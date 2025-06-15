--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: businesses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.businesses (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    logo text,
    password text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    pay_period_type text DEFAULT 'weekly'::text,
    pay_period_start_day integer DEFAULT 1,
    api_key text
);


ALTER TABLE public.businesses OWNER TO neondb_owner;

--
-- Name: businesses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.businesses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.businesses_id_seq OWNER TO neondb_owner;

--
-- Name: businesses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.businesses_id_seq OWNED BY public.businesses.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    business_id integer NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.clients OWNER TO neondb_owner;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO neondb_owner;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: estimates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.estimates (
    id integer NOT NULL,
    business_id integer NOT NULL,
    client_id integer NOT NULL,
    estimate_number text NOT NULL,
    title text NOT NULL,
    description text,
    line_items jsonb NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax_rate numeric(5,2) DEFAULT '0'::numeric,
    tax_amount numeric(10,2) DEFAULT '0'::numeric,
    total numeric(10,2) NOT NULL,
    deposit_amount numeric(10,2),
    status text DEFAULT 'draft'::text NOT NULL,
    valid_until timestamp without time zone,
    client_signature text,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    share_token text,
    client_response text,
    client_responded_at timestamp without time zone,
    deposit_required boolean DEFAULT false,
    deposit_type text DEFAULT 'fixed'::text,
    deposit_percentage text
);


ALTER TABLE public.estimates OWNER TO neondb_owner;

--
-- Name: estimates_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.estimates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.estimates_id_seq OWNER TO neondb_owner;

--
-- Name: estimates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.estimates_id_seq OWNED BY public.estimates.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    business_id integer NOT NULL,
    client_id integer NOT NULL,
    job_id integer,
    estimate_id integer,
    invoice_number text NOT NULL,
    title text NOT NULL,
    description text,
    line_items jsonb NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax_rate numeric(5,2) DEFAULT '0'::numeric,
    tax_amount numeric(10,2) DEFAULT '0'::numeric,
    total numeric(10,2) NOT NULL,
    amount_paid numeric(10,2) DEFAULT '0'::numeric,
    status text DEFAULT 'draft'::text NOT NULL,
    payment_method text,
    payment_notes text,
    client_signature text,
    photos jsonb,
    due_date timestamp without time zone,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    deposit_required boolean DEFAULT false,
    deposit_type text DEFAULT 'fixed'::text,
    deposit_amount text,
    deposit_percentage text,
    deposit_paid boolean DEFAULT false,
    deposit_paid_at timestamp without time zone,
    share_token text,
    signed_at timestamp without time zone
);


ALTER TABLE public.invoices OWNER TO neondb_owner;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO neondb_owner;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    business_id integer NOT NULL,
    client_id integer NOT NULL,
    assigned_user_id integer,
    title text NOT NULL,
    description text,
    address text,
    scheduled_start timestamp without time zone,
    scheduled_end timestamp without time zone,
    status text DEFAULT 'scheduled'::text NOT NULL,
    estimated_amount numeric(10,2),
    actual_amount numeric(10,2),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    priority text DEFAULT 'normal'::text NOT NULL,
    job_type text,
    is_recurring boolean DEFAULT false,
    recurring_frequency text,
    recurring_end_date timestamp without time zone,
    parent_job_id integer
);


ALTER TABLE public.jobs OWNER TO neondb_owner;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO neondb_owner;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: payroll_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payroll_settings (
    id integer NOT NULL,
    business_id integer NOT NULL,
    pay_period_type text DEFAULT 'weekly'::text NOT NULL,
    pay_period_start_day integer DEFAULT 1 NOT NULL,
    overtime_threshold numeric(5,2) DEFAULT 40.00,
    overtime_multiplier numeric(3,2) DEFAULT 1.50,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    pay_period_start_date date
);


ALTER TABLE public.payroll_settings OWNER TO neondb_owner;

--
-- Name: payroll_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.payroll_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_settings_id_seq OWNER TO neondb_owner;

--
-- Name: payroll_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.payroll_settings_id_seq OWNED BY public.payroll_settings.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.services (
    id integer NOT NULL,
    business_id integer NOT NULL,
    name text NOT NULL,
    description text,
    rate numeric(10,2),
    unit text DEFAULT 'hour'::text,
    is_active boolean DEFAULT true
);


ALTER TABLE public.services OWNER TO neondb_owner;

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO neondb_owner;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: time_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.time_entries (
    id integer NOT NULL,
    business_id integer NOT NULL,
    user_id integer NOT NULL,
    job_id integer,
    clock_in timestamp without time zone NOT NULL,
    clock_out timestamp without time zone,
    break_start timestamp without time zone,
    break_end timestamp without time zone,
    total_hours numeric(5,2),
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.time_entries OWNER TO neondb_owner;

--
-- Name: time_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.time_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.time_entries_id_seq OWNER TO neondb_owner;

--
-- Name: time_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.time_entries_id_seq OWNED BY public.time_entries.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    business_id integer NOT NULL,
    username text DEFAULT 'user'::text,
    pin text NOT NULL,
    role text NOT NULL,
    first_name text,
    last_name text,
    phone text,
    email text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: businesses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.businesses ALTER COLUMN id SET DEFAULT nextval('public.businesses_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: estimates id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.estimates ALTER COLUMN id SET DEFAULT nextval('public.estimates_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: payroll_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payroll_settings ALTER COLUMN id SET DEFAULT nextval('public.payroll_settings_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: time_entries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.time_entries ALTER COLUMN id SET DEFAULT nextval('public.time_entries_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: businesses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.businesses (id, name, email, phone, address, logo, password, created_at, pay_period_type, pay_period_start_day, api_key) FROM stdin;
10	Test	mdgross8921@gmail.com	\N	\N	\N	password	2025-05-27 03:06:58.458635	weekly	1	\N
11	J Home Services	Jacobblevins31@gmail.com	276-706-2467 	2082 Riverside Road Marion VA 	\N	Hhyr4hhyr4	2025-05-27 17:28:04.033477	weekly	1	\N
12	Shawn florey	shawn.florey@gmail.com	2766985480	\N	\N	Lincoln09	2025-05-27 23:40:26.183978	weekly	1	\N
13	Dirryyduckks	duck6165@yahoo.com	\N	\N	\N	Cincyreds!34	2025-06-06 22:21:45.658584	weekly	1	\N
14	M&M Pumping Service	mmpumping25@gmail.com	2762202580	\N	\N	pumpitup25	2025-06-09 19:11:40.841667	weekly	1	\N
1	Flatline earthworks	alter3d24@gmail.com	2762108273		data:image/jpeg;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADvAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAd4AAAAAAAAGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADvAAAAAAAAAAAAAAAA7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAoAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAD//Z	BodacsDmr21@	2025-05-23 21:50:50.665797	biweekly	6	bw_wkad606ephtmbqx7a0f
15	Childress Plumbing 	childressplumbing24@gmail.com	276;206-2579	\N	\N	mikeq978	2025-06-12 16:33:34.643346	weekly	1	\N
16	Fixed Login Business	loginfix@example.com	555-0199	\N	\N	1234	2025-06-12 17:36:11.136948	weekly	1	bw_lcf7itxs8qocat5sd5
17	Jake's Test Biz	jaker07@gmail.com	\N	\N	\N	Wtfdywm2d?	2025-06-12 21:02:44.822868	weekly	1	bw_uc17ycnemnaev8segsw
20	Test Business	test@example.com	555-1234	\N	\N	temp123	2025-06-15 02:42:36.468252	weekly	1	bw_i8g97qa8e0kgg07pr68
21	Test Business 2	test2@example.com	555-1234	\N	\N	temp123	2025-06-15 02:42:46.508272	weekly	1	bw_97oc5tfyqkdx8un8ogx
27	Test Business	test@business.com	555-1234	\N	\N	testpass123	2025-06-15 02:57:13.225631	weekly	1	bw_xh7raq1cj7m6gosjjj7
28	Auth Test Business	authtest@business.com	555-1234	\N	\N	testpass123	2025-06-15 02:57:45.065083	weekly	1	bw_nlz0lqaq7fbt8gy4a7l
34	Test Business	admin@test.com	\N	\N	\N	testpass123	2025-06-15 03:08:36.605124	weekly	1	bw_i8rfj2cpks92brji6al
35	Test Business 2	admin2@test.com	\N	\N	\N	testpass123	2025-06-15 03:08:47.888208	weekly	1	bw_y09k0oyq06t9peo4pd
36	Flatline Earthworks 	mtnmike89@gmail.com	2762108273	\N	\N	BodavsDmr21@	2025-06-15 14:13:34.686112	weekly	1	bw_ci4dubx6ziu75th9sto
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clients (id, business_id, name, email, phone, address, notes, created_at) FROM stdin;
1	1	John Deere	mdgross8921@gmail.com	2762108273	13004 flatwoods Rd coeburn, va	\N	2025-05-24 03:32:54.161422
2	1	Christine Vasickanin	leezahhelene@yahoo.com		1451 Massachusetts Ave Bristol, va	\N	2025-06-05 23:27:36.876961
3	14	Rigg's Oil	mmpumping25@gmail.com		Stateline Marathon	\N	2025-06-09 19:13:10.882234
4	1	Debug Client Test	debug@test.com	555-123-4567	\N	\N	2025-06-10 22:07:21.933851
5	1	Test Client Auth Check	test-auth@example.com	555-000-0000	\N	\N	2025-06-10 22:15:36.313003
6	1	Test Client Auth Check	test-auth@example.com	555-000-0000	\N	\N	2025-06-10 22:25:38.916922
7	1	Schema Test Client	schema-test@example.com	555-SCHEMA	\N	\N	2025-06-10 22:36:03.139461
8	1	Test Client via API	api-test@example.com	555-API-TEST	\N	\N	2025-06-11 02:03:45.129597
16	1	Test Client	test@test.com	555-0123	123 Test St	\N	2025-06-11 16:09:52.227545
17	1	Jane Deere	mdgross8921@gmail.com	2762108273	13004 flatwoods Rd coeburn, va	\N	2025-06-11 16:55:39.075871
18	1	Don Gross	email@gmail.com	1234567890	123 Main St, Bristol, VA	\N	2025-06-11 16:57:29.493193
19	1	Mary Kern	email@Gmail.com	\N	264 Knoll Dr, Bristol, VA	\N	2025-06-11 18:49:54.638436
20	1	Test Route Client	test@routetest.com	555-TEST-ROUTE	\N	\N	2025-06-11 21:16:09.621943
21	1	Test Route Client	test@routetest.com	555-TEST-ROUTE	\N	\N	2025-06-11 21:17:03.236051
22	1	Test Route Client	test@routetest.com	555-TEST-ROUTE	\N	\N	2025-06-11 21:24:00.714935
23	1	Final Test Client	final.test@example.com	555-0199	\N	\N	2025-06-11 21:25:05.950388
24	1	Final Test Client	final.test@example.com	555-0199	\N	\N	2025-06-11 21:27:27.669645
25	1	Final Test Client	final.test@example.com	555-0199	\N	\N	2025-06-11 21:29:05.968641
26	1	Final Test Client	final.test@example.com	555-0199	\N	\N	2025-06-11 21:30:57.015203
27	1	Final Test Client	final.test@example.com	555-0199	\N	\N	2025-06-11 21:33:29.530823
28	1	Unified Test Client	unified@test.com	555-0123	\N	\N	2025-06-11 23:13:59.560255
29	1	Travis Stanley	turdbird@gmail.com	276-210-8273	123 Main St, Kingsport, TN	\N	2025-06-12 03:06:54.414024
30	1	Jeff Baker	baker@gmail.com	1234567890	123 Main Street, Wise, Virginia	\N	2025-06-12 03:57:26.716995
31	1	Max F.	max@gmail.com	\N	124 Shit, Wise, VA	\N	2025-06-12 14:21:06.702241
32	1	Chuckie Fatboy	chuckie@gmail.com	\N	436 Main Street, Wise, Virginia	\N	2025-06-12 14:33:31.365656
35	1	Updated Final Client	final@test.com	\N	\N	\N	2025-06-12 21:28:23.967578
36	35	Test Client	client@test.com	555-0123	123 Main St	\N	2025-06-15 03:09:07.060173
\.


--
-- Data for Name: estimates; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.estimates (id, business_id, client_id, estimate_number, title, description, line_items, subtotal, tax_rate, tax_amount, total, deposit_amount, status, valid_until, client_signature, notes, created_at, share_token, client_response, client_responded_at, deposit_required, deposit_type, deposit_percentage) FROM stdin;
6	1	1	EST-1749593736875	Test Estimate Auth Check	\N	[]	0.00	0.00	0.00	150.00	\N	draft	\N	\N	\N	2025-06-10 22:15:36.896069	\N	\N	\N	f	fixed	\N
7	1	1	EST-1749594963999	Schema Test Estimate	\N	[]	0.00	0.00	0.00	300.00	\N	draft	2025-07-01 00:00:00	\N	\N	2025-06-10 22:36:04.017681	\N	\N	\N	f	fixed	\N
8	1	1	EST-1749607426174	Test Estimate via API	\N	[{"rate": "750.00", "amount": "750.00", "quantity": 1, "description": "Test Service"}]	750.00	0.00	0.00	750.00	\N	draft	\N	\N	\N	2025-06-11 02:03:46.194787	\N	\N	\N	f	fixed	\N
5	1	2	EST-250605-2331	Driveway apron	Correct driveway dropoff of about 1.5 ft drop off. 20 ft wide x 15 ft in length	[]	0.00	0.00	0.00	0.00	0.00	draft	2025-06-30 00:00:00	\N	\N	2025-06-05 23:31:33.612054	\N	\N	\N	f	fixed	25
11	1	29	EST-1749697866306	Drain Cleaning	Estimate for drain cleaning service	[]	0.00	0.00	0.00	300.00	\N	draft	\N	\N	\N	2025-06-12 03:11:06.3278	\N	\N	\N	f	fixed	\N
14	1	1	EST-1749763611170	Updated Debug Estimate		"[{\\"description\\":\\"Test\\",\\"quantity\\":1,\\"rate\\":100,\\"amount\\":100}]"	0.00	0.00	0.00	100.00	\N	draft	\N	\N		2025-06-12 21:26:51.184154	est_efh5jy312l9	\N	\N	f	fixed	\N
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoices (id, business_id, client_id, job_id, estimate_id, invoice_number, title, description, line_items, subtotal, tax_rate, tax_amount, total, amount_paid, status, payment_method, payment_notes, client_signature, photos, due_date, paid_at, created_at, deposit_required, deposit_type, deposit_amount, deposit_percentage, deposit_paid, deposit_paid_at, share_token, signed_at) FROM stdin;
12	1	1	\N	\N	INV-1749593736711	Test Invoice Auth Check	\N	[]	0.00	0.00	0.00	100.00	0.00	draft	\N	\N	\N	\N	\N	\N	2025-06-10 22:15:36.731489	f	fixed	\N	\N	f	\N	\N	\N
13	1	1	\N	\N	INV-1749594963828	Schema Test Invoice	\N	[{"amount": "250.00", "description": "Test service"}]	0.00	0.00	0.00	250.00	0.00	draft	\N	\N	\N	\N	\N	\N	2025-06-10 22:36:03.848007	f	fixed	\N	\N	f	\N	\N	\N
14	1	1	\N	\N	INV-1749607425849	Test Invoice via API	\N	[{"rate": "500.00", "amount": "500.00", "quantity": 1, "description": "Test Service"}]	500.00	0.00	0.00	500.00	0.00	draft	\N	\N	\N	\N	\N	\N	2025-06-11 02:03:45.870081	f	fixed	\N	\N	f	\N	\N	\N
15	1	1	\N	\N	INV-1749680258498	Updated Test Invoice	Test invoice for edit functionality	"[{\\"description\\":\\"Updated service\\",\\"quantity\\":2,\\"rate\\":150,\\"amount\\":300}]"	300.00	0.00	30.00	330.00	0.00	paid	\N	\N	\N	\N	\N	\N	2025-06-11 22:17:38.509587	f	fixed	\N	\N	f	\N	inv_2whcge1fdk2	\N
9	1	1	\N	\N	INV-250602A	Pump tank	Pump septic 	[{"rate": "400", "amount": "400", "quantity": 1, "description": "Pump septic tank"}]	400.00	0.00	0.00	400.00	0.00	draft	\N	\N	\N	\N	2025-06-03 00:00:00	\N	2025-06-02 14:34:33.339328	f	fixed	\N	\N	f	\N	\N	\N
10	1	1	3	\N	INV-250603A	Pump tank	Pump tank	[{"rate": "400", "amount": "400", "quantity": 1, "description": "Pump septic tank"}]	400.00	0.00	0.00	400.00	0.00	draft	\N	\N	\N	\N	2025-07-03 00:00:00	\N	2025-06-03 23:37:06.109536	f	fixed	\N	\N	f	\N	\N	\N
11	14	3	\N	\N	INV-250609A	Septic line repair	Cut asphalt to expose offset sewer line by septic tank behind gas station. 	[{"rate": "0", "amount": "0", "quantity": 1, "description": ""}]	0.00	0.00	0.00	0.00	0.00	draft	\N	\N	\N	\N	2025-06-30 00:00:00	\N	2025-06-09 19:14:24.534957	f	fixed	\N	\N	f	\N	\N	\N
23	1	1	\N	\N	INV-250612G	UPDATED Test Estimate		[{"rate": 150, "amount": 150, "quantity": 1, "description": "Test"}]	0.00	0.00	0.00	200.00	0.00	draft	\N	\N	\N	\N	2025-07-12 17:11:42.209	\N	2025-06-12 17:11:42.219711	f	fixed	\N	\N	f	\N	\N	\N
25	1	1	\N	\N	INV-250612H	Updated Test Estimate		[{"rate": 100, "amount": 100, "quantity": 1, "description": "Test Item"}]	0.00	0.00	0.00	150.00	0.00	draft	\N	\N	\N	\N	2025-07-12 21:26:31.69	\N	2025-06-12 21:26:31.70302	f	fixed	\N	\N	f	\N	\N	\N
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.jobs (id, business_id, client_id, assigned_user_id, title, description, address, scheduled_start, scheduled_end, status, estimated_amount, actual_amount, notes, created_at, priority, job_type, is_recurring, recurring_frequency, recurring_end_date, parent_job_id) FROM stdin;
1	1	1	2	Test 3	Test 3	\N	2025-05-27 13:00:00	2025-05-27 21:00:00	scheduled	695.00	\N	\N	2025-05-26 21:18:20.838706	normal	\N	f	\N	\N	\N
4	1	1	2	Pump tank	Pump tank	13004 flatwoods Rd coeburn, va	2025-06-04 13:00:00	2025-06-04 21:00:00	scheduled	450.00	\N	\N	2025-06-03 21:08:50.361186	normal	\N	f	\N	\N	\N
2	1	1	2	Pump tank	Pump tank	13004 flatwoods Rd coeburn, va	2025-06-04 13:00:00	2025-06-04 17:00:00	cancelled	450.00	\N	\N	2025-06-03 20:48:37.143405	normal	\N	f	\N	\N	\N
3	1	1	2	Pump tank	Pump tank	13004 flatwoods Rd coeburn, va	2025-06-05 13:00:00	2025-06-05 21:00:00	completed	450.00	\N	\N	2025-06-03 20:54:57.375505	normal	\N	f	\N	\N	\N
5	1	1	2	Pump tank	Pump tank	13004 flatwoods Rd coeburn, va	2025-06-13 13:00:00	2025-06-13 14:00:00	scheduled	450.00	\N	\N	2025-06-06 23:04:53.191408	normal	\N	f	\N	\N	\N
6	1	1	\N	Test Job Auth Check	Testing authentication	\N	2025-06-11 10:00:00	\N	scheduled	\N	\N	\N	2025-06-10 22:15:36.494212	medium	\N	f	\N	\N	\N
7	1	1	\N	Schema Test Job	Testing updated schema paths	\N	2025-06-12 09:00:00	\N	scheduled	\N	\N	\N	2025-06-10 22:36:03.508691	medium	\N	f	\N	\N	\N
8	1	1	\N	Test Job via API	Created through ChatGPT API	\N	2025-06-12 02:03:45.368	\N	scheduled	\N	\N	\N	2025-06-11 02:03:45.506521	medium	\N	f	\N	\N	\N
14	1	29	\N	Drain Cleaning	Drain cleaning service starting at $295/hr for the first hour and $150/hr after	123 Main St, Kingsport, TN	2025-06-12 14:00:00	2025-06-12 15:30:00	scheduled	370.00	\N	\N	2025-06-12 03:19:35.2254	medium	\N	f	\N	\N	\N
16	35	36	\N	Test Job	Install new system	123 Main St	2025-06-15 14:00:00	\N	scheduled	500.00	\N	\N	2025-06-15 03:09:24.912488	medium	service	f	\N	\N	\N
\.


--
-- Data for Name: payroll_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payroll_settings (id, business_id, pay_period_type, pay_period_start_day, overtime_threshold, overtime_multiplier, created_at, updated_at, pay_period_start_date) FROM stdin;
1	1	weekly	1	40.00	1.50	2025-06-02 19:20:45.988546	2025-06-02 19:20:45.988546	\N
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.services (id, business_id, name, description, rate, unit, is_active) FROM stdin;
1	1	Drain cleaning		295.00	hour	t
2	1	Pump septic tank	Pump 1000 gal septic tank	400.00	each	t
3	1	Travel time	Rate for travel to and from job	195.00	hour	t
4	1	Test Service via API	Created through ChatGPT API	100.00	hour	t
\.


--
-- Data for Name: time_entries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.time_entries (id, business_id, user_id, job_id, clock_in, clock_out, break_start, break_end, total_hours, notes, created_at) FROM stdin;
1	1	1	\N	2025-05-24 03:17:47.424	2025-05-24 03:17:47.424	\N	\N	\N	\N	2025-05-24 03:17:47.433577
2	1	1	\N	2025-05-24 03:17:53.352	2025-05-24 03:17:53.352	\N	\N	\N	\N	2025-05-24 03:17:53.359721
3	1	1	\N	2025-05-24 03:26:02.265	2025-05-24 03:26:02.265	\N	\N	\N	\N	2025-05-24 03:26:02.275236
11	1	1	\N	2025-05-30 14:44:49.134	2025-05-30 18:28:43.836	\N	\N	3.75	\N	2025-05-30 14:44:49.154751
6	1	1	\N	2025-05-24 03:27:41.426	2025-05-24 03:28:44.883	\N	\N	0.02	\N	2025-05-24 03:27:41.435511
5	1	1	\N	2025-05-24 03:27:23.97	2025-05-24 03:29:15.318	\N	\N	0.03	\N	2025-05-24 03:27:23.979595
4	1	1	\N	2025-05-24 03:26:06.439	2025-05-24 03:31:14.931	\N	\N	0.09	\N	2025-05-24 03:26:06.449252
7	1	1	\N	2025-05-24 03:31:17.044	2025-05-24 03:31:18.577	\N	\N	0.00	\N	2025-05-24 03:31:17.055516
8	1	1	\N	2025-05-24 03:38:59.341	2025-05-24 03:39:00.985	\N	\N	0.00	\N	2025-05-24 03:38:59.350087
9	1	1	\N	2025-05-24 03:48:16.5	2025-05-24 03:48:18.149	\N	\N	0.00	\N	2025-05-24 03:48:16.510829
10	1	1	\N	2025-05-30 01:48:35.238	2025-05-30 01:48:38.891	\N	\N	0.00	\N	2025-05-30 01:48:35.25878
12	1	1	\N	2025-06-02 17:29:43.389	2025-06-02 17:32:20.15	\N	\N	0.04	\N	2025-06-02 17:29:43.399552
13	1	1	\N	2025-06-02 19:20:19.39	2025-06-03 16:10:15.498	\N	\N	20.75	\N	2025-06-02 19:20:19.400957
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, business_id, username, pin, role, first_name, last_name, phone, email, is_active, created_at) FROM stdin;
2	1	Pwood	1234	member	Pecker 	Wood		mtnmike89@gmail.com	t	2025-05-23 22:04:21.42174
1	1	admin	1026	admin	Admin	User	\N	\N	t	2025-05-23 21:50:50.720057
6	10	admin	0828	admin	Micheal	Gross	\N	\N	t	2025-05-27 03:07:26.177075
7	11	admin	5747	admin	Jacob	Blevins	\N	\N	t	2025-05-27 17:28:20.831575
8	12	admin	9111	admin	Shawn	Florey	\N	\N	t	2025-05-27 23:40:42.995793
9	13	admin	6165	admin	Thomas	Gross	\N	\N	t	2025-06-06 22:22:05.536823
10	14	admin	1029	admin	Aki	Godsey	\N	\N	t	2025-06-09 19:12:10.745525
11	15	admin	1979	admin	Michael 	Cbili	\N	\N	t	2025-06-12 16:34:24.47567
12	16	loginfix@example.com	1234	owner	Test	Owner	\N	loginfix@example.com	t	2025-06-12 17:36:11.251936
15	28	admin.user	1234	owner	Admin	User	\N	authtest@business.com	t	2025-06-15 02:57:45.18441
16	35	admin.user	1234	owner	Admin	User	\N	admin2@test.com	t	2025-06-15 03:08:51.986196
17	36	mike.owner	1234	owner	Mike	Owner	\N	mtnmike89@gmail.com	t	2025-06-15 14:17:35.582098
\.


--
-- Name: businesses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.businesses_id_seq', 36, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.clients_id_seq', 36, true);


--
-- Name: estimates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.estimates_id_seq', 14, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.invoices_id_seq', 26, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.jobs_id_seq', 16, true);


--
-- Name: payroll_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.payroll_settings_id_seq', 1, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.services_id_seq', 4, true);


--
-- Name: time_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.time_entries_id_seq', 13, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 17, true);


--
-- Name: businesses businesses_api_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_api_key_key UNIQUE (api_key);


--
-- Name: businesses businesses_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_email_unique UNIQUE (email);


--
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: estimates estimates_estimate_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.estimates
    ADD CONSTRAINT estimates_estimate_number_unique UNIQUE (estimate_number);


--
-- Name: estimates estimates_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.estimates
    ADD CONSTRAINT estimates_pkey PRIMARY KEY (id);


--
-- Name: estimates estimates_share_token_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.estimates
    ADD CONSTRAINT estimates_share_token_key UNIQUE (share_token);


--
-- Name: invoices invoices_invoice_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_share_token_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_share_token_key UNIQUE (share_token);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: payroll_settings payroll_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payroll_settings
    ADD CONSTRAINT payroll_settings_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: time_entries time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: clients clients_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: estimates estimates_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.estimates
    ADD CONSTRAINT estimates_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: estimates estimates_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.estimates
    ADD CONSTRAINT estimates_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: invoices invoices_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: invoices invoices_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: invoices invoices_estimate_id_estimates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_estimate_id_estimates_id_fk FOREIGN KEY (estimate_id) REFERENCES public.estimates(id);


--
-- Name: invoices invoices_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: jobs jobs_assigned_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_assigned_user_id_users_id_fk FOREIGN KEY (assigned_user_id) REFERENCES public.users(id);


--
-- Name: jobs jobs_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: jobs jobs_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: jobs jobs_parent_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_parent_job_id_fkey FOREIGN KEY (parent_job_id) REFERENCES public.jobs(id);


--
-- Name: payroll_settings payroll_settings_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payroll_settings
    ADD CONSTRAINT payroll_settings_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: services services_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: time_entries time_entries_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: time_entries time_entries_job_id_jobs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_job_id_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: time_entries time_entries_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

