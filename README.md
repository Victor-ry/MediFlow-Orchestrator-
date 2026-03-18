# Mediflow Orchestrator

Mediflow Orchestrator is a React-based hospital workflow dashboard for managing patient intake, AI-assisted routing, consultation queues, department queues, and service definitions. The application connects to Supabase for operational data and can call an external AI endpoint for transcript analysis and hospital insight generation.

## Project Scope

This project supports a simplified clinical operations flow:

1. View operational metrics and department load from the dashboard.
2. Manage the consultation queue and select patients.
3. Review patient intake transcript details.
4. Generate AI-assisted analysis and suggested department routing.
5. Confirm routes and create downstream queue or order records.
6. Monitor department queue progression.
7. Maintain service definitions used in routing and queue workflows.

## Main Features

- Dashboard with queue KPIs, disease trend charts, live department load, and AI hospital briefing.
- Consultation queue page connected to Supabase patient and consultation data.
- Patient intake transcript review page.
- AI analysis page for department recommendation and route confirmation.
- Department queue monitor for check-in and status progression.
- Service management page for create, update, delete, and search operations.
- Route checking pages for reviewing patient routing details.
- Mediflow app branding for browser and installed app metadata.

## Tech Stack

- React 19
- React Router
- Supabase JavaScript client
- Recharts
- Lucide React
- CryptoJS
- Create React App build tooling

## Project Structure

```text
src/
	components/           Reusable UI such as sidebar and dashboard widgets
	pages/                Route-level screens for workflow pages
	styles/               Page-specific CSS files
	utils/                Supabase access, AI calls, encryption, and queue logic
public/                 Static assets, web manifest, branding assets
database/               Reserved for schema scripts or sanitized setup files
```

## Application Routes

- `/` Dashboard home page
- `/orchestrator` Orchestrator landing page
- `/orchestrator/consultation-queue` Consultation queue workflow
- `/orchestrator/transcript` Patient intake transcript page
- `/orchestrator/ai-analysis` AI analysis and route confirmation
- `/orchestrator/department-queue` Department queue monitor
- `/services` Service management
- `/checkRoute` Route lookup page
- `/checkRoute/:id` Individual patient route page

## Environment Variables

Create a local environment file such as `.env.local` and provide the required values.

Required for current workflow:

- `REACT_APP_SUPABASE_URL` Supabase project URL
- `REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY` Supabase publishable or anon key used by the frontend
- `REACT_APP_API_URL` External AI endpoint URL
- `REACT_APP_API_KEY` External AI authorization token
- `REACT_APP_PATIENT_SECRET` Secret used for client-side patient ID encryption helpers

Optional compatibility keys still referenced by some utility paths:

- `REACT_APP_FLEX_API_URL`
- `REACT_APP_FLEX_API_KEY`
- `REACT_APP_FLEX_TOKEN`
- `REACT_APP_SUPABASE_KEY`

An example template is provided in `.env.example`.

## Setup

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- A Supabase project with the required tables and relationships
- Access to the configured AI endpoint if AI features are part of the demo

### Install and Run

```bash
npm install
npm start
```

The app runs in development mode at `http://localhost:3000`.

### Production Build

```bash
npm run build
```

## Submission Guide

For academic or assessor submission, submit the source code and setup instructions, but do not submit live secrets or real database content.

Include:

- Source code in `src`, `public`, and any sanitized `database` schema scripts
- `package.json` and this README
- Optional screenshots or demo notes

Exclude:

- `.env`, `.env.local`, `.env.development.local`, `.env.production.local`
- `node_modules`
- `build`
- Any Supabase export containing real patient, consultation, queue, alert, transcript, or usage rows
- CSV, spreadsheet, SQLite, SQL dump, or backup files that contain live data
- API tokens, service keys, secret keys, and personal identifiers

## Database Submission Recommendation

The safest approach is to submit database schema only, not production or testing data.

The current schema reference for this project is available in `database/db.sql`.

Recommended submission format:

1. Export table structure only.
2. Remove all real rows from patient-related and operational tables.
3. If sample data is required, replace it with synthetic data only.
4. Rename or mask any fields that could identify a real person.
5. Document the expected tables and relationships in a short appendix or SQL schema file.

Tables that should be treated as sensitive in this project include at minimum:

- `Patient`
- `Consultation`
- `Order`
- `Queue`
- `Room` if room assignments reflect live operations

Based on the current schema in `database/db.sql`, these columns are especially sensitive and should not contain real data in a submission dataset:

- `Patient.name`
- `Patient.nric`
- `Patient.allergies`
- `Patient.medical_history`
- `Patient.family_history`
- `Consultation.doctor_name`
- `Consultation.transcript`
- `Order.remarks`

If your lecturer requires a database file, prefer one of these options:

1. A schema-only SQL file with `CREATE TABLE` statements and no `INSERT` data.
2. A sanitized demo dataset that uses fictional names, fictional IDs, and non-sensitive transcripts.
3. A separate clean Supabase project created specifically for submission and demo.

## Suggested Data Sanitization Rules

Before exporting demo data, remove or replace:

- Patient names
- National ID numbers or passport numbers
- Doctor names
- Detailed clinical notes
- Raw consultation transcripts copied from real cases
- Tokens, secrets, or provider credentials stored in any record

Use masking or synthetic replacements instead:

- `Patient 001`, `Patient 002`
- Age band instead of full date of birth
- Generic medical history values for demonstration
- Short fictional transcript samples written for the demo

## Known Notes

- The project currently builds successfully with existing ESLint warnings in the consultation queue page.
- A schema reference file is included at `database/db.sql`, but it is marked as context-only and may need reordering before direct execution.
- Some utilities still contain compatibility paths for older environment variable names.

## Scripts

- `npm start` Start the development server
- `npm run build` Create a production build
- `npm test` Run tests

## Submission Checklist

- Confirm `.env.local` is not included in the submission zip.
- Confirm no live database export files are included.
- Confirm screenshots and README match the current system behavior.
- Confirm the project can install with `npm install`.
- Confirm the app builds with `npm run build`.

## Authoring Note

If you want to include a database appendix for submission, refer to `database/db.sql`, `database/schema_appendix.md`, and the table sanitization guide in `database/submission_notes.md`. A fictional demo dataset is also provided in `database/demo_dataset.sql`.
