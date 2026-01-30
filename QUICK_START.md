# Emergency Response System - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Backend Server (Terminal 1)
```bash
node server.js
```
Expected output: `Server running on port 5000`

### 3. Start Frontend (Terminal 2)
```bash
npm run dev
```
Expected output: `Local: http://localhost:3000`

### 4. Open in Browser
- **Patient/Bystander**: http://localhost:3000
- **Test Dashboard** (Doctor/Ambulance): http://localhost:3000/test

## 🎯 Testing the System

### Scenario 1: Report Emergency & Get Doctor Consultation

1. **On Main Interface (http://localhost:3000)**
   - Allow location access
   - Click "REPORT EMERGENCY"
   - See confirmation notification
   - Click "Request Doctor"
   - Status updates as doctor is found

2. **On Test Dashboard (http://localhost:3000/test)**
   - Select "Doctor Mode"
   - Choose a doctor from dropdown
   - Click "Register as Doctor"
   - Wait for incoming call notification
   - Click "Accept Call"
   - Video call initiates

3. **Back on Main Interface**
   - See video call active
   - Test video/audio controls
   - Click "End Call"

### Scenario 2: Track Ambulance Movement

1. **On Main Interface**
   - Report emergency (see map updates)
   - Observe ambulances on map

2. **On Test Dashboard**
   - Select "Ambulance Mode"
   - Enter ambulance ID (amb1, amb2, or amb3)
   - Click "Register as Ambulance"
   - Click "Update Location" repeatedly
   - Watch map update in real-time on main interface

## 📁 Project Structure

```
emergency-response-system/
├── app/
│   ├── api/                          # API routes
│   │   ├── ambulances/nearby/route.ts
│   │   ├── doctors/available/route.ts
│   │   └── emergency/report/route.ts
│   ├── test/page.tsx                 # Test dashboard
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Main interface
│   └── globals.css                   # Styling
├── components/
│   ├── emergency-interface.tsx       # Main component
│   ├── test-dashboard.tsx            # Test component
│   └── ui/                           # shadcn components
├── lib/
│   ├── socket-utils.ts               # Socket utilities
│   ├── webrtc-utils.ts               # WebRTC utilities
│   └── utils.ts                      # General utilities
├── server.js                         # Node.js backend
├── .env.local                        # Environment config
├── SETUP.md                          # Detailed setup
├── DATABASE_SCHEMA.md                # Database guide
└── QUICK_START.md                    # This file
```

## 🔧 Configuration

### Default Locations (NYC Area)
```javascript
// Doctor Locations (for testing)
- Dr. Sarah Johnson: 40.7128, -74.0060
- Dr. Michael Chen: 40.7150, -74.0080
- Dr. Emma Williams: 40.7120, -74.0050

// Ambulance Locations (for testing)
- Unit 1: 40.7114, -74.0030
- Unit 2: 40.7120, -74.0090
- Unit 3: 40.7140, -74.0040
```

### Environment Variables (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
SOCKET_IO_URL=http://localhost:5000
DATABASE_URL=your_database_connection_string_here
```

## 🎨 Key Features

### Emergency Report Button
- Large, prominent button that reports emergency
- Updates status to confirmed
- Triggers ambulance dispatch
- Shows 10km search radius on map

### Doctor Consultation
- Automatic doctor search
- Real-time status updates
- WebRTC video/audio calling
- Video/audio control toggles
- Call duration tracking

### Real-time Map
- Shows user emergency location
- Displays nearby ambulances (blue markers)
- Shows available doctors (green markers)
- 10km search radius visualization
- OpenStreetMap tiles

### Video Calling
- Peer-to-peer video streaming
- Bi-directional audio/video
- Mute video/audio during call
- Screen sharing capable (can be added)
- Call recording capable (can be added)

## 🔌 WebSocket Events

### Emergency Reported
```javascript
socket.emit('emergency:reported', {
  id, userId, latitude, longitude, 
  status, timestamp
})
```

### Doctor Request
```javascript
socket.emit('doctor:request', {
  emergencyId, latitude, longitude, userId
})
```

### WebRTC Signaling
```javascript
socket.emit('webrtc:offer', { callSessionId, offer })
socket.emit('webrtc:answer', { callSessionId, answer })
socket.emit('webrtc:iceCandidate', { callSessionId, candidate })
```

### Location Updates
```javascript
socket.emit('ambulance:updateLocation', {
  ambulanceId, latitude, longitude
})
```

## 📊 Data Flow

```
User Reports Emergency
         ↓
Browser → API Route → Backend Server
         ↓
Emergency Stored & Broadcast via WebSocket
         ↓
Ambulance Locations Updated on Map
         ↓
Doctor Search Triggered
         ↓
Available Doctor Found
         ↓
Doctor Receives Call Notification
         ↓
Doctor Accepts → Call Session Created
         ↓
WebRTC Signaling → Peer Connection Established
         ↓
Video/Audio Streaming Active
         ↓
Call End → Session Closed & Resources Freed
```

## ✅ Browser Requirements

- Modern browser with WebRTC support
- Geolocation enabled
- Camera/Microphone access allowed
- JavaScript enabled
- CORS-compatible (local development works by default)

### Tested On
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend connection fails | Ensure `node server.js` is running on port 5000 |
| Video not working | Check camera permissions, try different browser |
| Map not loading | Check internet connection, clear browser cache |
| Location unavailable | Enable geolocation in browser settings |
| Socket connection error | Verify backend URL in `.env.local` |
| Doctor not found | Register in test dashboard first |
| Call quality poor | Check internet connection bandwidth |

## 📦 Deployment

### Docker
```bash
docker-compose up
```

### Vercel (Frontend Only)
```bash
npm run build
npm run start
```
*Note: Requires backend deployed separately*

### Self-Hosted
```bash
npm install
npm run build
npm start  # Runs both backend and frontend
```

## 🔐 Security Notes

Before production:
- Add authentication
- Enable HTTPS
- Implement database integration
- Add rate limiting
- Validate all inputs
- Encrypt sensitive data
- Implement HIPAA compliance
- Add audit logging

## 📚 Additional Resources

- **WebRTC**: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- **Socket.IO**: https://socket.io/docs/
- **Leaflet Maps**: https://leafletjs.com/
- **Next.js**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

## 🤝 Support

For detailed setup, see **SETUP.md**
For database integration, see **DATABASE_SCHEMA.md**

---

**Ready to go live?** Start the servers and navigate to http://localhost:3000!
