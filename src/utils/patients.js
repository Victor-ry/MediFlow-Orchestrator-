/**
 * Patient Database Utility
 * Manages sample patient data and provides functions for fetching and filtering
 */

const samplePatients = [
  {
    "idx": 0,
    "patient_id": "P10234",
    "name": "Max Tan",
    "age": 54,
    "sex": "Male",
    "allergies": "Penicillin",
    "medical_history": "Hypertension;Type 2 Diabetes",
    "family_history": "Heart Disease"
  },
  {
    "idx": 1,
    "patient_id": "P10235",
    "name": "Sarah Lee",
    "age": 37,
    "sex": "Female",
    "allergies": "None",
    "medical_history": "Asthma",
    "family_history": "None"
  },
  {
    "idx": 2,
    "patient_id": "P10236",
    "name": "Ahmad Rahman",
    "age": 61,
    "sex": "Male",
    "allergies": "Sulfa Drugs",
    "medical_history": "Hypertension",
    "family_history": "Stroke"
  },
  {
    "idx": 3,
    "patient_id": "P10237",
    "name": "Mei Ling",
    "age": 29,
    "sex": "Female",
    "allergies": "None",
    "medical_history": "None",
    "family_history": "Diabetes"
  },
  {
    "idx": 4,
    "patient_id": "P10238",
    "name": "David Wong",
    "age": 45,
    "sex": "Male",
    "allergies": "Aspirin",
    "medical_history": "GERD",
    "family_history": "None"
  },
  {
    "idx": 5,
    "patient_id": "P10239",
    "name": "Fiona Kumar",
    "age": 52,
    "sex": "Female",
    "allergies": "Latex",
    "medical_history": "Emphysema",
    "family_history": "Lung Cancer"
  }
];

/**
 * Get all patients with optional pagination
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Items per page (default: 10)
 * @returns {Object} { success, data, pagination, error }
 */
export const getAllPatients = (options = {}) => {
  const { page = 1, pageSize = 10 } = options;

  try {
    const totalItems = samplePatients.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const data = samplePatients.slice(startIdx, endIdx);

    const pagination = {
      currentPage: page,
      pageSize: pageSize,
      totalItems: totalItems,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    return {
      success: true,
      data: data,
      pagination: pagination,
      error: null
    };
  } catch (error) {
    console.error('Error fetching patients:', error);
    return {
      success: false,
      data: null,
      pagination: null,
      error: error.message || 'Failed to fetch patients'
    };
  }
};

/**
 * Get a single patient by ID
 * @param {string} patientId - Patient ID to search for
 * @returns {Object} { success, data, error }
 */
export const getPatientById = (patientId) => {
  try {
    const patient = samplePatients.find(p => p.patient_id === patientId);

    if (!patient) {
      return {
        success: false,
        data: null,
        error: `Patient with ID ${patientId} not found`
      };
    }

    return {
      success: true,
      data: patient,
      error: null
    };
  } catch (error) {
    console.error('Error fetching patient:', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to fetch patient'
    };
  }
};

/**
 * Search patients by name
 * @param {string} searchTerm - Name to search for
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Items per page (default: 10)
 * @returns {Object} { success, data, pagination, error }
 */
export const searchPatientsByName = (searchTerm, options = {}) => {
  const { page = 1, pageSize = 10 } = options;

  try {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return {
        success: false,
        data: null,
        pagination: null,
        error: 'Search term must be a non-empty string'
      };
    }

    const searchLower = searchTerm.toLowerCase();
    const filteredPatients = samplePatients.filter(patient =>
      patient.name.toLowerCase().includes(searchLower)
    );

    const totalItems = filteredPatients.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const data = filteredPatients.slice(startIdx, endIdx);

    const pagination = {
      currentPage: page,
      pageSize: pageSize,
      totalItems: totalItems,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    return {
      success: true,
      data: data,
      pagination: pagination,
      error: null
    };
  } catch (error) {
    console.error('Error searching patients:', error);
    return {
      success: false,
      data: null,
      pagination: null,
      error: error.message || 'Failed to search patients'
    };
  }
};

/**
 * Filter patients by sex
 * @param {string} sex - Sex to filter by ('Male' or 'Female')
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Items per page (default: 10)
 * @returns {Object} { success, data, pagination, error }
 */
export const filterPatientsBySex = (sex, options = {}) => {
  const { page = 1, pageSize = 10 } = options;

  try {
    const validSex = ['Male', 'Female'];
    if (!validSex.includes(sex)) {
      return {
        success: false,
        data: null,
        pagination: null,
        error: 'Sex must be "Male" or "Female"'
      };
    }

    const filteredPatients = samplePatients.filter(patient => patient.sex === sex);

    const totalItems = filteredPatients.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const data = filteredPatients.slice(startIdx, endIdx);

    const pagination = {
      currentPage: page,
      pageSize: pageSize,
      totalItems: totalItems,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    return {
      success: true,
      data: data,
      pagination: pagination,
      error: null
    };
  } catch (error) {
    console.error('Error filtering patients:', error);
    return {
      success: false,
      data: null,
      pagination: null,
      error: error.message || 'Failed to filter patients'
    };
  }
};

/**
 * Filter patients by age range
 * @param {number} minAge - Minimum age
 * @param {number} maxAge - Maximum age
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Items per page (default: 10)
 * @returns {Object} { success, data, pagination, error }
 */
export const filterPatientsByAge = (minAge, maxAge, options = {}) => {
  const { page = 1, pageSize = 10 } = options;

  try {
    if (typeof minAge !== 'number' || typeof maxAge !== 'number') {
      return {
        success: false,
        data: null,
        pagination: null,
        error: 'Age values must be numbers'
      };
    }

    if (minAge > maxAge) {
      return {
        success: false,
        data: null,
        pagination: null,
        error: 'Minimum age cannot be greater than maximum age'
      };
    }

    const filteredPatients = samplePatients.filter(patient =>
      patient.age >= minAge && patient.age <= maxAge
    );

    const totalItems = filteredPatients.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const data = filteredPatients.slice(startIdx, endIdx);

    const pagination = {
      currentPage: page,
      pageSize: pageSize,
      totalItems: totalItems,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    return {
      success: true,
      data: data,
      pagination: pagination,
      error: null
    };
  } catch (error) {
    console.error('Error filtering patients by age:', error);
    return {
      success: false,
      data: null,
      pagination: null,
      error: error.message || 'Failed to filter patients'
    };
  }
};

/**
 * Get total number of patients
 * @returns {number} Total patient count
 */
export const getTotalPatientCount = () => {
  return samplePatients.length;
};

/**
 * Export all raw patient data
 * @returns {Array} All patient records
 */
export const getAllPatientsRaw = () => {
  return [...samplePatients];
};

/**
 * Combined search with multiple filters
 * @param {Object} filters - Filter criteria
 * @param {string} filters.searchTerm - Search by patient name (optional)
 * @param {string} filters.sex - Filter by sex: 'Male' or 'Female' (optional)
 * @param {number} filters.minAge - Minimum age (optional)
 * @param {number} filters.maxAge - Maximum age (optional)
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Items per page (default: 10)
 * @returns {Object} { success, data, pagination, error }
 */
export const searchPatients = (filters = {}, options = {}) => {
  const { page = 1, pageSize = 10 } = options;
  const { searchTerm, sex, minAge, maxAge } = filters;

  try {
    let filteredPatients = [...samplePatients];

    // Apply search term filter
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredPatients = filteredPatients.filter(patient =>
        patient.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply sex filter
    if (sex && ['Male', 'Female'].includes(sex)) {
      filteredPatients = filteredPatients.filter(patient => patient.sex === sex);
    }

    // Apply age range filter
    if (typeof minAge === 'number' && typeof maxAge === 'number') {
      if (minAge <= maxAge) {
        filteredPatients = filteredPatients.filter(patient =>
          patient.age >= minAge && patient.age <= maxAge
        );
      }
    }

    const totalItems = filteredPatients.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const data = filteredPatients.slice(startIdx, endIdx);

    const pagination = {
      currentPage: page,
      pageSize: pageSize,
      totalItems: totalItems,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    return {
      success: true,
      data: data,
      pagination: pagination,
      error: null
    };
  } catch (error) {
    console.error('Error searching patients:', error);
    return {
      success: false,
      data: null,
      pagination: null,
      error: error.message || 'Failed to search patients'
    };
  }
};

// ============================================================
// Supabase Integration (OPTIONAL - Requires Configuration)
// ============================================================
// 
// TO ENABLE SUPABASE:
// 1. Copy .env.local.example to .env.local
// 2. Add your Supabase credentials to .env.local
// 3. Run: npm install @supabase/supabase-js
// 4. Uncomment the code below and import these functions
//    into ConsultationQueuePage.jsx instead of local functions
//
// Then replace getAllPatients() calls with getAllPatientsSupabase()
// and searchPatients() calls with searchPatientsSupabase()
//
// ============================================================

/*
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;

const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export const getAllPatientsSupabase = async (options = {}) => {
  const { page = 1, pageSize = 10 } = options;
  if (!supabase) return { 
    success: false, 
    data: null, 
    pagination: null,
    error: 'Supabase not configured. Check .env.local file.' 
  };

  try {
    const startIdx = (page - 1) * pageSize;
    const { data, count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .range(startIdx, startIdx + pageSize - 1);

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / pageSize);
    return {
      success: true,
      data: data || [],
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      error: null
    };
  } catch (error) {
    console.error('Supabase Error:', error);
    return { 
      success: false, 
      data: null, 
      pagination: null, 
      error: error.message || 'Failed to fetch from Supabase' 
    };
  }
};

export const searchPatientsSupabase = async (filters = {}, options = {}) => {
  const { page = 1, pageSize = 10 } = options;
  const { searchTerm, sex, minAge, maxAge } = filters;
  if (!supabase) return { 
    success: false, 
    error: 'Supabase not configured. Check .env.local file.' 
  };

  try {
    let query = supabase.from('patients').select('*', { count: 'exact' });

    // Apply filters
    if (searchTerm && searchTerm.trim()) query = query.ilike('name', `%${searchTerm}%`);
    if (sex) query = query.eq('sex', sex);
    if (typeof minAge === 'number') query = query.gte('age', minAge);
    if (typeof maxAge === 'number') query = query.lte('age', maxAge);

    const startIdx = (page - 1) * pageSize;
    const { data, count, error } = await query.range(startIdx, startIdx + pageSize - 1);

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / pageSize);
    return {
      success: true,
      data: data || [],
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      error: null
    };
  } catch (error) {
    console.error('Supabase Error:', error);
    return { 
      success: false, 
      data: null, 
      pagination: null, 
      error: error.message || 'Failed to search in Supabase' 
    };
  }
};

export const addPatientSupabase = async (patientData) => {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  try {
    const { data, error } = await supabase
      .from('patients')
      .insert([patientData])
      .select();

    if (error) throw error;
    return { success: true, data: data[0], error: null };
  } catch (error) {
    console.error('Supabase Error:', error);
    return { success: false, data: null, error: error.message };
  }
};

export const updatePatientSupabase = async (patientId, updates) => {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  try {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('patient_id', patientId)
      .select();

    if (error) throw error;
    return { success: true, data: data[0], error: null };
  } catch (error) {
    console.error('Supabase Error:', error);
    return { success: false, data: null, error: error.message };
  }
};

export const deletePatientSupabase = async (patientId) => {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  try {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('patient_id', patientId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Supabase Error:', error);
    return { success: false, error: error.message };
  }
};
*/
