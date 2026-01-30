# Emergency Response System - Database Schema

This guide provides SQL schemas for integrating your database with the Emergency Response System.

## Overview

The system requires four main tables:
1. **users** - Patient/bystander information
2. **doctors** - Doctor profiles and availability
3. **ambulances** - Ambulance fleet information
4. **emergency_reports** - Emergency incident records

## PostgreSQL Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  blood_type VARCHAR(5),
  medical_conditions TEXT,
  emergency_contacts JSONB,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_location (latitude, longitude)
);
```

### Doctors Table
```sql
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  hospital_name VARCHAR(255),
  is_available BOOLEAN DEFAULT true,
  average_rating DECIMAL(3, 2),
  total_consultations INTEGER DEFAULT 0,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_specialty (specialty),
  INDEX idx_is_available (is_available),
  INDEX idx_location (latitude, longitude)
);
```

### Ambulances Table
```sql
CREATE TABLE ambulances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'available',
  operator_name VARCHAR(100),
  operator_phone VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_updated_at TIMESTAMP,
  equipment JSONB,
  capacity INTEGER DEFAULT 4,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_location (latitude, longitude)
);
```

### Emergency Reports Table
```sql
CREATE TABLE emergency_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emergency_type VARCHAR(100),
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  severity_level VARCHAR(20),
  status VARCHAR(50) DEFAULT 'reported',
  assigned_ambulance_id UUID REFERENCES ambulances(id),
  assigned_doctor_id UUID REFERENCES doctors(id),
  response_time_minutes INTEGER,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### Call Sessions Table
```sql
CREATE TABLE call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  recording_url VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_emergency_id (emergency_id),
  INDEX idx_doctor_id (doctor_id),
  INDEX idx_status (status)
);
```

### Ratings/Reviews Table
```sql
CREATE TABLE doctor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_session_id UUID REFERENCES call_sessions(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_doctor_id (doctor_id),
  INDEX idx_user_id (user_id)
);
```

## Integration with Node.js/Express

### Using node-postgres (pg)

```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get nearby ambulances
const getNearbyAmbulances = async (latitude, longitude, radiusKm = 10) => {
  const query = `
    SELECT *,
    (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude)))) AS distance
    FROM ambulances
    WHERE status = 'available'
    HAVING distance <= $3
    ORDER BY distance
  `;
  
  const result = await pool.query(query, [latitude, longitude, radiusKm]);
  return result.rows;
};

// Get available doctors
const getAvailableDoctors = async (specialty = null) => {
  const query = specialty
    ? 'SELECT * FROM doctors WHERE is_available = true AND specialty = $1 ORDER BY average_rating DESC'
    : 'SELECT * FROM doctors WHERE is_available = true ORDER BY average_rating DESC LIMIT 20';
  
  const result = await pool.query(query, specialty ? [specialty] : []);
  return result.rows;
};

// Create emergency report
const createEmergencyReport = async (userId, latitude, longitude, description) => {
  const query = `
    INSERT INTO emergency_reports (user_id, latitude, longitude, description, severity_level, status)
    VALUES ($1, $2, $3, $4, 'high', 'reported')
    RETURNING *
  `;
  
  const result = await pool.query(query, [userId, latitude, longitude, description]);
  return result.rows[0];
};

// Update doctor availability
const updateDoctorAvailability = async (doctorId, isAvailable) => {
  const query = `
    UPDATE doctors
    SET is_available = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, [isAvailable, doctorId]);
  return result.rows[0];
};

// Update ambulance location
const updateAmbulanceLocation = async (ambulanceId, latitude, longitude) => {
  const query = `
    UPDATE ambulances
    SET latitude = $1, longitude = $2, location_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  
  const result = await pool.query(query, [latitude, longitude, ambulanceId]);
  return result.rows[0];
};

// Create call session
const createCallSession = async (emergencyId, doctorId, userId) => {
  const query = `
    INSERT INTO call_sessions (emergency_id, doctor_id, user_id, status)
    VALUES ($1, $2, $3, 'pending')
    RETURNING *
  `;
  
  const result = await pool.query(query, [emergencyId, doctorId, userId]);
  return result.rows[0];
};

// Get emergency details
const getEmergencyDetails = async (emergencyId) => {
  const query = `
    SELECT e.*, 
           u.first_name, u.last_name, u.phone,
           d.first_name as doctor_first_name, d.last_name as doctor_last_name,
           a.registration_number, a.operator_name
    FROM emergency_reports e
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN doctors d ON e.assigned_doctor_id = d.id
    LEFT JOIN ambulances a ON e.assigned_ambulance_id = a.id
    WHERE e.id = $1
  `;
  
  const result = await pool.query(query, [emergencyId]);
  return result.rows[0];
};
```

### Using Prisma ORM

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}

model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  phone               String?
  firstName           String?
  lastName            String?
  dateOfBirth         DateTime?
  bloodType           String?
  medicalConditions   String?
  emergencyContacts   Json?
  latitude            Float?
  longitude           Float?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  emergencyReports    EmergencyReport[]
  callSessions        CallSession[]
  reviews             DoctorReview[]
  
  @@index([email])
  @@index([latitude, longitude])
}

model Doctor {
  id                  String    @id @default(cuid())
  userId              String    @unique
  licenseNumber       String    @unique
  specialty           String
  hospitalName        String?
  isAvailable         Boolean   @default(true)
  averageRating       Float?
  totalConsultations  Int       @default(0)
  latitude            Float?
  longitude           Float?
  locationUpdatedAt   DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  user                User      @relation(fields: [userId], references: [id])
  assignedEmergencies EmergencyReport[]
  callSessions        CallSession[]
  reviews             DoctorReview[]
  
  @@index([specialty])
  @@index([isAvailable])
  @@index([latitude, longitude])
}

model Ambulance {
  id                  String    @id @default(cuid())
  registrationNumber  String    @unique
  vehicleType         String?
  status              String    @default("available")
  operatorName        String?
  operatorPhone       String?
  latitude            Float?
  longitude           Float?
  locationUpdatedAt   DateTime?
  equipment           Json?
  capacity            Int       @default(4)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  assignedEmergencies EmergencyReport[]
  
  @@index([status])
  @@index([latitude, longitude])
}

model EmergencyReport {
  id                  String    @id @default(cuid())
  userId              String
  emergencyType       String?
  description         String?
  latitude            Float
  longitude           Float
  severityLevel       String    @default("high")
  status              String    @default("reported")
  assignedAmbulanceId String?
  assignedDoctorId    String?
  responseTimeMinutes Int?
  resolvedAt          DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  user                User      @relation(fields: [userId], references: [id])
  ambulance           Ambulance? @relation(fields: [assignedAmbulanceId], references: [id])
  doctor              Doctor?   @relation(fields: [assignedDoctorId], references: [id])
  callSession         CallSession?
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model CallSession {
  id                  String    @id @default(cuid())
  emergencyId         String    @unique
  doctorId            String
  userId              String
  status              String    @default("pending")
  startedAt           DateTime?
  endedAt             DateTime?
  durationSeconds     Int?
  recordingUrl        String?
  notes               String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  emergency           EmergencyReport @relation(fields: [emergencyId], references: [id])
  doctor              Doctor    @relation(fields: [doctorId], references: [id])
  user                User      @relation(fields: [userId], references: [id])
  
  @@index([emergencyId])
  @@index([doctorId])
  @@index([status])
}

model DoctorReview {
  id                  String    @id @default(cuid())
  doctorId            String
  userId              String
  callSessionId       String?
  rating              Int
  review              String?
  createdAt           DateTime  @default(now())
  
  doctor              Doctor    @relation(fields: [doctorId], references: [id])
  user                User      @relation(fields: [userId], references: [id])
  
  @@index([doctorId])
  @@index([userId])
}
```

## Setup Instructions

### PostgreSQL

1. **Create Database**
```bash
createdb emergency_response_system
```

2. **Run Schema**
```bash
psql emergency_response_system < database_schema.sql
```

3. **Update .env.local**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/emergency_response_system
```

### With Prisma

1. **Initialize Prisma**
```bash
npm install @prisma/client
npx prisma init
```

2. **Update .env.local**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/emergency_response_system
```

3. **Run Migration**
```bash
npx prisma migrate dev --name init
```

## Data Integration

Replace mock data in `server.js` with actual database queries:

```javascript
// In server.js
const { getDoctorsFromDB, getAmbulancesFromDB } = require('./database');

io.on('connection', (socket) => {
  socket.on('doctor:request', async (data) => {
    const availableDoctors = await getDoctorsFromDB({ isAvailable: true });
    // ... rest of logic
  });
});
```

## Production Considerations

- Add database indexing for frequently queried columns
- Implement connection pooling for better performance
- Add data backup and recovery procedures
- Implement audit logging for sensitive operations
- Use encryption for sensitive medical data
- Set up automated backups
- Monitor query performance
- Implement proper access controls and RBAC
