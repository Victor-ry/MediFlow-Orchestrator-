import { supabase } from './supabase';

const CLOSED_ORDER_STATUSES = new Set(['complete', 'completed', 'cancelled']);

const isClosedOrderStatus = (status) => CLOSED_ORDER_STATUSES.has(String(status || '').trim().toLowerCase());

const normalizeDepartmentKey = (value) => {
    const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normalized) return '';
    if (normalized === 'pharm' || normalized.startsWith('pharmac')) return 'pharm';
    if (normalized === 'rad' || normalized.startsWith('radio')) return 'rad';
    if (normalized === 'res' || normalized.startsWith('resp')) return 'res';
    if (normalized === 'gas' || normalized.startsWith('gastro')) return 'gas';
    if (normalized === 'health' || normalized.startsWith('health')) return 'health';
    if (normalized === 'lab' || normalized.startsWith('laborator')) return 'lab';
    return normalized;
};

const isSameDepartment = (left, right) => {
    const leftKey = normalizeDepartmentKey(left);
    const rightKey = normalizeDepartmentKey(right);
    return Boolean(leftKey) && leftKey === rightKey;
};

export const getPatientByNricAndName = async (option) => {
    const { nric, name } = option;
    try {
        const { data: patient, error } = await supabase
            .from("Patient")
            .select("patient_id")
            .eq("name", name)
            .eq("nric", nric)
            .single();

        if (error) {
            throw error;
        }

        if (!patient) {
            return { data: null, error: null };
        }

        return { data: patient, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

export async function getOrdersByPatientId(patientId) {
    const { data, error } = await supabase
        .from("Order")
        .select(`*, Department: departmentCode(
            departmentName,
            location
        )`)
        .eq("patient_id", patientId)
        .order("priority", { ascending: true });

    if (error) {
        console.error("Error fetching orders:", error);
        return { data: null, error };
    }

    const activeOrders = (data || []).filter((order) => !isClosedOrderStatus(order.status));

    for (const order of activeOrders) {
        if (!order.serviceCodeList) {
            order.serviceNameList = [];
            continue;
        }

        const codes = order.serviceCodeList
            .split(",")
            .map(x => x.trim())
            .filter(x => x);

        if (!codes.length) {
            order.serviceNameList = [];
            continue;
        }

        // Query all matching service codes from Service table
        const { data: services, error } = await supabase
            .from("Service")
            .select("serviceName, serviceDescription")
            .in("serviceCode", codes);

        if (error) {
            console.error("Error fetching service names:", error);
            order.serviceNameList = [];
            continue;
        }

        // Map service codes to names
        order.serviceNameList = services;
    }

    return { data: activeOrders, error: null };
}

export async function getOrdersByPatientIdAndDepartment(patientId, option = {}) {
    const { departmentCode, departmentName } = option;
    const { data, error } = await getOrdersByPatientId(patientId);

    if (error || !Array.isArray(data)) {
        return { data: [], error };
    }

    const normalizedDepartmentName = normalizeDepartmentKey(departmentName);
    const normalizedDepartmentCode = String(departmentCode || '').trim().toLowerCase();

    const filteredOrders = data.filter((order) => {
        if (normalizedDepartmentCode && String(order.departmentCode || '').trim().toLowerCase() === normalizedDepartmentCode) {
            return true;
        }

        if (!normalizedDepartmentName) {
            return true;
        }

        if (isSameDepartment(order.Department?.departmentName, departmentName)) {
            return true;
        }

        return isSameDepartment(order.departmentCode, departmentName);
    });

    return { data: filteredOrders, error: null };
}

export const getPatientById = async (patient_id) => {
    try {
        const { data: patient, error } = await supabase
            .from("Patient")
            .select("*")
            .eq("patient_id", patient_id)
            .single();

        if (error) {
            throw error;
        }

        if (!patient) {
            return { data: null, error: null };
        }

        return { data: patient, error: null };
    } catch (error) {
        return { data: null, error };
    }
};