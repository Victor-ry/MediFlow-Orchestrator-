import { supabase } from './supabase';

// 获取所有服务
export const getServices = async () => {
    try {
        const { data, error } = await supabase
            .from('Service')
            .select(`
                *,
                Department:departmentCode (
                    departmentName,
                    location
                )
            `)
            .order('lastUpdated', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// 创建服务
export const createService = async (serviceData) => {
    try {
        const { data, error } = await supabase
            .from('Service')
            .insert([serviceData])
            .select();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// 更新服务
export const updateService = async (uid, serviceData) => {
    try {
        const { data, error } = await supabase
            .from('Service')
            .update({
                ...serviceData,
                lastUpdated: new Date().toISOString()
            })
            .eq('UID', uid)
            .select();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// 删除服务
export const deleteService = async (uid) => {
    try {
        const { error } = await supabase
            .from('Service')
            .delete()
            .eq('UID', uid);

        if (error) throw error;
        return { data: null, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// 获取单个服务
export const getServiceByUid = async (uid) => {
    try {
        const { data, error } = await supabase
            .from('Service')
            .select('*')
            .eq('UID', uid)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

export const getActiveServicesGroupByDep = async () => {
    try {
        const { data, error } = await supabase
            .from("Service")
            .select(`
        serviceName,
        Department:departmentCode (
          departmentName
        )
      `)
            .eq("isActive", true);

        if (error) throw error;

        // group by department
        const grouped = data.reduce((acc, item) => {
            const depName = item.Department.departmentName;
            if (!acc[depName]) {
                acc[depName] = [];
            }
            acc[depName].push(item.serviceName);
            return acc;
        }, {});

        return { data: grouped, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

export const getActiveServices = async () => {
    try {
        const { data, error } = await supabase
            .from("Service")
            .select(`
        serviceName,
        serviceCode,
        Department:departmentCode (
          departmentName,
          departmentCode
        )
      `)
            .eq("isActive", true);

        if (error) throw error;

        // 扁平化 department 字段
        const flattened = data.map(item => ({
            serviceName: item.serviceName,
            serviceCode: item.serviceCode,
            departmentName: item.Department.departmentName,
            departmentCode: item.Department.departmentCode
        }));

        return { data: flattened, error: null };
    } catch (error) {
        return { data: null, error };
    }
};