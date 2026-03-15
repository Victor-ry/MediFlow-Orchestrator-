import { supabase } from './supabase';

export const getRecentConsultationsByHours = async (hours) => {
    try {
        // 计算 N 小时之前的时间
        const fromDate = new Date();
        fromDate.setHours(fromDate.getHours() - hours);

        const fromISOString = fromDate.toISOString();
        const { data, error } = await supabase
            .from('Consultation')
            .select(`
        consultation_time,
        doctor_role,
        transcript,
        Patient!inner(
          medical_history,
          age
        )
      `)
            .gte('consultation_time', fromISOString)
            .order('consultation_time', { ascending: false });

        if (error) throw error;

        // 返回处理好的数据
        return data.map(item => ({
            consultation_time: item.consultation_time,
            doctor_role: item.doctor_role,
            transcript: item.transcript,
            medical_history: item.Patient.medical_history,
            age: item.Patient.age,
        }));
    } catch (error) {
        console.error(error);
        return [];
    }
};

/**
 * Generates an executive hospital briefing using AI.
 * @param {Array} dataRows - Array of objects from your database.
 * @returns {Promise<string>} - Returns raw HTML <ul> list.
 */
export async function getHospitalInsight(dataRows) {
    const API_URL = "https://aiworkshopapi.flexinfra.com.my/v1/chat/completions";
    const API_KEY = "Bearer sk-0rwIrkJyb1pRG8l1sDt0yA";

    // Format data into: [Time] [Age]y with [History] -> [Dept]: [Transcript]
    // This approach physically removes names/NRICs from the payload for security.
    const formattedLogs = dataRows.map(row => {
        const time = row.consultation_time?.split(' ')[1]?.substring(0, 5) || "00:00";
        const history = row.medical_history || "None";
        return `[${time}] ${row.age}y with ${history} -> ${row.doctor_role}: ${row.transcript}`;
    }).join('\n');

    const payload = {
        model: "qwen2.5",
        messages: [
            {
                role: "system",
                content: `# ROLE
Medical Operations Analyst AI.

# DATA PROCESSING RULES
1. INPUT FORMAT: You will receive logs as "[Time] [Age]y with [History] -> [Dept]: [Transcript]".
2. AGGREGATION: Summarize all entries into macro trends. Do not list individual cases.
3. PRIVACY SECURITY: STRICTLY FORBIDDEN to mention names or IDs. Use clinical groups (e.g., "cardiac patients", "elderly respiratory cases"). If a name is leaked, the task fails.

# OUTPUT CONSTRAINTS
- Output ONLY raw HTML <ul> and <li> tags.
- NO markdown code blocks (No \\\`).
- EXACTLY 3 <li> items in this order:
  <li>Traffic: [Current load summary]</li>
  <li>Critical: [Summary of urgent medical patterns/risks]</li>
  <li>Busiest: [Top 2 active departments]</li>
- LIMIT: Strictly under 50 words total.`
            },
            {
                role: "user",
                content: `Data: \n${formattedLogs}`
            }
        ],
        max_completion_tokens: 588,
        temperature: 0.4,
        top_p: 0.9
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": API_KEY
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        return result.choices[0]?.message?.content || "<ul><li>Error: Briefing unavailable.</li></ul>";
    } catch (error) {
        console.error("Fetch Error:", error);
        return "<ul><li>Error: Connection failed.</li></ul>";
    }
}

// Example Usage:
// const dbData = [{ consultation_time: "2026-03-15 14:39:00", age: 61, medical_history: "Heart Disease", doctor_role: "Cardiology", transcript: "Chest pain" }];
// getHospitalInsight(dbData).then(console.log);