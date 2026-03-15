# Schema Appendix

This appendix summarizes the Mediflow Orchestrator database structure for submission and report documentation. It is based on the reference schema in `database/db.sql`.

## Overview

The schema models a simplified hospital workflow covering patient registration, consultation, routing orders, queue management, service definitions, departments, and rooms.

## Table Summary

### Department

Purpose: master list of clinical departments.

- Primary identifier: `id`
- Business key: `departmentCode`
- Important fields: `departmentName`, `description`, `location`

### Patient

Purpose: patient demographic and clinical background used for routing.

- Primary identifier: `patient_id`
- Sensitive fields: `name`, `nric`, `allergies`, `medical_history`, `family_history`

### Service

Purpose: services offered by each department.

- Business identifiers: `UID`, `serviceCode`
- Foreign key: `departmentCode` -> `Department.departmentCode`
- Important fields: `serviceName`, `serviceDescription`, `defaultConsumeTime`, `isActive`

### Consultation

Purpose: captures consultation interaction before AI analysis or routing.

- Primary identifier: `consultation_id`
- Foreign key: `patient_id` -> `Patient.patient_id`
- Sensitive fields: `doctor_name`, `transcript`

### Order

Purpose: stores routing decisions generated or confirmed after consultation.

- Primary identifier: `order_id`
- Foreign keys:
  - `consultation_id` -> `Consultation.consultation_id`
  - `patient_id` -> `Patient.patient_id`
  - `departmentCode` -> `Department.departmentCode`
- Sensitive field: `remarks`

### Queue

Purpose: operational waiting queue for patients after order creation.

- Primary identifier: `queue_id`
- Foreign keys:
  - `patient_id` -> `Patient.patient_id`
  - `order_id` -> `Order.order_id`
  - `departmentCode` -> `Department.departmentCode`
- Important fields: `queue_number`, `estimated_wait_minutes`, `status`, `completed_at`

### Room

Purpose: maps rooms to services for service execution.

- Primary identifier: `id`
- Foreign key: `serviceCode` -> `Service.serviceCode`
- Important field: `roomName`

## Relationship Flow

1. A patient record exists in `Patient`.
2. A consultation is recorded in `Consultation` for that patient.
3. A routing decision creates one or more entries in `Order`.
4. Active operational flow is tracked in `Queue`.
5. Services are defined in `Service` and linked to `Department`.
6. Rooms are mapped to services through `Room`.

## Submission Notes

- Submit schema structure freely.
- Do not submit real patient or consultation rows.
- If sample rows are required, use the fictional examples in `database/demo_dataset.sql`.
- If your assessor wants a narrative explanation, this file can be attached as the database appendix.