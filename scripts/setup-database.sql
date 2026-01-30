-- Drop existing tables if they exist
DROP TABLE IF EXISTS emergency_responses CASCADE;
DROP TABLE IF EXISTS emergencies CASCADE;
DROP TABLE IF EXISTS ambulances CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;

-- Create doctors table
CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ambulances table
CREATE TABLE ambulances (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  license_plate VARCHAR(20) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  status VARCHAR(50) DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create emergencies table
CREATE TABLE emergencies (
  id SERIAL PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(20),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  doctor_id INTEGER REFERENCES doctors(id),
  ambulance_id INTEGER REFERENCES ambulances(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create emergency responses table for tracking
CREATE TABLE emergency_responses (
  id SERIAL PRIMARY KEY,
  emergency_id INTEGER REFERENCES emergencies(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES doctors(id),
  response_type VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample doctors
INSERT INTO doctors (name, email, specialty, latitude, longitude, is_available) VALUES
  ('Dr. Sarah Johnson', 'sarah.johnson@hospital.com', 'Emergency Medicine', 37.7749, -122.4194, true),
  ('Dr. Michael Chen', 'michael.chen@hospital.com', 'Cardiology', 37.7751, -122.4180, true),
  ('Dr. Emma Williams', 'emma.williams@hospital.com', 'Trauma Surgery', 37.7745, -122.4190, true),
  ('Dr. James Wilson', 'james.wilson@hospital.com', 'Internal Medicine', 37.7755, -122.4175, true),
  ('Dr. Priya Patel', 'priya.patel@hospital.com', 'Pediatric Emergency', 37.7742, -122.4185, false);

-- Insert sample ambulances
INSERT INTO ambulances (name, license_plate, latitude, longitude, status) VALUES
  ('Ambulance Unit 1', 'AMB-001', 37.7740, -122.4200, 'Available'),
  ('Ambulance Unit 2', 'AMB-002', 37.7760, -122.4190, 'Available'),
  ('Ambulance Unit 3', 'AMB-003', 37.7750, -122.4170, 'En Route'),
  ('Ambulance Unit 4', 'AMB-004', 37.7735, -122.4210, 'Available');
