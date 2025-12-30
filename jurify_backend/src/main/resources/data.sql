-- Seed Users (Password is 'password')
INSERT INTO users (email, password_hash, role, is_email_verified, is_active, created_at, updated_at)
VALUES 
('lawyer@example.com', '$2a$10$D8...hashedplaceholder...', 'LAWYER', true, true, NOW(), NOW()),
('ngo@example.com', '$2a$10$D8...hashedplaceholder...', 'NGO', true, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Seed Directory Entries
-- Lawyer
INSERT INTO directory_entries (user_id, role, display_name, phone_number, email, city, state, country, description, is_verified, is_active, created_at)
SELECT id, 'LAWYER', 'Adv. John Doe', '9876543210', 'lawyer@example.com', 'Mumbai', 'Maharashtra', 'India', 'Senior Criminal Lawyer with 15 years experience.', true, true, NOW()
FROM users WHERE email = 'lawyer@example.com'
AND NOT EXISTS (SELECT 1 FROM directory_entries WHERE user_id = users.id);

-- NGO
INSERT INTO directory_entries (user_id, role, display_name, phone_number, email, city, state, country, description, is_verified, is_active, created_at)
SELECT id, 'NGO', 'Justice for All', '1122334455', 'ngo@example.com', 'Delhi', 'Delhi', 'India', 'Non-profit organization dedicated to legal aid.', true, true, NOW()
FROM users WHERE email = 'ngo@example.com'
AND NOT EXISTS (SELECT 1 FROM directory_entries WHERE user_id = users.id);
