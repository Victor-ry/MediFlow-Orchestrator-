# Database Submission Notes

This project already includes a schema reference in `database/db.sql`. That file is suitable as a structure reference for submission, but it should be treated as schema documentation rather than a production backup.

## Recommended Submission Strategy

Submit one of these:

1. `database/db.sql` only, with no live `INSERT` statements.
2. `database/db.sql` plus a small fictional demo dataset created manually.
3. A separate sanitized SQL file prepared only for submission.

## Tables in Current Schema

- `Patient`
- `Consultation`
- `Department`
- `Order`
- `Queue`
- `Room`
- `Service`

## What To Exclude

Do not submit live rows from these tables:

- `Patient`
- `Consultation`
- `Order`
- `Queue`

These tables are usually safer, but still review them before submission:

- `Department`
- `Room`
- `Service`

## Fields That Must Be Masked Or Replaced

### Patient

- `patient_id`: replace with fictional IDs such as `P001`, `P002`
- `name`: replace with fictional names or generic labels
- `nric`: remove completely or replace with dummy format
- `allergies`: use generic sample values only
- `medical_history`: use fictional summary values only
- `family_history`: use fictional summary values only

### Consultation

- `consultation_id`: replace with demo IDs
- `doctor_name`: replace with generic labels such as `Doctor A`
- `transcript`: do not submit real transcript text
- `consultation_time`: acceptable if it is demo-only, otherwise replace with non-real timestamps

### Order

- `order_id`: replace with demo IDs
- `remarks`: remove real case notes

### Queue

- `queue_id`: replace with demo IDs
- `queue_number`: acceptable for demo if not tied to real patients

## Safe Demo Data Pattern

If your lecturer expects sample records, use a very small fictional set such as:

- 2 to 3 patients with fake IDs
- 2 departments such as Cardiology and General Medicine
- 2 to 4 services
- 1 to 2 consultations with short invented transcripts
- 1 to 2 orders and queue entries to show workflow linkage

## Do Not Include With Submission

- Real Supabase exports
- Screenshots of real patient data
- `.env` files
- API tokens
- Publishable keys if not required by the assessor
- Backup dumps copied from your working environment

## Practical Recommendation

For submission, the cleanest package is:

1. Source code
2. `README.md`
3. `.env.example`
4. `database/db.sql`
5. Optional fictional screenshots and demo notes

That is usually enough for an academic submission unless your lecturer explicitly asks for a runnable seeded database.