'use client';

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Video, MapPin } from 'lucide-react';

interface TestDoctor {
  id: string;
  name: string;
}

export default function TestDashboard() {
  const [socket, setSocket] = useState(null);
  const [role, setRole] = useState<'doctor' | 'ambulance' | null>(null);
  const [doctorId, setDoctorId] = useState<string>('doc1');
  const [ambulanceId, setAmbulanceId] = useState<string>('amb1');
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCall, setActiveCall] = useState(false);
  const [doctors] = useState<TestDoctor[]>([
    { id: 'doc1', name: 'Dr. Sarah Johnson' },
    { id: 'doc2', name: 'Dr. Michael Chen' },
    { id: 'doc3', name: 'Dr. Emma Williams' },
  ]);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');

    newSocket.on('connect', () => {
      console.log('Test dashboard connected');
    });

    newSocket.on('doctor:incomingCall', (data) => {
      console.log('Incoming call:', data);
      setIncomingCall(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const registerDoctor = () => {
    if (socket) {
      (socket as any).emit('doctor:register', { id: doctorId });
      setRole('doctor');
    }
  };

  const registerAmbulance = () => {
    if (socket) {
      (socket as any).emit('ambulance:register', { id: ambulanceId });
      setRole('ambulance');
    }
  };

  const acceptCall = () => {
    if (socket && incomingCall) {
      (socket as any).emit('doctor:acceptCall', { callSessionId: incomingCall.callSessionId });
      setActiveCall(true);
      setIncomingCall(null);
    }
  };

  const rejectCall = () => {
    if (socket && incomingCall) {
      (socket as any).emit('doctor:rejectCall', { callSessionId: incomingCall.callSessionId });
      setIncomingCall(null);
    }
  };

  const updateAmbulanceLocation = () => {
    if (socket) {
      const lat = (Math.random() * 0.01 + 40.71).toFixed(4);
      const lon = (Math.random() * 0.01 - 74.01).toFixed(4);
      (socket as any).emit('ambulance:updateLocation', {
        ambulanceId,
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
      });
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Test Dashboard</h1>

          <Card className="p-8 bg-slate-800 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Select Role</h2>

            {/* Doctor Registration */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-400" />
                Doctor Mode
              </h3>
              <div className="space-y-3 mb-4">
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={registerDoctor}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold"
              >
                Register as Doctor
              </Button>
            </div>

            {/* Ambulance Registration */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                Ambulance Mode
              </h3>
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  value={ambulanceId}
                  onChange={(e) => setAmbulanceId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded"
                  placeholder="Ambulance ID"
                />
              </div>
              <Button
                onClick={registerAmbulance}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold"
              >
                Register as Ambulance
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">
          {role === 'doctor' ? '🏥 Doctor Dashboard' : '🚑 Ambulance Dashboard'}
        </h1>
        <p className="text-slate-300 mb-8">
          {role === 'doctor'
            ? `Registered as: ${doctors.find((d) => d.id === doctorId)?.name}`
            : `Ambulance ID: ${ambulanceId}`}
        </p>

        {role === 'doctor' && (
          <div className="grid grid-cols-1 gap-6">
            {/* Incoming Call Alert */}
            {incomingCall && (
              <Card className="p-6 bg-red-900 border border-red-500 animate-pulse">
                <div className="flex items-center gap-4">
                  <Phone className="w-8 h-8 text-red-300 animate-bounce" />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">Incoming Emergency Call</h2>
                    <p className="text-red-200 mt-2">
                      Patient Location: {incomingCall.latitude.toFixed(4)}, {incomingCall.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button onClick={acceptCall} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold">
                    Accept Call
                  </Button>
                  <Button onClick={rejectCall} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold">
                    Reject Call
                  </Button>
                </div>
              </Card>
            )}

            {/* Active Call Status */}
            {activeCall && (
              <Card className="p-6 bg-green-900 border border-green-500">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Video className="w-6 h-6 text-green-300" />
                  Video Call Active
                </h2>
                <div className="bg-slate-800 rounded p-4 mb-4">
                  <p className="text-slate-300">Video call is active with patient</p>
                  <p className="text-green-400 mt-2">Both video and audio are connected</p>
                </div>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold">
                  End Call
                </Button>
              </Card>
            )}

            {!incomingCall && !activeCall && (
              <Card className="p-6 bg-slate-800 border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-4">Waiting for Emergency Calls...</h2>
                <div className="bg-slate-700 rounded p-4 text-slate-300">
                  <p>You are now available to receive emergency consultation calls.</p>
                  <p className="mt-2">When a patient requests emergency help, you will receive an incoming call notification.</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {role === 'ambulance' && (
          <div className="grid grid-cols-1 gap-6">
            <Card className="p-6 bg-slate-800 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-400" />
                Location Tracking
              </h2>

              <Button
                onClick={updateAmbulanceLocation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg"
              >
                Update Location (Simulate Movement)
              </Button>

              <div className="mt-6 bg-slate-700 rounded p-4 text-slate-300">
                <p>Click the button to simulate ambulance movement.</p>
                <p className="mt-2">Location updates are broadcast in real-time to the emergency interface.</p>
                <p className="mt-2 text-blue-300">Your location is visible on the map within the 10km search radius.</p>
              </div>
            </Card>

            <Card className="p-6 bg-slate-800 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">Real-time Information</h2>
              <div className="space-y-3 text-slate-300">
                <div className="bg-slate-700 rounded p-3">
                  <span className="text-blue-300">Status: </span> Operational
                </div>
                <div className="bg-slate-700 rounded p-3">
                  <span className="text-blue-300">Signal Strength: </span> Connected
                </div>
                <div className="bg-slate-700 rounded p-3">
                  <span className="text-blue-300">Active Emergencies: </span> 0
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Back Button */}
        <Button
          onClick={() => setRole(null)}
          className="w-full mt-8 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold"
        >
          Switch Role
        </Button>
      </div>
    </div>
  );
}
