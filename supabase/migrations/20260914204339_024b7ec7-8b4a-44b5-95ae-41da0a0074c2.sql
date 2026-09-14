
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','protocol_officer','protocol_head','approver','staff');
CREATE TYPE public.request_type AS ENUM ('ticket','ticket_refund','visa_refund','intro_letter','logistics');
CREATE TYPE public.request_status AS ENUM ('draft','awaiting_approval','approved','documents_pending','memo_raised','with_agency','ticket_issued','under_review','recommended_for_payment','closed','queried','rejected');
CREATE TYPE public.travel_scope AS ENUM ('domestic','international');
CREATE TYPE public.principal_type AS ENUM ('staff','guest','dgca');
CREATE TYPE public.approval_kind AS ENUM ('dgca','ministerial');
CREATE TYPE public.approval_decision AS ENUM ('pending','approved','queried','rejected');
CREATE TYPE public.doc_type AS ENUM ('passport_biodata','staff_id_card','approval_letter','ticket','receipt','visa_receipt','invoice','other');
CREATE TYPE public.doc_kind AS ENUM ('memo','intro_letter');
CREATE TYPE public.logistics_item_type AS ENUM ('hotel','transport','hall','flight','meet_assist');

-- CORE REFERENCE
CREATE TABLE public.directorates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  directorate_id uuid NOT NULL REFERENCES public.directorates(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (directorate_id, name)
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  staff_id_number text NOT NULL UNIQUE CHECK (staff_id_number ~ '^NCAA/P\.\d{4,}$'),
  full_name text NOT NULL,
  official_email text NOT NULL UNIQUE,
  phone text,
  rank_title text,
  directorate_id uuid REFERENCES public.directorates(id),
  department_id uuid REFERENCES public.departments(id),
  role public.app_role NOT NULL DEFAULT 'staff',
  is_active boolean NOT NULL DEFAULT true,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.staff_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  staff_id_number text NOT NULL UNIQUE CHECK (staff_id_number ~ '^NCAA/P\.\d{4,}$'),
  full_name text NOT NULL,
  rank_title text,
  official_email text,
  phone text,
  directorate_id uuid REFERENCES public.directorates(id),
  department_id uuid REFERENCES public.departments(id),
  passport_number text,
  passport_expiry date,
  nationality text DEFAULT 'Nigerian',
  bank_name text,
  account_name text,
  account_number text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.travel_agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  contact_person text,
  phone text,
  email text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.memo_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  default_signatory text,
  default_cc text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CASE FILES
CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_no text NOT NULL UNIQUE,
  type public.request_type NOT NULL,
  status public.request_status NOT NULL DEFAULT 'draft',
  requester_staff_id uuid NOT NULL REFERENCES public.staff_records(id),
  on_behalf_of_staff_id uuid REFERENCES public.staff_records(id),
  directorate_id uuid REFERENCES public.directorates(id),
  department_id uuid REFERENCES public.departments(id),
  purpose text,
  destination text,
  origin_city text,
  trip_start date,
  trip_end date,
  travel_scope public.travel_scope,
  principal_type public.principal_type NOT NULL DEFAULT 'staff',
  assigned_officer_id uuid,
  agency_id uuid REFERENCES public.travel_agencies(id),
  amount_requested numeric(14,2),
  amount_approved numeric(14,2),
  currency text NOT NULL DEFAULT 'NGN',
  approval_required boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  approval_kind public.approval_kind NOT NULL DEFAULT 'dgca',
  reference_no text,
  approved_on date,
  approver_name text,
  decision public.approval_decision NOT NULL DEFAULT 'pending',
  comment text,
  file_path text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.request_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  doc_type public.doc_type NOT NULL DEFAULT 'other',
  file_path text NOT NULL,
  file_name text NOT NULL,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.generated_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.memo_templates(id),
  doc_kind public.doc_kind NOT NULL DEFAULT 'memo',
  reference_no text NOT NULL UNIQUE,
  subject text NOT NULL,
  body_snapshot text NOT NULL,
  signatory_name text,
  signatory_title text,
  cc_list text,
  version int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  issued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  agency_id uuid REFERENCES public.travel_agencies(id),
  ticket_number text,
  pnr text,
  airline text,
  route text,
  cabin_class text DEFAULT 'Economy',
  depart_at timestamptz,
  return_at timestamptz,
  amount numeric(14,2),
  invoice_no text,
  ticket_file text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  refund_kind text NOT NULL DEFAULT 'ticket',
  claimed_amount numeric(14,2),
  recommended_amount numeric(14,2),
  bank_name text,
  account_name text,
  account_number text,
  payment_ref text,
  paid_on date,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.logistics_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  item_type public.logistics_item_type NOT NULL,
  vendor_name text,
  confirmation_no text,
  location text,
  start_at timestamptz,
  end_at timestamptz,
  amount numeric(14,2),
  notes text,
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.request_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  actor_id uuid,
  actor_name text,
  action text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_protocol(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('admin','protocol_officer','protocol_head'));
$$;

CREATE OR REPLACE FUNCTION public.is_staff_owner(_user_id uuid, _staff_record uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.staff_records s WHERE s.id = _staff_record AND s.user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.can_see_request(_user_id uuid, _request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_protocol(_user_id)
      OR public.has_role(_user_id,'approver')
      OR EXISTS (
        SELECT 1 FROM public.requests r
        JOIN public.staff_records s ON s.id = r.requester_staff_id
        WHERE r.id = _request_id AND s.user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.next_reference(_type public.request_type)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE seg text; n int; yr text;
BEGIN
  seg := CASE _type
    WHEN 'ticket' THEN 'TKT' WHEN 'ticket_refund' THEN 'TRF'
    WHEN 'visa_refund' THEN 'VRF' WHEN 'intro_letter' THEN 'INT' ELSE 'LOG' END;
  yr := to_char(now() AT TIME ZONE 'Africa/Lagos','YYYY');
  SELECT count(*)+1 INTO n FROM public.requests WHERE type = _type
    AND to_char(created_at AT TIME ZONE 'Africa/Lagos','YYYY') = yr;
  RETURN 'NCAA/PRT/'||seg||'/'||yr||'/'||lpad(n::text,5,'0');
END;
$$;

CREATE OR REPLACE FUNCTION public.next_memo_reference(_kind public.doc_kind)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE seg text; n int; yr text;
BEGIN
  seg := CASE WHEN _kind = 'intro_letter' THEN 'LTR' ELSE 'MEM' END;
  yr := to_char(now() AT TIME ZONE 'Africa/Lagos','YYYY');
  SELECT count(*)+1 INTO n FROM public.generated_documents WHERE doc_kind = _kind
    AND to_char(created_at AT TIME ZONE 'Africa/Lagos','YYYY') = yr;
  RETURN 'NCAA/PRT/'||seg||'/'||yr||'/'||lpad(n::text,5,'0');
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER t_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_staff_touch BEFORE UPDATE ON public.staff_records FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_requests_touch BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_templates_touch BEFORE UPDATE ON public.memo_templates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.directorates, public.departments, public.profiles,
  public.user_roles, public.staff_records, public.travel_agencies, public.memo_templates,
  public.app_settings, public.requests, public.approvals, public.request_documents,
  public.generated_documents, public.tickets, public.refunds, public.logistics_items,
  public.notifications, public.audit_logs, public.request_activity TO authenticated;
GRANT ALL ON public.directorates, public.departments, public.profiles, public.user_roles,
  public.staff_records, public.travel_agencies, public.memo_templates, public.app_settings,
  public.requests, public.approvals, public.request_documents, public.generated_documents,
  public.tickets, public.refunds, public.logistics_items, public.notifications,
  public.audit_logs, public.request_activity TO service_role;

-- RLS
ALTER TABLE public.directorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memo_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY d_read ON public.directorates FOR SELECT TO authenticated USING (true);
CREATE POLICY d_admin ON public.directorates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY dep_read ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY dep_admin ON public.departments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY p_self ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_protocol(auth.uid()) OR public.has_role(auth.uid(),'approver'));
CREATE POLICY p_self_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY p_admin ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY ur_self ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_protocol(auth.uid()));
CREATE POLICY ur_admin ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY sr_read ON public.staff_records FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_protocol(auth.uid()) OR public.has_role(auth.uid(),'approver'));
CREATE POLICY sr_self_update ON public.staff_records FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY sr_protocol ON public.staff_records FOR ALL TO authenticated USING (public.is_protocol(auth.uid())) WITH CHECK (public.is_protocol(auth.uid()));

CREATE POLICY ta_read ON public.travel_agencies FOR SELECT TO authenticated USING (true);
CREATE POLICY ta_protocol ON public.travel_agencies FOR ALL TO authenticated USING (public.is_protocol(auth.uid())) WITH CHECK (public.is_protocol(auth.uid()));

CREATE POLICY mt_read ON public.memo_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY mt_admin ON public.memo_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY as_read ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY as_admin ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY r_read ON public.requests FOR SELECT TO authenticated USING (
  public.is_protocol(auth.uid()) OR public.has_role(auth.uid(),'approver')
  OR public.is_staff_owner(auth.uid(), requester_staff_id));
CREATE POLICY r_insert ON public.requests FOR INSERT TO authenticated WITH CHECK (
  public.is_protocol(auth.uid()) OR public.is_staff_owner(auth.uid(), requester_staff_id));
CREATE POLICY r_update_protocol ON public.requests FOR UPDATE TO authenticated USING (
  public.is_protocol(auth.uid()) OR public.has_role(auth.uid(),'approver')
  OR public.is_staff_owner(auth.uid(), requester_staff_id))
  WITH CHECK (public.is_protocol(auth.uid()) OR public.has_role(auth.uid(),'approver')
  OR public.is_staff_owner(auth.uid(), requester_staff_id));
CREATE POLICY r_delete_admin ON public.requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY ap_read ON public.approvals FOR SELECT TO authenticated USING (public.can_see_request(auth.uid(), request_id));
CREATE POLICY ap_write ON public.approvals FOR ALL TO authenticated USING (public.can_see_request(auth.uid(), request_id)) WITH CHECK (public.can_see_request(auth.uid(), request_id));

CREATE POLICY rd_read ON public.request_documents FOR SELECT TO authenticated USING (public.can_see_request(auth.uid(), request_id));
CREATE POLICY rd_write ON public.request_documents FOR ALL TO authenticated USING (public.can_see_request(auth.uid(), request_id)) WITH CHECK (public.can_see_request(auth.uid(), request_id));

CREATE POLICY gd_read ON public.generated_documents FOR SELECT TO authenticated USING (public.can_see_request(auth.uid(), request_id));
CREATE POLICY gd_write ON public.generated_documents FOR ALL TO authenticated USING (public.is_protocol(auth.uid())) WITH CHECK (public.is_protocol(auth.uid()));

CREATE POLICY tk_read ON public.tickets FOR SELECT TO authenticated USING (public.can_see_request(auth.uid(), request_id));
CREATE POLICY tk_write ON public.tickets FOR ALL TO authenticated USING (public.is_protocol(auth.uid())) WITH CHECK (public.is_protocol(auth.uid()));

CREATE POLICY rf_read ON public.refunds FOR SELECT TO authenticated USING (public.can_see_request(auth.uid(), request_id));
CREATE POLICY rf_write ON public.refunds FOR ALL TO authenticated USING (public.can_see_request(auth.uid(), request_id)) WITH CHECK (public.can_see_request(auth.uid(), request_id));

CREATE POLICY li_read ON public.logistics_items FOR SELECT TO authenticated USING (public.can_see_request(auth.uid(), request_id));
CREATE POLICY li_write ON public.logistics_items FOR ALL TO authenticated USING (public.is_protocol(auth.uid())) WITH CHECK (public.is_protocol(auth.uid()));

CREATE POLICY ra_read ON public.request_activity FOR SELECT TO authenticated USING (public.can_see_request(auth.uid(), request_id));
CREATE POLICY ra_write ON public.request_activity FOR INSERT TO authenticated WITH CHECK (public.can_see_request(auth.uid(), request_id));

CREATE POLICY n_own ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY n_own_update ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY n_insert ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_protocol(auth.uid()) OR user_id = auth.uid());

CREATE POLICY al_admin ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY al_insert ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- SEED REFERENCE DATA
INSERT INTO public.directorates (name, code) VALUES
  ('Office of the DGCA','ODGCA'),
  ('Protocol Unit','PRT'),
  ('Directorate of Airworthiness Standards','DAWS'),
  ('Directorate of Operations and Training Standards','DOTS'),
  ('Directorate of Air Transport Regulation','DATR'),
  ('Directorate of Aerodrome and Airspace Standards','DAAS'),
  ('Directorate of Finance and Accounts','DFA');

INSERT INTO public.departments (directorate_id, name, code)
SELECT d.id, x.name, x.code FROM public.directorates d
JOIN (VALUES
  ('ODGCA','Protocol Unit','PRT-UNIT'),
  ('ODGCA','Office Administration','ODGCA-ADM'),
  ('DAWS','Aircraft Certification','DAWS-AC'),
  ('DAWS','Continuing Airworthiness','DAWS-CA'),
  ('DOTS','Flight Operations','DOTS-FO'),
  ('DATR','Economic Regulation','DATR-ER'),
  ('DAAS','Aerodrome Safety','DAAS-AS'),
  ('DFA','Treasury','DFA-TR'),
  ('DFA','Budget and Planning','DFA-BP'),
  ('PRT','Travel and Logistics','PRT-TL')
) AS x(dcode,name,code) ON x.dcode = d.code;

INSERT INTO public.travel_agencies (name, contact_person, phone, email, address) VALUES
  ('Official Agency A — Abuja','Musa Danladi','+234 803 000 0001','ops@agencya.ng','Plot 12, Central Business District, Abuja'),
  ('Official Agency B — Lagos','Bisi Adebayo','+234 802 000 0002','tickets@agencyb.ng','23 Awolowo Road, Ikoyi, Lagos'),
  ('Official Agency C — International Desk','Grace Umeh','+234 809 000 0003','intl@agencyc.ng','Suite 4, Wuse II, Abuja');

INSERT INTO public.app_settings (key, value) VALUES
  ('authority_name','Nigeria Civil Aviation Authority'),
  ('authority_address','Aviation House, Murtala Muhammed Airport, Ikeja, Lagos'),
  ('dgca_title','Director-General of Civil Aviation'),
  ('dgca_name','Director-General of Civil Aviation'),
  ('memo_prefix','NCAA/PRT'),
  ('default_cc','Director-General of Civil Aviation; Director, Finance and Accounts; File Copy');

INSERT INTO public.memo_templates (code, title, subject, body, default_signatory, default_cc) VALUES
('TICKET_REQUEST','Request memo for flight tickets for a foreign / official trip','REQUEST FOR ISSUANCE OF FLIGHT TICKET — {{staff_name}} ({{staff_id}})',
E'Ref: {{memo_ref}}\nDate: {{date}}\n\nTHE DIRECTOR-GENERAL OF CIVIL AVIATION\nNigeria Civil Aviation Authority\n\nSUBJECT: REQUEST FOR ISSUANCE OF FLIGHT TICKET\n\nFollowing the approval conveyed vide reference {{approval_ref}}, the Protocol Unit hereby requests the issuance of a flight ticket in favour of the officer detailed below:\n\nName of Officer: {{staff_name}}\nUser ID / Personnel No.: {{staff_id}}\nRank / Title: {{rank}}\nDirectorate: {{directorate}}\nDepartment: {{department}}\nPassport Number: {{passport_no}}\nDestination: {{destination}}\nTravel Dates: {{travel_dates}}\nPurpose of Travel: {{purpose}}\nEstimated Cost: {{amount}}\nNominated Travel Agency: {{agency_name}}\n\nThe officer''s travel pack, comprising the passport biodata page, Staff Identity Card and departmental clearance, has been verified by the Protocol Unit.\n\nKindly approve for onward transmission to the nominated travel agency for issuance.\n\nThank you, Sir.',
'Head, Protocol Unit','Director-General of Civil Aviation; Director, Finance and Accounts; File Copy'),

('VISA_REFUND','Request memo for visa refund','REQUEST FOR REFUND OF VISA FEE — {{staff_name}} ({{staff_id}})',
E'Ref: {{memo_ref}}\nDate: {{date}}\n\nTHE DIRECTOR, FINANCE AND ACCOUNTS\nNigeria Civil Aviation Authority\n\nSUBJECT: REQUEST FOR REFUND OF VISA FEE\n\nThe under-listed officer proceeded on official assignment and personally defrayed the cost of the visa fee in respect of the trip approved vide reference {{approval_ref}}.\n\nName of Officer: {{staff_name}}\nUser ID / Personnel No.: {{staff_id}}\nRank / Title: {{rank}}\nDirectorate: {{directorate}}\nDepartment: {{department}}\nDestination / Embassy: {{destination}}\nTravel Dates: {{travel_dates}}\nAmount Claimed: {{amount}}\n\nThe visa fee receipt, passport biodata page and the approval document have been sighted and verified by the Protocol Unit.\n\nIt is hereby recommended that the sum stated above be refunded to the officer.',
'Head, Protocol Unit','Director-General of Civil Aviation; Director, Finance and Accounts; File Copy'),

('TICKET_REFUND','Request memo for ticket refund','REQUEST FOR REFUND OF AIR TICKET COST — {{staff_name}} ({{staff_id}})',
E'Ref: {{memo_ref}}\nDate: {{date}}\n\nTHE DIRECTOR, FINANCE AND ACCOUNTS\nNigeria Civil Aviation Authority\n\nSUBJECT: REQUEST FOR REFUND OF AIR TICKET COST\n\nThe officer named below personally purchased an air ticket for the official trip approved vide reference {{approval_ref}}, the Authority having been unable to issue the ticket ahead of departure.\n\nName of Officer: {{staff_name}}\nUser ID / Personnel No.: {{staff_id}}\nRank / Title: {{rank}}\nDirectorate: {{directorate}}\nDepartment: {{department}}\nRoute / Destination: {{destination}}\nTravel Dates: {{travel_dates}}\nPurpose of Travel: {{purpose}}\nAmount Claimed: {{amount}}\n\nThe ticket copy, payment receipt and approval document have been verified against the officer''s staff record by the Protocol Unit.\n\nIt is hereby recommended for payment.',
'Head, Protocol Unit','Director-General of Civil Aviation; Director, Finance and Accounts; File Copy'),

('INTRO_LETTER','Embassy Introduction Letter','LETTER OF INTRODUCTION — {{staff_name}} ({{staff_id}})',
E'Ref: {{memo_ref}}\nDate: {{date}}\n\nTHE VISA SECTION\n{{destination}}\n\nSUBJECT: LETTER OF INTRODUCTION\n\nI write to introduce {{staff_name}}, {{rank}}, of the {{directorate}} ({{department}}), Nigeria Civil Aviation Authority, bearing personnel number {{staff_id}} and passport number {{passport_no}}.\n\nThe officer is proceeding on official assignment on behalf of the Authority for the purpose of {{purpose}}, travelling on {{travel_dates}}. The journey has been duly approved by the Director-General of Civil Aviation vide reference {{approval_ref}}.\n\nThe Authority hereby confirms that the officer remains in its employment and will resume official duties on conclusion of the assignment. All expenses relating to the trip are borne by the Authority.\n\nKindly accord the officer the usual courtesies in the processing of the visa application.\n\nThank you.',
'Head, Protocol Unit','Director-General of Civil Aviation; File Copy'),

('LOGISTICS_COVER','Logistics cover memo','OFFICIAL LOGISTICS ARRANGEMENT — {{destination}}',
E'Ref: {{memo_ref}}\nDate: {{date}}\n\nTHE DIRECTOR-GENERAL OF CIVIL AVIATION\nNigeria Civil Aviation Authority\n\nSUBJECT: OFFICIAL LOGISTICS ARRANGEMENT\n\nPursuant to the approval conveyed vide reference {{approval_ref}}, the Protocol Unit has made the following logistics arrangements:\n\nPrincipal: {{staff_name}} ({{staff_id}})\nLocation: {{destination}}\nPeriod: {{travel_dates}}\nPurpose: {{purpose}}\nEstimated Cost: {{amount}}\n\nHotel accommodation, ground transportation and meet-and-assist services have been arranged with the vendors recorded on the case file.\n\nSubmitted for your kind approval, Sir.',
'Head, Protocol Unit','Director-General of Civil Aviation; Director, Finance and Accounts; File Copy');
