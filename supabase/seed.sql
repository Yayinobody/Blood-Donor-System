-- AnonBlood Development Seed File
-- Location Focus: Dumaguete City and surrounding municipalities (Bacong, Sibulan, Valencia, Dauin, San Jose), Negros Oriental, Philippines
-- Data Summary: 1 Admin, 30 Donors, 15 Seekers, Requests, Matches, Donations, Verification Submissions, Reference Content

-- Ensure idempotency by using ON CONFLICT DO UPDATE / DO NOTHING with deterministic fixed UUIDs.

-- ============================================================================
-- 1. AUTH & PUBLIC USERS (1 Admin, 30 Donors, 15 Seekers)
-- ============================================================================

-- 1.1 ADMIN USER
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  'a0000000-0000-4000-a000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'admin@anonblood.ph',
  '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dr. Manuel Teves","role":"admin"}',
  NOW() - INTERVAL '100 days',
  NOW() - INTERVAL '100 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (
  id, role, full_name, email, phone, blood_type, birthdate, gender, weight_kg,
  barangay, city, latitude, longitude, availability_status, is_verified,
  verification_method, verified_at, display_id, created_at, updated_at
) VALUES (
  'a0000000-0000-4000-a000-000000000001',
  'admin', 'Dr. Manuel Teves', 'admin@anonblood.ph', '09171234567', 'O+',
  '1978-05-14', 'Male', 78.5,
  'Poblacion 1', 'Dumaguete City', 9.3068, 123.3012,
  'available', true, 'id', NOW() - INTERVAL '90 days', 'Admin #001',
  NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days'
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  blood_type = EXCLUDED.blood_type,
  barangay = EXCLUDED.barangay,
  city = EXCLUDED.city,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  is_verified = EXCLUDED.is_verified,
  display_id = EXCLUDED.display_id;


-- 1.2 30 DONORS
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('d0000000-0000-4000-a000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'juan.delacruz@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Juan Dela Cruz","blood_type":"O+"}', NOW() - INTERVAL '60 days', NOW()),
  ('d0000000-0000-4000-a000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'maria.santos@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Maria Santos","blood_type":"A+"}', NOW() - INTERVAL '58 days', NOW()),
  ('d0000000-0000-4000-a000-000000000003', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'ramon.alcantara@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Ramon Alcantara","blood_type":"B+"}', NOW() - INTERVAL '55 days', NOW()),
  ('d0000000-0000-4000-a000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'liza.reyes@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Liza Reyes","blood_type":"O-"}', NOW() - INTERVAL '52 days', NOW()),
  ('d0000000-0000-4000-a000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'paolo.teves@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Paolo Teves","blood_type":"AB+"}', NOW() - INTERVAL '50 days', NOW()),
  ('d0000000-0000-4000-a000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'grace.macias@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Grace Macias","blood_type":"A-"}', NOW() - INTERVAL '48 days', NOW()),
  ('d0000000-0000-4000-a000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mark.villanueva@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Mark Villanueva","blood_type":"O+"}', NOW() - INTERVAL '45 days', NOW()),
  ('d0000000-0000-4000-a000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'anna.sagarbarria@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Anna Sagarbarria","blood_type":"B-"}', NOW() - INTERVAL '43 days', NOW()),
  ('d0000000-0000-4000-a000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gabriel.perdices@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Gabriel Perdices","blood_type":"AB-"}', NOW() - INTERVAL '40 days', NOW()),
  ('d0000000-0000-4000-a000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'elena.sy@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Elena Sy","blood_type":"O+"}', NOW() - INTERVAL '38 days', NOW()),
  ('d0000000-0000-4000-a000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jose.arnaiz@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Jose Arnaiz","blood_type":"A+"}', NOW() - INTERVAL '35 days', NOW()),
  ('d0000000-0000-4000-a000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sofia.locsin@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Sofia Locsin","blood_type":"O+"}', NOW() - INTERVAL '33 days', NOW()),
  ('d0000000-0000-4000-a000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'chris.remollo@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Chris Remollo","blood_type":"B+"}', NOW() - INTERVAL '30 days', NOW()),
  ('d0000000-0000-4000-a000-000000000014', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'joy.dy@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Joy Dy","blood_type":"A+"}', NOW() - INTERVAL '28 days', NOW()),
  ('d0000000-0000-4000-a000-000000000015', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dave.pinili@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Dave Pinili","blood_type":"O-"}', NOW() - INTERVAL '25 days', NOW()),
  ('d0000000-0000-4000-a000-000000000016', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'katrina.tuballa@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Katrina Tuballa","blood_type":"AB+"}', NOW() - INTERVAL '24 days', NOW()),
  ('d0000000-0000-4000-a000-000000000017', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'michael.absin@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Michael Absin","blood_type":"O+"}', NOW() - INTERVAL '22 days', NOW()),
  ('d0000000-0000-4000-a000-000000000018', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah.amor@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Sarah Amor","blood_type":"B+"}', NOW() - INTERVAL '20 days', NOW()),
  ('d0000000-0000-4000-a000-000000000019', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'francis.real@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Francis Real","blood_type":"A-"}', NOW() - INTERVAL '18 days', NOW()),
  ('d0000000-0000-4000-a000-000000000020', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teresa.villegas@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Teresa Villegas","blood_type":"O+"}', NOW() - INTERVAL '16 days', NOW()),
  ('d0000000-0000-4000-a000-000000000021', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'anthony.pastor@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Anthony Pastor","blood_type":"B-"}', NOW() - INTERVAL '15 days', NOW()),
  ('d0000000-0000-4000-a000-000000000022', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'claire.gomez@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Claire Gomez","blood_type":"A+"}', NOW() - INTERVAL '14 days', NOW()),
  ('d0000000-0000-4000-a000-000000000023', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leo.mercado@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Leo Mercado","blood_type":"AB-"}', NOW() - INTERVAL '12 days', NOW()),
  ('d0000000-0000-4000-a000-000000000024', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rachel.diaz@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Rachel Diaz","blood_type":"O+"}', NOW() - INTERVAL '10 days', NOW()),
  ('d0000000-0000-4000-a000-000000000025', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'benjie.torres@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Benjie Torres","blood_type":"O-"}', NOW() - INTERVAL '8 days', NOW()),
  ('d0000000-0000-4000-a000-000000000026', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'diane.flores@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Diane Flores","blood_type":"A+"}', NOW() - INTERVAL '6 days', NOW()),
  ('d0000000-0000-4000-a000-000000000027', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jerome.lim@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Jerome Lim","blood_type":"B+"}', NOW() - INTERVAL '5 days', NOW()),
  ('d0000000-0000-4000-a000-000000000028', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hannah.navarro@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Hannah Navarro","blood_type":"O+"}', NOW() - INTERVAL '4 days', NOW()),
  ('d0000000-0000-4000-a000-000000000029', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carlos.riego@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Carlos Riego","blood_type":"A-"}', NOW() - INTERVAL '2 days', NOW()),
  ('d0000000-0000-4000-a000-000000000030', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bea.mendoza@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Bea Mendoza","blood_type":"AB+"}', NOW() - INTERVAL '1 day', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, role, full_name, email, phone, blood_type, birthdate, gender, weight_kg, barangay, city, latitude, longitude, availability_status, is_verified, verification_method, verified_at, display_id, last_donation_date, next_eligible_date, created_at, updated_at)
VALUES
  ('d0000000-0000-4000-a000-000000000001', 'donor', 'Juan Dela Cruz', 'juan.delacruz@anonblood.ph', '09173019283', 'O+', '1992-03-15', 'Male', 72.0, 'Taclobo', 'Dumaguete City', 9.3021, 123.2954, 'available', true, 'id', NOW() - INTERVAL '50 days', 'Donor #104821', NULL, NULL, NOW() - INTERVAL '60 days', NOW()),
  ('d0000000-0000-4000-a000-000000000002', 'donor', 'Maria Santos', 'maria.santos@anonblood.ph', '09182938475', 'A+', '1995-07-22', 'Female', 58.0, 'Bantayan', 'Dumaguete City', 9.3184, 123.2921, 'available', true, 'email', NOW() - INTERVAL '55 days', 'Donor #208194', NULL, NULL, NOW() - INTERVAL '58 days', NOW()),
  ('d0000000-0000-4000-a000-000000000003', 'donor', 'Ramon Alcantara', 'ramon.alcantara@anonblood.ph', '09203948576', 'B+', '1988-11-04', 'Male', 80.0, 'Calindagan', 'Dumaguete City', 9.2965, 123.2978, 'resting', true, 'phone', NOW() - INTERVAL '40 days', 'Donor #309482', NOW() - INTERVAL '14 days', NOW() + INTERVAL '70 days', NOW() - INTERVAL '55 days', NOW()),
  ('d0000000-0000-4000-a000-000000000004', 'donor', 'Liza Reyes', 'liza.reyes@anonblood.ph', '09984756382', 'O-', '1994-01-30', 'Female', 54.0, 'Poblacion', 'Sibulan', 9.3582, 123.2710, 'available', true, 'id', NOW() - INTERVAL '45 days', 'Donor #401293', NULL, NULL, NOW() - INTERVAL '52 days', NOW()),
  ('d0000000-0000-4000-a000-000000000005', 'donor', 'Paolo Teves', 'paolo.teves@anonblood.ph', '09065849201', 'AB+', '1991-09-12', 'Male', 76.0, 'Daro', 'Dumaguete City', 9.3105, 123.2942, 'available', true, 'email', NOW() - INTERVAL '40 days', 'Donor #503918', NULL, NULL, NOW() - INTERVAL '50 days', NOW()),
  ('d0000000-0000-4000-a000-000000000006', 'donor', 'Grace Macias', 'grace.macias@anonblood.ph', '09276958473', 'A-', '1996-05-18', 'Female', 56.0, 'Poblacion', 'Valencia', 9.2815, 123.2411, 'available', true, 'id', NOW() - INTERVAL '35 days', 'Donor #602847', NULL, NULL, NOW() - INTERVAL '48 days', NOW()),
  ('d0000000-0000-4000-a000-000000000007', 'donor', 'Mark Villanueva', 'mark.villanueva@anonblood.ph', '09178493021', 'O+', '1990-12-08', 'Male', 68.0, 'Poblacion', 'Bacong', 9.2458, 123.2825, 'available', true, 'phone', NOW() - INTERVAL '30 days', 'Donor #704921', NULL, NULL, NOW() - INTERVAL '45 days', NOW()),
  ('d0000000-0000-4000-a000-000000000008', 'donor', 'Anna Sagarbarria', 'anna.sagarbarria@anonblood.ph', '09189302918', 'B-', '1993-04-03', 'Female', 52.0, 'Bagacay', 'Dumaguete City', 9.3082, 123.2855, 'available', true, 'id', NOW() - INTERVAL '38 days', 'Donor #805193', NULL, NULL, NOW() - INTERVAL '43 days', NOW()),
  ('d0000000-0000-4000-a000-000000000009', 'donor', 'Gabriel Perdices', 'gabriel.perdices@anonblood.ph', '09201928374', 'AB-', '1987-08-25', 'Male', 74.0, 'Maslog', 'Sibulan', 9.3491, 123.2684, 'available', true, 'email', NOW() - INTERVAL '35 days', 'Donor #901248', NULL, NULL, NOW() - INTERVAL '40 days', NOW()),
  ('d0000000-0000-4000-a000-000000000010', 'donor', 'Elena Sy', 'elena.sy@anonblood.ph', '09982837465', 'O+', '1997-02-14', 'Female', 60.0, 'West Balabag', 'Valencia', 9.2890, 123.2285, 'resting', true, 'id', NOW() - INTERVAL '30 days', 'Donor #102938', NOW() - INTERVAL '28 days', NOW() + INTERVAL '56 days', NOW() - INTERVAL '38 days', NOW()),
  ('d0000000-0000-4000-a000-000000000011', 'donor', 'Jose Arnaiz', 'jose.arnaiz@anonblood.ph', '09063748592', 'A+', '1989-06-30', 'Male', 82.0, 'Poblacion', 'Dauin', 9.1895, 123.2492, 'available', true, 'phone', NOW() - INTERVAL '25 days', 'Donor #119284', NULL, NULL, NOW() - INTERVAL '35 days', NOW()),
  ('d0000000-0000-4000-a000-000000000012', 'donor', 'Sofia Locsin', 'sofia.locsin@anonblood.ph', '09274859603', 'O+', '1998-10-19', 'Female', 55.0, 'Junob', 'Dumaguete City', 9.2945, 123.2820, 'available', true, 'id', NOW() - INTERVAL '20 days', 'Donor #124910', NULL, NULL, NOW() - INTERVAL '33 days', NOW()),
  ('d0000000-0000-4000-a000-000000000013', 'donor', 'Chris Remollo', 'chris.remollo@anonblood.ph', '09175960483', 'B+', '1991-03-08', 'Male', 75.0, 'Poblacion', 'San Jose', 9.4085, 123.2280, 'available', true, 'email', NOW() - INTERVAL '22 days', 'Donor #139481', NULL, NULL, NOW() - INTERVAL '30 days', NOW()),
  ('d0000000-0000-4000-a000-000000000014', 'donor', 'Joy Dy', 'joy.dy@anonblood.ph', '09186049382', 'A+', '1995-12-01', 'Female', 51.0, 'Piapi', 'Dumaguete City', 9.3140, 123.2965, 'unavailable', true, 'id', NOW() - INTERVAL '15 days', 'Donor #140293', NULL, NULL, NOW() - INTERVAL '28 days', NOW()),
  ('d0000000-0000-4000-a000-000000000015', 'donor', 'Dave Pinili', 'dave.pinili@anonblood.ph', '09207158493', 'O-', '1993-08-17', 'Male', 70.0, 'Tubod', 'Bacong', 9.2520, 123.2750, 'available', true, 'id', NOW() - INTERVAL '18 days', 'Donor #159384', NULL, NULL, NOW() - INTERVAL '25 days', NOW()),
  ('d0000000-0000-4000-a000-000000000016', 'donor', 'Katrina Tuballa', 'katrina.tuballa@anonblood.ph', '09988269483', 'AB+', '1996-11-23', 'Female', 57.0, 'Candau-ay', 'Dumaguete City', 9.3195, 123.2780, 'available', true, 'phone', NOW() - INTERVAL '15 days', 'Donor #162948', NULL, NULL, NOW() - INTERVAL '24 days', NOW()),
  ('d0000000-0000-4000-a000-000000000017', 'donor', 'Michael Absin', 'michael.absin@anonblood.ph', '09069370482', 'O+', '1986-09-05', 'Male', 79.0, 'Bongao', 'Valencia', 9.2740, 123.2180, 'available', true, 'email', NOW() - INTERVAL '12 days', 'Donor #174029', NULL, NULL, NOW() - INTERVAL '22 days', NOW()),
  ('d0000000-0000-4000-a000-000000000018', 'donor', 'Sarah Amor', 'sarah.amor@anonblood.ph', '09270481592', 'B+', '1994-05-29', 'Female', 53.0, 'Cangmating', 'Sibulan', 9.3620, 123.2620, 'resting', true, 'id', NOW() - INTERVAL '10 days', 'Donor #189302', NOW() - INTERVAL '42 days', NOW() + INTERVAL '42 days', NOW() - INTERVAL '20 days', NOW()),
  ('d0000000-0000-4000-a000-000000000019', 'donor', 'Francis Real', 'francis.real@anonblood.ph', '09171592603', 'A-', '1992-01-11', 'Male', 69.0, 'Banilad', 'Dumaguete City', 9.2885, 123.2920, 'available', true, 'id', NOW() - INTERVAL '10 days', 'Donor #192039', NULL, NULL, NOW() - INTERVAL '18 days', NOW()),
  ('d0000000-0000-4000-a000-000000000020', 'donor', 'Teresa Villegas', 'teresa.villegas@anonblood.ph', '09182603714', 'O+', '1999-07-07', 'Female', 62.0, 'Isugan', 'Bacong', 9.2380, 123.2690, 'available', true, 'phone', NOW() - INTERVAL '8 days', 'Donor #203948', NULL, NULL, NOW() - INTERVAL '16 days', NOW()),
  ('d0000000-0000-4000-a000-000000000021', 'donor', 'Anthony Pastor', 'anthony.pastor@anonblood.ph', '09203714825', 'B-', '1988-04-16', 'Male', 77.0, 'Pulantubig', 'Dumaguete City', 9.3210, 123.2840, 'available', true, 'email', NOW() - INTERVAL '7 days', 'Donor #210948', NULL, NULL, NOW() - INTERVAL '15 days', NOW()),
  ('d0000000-0000-4000-a000-000000000022', 'donor', 'Claire Gomez', 'claire.gomez@anonblood.ph', '09984825936', 'A+', '1997-12-03', 'Female', 59.0, 'Tampi', 'San Jose', 9.4180, 123.2150, 'available', true, 'id', NOW() - INTERVAL '6 days', 'Donor #229481', NULL, NULL, NOW() - INTERVAL '14 days', NOW()),
  ('d0000000-0000-4000-a000-000000000023', 'donor', 'Leo Mercado', 'leo.mercado@anonblood.ph', '09065936047', 'AB-', '1990-08-20', 'Male', 71.0, 'Tugawe', 'Dauin', 9.1810, 123.2380, 'resting', true, 'id', NOW() - INTERVAL '5 days', 'Donor #230194', NOW() - INTERVAL '7 days', NOW() + INTERVAL '77 days', NOW() - INTERVAL '12 days', NOW()),
  ('d0000000-0000-4000-a000-000000000024', 'donor', 'Rachel Diaz', 'rachel.diaz@anonblood.ph', '09276047158', 'O+', '1993-02-28', 'Female', 50.0, 'Looc', 'Dumaguete City', 9.3090, 123.2970, 'unavailable', false, NULL, NULL, 'Donor #248192', NULL, NULL, NOW() - INTERVAL '10 days', NOW()),
  ('d0000000-0000-4000-a000-000000000025', 'donor', 'Benjie Torres', 'benjie.torres@anonblood.ph', '09177158269', 'O-', '1985-10-10', 'Male', 84.0, 'Apolong', 'Valencia', 9.2680, 123.2080, 'available', true, 'id', NOW() - INTERVAL '3 days', 'Donor #259182', NULL, NULL, NOW() - INTERVAL '8 days', NOW()),
  ('d0000000-0000-4000-a000-000000000026', 'donor', 'Diane Flores', 'diane.flores@anonblood.ph', '09188269370', 'A+', '1996-06-14', 'Female', 54.0, 'Magatas', 'Sibulan', 9.3510, 123.2540, 'available', true, 'email', NOW() - INTERVAL '2 days', 'Donor #260193', NULL, NULL, NOW() - INTERVAL '6 days', NOW()),
  ('d0000000-0000-4000-a000-000000000027', 'donor', 'Jerome Lim', 'jerome.lim@anonblood.ph', '09209370481', 'B+', '1992-09-09', 'Male', 73.0, 'Mangnao', 'Dumaguete City', 9.2840, 123.2940, 'resting', true, 'id', NOW() - INTERVAL '2 days', 'Donor #278194', NOW() - INTERVAL '35 days', NOW() + INTERVAL '49 days', NOW() - INTERVAL '5 days', NOW()),
  ('d0000000-0000-4000-a000-000000000028', 'donor', 'Hannah Navarro', 'hannah.navarro@anonblood.ph', '09980481592', 'O+', '1995-03-27', 'Female', 61.0, 'Sacsac', 'Bacong', 9.2590, 123.2650, 'available', true, 'phone', NOW() - INTERVAL '1 day', 'Donor #289012', NULL, NULL, NOW() - INTERVAL '4 days', NOW()),
  ('d0000000-0000-4000-a000-000000000029', 'donor', 'Carlos Riego', 'carlos.riego@anonblood.ph', '09061592603', 'A-', '1991-11-15', 'Male', 67.0, 'Masaplod Norte', 'Dauin', 9.1950, 123.2420, 'available', true, 'id', NOW() - INTERVAL '1 day', 'Donor #290148', NULL, NULL, NOW() - INTERVAL '2 days', NOW()),
  ('d0000000-0000-4000-a000-000000000030', 'donor', 'Bea Mendoza', 'bea.mendoza@anonblood.ph', '09272603714', 'AB+', '1998-01-05', 'Female', 58.0, 'Cantil-e', 'Dumaguete City', 9.2980, 123.2790, 'resting', true, 'id', NOW() - INTERVAL '12 hours', 'Donor #301948', NOW() - INTERVAL '21 days', NOW() + INTERVAL '63 days', NOW() - INTERVAL '1 day', NOW())
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  blood_type = EXCLUDED.blood_type,
  barangay = EXCLUDED.barangay,
  city = EXCLUDED.city,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  availability_status = EXCLUDED.availability_status,
  is_verified = EXCLUDED.is_verified,
  verification_method = EXCLUDED.verification_method,
  verified_at = EXCLUDED.verified_at,
  display_id = EXCLUDED.display_id,
  last_donation_date = EXCLUDED.last_donation_date,
  next_eligible_date = EXCLUDED.next_eligible_date;


-- 1.3 15 SEEKERS
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('s0000000-0000-4000-a000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ernesto.guingona@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Ernesto Guingona","role":"seeker"}', NOW() - INTERVAL '30 days', NOW()),
  ('s0000000-0000-4000-a000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lourdes.paras@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Lourdes Paras","role":"seeker"}', NOW() - INTERVAL '28 days', NOW()),
  ('s0000000-0000-4000-a000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'benjamin.teves@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Benjamin Teves","role":"seeker"}', NOW() - INTERVAL '25 days', NOW()),
  ('s0000000-0000-4000-a000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'corazon.alviola@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Corazon Alviola","role":"seeker"}', NOW() - INTERVAL '22 days', NOW()),
  ('s0000000-0000-4000-a000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'vicente.arnaiz@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Vicente Arnaiz","role":"seeker"}', NOW() - INTERVAL '20 days', NOW()),
  ('s0000000-0000-4000-a000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teresita.macias@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Teresita Macias","role":"seeker"}', NOW() - INTERVAL '18 days', NOW()),
  ('s0000000-0000-4000-a000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rolando.pinili@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Rolando Pinili","role":"seeker"}', NOW() - INTERVAL '15 days', NOW()),
  ('s0000000-0000-4000-a000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carmen.remollo@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Carmen Remollo","role":"seeker"}', NOW() - INTERVAL '12 days', NOW()),
  ('s0000000-0000-4000-a000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'felipe.sagarbarria@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Felipe Sagarbarria","role":"seeker"}', NOW() - INTERVAL '10 days', NOW()),
  ('s0000000-0000-4000-a000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'josefina.perdices@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Josefina Perdices","role":"seeker"}', NOW() - INTERVAL '8 days', NOW()),
  ('s0000000-0000-4000-a000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mariano.sy@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Mariano Sy","role":"seeker"}', NOW() - INTERVAL '6 days', NOW()),
  ('s0000000-0000-4000-a000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rosario.locsin@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Rosario Locsin","role":"seeker"}', NOW() - INTERVAL '5 days', NOW()),
  ('s0000000-0000-4000-a000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jaime.absin@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Jaime Absin","role":"seeker"}', NOW() - INTERVAL '3 days', NOW()),
  ('s0000000-0000-4000-a000-000000000014', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mercy.villegas@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Mercy Villegas","role":"seeker"}', NOW() - INTERVAL '2 days', NOW()),
  ('s0000000-0000-4000-a000-000000000015', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'salvador.amor@anonblood.ph', '$2a$10$w8T.yN7w78988N48x0z.e.x8z564b73b222956e189', NOW(), '{"provider":"email"}', '{"full_name":"Salvador Amor","role":"seeker"}', NOW() - INTERVAL '1 day', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, role, full_name, email, phone, blood_type, birthdate, gender, weight_kg, barangay, city, latitude, longitude, availability_status, is_verified, verification_method, verified_at, display_id, created_at, updated_at)
VALUES
  ('s0000000-0000-4000-a000-000000000001', 'seeker', 'Ernesto Guingona', 'ernesto.guingona@anonblood.ph', '09179991101', 'O+', '1982-01-20', 'Male', 75.0, 'Taclobo', 'Dumaguete City', 9.3030, 123.2940, 'available', true, 'email', NOW() - INTERVAL '25 days', 'Seeker #001', NOW() - INTERVAL '30 days', NOW()),
  ('s0000000-0000-4000-a000-000000000002', 'seeker', 'Lourdes Paras', 'lourdes.paras@anonblood.ph', '09189991102', 'A+', '1985-05-15', 'Female', 63.0, 'Bantayan', 'Dumaguete City', 9.3170, 123.2910, 'available', true, 'phone', NOW() - INTERVAL '22 days', 'Seeker #002', NOW() - INTERVAL '28 days', NOW()),
  ('s0000000-0000-4000-a000-000000000003', 'seeker', 'Benjamin Teves', 'benjamin.teves@anonblood.ph', '09209991103', 'B+', '1979-09-08', 'Male', 81.0, 'Calindagan', 'Dumaguete City', 9.2970, 123.2960, 'available', true, 'email', NOW() - INTERVAL '20 days', 'Seeker #003', NOW() - INTERVAL '25 days', NOW()),
  ('s0000000-0000-4000-a000-000000000004', 'seeker', 'Corazon Alviola', 'corazon.alviola@anonblood.ph', '09989991104', 'O-', '1990-03-30', 'Female', 57.0, 'Poblacion', 'Sibulan', 9.3570, 123.2700, 'available', true, 'phone', NOW() - INTERVAL '18 days', 'Seeker #004', NOW() - INTERVAL '22 days', NOW()),
  ('s0000000-0000-4000-a000-000000000005', 'seeker', 'Vicente Arnaiz', 'vicente.arnaiz@anonblood.ph', '09069991105', 'AB+', '1984-11-12', 'Male', 79.0, 'Poblacion', 'Valencia', 9.2820, 123.2400, 'available', true, 'email', NOW() - INTERVAL '15 days', 'Seeker #005', NOW() - INTERVAL '20 days', NOW()),
  ('s0000000-0000-4000-a000-000000000006', 'seeker', 'Teresita Macias', 'teresita.macias@anonblood.ph', '09279991106', 'A-', '1988-07-25', 'Female', 60.0, 'Poblacion', 'Bacong', 9.2460, 123.2810, 'available', true, 'phone', NOW() - INTERVAL '12 days', 'Seeker #006', NOW() - INTERVAL '18 days', NOW()),
  ('s0000000-0000-4000-a000-000000000007', 'seeker', 'Rolando Pinili', 'rolando.pinili@anonblood.ph', '09179991107', 'O+', '1976-12-14', 'Male', 83.0, 'Poblacion', 'Dauin', 9.1880, 123.2480, 'available', true, 'email', NOW() - INTERVAL '10 days', 'Seeker #007', NOW() - INTERVAL '15 days', NOW()),
  ('s0000000-0000-4000-a000-000000000008', 'seeker', 'Carmen Remollo', 'carmen.remollo@anonblood.ph', '09189991108', 'B-', '1993-02-18', 'Female', 55.0, 'Poblacion', 'San Jose', 9.4070, 123.2270, 'available', true, 'phone', NOW() - INTERVAL '8 days', 'Seeker #008', NOW() - INTERVAL '12 days', NOW()),
  ('s0000000-0000-4000-a000-000000000009', 'seeker', 'Felipe Sagarbarria', 'felipe.sagarbarria@anonblood.ph', '09209991109', 'AB-', '1981-06-22', 'Male', 76.0, 'Daro', 'Dumaguete City', 9.3110, 123.2930, 'available', true, 'email', NOW() - INTERVAL '7 days', 'Seeker #009', NOW() - INTERVAL '10 days', NOW()),
  ('s0000000-0000-4000-a000-000000000010', 'seeker', 'Josefina Perdices', 'josefina.perdices@anonblood.ph', '09989991110', 'O+', '1987-10-05', 'Female', 62.0, 'Bagacay', 'Dumaguete City', 9.3070, 123.2840, 'available', true, 'phone', NOW() - INTERVAL '5 days', 'Seeker #010', NOW() - INTERVAL '8 days', NOW()),
  ('s0000000-0000-4000-a000-000000000011', 'seeker', 'Mariano Sy', 'mariano.sy@anonblood.ph', '09069991111', 'A+', '1975-04-09', 'Male', 85.0, 'West Balabag', 'Valencia', 9.2880, 123.2270, 'available', true, 'email', NOW() - INTERVAL '4 days', 'Seeker #011', NOW() - INTERVAL '6 days', NOW()),
  ('s0000000-0000-4000-a000-000000000012', 'seeker', 'Rosario Locsin', 'rosario.locsin@anonblood.ph', '09279991112', 'B+', '1992-08-17', 'Female', 58.0, 'Maslog', 'Sibulan', 9.3480, 123.2670, 'available', true, 'phone', NOW() - INTERVAL '3 days', 'Seeker #012', NOW() - INTERVAL '5 days', NOW()),
  ('s0000000-0000-4000-a000-000000000013', 'seeker', 'Jaime Absin', 'jaime.absin@anonblood.ph', '09179991113', 'O-', '1989-01-31', 'Male', 72.0, 'Junob', 'Dumaguete City', 9.2930, 123.2810, 'available', true, 'email', NOW() - INTERVAL '2 days', 'Seeker #013', NOW() - INTERVAL '3 days', NOW()),
  ('s0000000-0000-4000-a000-000000000014', 'seeker', 'Mercy Villegas', 'mercy.villegas@anonblood.ph', '09189991114', 'A-', '1994-09-24', 'Female', 53.0, 'Tubod', 'Bacong', 9.2510, 123.2740, 'available', true, 'phone', NOW() - INTERVAL '1 day', 'Seeker #014', NOW() - INTERVAL '2 days', NOW()),
  ('s0000000-0000-4000-a000-000000000015', 'seeker', 'Salvador Amor', 'salvador.amor@anonblood.ph', '09209991115', 'AB+', '1983-05-19', 'Male', 78.0, 'Tugawe', 'Dauin', 9.1800, 123.2370, 'available', true, 'email', NOW() - INTERVAL '12 hours', 'Seeker #015', NOW() - INTERVAL '1 day', NOW())
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  blood_type = EXCLUDED.blood_type,
  barangay = EXCLUDED.barangay,
  city = EXCLUDED.city,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  availability_status = EXCLUDED.availability_status,
  is_verified = EXCLUDED.is_verified,
  verification_method = EXCLUDED.verification_method,
  verified_at = EXCLUDED.verified_at,
  display_id = EXCLUDED.display_id;


-- ============================================================================
-- 2. BLOOD REQUESTS (Seeker Requests)
-- ============================================================================

INSERT INTO public.requests (
  id, seeker_name, seeker_email, seeker_phone, blood_type_needed, units_needed,
  urgency_level, hospital_name, notes, status, is_verified, created_at, expires_at, ip_address, user_agent
) VALUES
  ('r0000000-0000-4000-a000-000000000001', 'Ernesto Guingona', 'ernesto.guingona@anonblood.ph', '09179991101', 'O+', 2, 'emergency', 'Silliman University Medical Center', 'Urgent replacement needed for scheduled surgery.', 'active', true, NOW() - INTERVAL '12 hours', NOW() + INTERVAL '36 hours', '120.28.64.12', 'Mozilla/5.0 (X11; Linux x86_64)'),
  ('r0000000-0000-4000-a000-000000000002', 'Lourdes Paras', 'lourdes.paras@anonblood.ph', '09189991102', 'A+', 1, 'within_hours', 'Negros Oriental Provincial Hospital', 'Dengue fever patient needing packed RBC.', 'active', true, NOW() - INTERVAL '6 hours', NOW() + INTERVAL '42 hours', '120.28.64.18', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)'),
  ('r0000000-0000-4000-a000-000000000003', 'Benjamin Teves', 'benjamin.teves@anonblood.ph', '09209991103', 'B+', 3, 'within_day', 'ACE Dumaguete Doctors Hospital', 'Post-operative recovery blood replacement.', 'active', true, NOW() - INTERVAL '18 hours', NOW() + INTERVAL '30 hours', '120.28.65.02', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
  ('r0000000-0000-4000-a000-000000000004', 'Corazon Alviola', 'corazon.alviola@anonblood.ph', '09989991104', 'O-', 1, 'emergency', 'Holy Child Hospital', 'Rare blood type needed for dialysis complication.', 'active', true, NOW() - INTERVAL '3 hours', NOW() + INTERVAL '21 hours', '120.28.66.45', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'),
  ('r0000000-0000-4000-a000-000000000005', 'Vicente Arnaiz', 'vicente.arnaiz@anonblood.ph', '09069991105', 'AB+', 2, 'planning', 'Silliman University Medical Center', 'Elective orthopedic surgery next week.', 'active', true, NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', '120.28.64.99', 'Mozilla/5.0 (X11; Ubuntu; Linux)'),
  ('r0000000-0000-4000-a000-000000000006', 'Teresita Macias', 'teresita.macias@anonblood.ph', '09279991106', 'A-', 1, 'within_hours', 'Negros Oriental Provincial Hospital', 'Maternal anemia during delivery preparation.', 'fulfilled', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', '120.28.67.11', 'Mozilla/5.0 (Android 14; Mobile)'),
  ('r0000000-0000-4000-a000-000000000007', 'Rolando Pinili', 'rolando.pinili@anonblood.ph', '09179991107', 'O+', 2, 'within_day', 'Holy Child Hospital', 'Gastrointestinal bleeding patient.', 'fulfilled', true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '4 days', '120.28.68.33', 'Mozilla/5.0 (Windows NT 10.0)'),
  ('r0000000-0000-4000-a000-000000000008', 'Carmen Remollo', 'carmen.remollo@anonblood.ph', '09189991108', 'B-', 1, 'emergency', 'ACE Dumaguete Doctors Hospital', 'Trauma emergency patient in ER.', 'fulfilled', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days', '120.28.69.12', 'Mozilla/5.0 (X11; Linux)'),
  ('r0000000-0000-4000-a000-000000000009', 'Felipe Sagarbarria', 'felipe.sagarbarria@anonblood.ph', '09209991109', 'AB-', 1, 'planning', 'Silliman University Medical Center', 'Chemotherapy supportive care.', 'cancelled', false, NOW() - INTERVAL '12 days', NOW() - INTERVAL '8 days', '120.28.70.05', 'Mozilla/5.0 (iPhone)'),
  ('r0000000-0000-4000-a000-000000000010', 'Josefina Perdices', 'josefina.perdices@anonblood.ph', '09989991110', 'O+', 3, 'within_hours', 'Negros Oriental Provincial Hospital', 'Severe anemia due to chronic renal failure.', 'expired', false, NOW() - INTERVAL '15 days', NOW() - INTERVAL '13 days', '120.28.71.88', 'Mozilla/5.0 (Windows NT 10.0)')
ON CONFLICT (id) DO UPDATE SET
  seeker_name = EXCLUDED.seeker_name,
  seeker_email = EXCLUDED.seeker_email,
  seeker_phone = EXCLUDED.seeker_phone,
  blood_type_needed = EXCLUDED.blood_type_needed,
  units_needed = EXCLUDED.units_needed,
  urgency_level = EXCLUDED.urgency_level,
  hospital_name = EXCLUDED.hospital_name,
  notes = EXCLUDED.notes,
  status = EXCLUDED.status,
  is_verified = EXCLUDED.is_verified;


-- ============================================================================
-- 3. REQUEST MATCHES
-- ============================================================================

INSERT INTO public.request_matches (
  id, request_id, donor_id, status, notified_at, responded_at, contact_revealed, revealed_at, created_at
) VALUES
  ('m0000000-0000-4000-a000-000000000001', 'r0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001', 'contact_revealed', NOW() - INTERVAL '11 hours', NOW() - INTERVAL '10 hours', true, NOW() - INTERVAL '10 hours', NOW() - INTERVAL '11 hours'),
  ('m0000000-0000-4000-a000-000000000002', 'r0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000007', 'accepted', NOW() - INTERVAL '11 hours', NOW() - INTERVAL '9 hours', false, NULL, NOW() - INTERVAL '11 hours'),
  ('m0000000-0000-4000-a000-000000000003', 'r0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000002', 'notified', NOW() - INTERVAL '5 hours', NULL, false, NULL, NOW() - INTERVAL '5 hours'),
  ('m0000000-0000-4000-a000-000000000004', 'r0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000011', 'accepted', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours', false, NULL, NOW() - INTERVAL '5 hours'),
  ('m0000000-0000-4000-a000-000000000005', 'r0000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000013', 'notified', NOW() - INTERVAL '16 hours', NULL, false, NULL, NOW() - INTERVAL '16 hours'),
  ('m0000000-0000-4000-a000-000000000006', 'r0000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000004', 'contact_revealed', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', true, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '2 hours'),
  ('m0000000-0000-4000-a000-000000000007', 'r0000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000015', 'declined', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '90 minutes', false, NULL, NOW() - INTERVAL '2 hours'),
  ('m0000000-0000-4000-a000-000000000008', 'r0000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000006', 'contact_revealed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('m0000000-0000-4000-a000-000000000009', 'r0000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000012', 'contact_revealed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('m0000000-0000-4000-a000-000000000010', 'r0000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000021', 'contact_revealed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  responded_at = EXCLUDED.responded_at,
  contact_revealed = EXCLUDED.contact_revealed,
  revealed_at = EXCLUDED.revealed_at;


-- ============================================================================
-- 4. DONATIONS (Self-Reported History)
-- ============================================================================

INSERT INTO public.donations (
  id, donor_id, donation_date, volume_ml, status, notes, created_at
) VALUES
  ('b0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000003', NOW() - INTERVAL '14 days', 450, 'completed', 'Mobile blood drive at Silliman University Gym.', NOW() - INTERVAL '14 days'),
  ('b0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000010', NOW() - INTERVAL '28 days', 450, 'completed', 'Donation at Philippine Red Cross Negros Oriental Chapter.', NOW() - INTERVAL '28 days'),
  ('b0000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000018', NOW() - INTERVAL '42 days', 450, 'completed', 'Direct donor replacement for hospital request.', NOW() - INTERVAL '42 days'),
  ('b0000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000023', NOW() - INTERVAL '7 days', 450, 'completed', 'Voluntary donation at NOPH Blood Bank.', NOW() - INTERVAL '7 days'),
  ('b0000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000027', NOW() - INTERVAL '35 days', 450, 'completed', 'Community blood letting in Barangay Mangnao.', NOW() - INTERVAL '35 days'),
  ('b0000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000030', NOW() - INTERVAL '21 days', 450, 'completed', 'Donation for matched request.', NOW() - INTERVAL '21 days')
ON CONFLICT (id) DO UPDATE SET
  donation_date = EXCLUDED.donation_date,
  volume_ml = EXCLUDED.volume_ml,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes;


-- ============================================================================
-- 5. VERIFICATION SUBMISSIONS (Strong ID Uploads)
-- ============================================================================

INSERT INTO public.verification_submissions (
  id, user_id, verification_type, status, id_document_url, id_document_type,
  submitted_at, reviewed_by, reviewed_at, rejection_reason, metadata
) VALUES
  ('v0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001', 'strong', 'approved', 'https://storage.anonblood.ph/ids/d0000000-0000-4000-a000-000000000001.jpg', 'Driver License', NOW() - INTERVAL '52 days', 'a0000000-0000-4000-a000-000000000001', NOW() - INTERVAL '50 days', NULL, '{"issuing_agency":"LTO","expiry":"2028-03-15"}'::jsonb),
  ('v0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000004', 'strong', 'approved', 'https://storage.anonblood.ph/ids/d0000000-0000-4000-a000-000000000004.jpg', 'Philippine Passport', NOW() - INTERVAL '47 days', 'a0000000-0000-4000-a000-000000000001', NOW() - INTERVAL '45 days', NULL, '{"issuing_agency":"DFA","expiry":"2030-01-20"}'::jsonb),
  ('v0000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000006', 'strong', 'approved', 'https://storage.anonblood.ph/ids/d0000000-0000-4000-a000-000000000006.jpg', 'UMID', NOW() - INTERVAL '37 days', 'a0000000-0000-4000-a000-000000000001', NOW() - INTERVAL '35 days', NULL, '{"issuing_agency":"GSIS"}'::jsonb),
  ('v0000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000010', 'strong', 'approved', 'https://storage.anonblood.ph/ids/d0000000-0000-4000-a000-000000000010.jpg', 'PhilHealth ID', NOW() - INTERVAL '32 days', 'a0000000-0000-4000-a000-000000000001', NOW() - INTERVAL '30 days', NULL, '{"issuing_agency":"PhilHealth"}'::jsonb),
  ('v0000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000021', 'strong', 'pending', 'https://storage.anonblood.ph/ids/d0000000-0000-4000-a000-000000000021.jpg', 'Postal ID', NOW() - INTERVAL '2 days', NULL, NULL, NULL, '{"issuing_agency":"PHLPost"}'::jsonb),
  ('v0000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000024', 'strong', 'rejected', 'https://storage.anonblood.ph/ids/d0000000-0000-4000-a000-000000000024.jpg', 'Student ID', NOW() - INTERVAL '9 days', 'a0000000-0000-4000-a000-000000000001', NOW() - INTERVAL '8 days', 'Expired document submitted. Please upload a valid government-issued ID.', '{"issuing_agency":"School"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  id_document_url = EXCLUDED.id_document_url,
  id_document_type = EXCLUDED.id_document_type,
  reviewed_by = EXCLUDED.reviewed_by,
  reviewed_at = EXCLUDED.reviewed_at,
  rejection_reason = EXCLUDED.rejection_reason;


-- ============================================================================
-- 6. CONTACT REVEAL AUDIT LOGS
-- ============================================================================

INSERT INTO public.contact_reveal_audit (
  id, request_id, donor_id, seeker_email, reveal_timestamp, ip_address, user_agent
) VALUES
  ('c0000000-0000-4000-a000-000000000001', 'r0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001', 'ernesto.guingona@anonblood.ph', NOW() - INTERVAL '10 hours', '120.28.64.12', 'Mozilla/5.0 (X11; Linux x86_64)'),
  ('c0000000-0000-4000-a000-000000000002', 'r0000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000004', 'corazon.alviola@anonblood.ph', NOW() - INTERVAL '1 hour', '120.28.66.45', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'),
  ('c0000000-0000-4000-a000-000000000003', 'r0000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000006', 'teresita.macias@anonblood.ph', NOW() - INTERVAL '5 days', '120.28.67.11', 'Mozilla/5.0 (Android 14; Mobile)')
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 7. REFERENCE CONTENT FOR AI RAG GROUNDING
-- ============================================================================

INSERT INTO public.reference_content (
  id, category, title, content, source, tags, last_updated
) VALUES
  ('k0000000-0000-4000-a000-000000000001', 'Eligibility', 'General Blood Donation Requirements in the Philippines',
   'To donate blood in the Philippines per DOH guidelines: 1. Age must be 18 to 65 years old (16-17 allowed with written parental consent). 2. Weight must be at least 50 kg (110 lbs). 3. Hemoglobin level must be at least 12.5 g/dL. 4. Blood pressure must be between 90-140 systolic and 60-90 diastolic. 5. Pulse rate between 60-100 bpm. 6. Must be in good health and feel well on donation day.',
   'DOH_Philippines', ARRAY['eligibility', 'requirements', 'age', 'weight', 'hemoglobin'], NOW() - INTERVAL '30 days'),

  ('k0000000-0000-4000-a000-000000000002', 'Eligibility', 'Donation Interval & Rest Period Guidelines',
   'According to WHO and Philippine Red Cross guidance, donors must observe a minimum interval of 12 weeks (84 days) between whole blood donations. This allows red blood cells and iron stores in the body to fully replenish. Male donors can donate up to 4 times a year, while female donors can donate up to 3 times a year.',
   'WHO', ARRAY['eligibility', 'interval', 'rest_period', 'frequency', 'recovery'], NOW() - INTERVAL '30 days'),

  ('k0000000-0000-4000-a000-000000000003', 'Compatibility', 'Blood Type Compatibility Matrix',
   'Blood compatibility rules: O- negative is the universal donor for red blood cells and can give to all blood types (O-, O+, A-, A+, B-, B+, AB-, AB+). O+ can give to O+, A+, B+, AB+. A- can give to A-, A+, AB-, AB+. A+ can give to A+, AB+. B- can give to B-, B+, AB-, AB+. B+ can give to B+, AB+. AB- can give to AB-, AB+. AB+ is the universal recipient and can receive red cells from all types.',
   'Red_Cross', ARRAY['compatibility', 'blood_type', 'universal_donor', 'matching'], NOW() - INTERVAL '30 days'),

  ('k0000000-0000-4000-a000-000000000004', 'Preparation', 'How to Prepare Before Donating Blood',
   'Preparation steps before donation: 1. Get at least 6-8 hours of sleep the night before. 2. Drink plenty of water or non-alcoholic fluids (at least 500ml before donating). 3. Eat a healthy, low-fat meal before donating; avoid fatty foods like fried meals or butter, as fats can affect blood testing. 4. Avoid alcohol 24 hours prior to donation. 5. Wear comfortable clothes with sleeves that can easily be rolled up.',
   'Red_Cross', ARRAY['preparation', 'hydration', 'diet', 'sleep', 'pre_donation'], NOW() - INTERVAL '30 days'),

  ('k0000000-0000-4000-a000-000000000005', 'Recovery', 'Post-Donation Care and Recovery Instructions',
   'After donating blood: 1. Rest in the refreshment area for 10-15 minutes and enjoy light snacks/juice. 2. Keep the bandage on your arm for at least 4 hours. 3. Drink extra fluids for the next 24-48 hours. 4. Avoid strenuous physical activity or heavy lifting for the rest of the day. 5. If you feel dizzy, sit down or lie down with your legs elevated until the feeling passes.',
   'WHO', ARRAY['recovery', 'care', 'hydration', 'dizziness', 'post_donation'], NOW() - INTERVAL '30 days'),

  ('k0000000-0000-4000-a000-000000000006', 'Platform_Scope', 'AnonBlood Platform Scope & Privacy Guidelines',
   'AnonBlood is a discovery and matchmaking platform designed to help blood seekers connect with voluntary blood donors. AnonBlood operates strictly on anonymized discovery: contact details are hidden until a donor accepts a request and both parties complete light verification. AnonBlood does NOT manage hospital admissions, medical testing, blood collection, or cross-matching — these are conducted directly at licensed hospital/clinic facilities.',
   'DOH_Philippines', ARRAY['scope', 'privacy', 'anonymity', 'matchmaking', 'platform_rules'], NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  source = EXCLUDED.source,
  tags = EXCLUDED.tags,
  last_updated = EXCLUDED.last_updated;
