import { supabase } from './supabase';

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
        .neq("status", "complete")
        .order("priority", { ascending: true });

    if (error) {
        console.error("Error fetching orders:", error);
        return { data: null, error };
    }

    for (const order of data) {
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

    return { data, error: null };
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