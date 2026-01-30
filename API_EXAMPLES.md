# Emergency Response System - API Examples

## Base URLs

```
Frontend: http://localhost:3000
Backend:  http://localhost:5000
```

## REST API Endpoints

### 1. Report Emergency

**Endpoint**: `POST /api/emergency/report`

**Request**:
```bash
curl -X POST http://localhost:3000/api/emergency/report \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_12345",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "description": "Car accident on 5th Avenue"
  }'
```

**Response**:
```json
{
  "success": true,
  "emergencyId": "em_1704067200000",
  "emergency": {
    "id": "em_1704067200000",
    "userId": "user_12345",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "description": "Car accident on 5th Avenue",
    "status": "reported",
    "timestamp": "2024-01-01T12:00:00Z",
    "assignedAmbulance": null,
    "assignedDoctor": null
  }
}
```

### 2. Get Available Doctors

**Endpoint**: `GET /api/doctors/available`

**Request**:
```bash
curl -X GET "http://localhost:3000/api/doctors/available?latitude=40.7128&longitude=-74.0060"
```

**Response**:
```json
[
  {
    "id": "doc1",
    "name": "Dr. Sarah Johnson",
    "specialty": "Emergency Medicine",
    "latitude": 40.7128,
    "longitude": -74.006,
    "isAvailable": true,
    "socketId": "socket_123"
  },
  {
    "id": "doc2",
    "name": "Dr. Michael Chen",
    "specialty": "Cardiology",
    "latitude": 40.715,
    "longitude": -74.008,
    "isAvailable": true,
    "socketId": "socket_456"
  }
]
```

### 3. Get Nearby Ambulances

**Endpoint**: `GET /api/ambulances/nearby`

**Request**:
```bash
curl -X GET "http://localhost:3000/api/ambulances/nearby?latitude=40.7128&longitude=-74.0060&radiusKm=10"
```

**Response**:
```json
[
  {
    "id": "amb1",
    "name": "Ambulance Unit 1",
    "latitude": 40.7114,
    "longitude": -74.003,
    "status": "available",
    "socketId": "socket_789"
  },
  {
    "id": "amb2",
    "name": "Ambulance Unit 2",
    "latitude": 40.712,
    "longitude": -74.009,
    "status": "available",
    "socketId": "socket_012"
  }
]
```

## WebSocket Events

### Connection Setup

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected to server');
});
```

### User Registration

**Emit**:
```javascript
socket.emit('user:register', { 
  userId: 'user_12345' 
});
```

**Listen**:
```javascript
socket.on('doctor:found', (data) => {
  console.log('Doctor found:', data);
  // { 
  //   success: true, 
  //   callSessionId: 'call_123', 
  //   doctorName: 'Dr. Sarah Johnson' 
  // }
});
```

### Doctor Registration

**Emit**:
```javascript
socket.emit('doctor:register', { 
  id: 'doc1' 
});
```

**Listen**:
```javascript
socket.on('doctor:registered', (data) => {
  console.log('Doctor registered:', data);
  // { success: true, doctorId: 'doc1' }
});
```

### Request Doctor Consultation

**Emit**:
```javascript
socket.emit('doctor:request', {
  emergencyId: 'em_1704067200000',
  latitude: 40.7128,
  longitude: -74.0060,
  userId: 'user_12345'
});
```

**Listen**:
```javascript
socket.on('doctor:found', (data) => {
  console.log('Doctor found and assigned');
  // { 
  //   success: true, 
  //   callSessionId: 'call_123',
  //   doctorName: 'Dr. Sarah Johnson'
  // }
});

socket.on('doctor:notFound', (data) => {
  console.log('No doctors available');
  // { success: false, message: 'No doctors available' }
});
```

### Doctor Incoming Call

**Listen** (Doctor side):
```javascript
socket.on('doctor:incomingCall', (data) => {
  console.log('Incoming call from patient:', data);
  // {
  //   callSessionId: 'call_123',
  //   emergencyId: 'em_123',
  //   userId: 'user_12345',
  //   latitude: 40.7128,
  //   longitude: -74.0060
  // }
});
```

### Accept Call

**Emit** (Doctor side):
```javascript
socket.emit('doctor:acceptCall', { 
  callSessionId: 'call_123' 
});
```

**Listen** (Patient side):
```javascript
socket.on('doctor:joined', (data) => {
  console.log('Doctor joining call:', data);
  // {
  //   callSessionId: 'call_123',
  //   doctorName: 'Dr. Sarah Johnson',
  //   message: 'Doctor will join the video call soon'
  // }
});
```

### Reject Call

**Emit** (Doctor side):
```javascript
socket.emit('doctor:rejectCall', { 
  callSessionId: 'call_123' 
});
```

**Listen** (Patient side):
```javascript
socket.on('doctor:rejected', (data) => {
  console.log('Doctor rejected call:', data);
  // { message: 'Doctor is unavailable, searching for another...' }
});
```

### WebRTC Offer (Patient → Doctor)

**Emit**:
```javascript
socket.emit('webrtc:offer', {
  callSessionId: 'call_123',
  offer: {
    type: 'offer',
    sdp: '...' // WebRTC Session Description Protocol
  },
  fromRole: 'user'
});
```

**Listen**:
```javascript
socket.on('webrtc:offer', (data) => {
  console.log('Received WebRTC offer:', data);
  // { 
  //   callSessionId: 'call_123',
  //   offer: { type: 'offer', sdp: '...' }
  // }
});
```

### WebRTC Answer (Doctor → Patient)

**Emit**:
```javascript
socket.emit('webrtc:answer', {
  callSessionId: 'call_123',
  answer: {
    type: 'answer',
    sdp: '...'
  },
  fromRole: 'doctor'
});
```

**Listen**:
```javascript
socket.on('webrtc:answer', (data) => {
  console.log('Received WebRTC answer:', data);
  // { 
  //   callSessionId: 'call_123',
  //   answer: { type: 'answer', sdp: '...' }
  // }
});
```

### ICE Candidate Exchange

**Emit**:
```javascript
socket.emit('webrtc:iceCandidate', {
  callSessionId: 'call_123',
  candidate: {
    candidate: 'candidate:...',
    sdpMLineIndex: 0,
    sdpMid: 'video'
  },
  fromRole: 'user'
});
```

**Listen**:
```javascript
socket.on('webrtc:iceCandidate', (data) => {
  console.log('Received ICE candidate:', data);
  // { 
  //   callSessionId: 'call_123',
  //   candidate: { ... }
  // }
});
```

### Ambulance Location Update

**Emit**:
```javascript
socket.emit('ambulance:updateLocation', {
  ambulanceId: 'amb1',
  latitude: 40.7124,
  longitude: -74.0045
});
```

**Broadcast Listen** (all clients):
```javascript
socket.on('ambulance:locationUpdated', (data) => {
  console.log('Ambulance moved:', data);
  // {
  //   ambulanceId: 'amb1',
  //   latitude: 40.7124,
  //   longitude: -74.0045
  // }
});
```

### End Call

**Emit**:
```javascript
socket.emit('call:end', {
  callSessionId: 'call_123'
});
```

**Listen** (both sides):
```javascript
socket.on('call:ended', (data) => {
  console.log('Call ended:', data);
  // { callSessionId: 'call_123' }
});
```

## Complete Workflow Example

### JavaScript/Node.js

```javascript
const io = require('socket.io-client');

// Initialize socket
const socket = io('http://localhost:5000');

// Step 1: Register user
socket.on('connect', () => {
  socket.emit('user:register', { userId: 'user_12345' });
});

// Step 2: Report emergency
async function reportEmergency() {
  const response = await fetch('http://localhost:3000/api/emergency/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user_12345',
      latitude: 40.7128,
      longitude: -74.0060,
      description: 'Medical emergency'
    })
  });
  
  const data = await response.json();
  return data.emergencyId;
}

// Step 3: Request doctor
async function requestDoctor(emergencyId) {
  socket.emit('doctor:request', {
    emergencyId,
    latitude: 40.7128,
    longitude: -74.0060,
    userId: 'user_12345'
  });
}

// Step 4: Listen for doctor found
socket.on('doctor:found', (data) => {
  console.log('Doctor found!', data.doctorName);
  initializeWebRTC(data.callSessionId);
});

// Step 5: WebRTC setup
function initializeWebRTC(callSessionId) {
  // Get local media stream
  navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 },
    audio: true
  }).then(stream => {
    // Create peer connection and emit offer
    const peerConnection = new RTCPeerConnection();
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });
    
    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('webrtc:iceCandidate', {
          callSessionId,
          candidate: event.candidate,
          fromRole: 'user'
        });
      }
    };
    
    peerConnection.createOffer().then(offer => {
      peerConnection.setLocalDescription(offer);
      socket.emit('webrtc:offer', {
        callSessionId,
        offer,
        fromRole: 'user'
      });
    });
  });
}

// Run workflow
async function main() {
  const emergencyId = await reportEmergency();
  await requestDoctor(emergencyId);
}

main();
```

## Error Handling

### Common Errors

```javascript
// Connection error
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

// Disconnect
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// API error response
fetch(url).then(res => {
  if (!res.ok) {
    throw new Error(`HTTP Error: ${res.status}`);
  }
  return res.json();
}).catch(error => {
  console.error('API Error:', error);
});
```

## Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
const maxRequests = 10;
const timeWindow = 60000; // 1 minute
let requestCount = 0;

socket.on('doctor:request', (data) => {
  requestCount++;
  
  if (requestCount > maxRequests) {
    socket.emit('error', {
      message: 'Too many requests. Please wait.'
    });
    return;
  }
  
  setTimeout(() => {
    requestCount--;
  }, timeWindow);
});
```

## Testing with Postman

Import this collection into Postman:

```json
{
  "info": {
    "name": "Emergency Response API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Report Emergency",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/emergency/report",
        "body": {
          "raw": "{\"userId\": \"user_12345\", \"latitude\": 40.7128, \"longitude\": -74.0060, \"description\": \"Emergency\"}"
        }
      }
    },
    {
      "name": "Get Doctors",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/api/doctors/available?latitude=40.7128&longitude=-74.0060"
      }
    },
    {
      "name": "Get Ambulances",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/api/ambulances/nearby?latitude=40.7128&longitude=-74.0060&radiusKm=10"
      }
    }
  ]
}
```

---

**More help?** See SETUP.md or QUICK_START.md
