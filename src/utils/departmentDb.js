import { supabase } from './supabase';

export const getDepartments = async () => {
    try {
        const { data, error } = await supabase
            .from('Department')
            .select('departmentCode, departmentName, description, location')
            .order('departmentName');

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};
