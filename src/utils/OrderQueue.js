import { supabase } from './supabase';

const ACTIVE_QUEUE_STATUSES = ['waiting', 'called'];

const normalizePriority = (priority) => {
    if (priority === null || priority === undefined || priority === '') {
        return 'Routine';
    }

    if (typeof priority === 'number') {
        return priority <= 2 ? 'Urgent' : 'Routine';
    }

    const normalized = String(priority).trim().toLowerCase();
    if (!normalized) return 'Routine';
    if (normalized === 'urgent' || normalized === 'stat' || normalized === 'high') return 'Urgent';
    if (normalized === 'routine' || normalized === 'normal' || normalized === 'low') return 'Routine';

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const minutesSince = (timestamp) => {
    if (!timestamp) return 0;

    const parsed = new Date(timestamp).getTime();
    if (Number.isNaN(parsed)) return 0;

    return Math.max(0, Math.floor((Date.now() - parsed) / 60000));
};

const buildServiceSummary = (orders) => {
    const names = orders.flatMap((order) => {
        if (Array.isArray(order.serviceNameList) && order.serviceNameList.length > 0) {
            return order.serviceNameList.map((service) => service.serviceName).filter(Boolean);
        }

        if (!order.serviceCodeList) {
            return [];
        }

        return order.serviceCodeList.split(',').map((code) => code.trim()).filter(Boolean);
    });

    return [...new Set(names)].join(', ');
};

const buildQueueId = () => `QUE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const buildQueueNumber = (departmentCode, sequence) => {
    const prefix = (departmentCode || 'GEN').replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || 'GEN';
    return `${prefix}-${String(sequence).padStart(3, '0')}`;
};

const enrichOrders = async (orders) => {
    const enrichedOrders = [...orders];

    for (const order of enrichedOrders) {
        if (!order.serviceCodeList) {
            order.serviceNameList = [];
            continue;
        }

        const codes = order.serviceCodeList
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);

        if (!codes.length) {
            order.serviceNameList = [];
            continue;
        }

        const { data: services, error } = await supabase
            .from('Service')
            .select('serviceName, serviceDescription')
            .in('serviceCode', codes);

        if (error) {
            console.error('Error fetching service names:', error);
            order.serviceNameList = [];
            continue;
        }

        order.serviceNameList = services || [];
    }

    const patientIds = [...new Set(enrichedOrders.map((order) => order.patient_id).filter(Boolean))];
    let patientNameMap = {};

    if (patientIds.length > 0) {
        const { data: patients, error } = await supabase
            .from('Patient')
            .select('patient_id, name')
            .in('patient_id', patientIds);

        if (error) {
            console.error('Error fetching patient names:', error);
        } else {
            patientNameMap = (patients || []).reduce((accumulator, patient) => {
                accumulator[patient.patient_id] = patient.name;
                return accumulator;
            }, {});
        }
    }

    return enrichedOrders.map((order) => ({
        ...order,
        patientName: patientNameMap[order.patient_id] || order.patient_id,
    }));
};

const enrichQueueRows = async (queueRows) => {
    const orders = queueRows
        .map((row) => {
            if (!row.Order) {
                return null;
            }

            return {
                ...row.Order,
                patientName: row.Patient?.name || row.Order.patient_id,
            };
        })
        .filter(Boolean);

    const enrichedOrders = await enrichOrders(orders);
    const orderMap = enrichedOrders.reduce((accumulator, order) => {
        accumulator[order.order_id] = order;
        return accumulator;
    }, {});

    return queueRows.map((row) => ({
        ...row,
        Order: orderMap[row.order_id] || row.Order,
    }));
};

const groupQueueRowsToEntries = (queueRows) => {
    const grouped = queueRows.reduce((accumulator, row) => {
        const order = row.Order || {};
        const departmentKey = row.departmentCode || order.departmentCode || row.Department?.departmentName || 'unknown';
        const patientId = row.patient_id || order.patient_id || 'unknown';
        const key = `${patientId}::${departmentKey}`;

        if (!accumulator[key]) {
            accumulator[key] = [];
        }

        accumulator[key].push(row);
        return accumulator;
    }, {});

    return Object.entries(grouped).map(([key, groupRows]) => {
        const sortedRows = [...groupRows].sort((left, right) => {
            const leftPriority = left.Order?.priority ?? Number.MAX_SAFE_INTEGER;
            const rightPriority = right.Order?.priority ?? Number.MAX_SAFE_INTEGER;
            if (leftPriority !== rightPriority) {
                return leftPriority - rightPriority;
            }

            return String(left.order_id).localeCompare(String(right.order_id));
        });

        const firstQueueRow = sortedRows[0];
        const orders = sortedRows.map((row) => row.Order).filter(Boolean);
        const firstOrder = orders[0] || {};
        const queueTimestamp = firstQueueRow.created_at || null;
        const hasCalledOrder = sortedRows.some((row) => String(row.status || '').toLowerCase() === 'called');
        const estimatedWait = sortedRows.reduce((maxValue, row) => {
            const value = Number(row.estimated_wait_minutes);
            if (Number.isFinite(value)) {
                return Math.max(maxValue, value);
            }

            return maxValue;
        }, 0);

        return {
            id: key,
            queueEntryId: key,
            sourceOrderIds: sortedRows.map((row) => row.order_id).filter(Boolean),
            sourceQueueIds: sortedRows.map((row) => row.queue_id),
            ticket: firstQueueRow.queue_number || `Q-${firstQueueRow.queue_id}`,
            patient: firstQueueRow.Patient?.name || firstOrder.patientName || firstQueueRow.patient_id,
            patientId: firstQueueRow.patient_id || firstOrder.patient_id,
            test: buildServiceSummary(orders) || 'No service assigned',
            priority: orders.some((order) => normalizePriority(order.priority) === 'Urgent') ? 'Urgent' : 'Routine',
            wait: estimatedWait || minutesSince(queueTimestamp),
            department: firstQueueRow.Department?.departmentName || firstQueueRow.departmentCode || firstOrder.departmentCode || '-',
            departmentCode: firstQueueRow.departmentCode || firstOrder.departmentCode || '',
            orderId: firstOrder.order_id,
            queuedAt: queueTimestamp,
            queueStatus: hasCalledOrder ? 'called' : 'waiting',
        };
    });
};

export async function getOrdersByPatientId(patientId, departmentcode) {
    let query = supabase
        .from('Order')
        .select(`*, Department: departmentCode(
            departmentName,
            location
        )`)
        .eq('patient_id', patientId)
        .neq('status', 'complete')
        .order('priority', { ascending: true });

    if (departmentcode) {
        query = query.eq('departmentCode', departmentcode);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching orders:', error);
        return { data: null, error };
    }

    const enrichedOrders = await enrichOrders(data || []);
    return { data: enrichedOrders, error: null };
}

export const getDepartmentQueueEntries = async ({ departmentCode, departmentName, statuses = ['waiting'] } = {}) => {
    try {
        let query = supabase
            .from('Queue')
            .select(`
                queue_id,
                patient_id,
                order_id,
                departmentCode,
                queue_number,
                estimated_wait_minutes,
                status,
                created_at,
                completed_at,
                Order:order_id(
                    order_id,
                    consultation_id,
                    patient_id,
                    departmentCode,
                    serviceCodeList,
                    remarks,
                    priority,
                    status,
                    created_at
                ),
                Patient:patient_id(
                    patient_id,
                    name
                ),
                Department:departmentCode(
                    departmentName,
                    location
                )
            `)
            .in('status', statuses)
            .order('created_at', { ascending: true });

        if (departmentCode) {
            query = query.eq('departmentCode', departmentCode);
        }

        const { data, error } = await query;
        if (error) throw error;

        let enrichedQueueRows = await enrichQueueRows(data || []);

        if (!departmentCode && departmentName) {
            const normalizedDepartmentName = departmentName.trim().toLowerCase();
            enrichedQueueRows = enrichedQueueRows.filter((row) => (
                row.Department?.departmentName?.trim().toLowerCase() === normalizedDepartmentName
            ));
        }

        return {
            data: groupQueueRowsToEntries(enrichedQueueRows),
            error: null,
        };
    } catch (error) {
        return {
            data: [],
            error: new Error(error.message || 'Unable to load department queue from Queue data.'),
        };
    }
};

export const getActiveQueueEntryForPatient = async ({ patientId, departmentCode, departmentName }) => {
    try {
        const result = await getDepartmentQueueEntries({
            departmentCode,
            departmentName,
            statuses: ACTIVE_QUEUE_STATUSES,
        });

        if (result.error) {
            return { data: null, error: result.error };
        }

        const activeEntry = result.data.find((entry) => entry.patientId === patientId) || null;
        return { data: activeEntry, error: null };
    } catch (error) {
        return {
            data: null,
            error: new Error(error.message || 'Unable to validate active queue entry from Order data.'),
        };
    }
};

export const createDepartmentQueueEntry = async ({ orderIds = [] } = {}) => {
    try {
        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            throw new Error('No order IDs provided for queueing.');
        }

        const { data: orders, error: orderError } = await supabase
            .from('Order')
            .select('order_id, patient_id, departmentCode')
            .in('order_id', orderIds);

        if (orderError) throw orderError;

        if (!orders || orders.length === 0) {
            throw new Error('No matching orders found to add into queue.');
        }

        const patientIds = [...new Set(orders.map((order) => order.patient_id).filter(Boolean))];
        const departmentCodes = [...new Set(orders.map((order) => order.departmentCode).filter(Boolean))];

        if (patientIds.length !== 1 || departmentCodes.length !== 1) {
            throw new Error('Queueing requires orders from the same patient and department.');
        }

        const patientId = patientIds[0];
        const departmentCode = departmentCodes[0];

        const { data: activeQueueRows, error: activeQueueError } = await supabase
            .from('Queue')
            .select('queue_id, order_id')
            .eq('patient_id', patientId)
            .eq('departmentCode', departmentCode)
            .in('status', ACTIVE_QUEUE_STATUSES);

        if (activeQueueError) throw activeQueueError;

        if ((activeQueueRows || []).length > 0) {
            throw new Error('Patient is already in the active queue for this department.');
        }

        const { count, error: countError } = await supabase
            .from('Queue')
            .select('queue_id', { count: 'exact', head: true })
            .eq('departmentCode', departmentCode);

        if (countError) throw countError;

        const baseCount = count || 0;
        const queueRows = orders.map((order, index) => ({
            queue_id: buildQueueId(),
            patient_id: order.patient_id,
            order_id: order.order_id,
            departmentCode: order.departmentCode,
            queue_number: buildQueueNumber(order.departmentCode, baseCount + index + 1),
            estimated_wait_minutes: 0,
            status: 'waiting',
        }));

        const { data, error } = await supabase
            .from('Queue')
            .insert(queueRows)
            .select(`
                queue_id,
                patient_id,
                order_id,
                departmentCode,
                queue_number,
                estimated_wait_minutes,
                status,
                created_at,
                completed_at,
                Order:order_id(
                    order_id,
                    consultation_id,
                    patient_id,
                    departmentCode,
                    serviceCodeList,
                    remarks,
                    priority,
                    status,
                    created_at
                ),
                Patient:patient_id(
                    patient_id,
                    name
                ),
                Department:departmentCode(
                    departmentName,
                    location
                )
            `);

        if (error) throw error;

        await supabase
            .from('Order')
            .update({ status: 'waiting' })
            .in('order_id', orderIds);

        const queueEntries = groupQueueRowsToEntries(await enrichQueueRows(data || []));
        return {
            data: queueEntries[0] || null,
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: new Error(error.message || 'Unable to queue patient orders.'),
        };
    }
};

export const updateDepartmentQueueEntryStatus = async (orderIds, status) => {
    try {
        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            throw new Error('No order IDs provided for status update.');
        }

        const nextQueueStatus = status === 'complete' ? 'completed' : status;
        const orderStatusMap = {
            called: 'called',
            complete: 'complete',
            cancelled: 'pending',
            waiting: 'waiting',
        };

        const queueUpdatePayload = {
            status: nextQueueStatus,
        };

        if (nextQueueStatus === 'completed' || nextQueueStatus === 'cancelled') {
            queueUpdatePayload.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('Queue')
            .update(queueUpdatePayload)
            .in('order_id', orderIds)
            .select(`
                queue_id,
                patient_id,
                order_id,
                departmentCode,
                queue_number,
                estimated_wait_minutes,
                status,
                created_at,
                completed_at,
                Order:order_id(
                    order_id,
                    consultation_id,
                    patient_id,
                    departmentCode,
                    serviceCodeList,
                    remarks,
                    priority,
                    status,
                    created_at
                ),
                Patient:patient_id(
                    patient_id,
                    name
                ),
                Department:departmentCode(
                    departmentName,
                    location
                )
            `);

        if (error) throw error;

        const nextOrderStatus = orderStatusMap[status] || status;

        await supabase
            .from('Order')
            .update({ status: nextOrderStatus })
            .in('order_id', orderIds);

        const queueEntries = groupQueueRowsToEntries(await enrichQueueRows(data || []));
        return {
            data: queueEntries[0] || null,
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: new Error(error.message || 'Unable to update queued order status.'),
        };
    }
};

export const formatQueuePriority = normalizePriority;