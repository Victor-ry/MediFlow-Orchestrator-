-- Fictional demo dataset for submission purposes only.
-- This file is designed to illustrate sample content without exposing real records.
-- Review identifier casing and table naming against your live Supabase project before execution.

-- Departments
INSERT INTO public."Department" (departmentName, description, location, departmentCode)
VALUES
  ('Cardiology', 'Heart and cardiovascular care', 'Block A, Level 2', 'CARD'),
  ('General Medicine', 'General clinical assessment and follow-up', 'Block B, Level 1', 'GEN'),
  ('Ophthalmology', 'Eye and vision care', 'Block C, Level 3', 'OPH');

-- Patients
INSERT INTO public."Patient" (patient_id, name, age, sex, allergies, medical_history, family_history, nric)
VALUES
  ('P001', 'Patient 001', 61, 'Male', 'None', 'Hypertension', 'Father with hypertension', 'DEMO-0001'),
  ('P002', 'Patient 002', 29, 'Female', 'Penicillin', 'Seasonal allergy', 'No known family history', 'DEMO-0002'),
  ('P003', 'Patient 003', 47, 'Female', 'None', 'Type 2 diabetes', 'Mother with diabetes', 'DEMO-0003');

-- Services
INSERT INTO public."Service" (UID, serviceName, departmentCode, serviceDescription, isActive, serviceCode, defaultConsumeTime)
VALUES
  ('SVC-001', 'ECG Screening', 'CARD', 'Electrocardiogram screening for cardiac symptoms', true, 'CARD-ECG', 20),
  ('SVC-002', 'Blood Pressure Review', 'CARD', 'Blood pressure review and monitoring', true, 'CARD-BP', 15),
  ('SVC-003', 'General Assessment', 'GEN', 'General physician assessment', true, 'GEN-CONSULT', 25),
  ('SVC-004', 'Eye Examination', 'OPH', 'Basic ophthalmology assessment', true, 'OPH-EYE', 30);

-- Consultations
INSERT INTO public."Consultation" (consultation_id, patient_id, doctor_name, doctor_role, transcript, consultation_time)
VALUES
  ('CONS-001', 'P001', 'Doctor A', 'Cardiology', 'Patient reports intermittent chest tightness and elevated blood pressure readings over the last two days.', '2026-03-10 09:15:00+00'),
  ('CONS-002', 'P002', 'Doctor B', 'General Medicine', 'Patient reports headache, mild dizziness, and fatigue after a long work shift.', '2026-03-10 10:00:00+00'),
  ('CONS-003', 'P003', 'Doctor C', 'Ophthalmology', 'Patient reports blurry vision and eye discomfort since yesterday evening.', '2026-03-10 10:45:00+00');

-- Orders
INSERT INTO public."Order" (order_id, consultation_id, patient_id, departmentCode, serviceCodeList, remarks, priority, status, created_at)
VALUES
  ('ORD-001', 'CONS-001', 'P001', 'CARD', 'CARD-ECG,CARD-BP', 'Route to cardiology for ECG and blood pressure review', 'High', 'Pending', '2026-03-10 09:20:00+00'),
  ('ORD-002', 'CONS-002', 'P002', 'GEN', 'GEN-CONSULT', 'General assessment recommended', 'Medium', 'Pending', '2026-03-10 10:05:00+00'),
  ('ORD-003', 'CONS-003', 'P003', 'OPH', 'OPH-EYE', 'Eye examination recommended', 'Medium', 'Pending', '2026-03-10 10:50:00+00');

-- Queue
INSERT INTO public."Queue" (queue_id, patient_id, order_id, departmentCode, queue_number, estimated_wait_minutes, status, created_at, completed_at)
VALUES
  ('QUE-001', 'P001', 'ORD-001', 'CARD', 'C-101', 18, 'Waiting', '2026-03-10 09:22:00+00', NULL),
  ('QUE-002', 'P002', 'ORD-002', 'GEN', 'G-205', 12, 'In Progress', '2026-03-10 10:07:00+00', NULL),
  ('QUE-003', 'P003', 'ORD-003', 'OPH', 'O-014', 25, 'Waiting', '2026-03-10 10:52:00+00', NULL);

-- Rooms
INSERT INTO public."Room" (roomName, serviceCode)
VALUES
  ('Consult Room A1', 'CARD-ECG'),
  ('Consult Room B2', 'GEN-CONSULT'),
  ('Eye Room C3', 'OPH-EYE');