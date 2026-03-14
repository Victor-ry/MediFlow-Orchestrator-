import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch patients from Supabase with filtering and pagination
 * @param {Object} options - Query options
 * @param {string} options.search - Search by patient name
 * @param {string} options.patientId - Filter by specific patient ID
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Items per page (default: 10)
 * @returns {Promise<{ success: boolean, data: Array|null, error: string|null, pagination: Object|null }>}
 */
export const getPatients = async (options = {}) => {
    const {
        patientId = '',
        page = 1,
        pageSize = 10
    } = options

    try {
        // Build query
        let query = supabase.from('Patient').select('*', { count: 'exact' })

        // Filter by ID
        if (patientId) {
            query = query.eq('patient_id', patientId)
        }

        // Apply pagination
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)

        // Execute query
        const { data, error, count } = await query

        // Handle error
        if (error) {
            console.error('Error fetching patients:', error)
            return {
                success: false,
                data: null,
                error: error.message,
                pagination: null
            }
        }

        // Calculate pagination info
        const totalPages = count ? Math.ceil(count / pageSize) : 0
        const pagination = {
            currentPage: page,
            pageSize: pageSize,
            totalItems: count || 0,
            totalPages: totalPages,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            from: from + 1,
            to: Math.min(from + pageSize, count || 0)
        }

        // Handle empty result
        if (!data || data.length === 0) {
            console.warn('No patients found')
            return {
                success: true,
                data: [],
                error: null,
                pagination: pagination
            }
        }

        console.log(`Fetched ${data.length} patient(s) (Page ${page} of ${totalPages})`)
        return {
            success: true,
            data: data,
            error: null,
            pagination: pagination
        }

    } catch (exception) {
        console.error('Unexpected error in getPatients:', exception)
        return {
            success: false,
            data: null,
            error: exception.message || 'An unexpected error occurred',
            pagination: null
        }
    }
}
