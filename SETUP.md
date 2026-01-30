# Emergency Response System - Setup Guide

A real-time emergency response system with WebSocket-based video calling, doctor consultation, and ambulance tracking.

## Features

- **Emergency Report Button**: Instant emergency reporting with confirmation notifications
- **Real-time Doctor Consultation**: WebRTC-based video calling with nearby doctors
- **Ambulance Tracking**: Live map showing ambulance locations within 10km radius
- **Doctor Search**: Automatic search for available doctors with real-time status
- **Live Location Tracking**: User and service provider location tracking
- **Video Call Controls**: Mute/unmute video and audio during calls
- **WebSocket Communication**: Real-time signaling and updates

## Architecture

### Frontend (React + Next.js)
- Location-based services
- Real-time map with Leaflet
- WebRTC peer-to-peer video calling
- Socket.IO client for real-time communication

### Backend (Node.js + Express)
- Socket.IO server for WebSocket communication
- RESTful API endpoints
- In-memory data storage (easily replaceable with your database)
- WebRTC signaling

## Prerequisites

- Node.js 18+ and npm
- Modern web browser with WebRTC support
- Geolocation enabled on your device

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Backend Dependencies

```bash
npm install express socket.io cors dotenv
```

### 3. Environment Setup

Create/update `.env.local` with:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
SOCKET_IO_URL=http://localhost:5000
DATABASE_URL=your_database_connection_string_here
```

## Running the Application

### Development Mode

In separate terminals:

```bash
# Terminal 1: Start Backend Server
node server.js

# Terminal 2: Start Next.js Frontend
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Mode

```bash
npm run build
npm start
```

## Using the Application

### 1. Emergency Report
- Click the large "REPORT EMERGENCY" button
- Your location will be captured and emergency services notified
- The map will show a 10km search radius

### 2. Consult Doctor
- After reporting an emergency, click "Request Doctor"
- The system automatically searches for available doctors
- Once found, a video call session initiates

### 3. Video Call
- Allow camera and microphone access when prompted
- Toggle video/audio during the call with the control buttons
- Click "End Call" to disconnect

### 4. Ambulance Tracking
- Real-time ambulance locations are displayed on the map
- Ambulances within 10km are shown with status

## API Endpoints

### Emergency Report
```
POST /api/emergency/report
Content-Type: application/json

{
  "userId": "user_123",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "description": "Emergency description"
}
```

### Get Available Doctors
```
GET /api/doctors/available?latitude=40.7128&longitude=-74.0060
```

### Get Nearby Ambulances
```
GET /api/ambulances/nearby?latitude=40.7128&longitude=-74.0060&radiusKm=10
```

## WebSocket Events

### Client to Server
- `user:register` - Register user session
- `doctor:register` - Register doctor account
- `doctor:request` - Request doctor consultation
- `doctor:acceptCall` - Doctor accepts incoming call
- `doctor:rejectCall` - Doctor rejects incoming call
- `webrtc:offer` - WebRTC offer for peer connection
- `webrtc:answer` - WebRTC answer response
- `webrtc:iceCandidate` - ICE candidate for connection
- `ambulance:updateLocation` - Update ambulance position
- `call:end` - End active call

### Server to Client
- `doctor:found` - Doctor matched for consultation
- `doctor:notFound` - No doctors available
- `doctor:joined` - Doctor joining video call
- `doctor:incomingCall` - Incoming call notification
- `ambulance:locationUpdated` - Ambulance location update
- `webrtc:offer/answer/iceCandidate` - WebRTC signaling messages

## Database Integration

The current implementation uses in-memory storage. To integrate your database:

1. **Modify server.js**:
   - Replace mock doctor/ambulance data with database queries
   - Add database connection using your connection string from `.env.local`
   - Implement persistent storage for emergency records

Example for PostgreSQL with your connection string:

```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Replace mock data with database queries
const getDoctors = async (limit = 10) => {
  const result = await pool.query('SELECT * FROM doctors WHERE is_available = true LIMIT $1', [limit]);
  return result.rows;
};
```

## Location Services

- Uses browser Geolocation API
- Fallback to default NYC coordinates if location unavailable
- Automatically updates ambulance positions every 5 seconds

## Video Call Implementation

- **WebRTC**: Peer-to-peer video streaming
- **SimpleP2P**: Simplified WebRTC wrapper
- **STUN Server**: Google's public STUN server for NAT traversal
- **Audio/Video Controls**: Toggle during active calls

## Troubleshooting

### Backend Connection Issues
- Ensure `server.js` is running on port 5000
- Check firewall settings for port access
- Verify environment variables in `.env.local`

### Video Call Not Working
- Allow camera/microphone permissions
- Check browser console for WebRTC errors
- Ensure browser supports WebRTC (Chrome, Firefox, Safari)

### Location Not Available
- Enable geolocation in browser settings
- Check browser console for permission errors
- System will use fallback NYC coordinates

### Map Not Loading
- Ensure internet connection for tile layer
- Check for browser CORS issues
- Verify Leaflet CSS is loaded

## Future Enhancements

- Multi-doctor group calls
- Call recording and transcription
- Patient history and medical records
- Emergency services integration (911)
- SMS/push notifications
- Payment and insurance integration
- Analytics and reporting dashboard
- Doctor availability scheduling
- Emergency triage system
- Prescription and follow-up management

## Security Considerations

Before production deployment:

1. **Implement Authentication**: Add user/doctor login system
2. **HTTPS Only**: Use SSL/TLS certificates
3. **Data Encryption**: Encrypt sensitive data in transit and at rest
4. **HIPAA Compliance**: Ensure medical data protection
5. **Rate Limiting**: Prevent abuse of API endpoints
6. **Input Validation**: Sanitize all user inputs
7. **Access Control**: Implement role-based permissions
8. **Audit Logging**: Log all emergency reports and calls

## Support & Notes

- This is a foundation system. Add your database integration for production
- Customize mock doctor/ambulance data for your region
- Modify styling and branding as needed
- Test thoroughly with real medical professionals
- Ensure compliance with local healthcare regulations

## License

MIT License - Feel free to use and modify for your needs.
