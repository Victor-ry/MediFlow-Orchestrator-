-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Consultation (
  consultation_id character varying NOT NULL,
  patient_id text,
  doctor_name character varying,
  doctor_role character varying,
  transcript text,
  consultation_time timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT Consultation_pkey PRIMARY KEY (consultation_id),
  CONSTRAINT Consultation_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.Patient(patient_id)
);
CREATE TABLE public.Department (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  departmentName character varying NOT NULL UNIQUE,
  description text,
  location text,
  departmentCode character varying NOT NULL UNIQUE,
  CONSTRAINT Department_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Order (
  order_id text NOT NULL,
  consultation_id character varying,
  patient_id text,
  departmentCode character varying,
  serviceCodeList text,
  remarks text,
  priority character varying,
  status character varying,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT Order_pkey PRIMARY KEY (order_id),
  CONSTRAINT Order_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.Consultation(consultation_id),
  CONSTRAINT Order_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.Patient(patient_id),
  CONSTRAINT Order_departmentCode_fkey FOREIGN KEY (departmentCode) REFERENCES public.Department(departmentCode)
);
CREATE TABLE public.Patient (
  patient_id text NOT NULL,
  name character varying,
  age bigint,
  sex character varying,
  allergies text,
  medical_history text,
  family_history text,
  nric text UNIQUE,
  CONSTRAINT Patient_pkey PRIMARY KEY (patient_id)
);
CREATE TABLE public.Queue (
  queue_id text NOT NULL,
  patient_id text,
  order_id text,
  departmentCode character varying,
  queue_number character varying,
  estimated_wait_minutes bigint,
  status character varying,
  created_at timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
  completed_at timestamp with time zone,
  CONSTRAINT Queue_pkey PRIMARY KEY (queue_id),
  CONSTRAINT Queue_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.Patient(patient_id),
  CONSTRAINT Queue_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.Order(order_id),
  CONSTRAINT Queue_departmentCode_fkey FOREIGN KEY (departmentCode) REFERENCES public.Department(departmentCode)
);
CREATE TABLE public.Room (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  roomName character varying NOT NULL,
  serviceCode character varying NOT NULL,
  CONSTRAINT Room_serviceCode_fkey FOREIGN KEY (serviceCode) REFERENCES public.Service(serviceCode)
);
CREATE TABLE public.Service (
  UID text NOT NULL,
  serviceName character varying NOT NULL,
  departmentCode character varying NOT NULL,
  serviceDescription text,
  isActive boolean DEFAULT true,
  lastUpdated timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  serviceCode character varying NOT NULL UNIQUE,
  defaultConsumeTime bigint,
  CONSTRAINT Service_departmentCode_fkey FOREIGN KEY (departmentCode) REFERENCES public.Department(departmentCode)
);