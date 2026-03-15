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

const getOrderTimestamp = (order) => (
    order.updated_at || order.created_at || order.lastUpdated || null
);

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

const groupOrdersToQueueEntries = (orders) => {
    const grouped = orders.reduce((accumulator, order) => {
        const departmentKey = order.departmentCode || order.Department?.departmentName || 'unknown';
        const key = `${order.patient_id}::${departmentKey}`;

        if (!accumulator[key]) {
            accumulator[key] = [];
        }

        accumulator[key].push(order);
        return accumulator;
    }, {});

    return Object.entries(grouped).map(([key, groupOrders]) => {
        const sortedOrders = [...groupOrders].sort((left, right) => {
            const leftPriority = left.priority ?? Number.MAX_SAFE_INTEGER;
            const rightPriority = right.priority ?? Number.MAX_SAFE_INTEGER;
            if (leftPriority !== rightPriority) {
                return leftPriority - rightPriority;
            }

            return String(left.order_id).localeCompare(String(right.order_id));
        });

        const firstOrder = sortedOrders[0];
        const queueTimestamp = sortedOrders.map(getOrderTimestamp).find(Boolean) || null;
        const hasCalledOrder = sortedOrders.some((order) => String(order.status || '').toLowerCase() === 'called');

        return {
            id: key,
            queueEntryId: key,
            sourceOrderIds: sortedOrders.map((order) => order.order_id),
            ticket: `ORD-${firstOrder.order_id}`,
            patient: firstOrder.patientName,
            patientId: firstOrder.patient_id,
            test: buildServiceSummary(sortedOrders) || 'No service assigned',
            priority: sortedOrders.some((order) => normalizePriority(order.priority) === 'Urgent') ? 'Urgent' : 'Routine',
            wait: minutesSince(queueTimestamp),
            department: firstOrder.Department?.departmentName || firstOrder.departmentCode || '-',
            departmentCode: firstOrder.departmentCode || '',
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
            .from('Order')
            .select(`*, Department: departmentCode(
                departmentName,
                location
            )`)
            .in('status', statuses)
            .order('priority', { ascending: true });

        if (departmentCode) {
            query = query.eq('departmentCode', departmentCode);
        }

        const { data, error } = await query;
        if (error) throw error;

        let enrichedOrders = await enrichOrders(data || []);

        if (!departmentCode && departmentName) {
            const normalizedDepartmentName = departmentName.trim().toLowerCase();
            enrichedOrders = enrichedOrders.filter((order) => (
                order.Department?.departmentName?.trim().toLowerCase() === normalizedDepartmentName
            ));
        }

        return {
            data: groupOrdersToQueueEntries(enrichedOrders),
            error: null,
        };
    } catch (error) {
        return {
            data: [],
            error: new Error(error.message || 'Unable to load department waiting queue from Order data.'),
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

        const { data, error } = await supabase
            .from('Order')
            .update({ status: 'waiting' })
            .in('order_id', orderIds)
            .select(`*, Department: departmentCode(
                departmentName,
                location
            )`);

        if (error) throw error;

        const queueEntries = groupOrdersToQueueEntries(await enrichOrders(data || []));
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

        const nextStatus = status === 'cancelled' ? 'pending' : status;

        const { data, error } = await supabase
            .from('Order')
            .update({ status: nextStatus })
            .in('order_id', orderIds)
            .select(`*, Department: departmentCode(
                departmentName,
                location
            )`);

        if (error) throw error;

        const queueEntries = groupOrdersToQueueEntries(await enrichOrders(data || []));
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