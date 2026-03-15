import { supabase } from './supabase';

const STOP_WORDS = new Set(['request', 'custom', 'referral', 'for', 'and', 'the', 'lab']);

const normalizeText = (value) => String(value || '')
  .toLowerCase()
  .replace(/\[[^\]]*\]/g, (match) => ` ${match.replace(/[[\]]/g, '')} `)
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const getMeaningfulTokens = (value) => normalizeText(value)
  .split(' ')
  .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

const buildConsultationId = () => `CON-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const buildOrderId = () => `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const mapRoutePriority = (route) => {
  const color = String(route?.color || '').toLowerCase();
  if (color === 'red') return 'Urgent';
  if (color === 'yellow') return 'Semi-Urgent';
  return 'Routine';
};

const dedupeRoutes = (routes) => {
  const seen = new Set();

  return routes.filter((route) => {
    const key = `${route.intent || ''}::${route.department || ''}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const resolveServiceCodes = (route, services, departmentCode) => {
  const departmentServices = services.filter((service) => service.departmentCode === departmentCode && service.isActive !== false);
  if (departmentServices.length === 0) return [];

  const routeTokens = getMeaningfulTokens(route.intent);
  if (routeTokens.length === 0) {
    return departmentServices.length === 1 ? [departmentServices[0].serviceCode] : [];
  }

  const ranked = departmentServices
    .map((service) => {
      const searchable = `${service.serviceName || ''} ${service.serviceDescription || ''}`.toLowerCase();
      const score = routeTokens.reduce((total, token) => total + (searchable.includes(token) ? 1 : 0), 0);
      return { service, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  if (ranked.length === 0) {
    return departmentServices.length === 1 ? [departmentServices[0].serviceCode] : [];
  }

  const topScore = ranked[0].score;
  return ranked
    .filter((item) => item.score === topScore)
    .map((item) => item.service.serviceCode);
};

export const createConsultationRecord = async ({ patientId, transcript }) => {
  const consultationId = buildConsultationId();

  const { data, error } = await supabase
    .from('Consultation')
    .insert([{
      consultation_id: consultationId,
      patient_id: patientId,
      transcript: transcript || null,
    }])
    .select('*')
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
};

export const createOrdersFromConfirmedRoutes = async ({
  patientId,
  consultationId,
  routes,
  departments,
  services,
  aiRecommendation,
}) => {
  const uniqueRoutes = dedupeRoutes(routes);

  const departmentMap = departments.reduce((accumulator, department) => {
    accumulator[String(department.departmentName || '').trim().toLowerCase()] = department;
    return accumulator;
  }, {});

  const unmatchedRoutes = [];

  const orderRows = uniqueRoutes
    .map((route) => {
      const department = departmentMap[String(route.department || '').trim().toLowerCase()];
      if (!department?.departmentCode) {
        return null;
      }

      const serviceCodes = resolveServiceCodes(route, services, department.departmentCode);
      const hasMatchedServiceCodes = serviceCodes.length > 0;

      if (!hasMatchedServiceCodes) {
        unmatchedRoutes.push({
          intent: route.intent || 'Route created',
          departmentName: department.departmentName,
          departmentCode: department.departmentCode,
        });
      }

      return {
        order_id: buildOrderId(),
        consultation_id: consultationId || null,
        patient_id: patientId,
        departmentCode: department.departmentCode,
        serviceCodeList: serviceCodes.join(','),
        remarks: `${route.intent || 'Route created'}${aiRecommendation ? ` | ${aiRecommendation}` : ''}${hasMatchedServiceCodes ? '' : ' | NO_SERVICE_MATCH'}`,
        priority: mapRoutePriority(route),
        status: 'Pending',
      };
    })
    .filter(Boolean);

  if (orderRows.length === 0) {
    return { data: [], error: new Error('No valid departments were found for the confirmed routes.') };
  }

  const { data, error } = await supabase
    .from('Order')
    .insert(orderRows)
    .select('*');

  if (error) {
    return { data: null, error };
  }

  return {
    data: data || [],
    unmatchedRoutes,
    error: null,
  };
};