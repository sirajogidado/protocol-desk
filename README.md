# NCAA Protocol Hub

# NCAA Protocol Desk — Official Travel, Visa, Ticket & Logistics Platform

Build a production-ready internal web application for the Protocol Unit of the Nigeria Civil Aviation Authority (NCAA), which sits under the Director-General of Civil Aviation (DGCA).

Product name: NCAA Protocol Desk
Tagline: Official travel, visa, ticket and logistics desk for NCAA staff and Protocol.

This is NOT a public consumer aviation app. It is a secure government staff portal used only by NCAA employees and the Protocol Unit to process official tasks that currently move by paper memos, emails, and travel agencies.

## Problem
Protocol staff process visa refunds, embassy introduction letters, local and international tickets, ticket refunds, and logistics (hotels, flights, halls, transport) for NCAA staff, official guests, and the DGCA. Work only starts after DGCA / ministerial approval. Staff biodata page, Staff ID, Department and Directorate must be collected before an agency can issue a ticket. Staff identity across the Authority uses personnel number format NCAA/P.xxxx. There is no single system for requests, approvals, e-memos, attachments, agencies, and status tracking.

## Who it is for
1. NCAA staff (requestors) across Directorates and Departments
2. Protocol Unit officers (processors)
3. Protocol Unit Head (supervisor)
4. DGCA / designated approvers
5. System Admin

## Design direction
Professional Nigerian federal-agency operations desk. Clean, calm, high-trust, not flashy SaaS marketing.

- Visual language: deep NCAA navy (#0B1F3A), aviation green (#1B7A4E), gold accent (#C9A227), off-white canvas (#F6F7F4), sharp white cards
- Typography: tight government UI, excellent table density, readable memo documents
- Layout: left sidebar + top bar with NCAA mark, user role badge, User ID (NCAA/P.xxxx), notifications
- Components: shadcn/ui only (Sidebar, Table, Tabs, Dialog, Sheet, Form, Select, Textarea, Badge, Card, DropdownMenu, Avatar, Calendar, Command, Sonner toasts, Alert, Separator, Breadcrumb, Pagination)
- Icons: Lucide only
- Empty states must explain the next official action
- All money in Nigerian Naira (₦). Dates in Africa/Lagos. Use DD MMM YYYY
- Printable official documents (memo, introduction letter, ticket request pack) must look like NCAA internal correspondence: letterhead block, reference number, subject line, body, sign-off, CC list

Do not use purple SaaS gradients, playful illustrations, or consumer booking-site patterns.

## Tech stack (mandatory — do not substitute)
- Language: TypeScript (JavaScript runtime)
- Framework: TanStack Start + TanStack Router + TanStack Query + TanStack Form + TanStack Table
- UI: shadcn/ui + Tailwind CSS
- Icons: Lucide
- Database: PostgreSQL via Lovable Cloud / Supabase
- Auth: Supabase Auth (email + password). No public self-signup
- Files: Supabase Storage private buckets
- Authorization: Postgres Row Level Security on every table
- Use TanStack Server Functions for privileged writes (approval actions, memo number generation, role changes, user creation)
- No Next.js, no React Router, no custom Express server, no other icon pack, no other UI kit

## Login and identity (mandatory)

### Admin account that must exist after seed
Create this account so the app can be opened immediately:

- Email: protocol@ncaa.gov.ng
- Password: 123456
- Role: admin
- Full name: Protocol Administrator
- User ID / Staff ID: NCAA/P.0001
- Directorate: Office of the DGCA
- Department: Protocol Unit

This is the primary Admin login. Do not make admin@ncaa.gov.ng the main admin.

### Staff User ID format
Every staff record and every user must have a personnel number:

User ID: NCAA/P.xxxx

Rules:
- Prefix is exactly NCAA/P. (uppercase NCAA, slash, capital P, period)
- Then 4 or more digits, e.g. NCAA/P.0001, NCAA/P.0142, NCAA/P.1208
- Validate with regex: ^NCAA/P\.\d{4,}$
- Unique across profiles and staff_records
- Store as staff_id_number
- Show it on the top bar, request lists, staff directory, memos, introduction letters, and case files

### Registration
No public self-signup. Only Admin creates users from /admin/users.

Admin user form must require:
- User ID (NCAA/P.xxxx) with live pattern validation
- Official email
- Full name
- Rank / title
- Directorate
- Department
- Role: admin | protocol_officer | protocol_head | approver | staff
- Temporary password (Admin sets it)

On save: create Auth user, profile, and staff_record with the same NCAA/P.xxxx. Reject duplicate User IDs and duplicate emails.

### Login screen
Route: /login
- Title: NCAA Protocol Desk
- Fields: Official email + password
- Helper text: Staff are provisioned by Admin using User ID format NCAA/P.xxxx
- Small note under the form: Demo Admin — protocol@ncaa.gov.ng
- Do not print the password on the login page
- After login, top bar shows name, role, and User ID

## Roles and privileges

### Admin (seeded as protocol@ncaa.gov.ng)
- Create, deactivate, and manage users
- Assign roles
- Create and maintain Directorates, Departments, staff records
- Manage travel agencies
- Manage e-memo templates
- View full audit log
- Edit system settings (memo prefixes, default CCs, NCAA address, DGCA title)

### Approver (DGCA desk / designated officer)
- See pending requests that require DGCA / ministerial approval
- Approve, query, or reject with comments
- Attach signed approval PDF
- Cannot edit agency commercials or user accounts

### Protocol Head
- Assign requests to Protocol Officers
- Approve Protocol recommendations before tickets are issued or refunds are sent onward
- Oversee open protocol jobs, SLAs, and guest/DGCA logistics

### Protocol Officer
- Process assigned jobs end-to-end
- Collect staff pack: passport biodata page, Staff ID (NCAA/P.xxxx), Department, Directorate
- Raise e-memos from templates
- Send ticket packs to a travel agency
- Record issued tickets, PNRs, amounts, itineraries
- Book / record hotels, transport, hall hire
- Prepare embassy introduction letters
- Process visa refund and ticket refund files
- Update status and leave an activity trail

### Staff (NCAA employee)
- View own profile and uploaded documents
- Submit: ticket request, self-bought ticket refund, visa refund, introduction letter request, logistics support request
- Upload receipts, passport biodata, invitation letters, approval documents
- Track status of own requests only
- Download generated memos and letters addressed to them
- Cannot see other staff requests

A user holds one primary role. Staff records may exist before the person has a login.

## Core business rule
No Protocol task may move into “In processing” unless a DGCA / ministerial approval is attached OR an Approver has marked the request Approved in-app. The approval record must store: approval type (DGCA approval / ministerial approval), reference number, date, approver name, and file.

If a staff member already bought a ticket themselves, they apply for Ticket Refund through Protocol. Protocol still requires the same approval trail plus receipt and ticket copy.

Protocol must not assign a travel agency until the Staff Travel Pack is complete: passport biodata page, Staff ID (NCAA/P.xxxx), Department, Directorate. Protocol Head may override with a written reason.

## Request types
1. Flight ticket request (Domestic / International)
2. Ticket refund (staff self-purchased)
3. Visa refund
4. Embassy introduction letter
5. Official logistics (hotel, flight coordination, hall booking, ground transport) for staff, official guests, or DGCA movement

Each request is one case file with a unique reference, e.g. NCAA/PRT/TKT/2026/00041

## End-to-end workflows

### A. Ticket issuance (Protocol buys the ticket)
1. Staff or Protocol creates a Ticket Request: purpose, destination, travel dates, class (Economy default), domestic or international, accompanying officers if any, funding note.
2. Requester uploads or links DGCA/ministerial approval. If missing, status = Awaiting Approval and the Approver queue receives it.
3. On approval, status = Ready for Protocol.
4. Protocol Officer opens Staff Travel Pack checklist:
   - Passport biodata page (file)
   - Staff ID NCAA/P.xxxx + ID card file
   - Directorate
   - Department
   - Official email and phone
   - Passport number, expiry, nationality
5. Protocol generates e-memo “Request for issuance of flight ticket” from template and records the memo number.
6. Protocol assigns one registered Travel Agency and records the pack sent.
7. Protocol records the issued ticket: airline, PNR/ticket number, route, departure/return, amount ₦, agency invoice number, ticket PDF.
8. Status = Ticket Issued. Staff is notified in-app.

### B. Ticket refund (staff bought ticket themselves)
1. Staff submits Ticket Refund with ticket copy, payment receipt, reason, bank details (account name, NUBAN, bank), approval document, and User ID NCAA/P.xxxx.
2. Protocol verifies against staff record and approval.
3. Protocol generates “Request for ticket refund” e-memo.
4. Protocol Head clears the file.
5. Status: Submitted → Under review → Memo raised → Recommended for payment → Closed / Queried.
6. Record refund amount ₦ and payment voucher / accounts reference when available.

### C. Visa refund
Same pattern as ticket refund, plus visa fee receipt, embassy/country, visa type, entry date, and passport biodata.

### D. Embassy introduction letter
1. Staff requests letter: destination country, embassy/high commission, travel purpose, dates, passport number, User ID NCAA/P.xxxx.
2. Approval attached.
3. Protocol generates official Introduction Letter from template on NCAA letterhead block, with reference number, addressed to the Embassy/High Commission, introducing the officer by name, rank, User ID NCAA/P.xxxx, Directorate, and purpose.
4. Protocol Head / Approver can sign-off in-app (name, designation, date).
5. Staff downloads a printable view.

### E. Logistics for guests and DGCA
Create a Logistics Job that can bundle hotel, flight coordination, hall/venue, ground transportation, meet-and-assist.
Fields: principal (DGCA / named guest / staff), arrival, departure, city, preferred hotel class, vehicle type, venue name, special instructions, related request IDs.
Protocol records vendor, confirmation numbers, cost ₦, and voucher files.

## E-memo engine
Admin can create and edit templates. Each template has:
- code (TICKET_REQUEST, VISA_REFUND, TICKET_REFUND, INTRO_LETTER, LOGISTICS_COVER)
- title
- body with variables: {{memo_ref}}, {{date}}, {{staff_name}}, {{staff_id}}, {{rank}}, {{directorate}}, {{department}}, {{destination}}, {{travel_dates}}, {{purpose}}, {{amount}}, {{approval_ref}}, {{agency_name}}, {{passport_no}}, {{dgca_name}}
- default subject, default signatory title, default CC list

When Protocol generates a memo from a case:
- system allocates the next memo number
- snapshot the rendered body so later template edits do not rewrite issued memos
- store version, author, timestamp
- printable A4 view
- {{staff_id}} always renders as NCAA/P.xxxx

Seed these templates on first run:
1. Request memo for flight tickets for a foreign / official trip
2. Request memo for visa refund
3. Request memo for ticket refund
4. Embassy Introduction Letter

## Pages
Public
- /login

Authenticated shell
- /dashboard
- /requests
- /requests/new
- /requests/:id
- /letters
- /logistics
- /agencies
- /staff-directory
- /memos
- /approvals
- /admin/users
- /admin/templates
- /admin/directorates
- /admin/settings
- /profile
- /notifications

### Dashboard by role
Staff: my open requests, documents to download, missing-document checklist.
Protocol: assigned queue, awaiting documents, awaiting agency ticket, upcoming DGCA/guest movements this week.
Approver: pending approvals.
Admin: user count, open cases, agencies, recent audit events.

### Request list
TanStack Table with filters: type, status, directorate, date range, assigned officer, domestic/international. Show User ID column as NCAA/P.xxxx. Row click opens case file.

### Case file page
Left: request summary + status stepper.
Main tabs: Details | Documents | Staff pack | Memos & letters | Agency & ticket | Logistics | Activity.
Right rail: approval card, assigned officer, agency, amounts.

Ticket status stepper:
Draft → Awaiting Approval → Approved → Documents pending → Memo raised → With agency → Ticket issued → Closed
Any step can go to Queried or Rejected with a reason.

## Data model (Postgres)
Use UUIDs, timestamptz, created_by, updated_by. Enable RLS on every table.

profiles
- id (auth user)
- staff_id_number unique (NCAA/P.xxxx)
- full_name, official_email, phone, rank_title
- directorate_id, department_id
- role (admin | protocol_officer | protocol_head | approver | staff)
- is_active
- avatar_url

directorates
- id, name, code, is_active

departments
- id, directorate_id, name, code, is_active

staff_records
- id
- user_id nullable
- staff_id_number unique (NCAA/P.xxxx)
- full_name, rank_title, official_email, phone
- directorate_id, department_id
- passport_number, passport_expiry, nationality
- bank_name, account_name, account_number
- is_active

travel_agencies
- id, name, contact_person, phone, email, address, is_active, notes

memo_templates
- id, code, title, subject, body, default_signatory, default_cc, is_active

requests
- id
- reference_no unique
- type (ticket | ticket_refund | visa_refund | intro_letter | logistics)
- status
- requester_staff_id
- on_behalf_of_staff_id nullable
- directorate_id, department_id
- purpose, destination, origin_city
- trip_start, trip_end
- travel_scope (domestic | international)
- principal_type (staff | guest | dgca)
- assigned_officer_id
- agency_id
- amount_requested numeric
- amount_approved numeric
- currency default NGN
- approval_required boolean default true
- notes

approvals
- id, request_id
- approval_kind (dgca | ministerial)
- reference_no, approved_on, approver_name
- decision (pending | approved | queried | rejected)
- comment, file_path

request_documents
- id, request_id, doc_type, file_path, file_name, uploaded_by, created_at
doc_type: passport_biodata | staff_id_card | approval_letter | ticket | receipt | visa_receipt | invoice | other

generated_documents
- id, request_id, template_id, doc_kind (memo | intro_letter)
- reference_no, subject, body_snapshot, signatory_name, signatory_title, cc_list
- status (draft | issued)
- created_by, issued_at

tickets
- id, request_id, agency_id
- ticket_number, pnr, airline, route, cabin_class
- depart_at, return_at
- amount, invoice_no, ticket_file

refunds
- id, request_id, refund_kind (ticket | visa)
- claimed_amount, recommended_amount
- bank_name, account_name, account_number
- payment_ref, paid_on, status

logistics_items
- id, request_id
- item_type (hotel | transport | hall | flight | meet_assist)
- vendor_name, confirmation_no, location
- start_at, end_at, amount, notes, file_path

notifications
- id, user_id, title, body, link, is_read, created_at

audit_logs
- id, actor_id, action, entity_type, entity_id, metadata jsonb, created_at

## Security
- No public registration. Admin creates users.
- Staff RLS: select/update only own requests and own profile.
- Protocol roles: all requests.
- Approver: requests awaiting approval + already acted.
- Storage buckets private. Signed URLs only. Never expose public URLs for passport biodata or ID cards.
- Every status change, memo issue, approval, user create, and document upload writes audit_logs.
- Do not show full passport numbers in list views; show them only on the case file for Protocol/Admin.

## Seed data so the preview is usable immediately

Directorates:
- Directorate of Airworthiness Standards (DAWS)
- Directorate of Operations and Training Standards
- Directorate of Air Transport Regulation
- Directorate of Aerodrome and Airspace Standards
- Directorate of Finance and Accounts
- Office of the DGCA
- Protocol Unit

Departments under a few of those, including Protocol Unit under Office of the DGCA.

Travel agencies:
- Official Agency A — Abuja
- Official Agency B — Lagos
- Official Agency C — International Desk

Demo users (all password 123456):
- protocol@ncaa.gov.ng | NCAA/P.0001 | admin | Protocol Administrator | Protocol Unit
- head.protocol@ncaa.gov.ng | NCAA/P.0002 | protocol_head | Head, Protocol Unit | Protocol Unit
- officer@ncaa.gov.ng | NCAA/P.0003 | protocol_officer | Protocol Officer | Protocol Unit
- approver@ncaa.gov.ng | NCAA/P.0004 | approver | DGCA Approving Officer | Office of the DGCA
- staff@ncaa.gov.ng | NCAA/P.0142 | staff | Sample Staff Officer | DAWS

Seed 6 sample requests in different statuses covering ticket, ticket refund, visa refund, intro letter, and DGCA hotel logistics. Every sample request must use NCAA/P.xxxx User IDs from the list above.

## UX details
- New request is a wizard: choose type → form → upload documents → submit
- Document checklist on ticket cases shows complete/missing for biodata page, Staff ID NCAA/P.xxxx, Department, Directorate, approval
- Amount fields formatted as ₦1,250,000.00
- Status badges colour-coded and labelled
- Activity timeline on every case
- Confirmation dialogs for Approve, Reject, Issue memo, Close case
- Toasts for success/failure
- Desktop-first, mobile usable
- Notifications when a request is approved, queried, assigned, or a ticket is issued

## Out of scope for this first build
- Live airline GDS / Amadeus booking
- External travel-agency login portal
- Payroll or GIFMIS payment execution
- Email/SMS gateway
- Multi-language
- Public NCAA passenger-refund portal

## Implementation notes
- Create schema, RLS, auth, navigation, and the case-file workflow first, then dashboards
- Use TanStack Router file routes
- Use TanStack Query for server state
- Use TanStack Table for directories and queues
- Use TanStack Form + zod for every form, including User ID pattern NCAA/P.xxxx
- Keep components small: RequestStatusBadge, StaffPackChecklist, MemoPreview, ApprovalCard, MoneyText
- After scaffolding, a user must be able to log in as protocol@ncaa.gov.ng / 123456, open Admin, create a staff user with User ID NCAA/P.0201, open a ticket request, see missing biodata, generate a memo, assign an agency, and mark ticket issued

Build the full MVP described above as one coherent NCAA Protocol Desk, not a generic CRM or travel booking website. use the attached logo as the portal logo

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5f9f6b1a-d99b-4358-9aae-a0f026063b2b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
