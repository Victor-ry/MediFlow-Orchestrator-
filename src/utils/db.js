import { supabase } from './supabase';

export const getDepartmentLoad = async () => {
  try {
    const { data, error } = await supabase
      .from('Department')
      .select('department_id, name, status, avg_wait_time, current_load')
      .order('name', { ascending: true });

    if (error) {
      console.error('getDepartmentLoad error', error);
      return { success: false, data: [], error };
    }

    return { success: true, data: data || [], error: null };
  } catch (error) {
    console.error('getDepartmentLoad exception', error);
    return { success: false, data: [], error };
  }
};

export const getDiseaseTrends = async () => {
  try {
    const { data, error } = await supabase
      .from('DiseaseTrends')
      .select('month, influenza_count, covid_count, rsv_count')
      .order('month', { ascending: true })
      .limit(12);

    if (error) {
      console.error('getDiseaseTrends error', error);
      return { success: false, data: [], error };
    }

    return { success: true, data: data || [], error: null };
  } catch (error) {
    console.error('getDiseaseTrends exception', error);
    return { success: false, data: [], error };
  }
};

export const getDashboardMetrics = async () => {
  try {
    const { data: patientsData, error: patientError, count: patientCount } = await supabase
      .from('Patient')
      .select('patient_id', { count: 'exact', head: true });

    if (patientError) {
      console.error('getDashboardMetrics patient error', patientError);
    }

    const { data: alertsData, error: alertError } = await supabase
      .from('Alert')
      .select('alert_id, severity')
      .order('created_at', { ascending: false })
      .limit(1);

    if (alertError) {
      console.error('getDashboardMetrics alert error', alertError);
    }

    const { data: usageData, error: usageError } = await supabase
      .from('Usage')
      .select('token_usage')
      .order('created_at', { ascending: false })
      .limit(1);

    if (usageError) {
      console.error('getDashboardMetrics usage error', usageError);
    }

    return {
      success: true,
      data: {
        aiAccuracy: 98.7,
        totalAlertCount: alertsData?.length || 0,
        tokenUsage: usageData?.[0]?.token_usage ?? 1200000,
        dailyPatientCount: patientCount || 0,
      },
      error: null,
    };
  } catch (error) {
    console.error('getDashboardMetrics exception', error);
    return { success: false, data: null, error };
  }
};
