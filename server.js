const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// In-memory data storage (use your database connection string here)
const emergencies = new Map();
const doctors = new Map();
const ambulances = new Map();
const callSessions = new Map();

// Mock data - doctors
const mockDoctors = [
  {
    id: 'doc1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Emergency Medicine',
    latitude: 40.7128,
    longitude: -74.006,
    isAvailable: true,
    socketId: null,
  },
  {
    id: 'doc2',
    name: 'Dr. Michael Chen',
    specialty: 'Cardiology',
    latitude: 40.715,
    longitude: -74.008,
    isAvailable: true,
    socketId: null,
  },
  {
    id: 'doc3',
    name: 'Dr. Emma Williams',
    specialty: 'Trauma Surgery',
    latitude: 40.712,
    longitude: -74.005,
    isAvailable: true,
    socketId: null,
  },
];

// Mock data - ambulances
const mockAmbulances = [
  {
    id: 'amb1',
    name: 'Ambulance Unit 1',
    latitude: 40.7114,
    longitude: -74.003,
    status: 'available',
    socketId: null,
  },
  {
    id: 'amb2',
    name: 'Ambulance Unit 2',
    latitude: 40.712,
    longitude: -74.009,
    status: 'available',
    socketId: null,
  },
  {
    id: 'amb3',
    name: 'Ambulance Unit 3',
    latitude: 40.714,
    longitude: -74.004,
    status: 'available',
    socketId: null,
  },
];

mockDoctors.forEach((doc) => doctors.set(doc.id, doc));
mockAmbulances.forEach((amb) => ambulances.set(amb.id, amb));

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

app.get('/api/doctors/available', (req, res) => {
  const { latitude, longitude } = req.query;
  const availableDoctors = Array.from(doctors.values()).filter((doc) => doc.isAvailable);
  res.json(availableDoctors);
});

app.get('/api/ambulances/nearby', (req, res) => {
  const { latitude, longitude, radiusKm = 10 } = req.query;

  const nearbyAmbulances = Array.from(ambulances.values()).filter((amb) => {
    const lat1 = parseFloat(latitude);
    const lon1 = parseFloat(longitude);
    const lat2 = amb.latitude;
    const lon2 = amb.longitude;

    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusKm;
  });

  res.json(nearbyAmbulances);
});

app.post('/api/emergency/report', (req, res) => {
  const { userId, latitude, longitude, description } = req.body;
  const emergencyId = `em_${Date.now()}`;
  const emergency = {
    id: emergencyId,
    userId,
    latitude,
    longitude,
    description,
    status: 'reported',
    timestamp: new Date(),
    assignedAmbulance: null,
    assignedDoctor: null,
  };

  emergencies.set(emergencyId, emergency);
  io.emit('emergency:reported', emergency);

  res.json({ success: true, emergencyId, emergency });
});

// WebSocket events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Doctor registration
  socket.on('doctor:register', (doctorData) => {
    const doctor = doctors.get(doctorData.id);
    if (doctor) {
      doctor.socketId = socket.id;
      doctors.set(doctorData.id, doctor);
      socket.emit('doctor:registered', { success: true, doctorId: doctorData.id });
      console.log(`Doctor ${doctorData.id} registered with socket ${socket.id}`);
    }
  });

  // Ambulance registration
  socket.on('ambulance:register', (ambulanceData) => {
    const ambulance = ambulances.get(ambulanceData.id);
    if (ambulance) {
      ambulance.socketId = socket.id;
      ambulances.set(ambulanceData.id, ambulance);
      socket.emit('ambulance:registered', { success: true, ambulanceId: ambulanceData.id });
      console.log(`Ambulance ${ambulanceData.id} registered with socket ${socket.id}`);
    }
  });

  // Bystander/User registration
  socket.on('user:register', (userData) => {
    socket.join(`user_${userData.userId}`);
    console.log(`User ${userData.userId} connected`);
  });

  // Request doctor consultation
  socket.on('doctor:request', (data) => {
    const { emergencyId, latitude, longitude, userId } = data;
    const availableDoctors = Array.from(doctors.values()).filter((doc) => doc.isAvailable && doc.socketId);

    if (availableDoctors.length > 0) {
      const selectedDoctor = availableDoctors[0];
      const callSession = {
        id: `call_${Date.now()}`,
        emergencyId,
        doctorId: selectedDoctor.id,
        userId,
        doctorName: selectedDoctor.name,
        status: 'ringing',
        timestamp: new Date(),
      };

      callSessions.set(callSession.id, callSession);
      selectedDoctor.isAvailable = false;
      doctors.set(selectedDoctor.id, selectedDoctor);

      io.to(selectedDoctor.socketId).emit('doctor:incomingCall', {
        callSessionId: callSession.id,
        emergencyId,
        userId,
        latitude,
        longitude,
      });

      socket.emit('doctor:found', {
        success: true,
        callSessionId: callSession.id,
        doctorName: selectedDoctor.name,
      });
    } else {
      socket.emit('doctor:notFound', { success: false, message: 'No doctors available' });
    }
  });

  // Doctor accepts call
  socket.on('doctor:acceptCall', (data) => {
    const { callSessionId } = data;
    const callSession = callSessions.get(callSessionId);

    if (callSession) {
      callSession.status = 'accepted';
      callSessions.set(callSessionId, callSession);

      io.to(`user_${callSession.userId}`).emit('doctor:joined', {
        callSessionId,
        doctorName: callSession.doctorName,
        message: 'Doctor will join the video call soon',
      });

      socket.emit('doctor:callAccepted', { success: true, callSessionId });
    }
  });

  // Doctor rejects call
  socket.on('doctor:rejectCall', (data) => {
    const { callSessionId } = data;
    const callSession = callSessions.get(callSessionId);

    if (callSession) {
      const doctor = doctors.get(callSession.doctorId);
      if (doctor) {
        doctor.isAvailable = true;
        doctors.set(callSession.doctorId, doctor);
      }

      io.to(`user_${callSession.userId}`).emit('doctor:rejected', {
        message: 'Doctor is unavailable, searching for another doctor...',
      });

      callSessions.delete(callSessionId);
    }
  });

  // WebRTC signaling
  socket.on('webrtc:offer', (data) => {
    const { callSessionId, offer, fromRole } = data;
    const callSession = callSessions.get(callSessionId);

    if (callSession) {
      const targetUserId = fromRole === 'user' ? callSession.doctorId : callSession.userId;
      io.to(`user_${targetUserId}`).emit('webrtc:offer', { callSessionId, offer });
    }
  });

  socket.on('webrtc:answer', (data) => {
    const { callSessionId, answer, fromRole } = data;
    const callSession = callSessions.get(callSessionId);

    if (callSession) {
      const targetUserId = fromRole === 'doctor' ? callSession.userId : callSession.doctorId;
      io.to(`user_${targetUserId}`).emit('webrtc:answer', { callSessionId, answer });
    }
  });

  socket.on('webrtc:iceCandidate', (data) => {
    const { callSessionId, candidate, fromRole } = data;
    const callSession = callSessions.get(callSessionId);

    if (callSession) {
      const targetUserId = fromRole === 'user' ? callSession.doctorId : callSession.userId;
      io.to(`user_${targetUserId}`).emit('webrtc:iceCandidate', { callSessionId, candidate });
    }
  });

  // Ambulance location update
  socket.on('ambulance:updateLocation', (data) => {
    const { ambulanceId, latitude, longitude } = data;
    const ambulance = ambulances.get(ambulanceId);

    if (ambulance) {
      ambulance.latitude = latitude;
      ambulance.longitude = longitude;
      ambulances.set(ambulanceId, ambulance);

      io.emit('ambulance:locationUpdated', {
        ambulanceId,
        latitude,
        longitude,
      });
    }
  });

  // End call
  socket.on('call:end', (data) => {
    const { callSessionId } = data;
    const callSession = callSessions.get(callSessionId);

    if (callSession) {
      const doctor = doctors.get(callSession.doctorId);
      if (doctor) {
        doctor.isAvailable = true;
        doctors.set(callSession.doctorId, doctor);
      }

      io.emit('call:ended', { callSessionId });
      callSessions.delete(callSessionId);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    doctors.forEach((doctor) => {
      if (doctor.socketId === socket.id) {
        doctor.socketId = null;
        doctor.isAvailable = false;
      }
    });

    ambulances.forEach((ambulance) => {
      if (ambulance.socketId === socket.id) {
        ambulance.socketId = null;
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
