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