'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  AlertCircle, 
  Phone, 
  MapPin, 
  User, 
  Video, 
  XCircle, 
  Mic, 
  MicOff, 
  VideoOff, 
  Loader2, 
  CheckCircle2,
  Clock,
  Activity,
  Bell,
  PhoneOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  rating: number;
  phone: string;
}

interface Emergency {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  latitude: number;
  longitude: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  created_at: string;
}

export default function DoctorDashboard() {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [status, setStatus] = useState('Select your profile to start');
  const [isOnline, setIsOnline] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Fetch all doctors for selection
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch('/api/doctors/available?latitude=0&longitude=0');
        const data = await response.json();
        setDoctors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch pending emergencies
  const fetchEmergencies = useCallback(async () => {
    if (!isOnline || !selectedDoctor) return;
    try {
      const response = await fetch('/api/emergency/report');
      const data = await response.json();
      setEmergencies(Array.isArray(data) ? data.filter((e: Emergency) => e.status === 'pending') : []);
    } catch (error) {
      console.error('Error fetching emergencies:', error);
    }
  }, [isOnline, selectedDoctor]);

  // Poll for emergencies when online
  useEffect(() => {
    if (isOnline && selectedDoctor) {
      fetchEmergencies();
      const interval = setInterval(fetchEmergencies, 3000);
      return () => clearInterval(interval);
    }
  }, [isOnline, selectedDoctor, fetchEmergencies]);

  // Go online/offline
  const toggleOnlineStatus = async () => {
    if (!selectedDoctor) return;

    const newStatus = !isOnline;
    setIsOnline(newStatus);

    try {
      await fetch('/api/doctors/available', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          isAvailable: newStatus,
        }),
      });
      setStatus(newStatus ? 'Online - Waiting for emergencies' : 'Offline');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Accept emergency
  const handleAcceptEmergency = async (emergency: Emergency) => {
    if (!selectedDoctor) return;

    try {
      const response = await fetch('/api/emergency/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergencyId: emergency.id,
          doctorId: selectedDoctor.id,
          responseType: 'doctor',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setActiveEmergency(emergency);
        setStatus(`Emergency accepted - Connecting to ${emergency.user_name}`);
        
        // Start video call
        setTimeout(() => {
          setCallActive(true);
          initializeVideoStream();
        }, 1500);
      }
    } catch (error) {
      console.error('Error accepting emergency:', error);
    }
  };

  // Initialize video stream
  const initializeVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setStatus('Video call active');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setStatus('Unable to access camera/microphone');
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // End call
  const handleEndCall = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Update emergency status
    if (activeEmergency?.id) {
      try {
        await fetch(`/api/emergency/${activeEmergency.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        });
      } catch (error) {
        console.error('Error completing emergency:', error);
      }
    }

    // Mark doctor as available again
    if (selectedDoctor) {
      try {
        await fetch('/api/doctors/available', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorId: selectedDoctor.id,
            isAvailable: true,
          }),
        });
      } catch (error) {
        console.error('Error updating doctor status:', error);
      }
    }

    setCallActive(false);
    setActiveEmergency(null);
    setStatus('Online - Waiting for emergencies');
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/20 border-red-500';
      case 'high': return 'text-orange-500 bg-orange-500/20 border-orange-500';
      case 'medium': return 'text-amber-500 bg-amber-500/20 border-amber-500';
      default: return 'text-green-500 bg-green-500/20 border-green-500';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-cyan-500 mb-2">Doctor Dashboard</h1>
            <p className="text-slate-400">Manage emergency consultations and patient care</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-slate-400 hover:text-white transition">
              Switch to User View
            </a>
          </div>
        </div>

        {/* Doctor Selection */}
        {!selectedDoctor ? (
          <Card className="p-8 bg-slate-800 border-slate-700 rounded-xl max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Select Your Profile</h2>
            <div className="space-y-4">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => {
                    setSelectedDoctor(doctor);
                    setStatus('Offline - Go online to receive emergencies');
                  }}
                  className="w-full p-4 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <User className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-lg">{doctor.name}</p>
                      <p className="text-sm text-slate-400">{doctor.specialty}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-amber-400">{doctor.rating}/5 rating</p>
                    <p className="text-xs text-slate-500">{doctor.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        ) : (
          // Main Dashboard
          <div className="space-y-8">
            {/* Status Bar */}
            <Card className={`p-4 ${isOnline ? 'bg-green-600 border-green-500' : 'bg-slate-700 border-slate-600'} rounded-xl`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
                  <p className="font-bold">{selectedDoctor.name}</p>
                  <span className="text-sm opacity-80">- {selectedDoctor.specialty}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{status}</span>
                  <Button
                    onClick={toggleOnlineStatus}
                    disabled={callActive}
                    className={isOnline ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                  >
                    {isOnline ? 'Go Offline' : 'Go Online'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Video Call or Emergency List */}
              {callActive && activeEmergency ? (
                <Card className="lg:col-span-2 p-0 overflow-hidden border-slate-700 bg-slate-800 rounded-xl">
                  <div className="relative bg-black h-96 md:h-[500px]">
                    {/* Remote Video (Patient) */}
                    <video
                      ref={remoteVideoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                    />
                    
                    {/* Placeholder when no remote video */}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                          <User className="w-12 h-12 text-orange-400" />
                        </div>
                        <p className="text-lg font-semibold">{activeEmergency.user_name}</p>
                        <p className="text-sm text-green-400">Connected</p>
                      </div>
                    </div>

                    {/* Local Video (Doctor) - Picture in Picture */}
                    <div className="absolute bottom-4 right-4 w-32 h-40 bg-slate-900 rounded-lg overflow-hidden border-2 border-cyan-500">
                      <video
                        ref={localVideoRef}
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                        autoPlay
                        muted
                        playsInline
                      />
                    </div>

                    {/* Patient Info Overlay */}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-4 py-2 rounded-lg">
                      <p className="text-sm font-semibold">{activeEmergency.user_name}</p>
                      <p className="text-xs text-green-400">Video Call Active</p>
                      <p className={`text-xs mt-1 ${getSeverityColor(activeEmergency.severity)}`}>
                        {activeEmergency.severity.toUpperCase()} - {activeEmergency.description}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      <Button
                        onClick={toggleVideo}
                        size="lg"
                        className={`rounded-full w-12 h-12 p-0 ${
                          videoEnabled ? 'bg-slate-600 hover:bg-slate-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                      </Button>

                      <Button
                        onClick={toggleAudio}
                        size="lg"
                        className={`rounded-full w-12 h-12 p-0 ${
                          audioEnabled ? 'bg-slate-600 hover:bg-slate-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                      </Button>

                      <Button
                        onClick={handleEndCall}
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 rounded-full w-12 h-12 p-0"
                      >
                        <PhoneOff className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="lg:col-span-2 p-6 border-slate-700 bg-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Bell className="w-6 h-6 text-orange-500" />
                      Incoming Emergencies
                    </h3>
                    {emergencies.length > 0 && (
                      <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse">
                        {emergencies.length} Pending
                      </span>
                    )}
                  </div>

                  {!isOnline ? (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400 mb-4">You are currently offline</p>
                      <Button onClick={toggleOnlineStatus} className="bg-green-600 hover:bg-green-700">
                        Go Online to Receive Emergencies
                      </Button>
                    </div>
                  ) : emergencies.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {emergencies.map((emergency) => (
                        <div
                          key={emergency.id}
                          className={`p-4 bg-slate-700 rounded-lg border-l-4 ${getSeverityColor(emergency.severity)}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className={`w-5 h-5 ${getSeverityColor(emergency.severity).split(' ')[0]}`} />
                                <span className={`text-sm font-bold uppercase ${getSeverityColor(emergency.severity).split(' ')[0]}`}>
                                  {emergency.severity} Priority
                                </span>
                              </div>
                              <p className="font-semibold text-lg">{emergency.user_name}</p>
                              <p className="text-sm text-slate-400 mb-2">{emergency.description}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {emergency.latitude.toFixed(4)}, {emergency.longitude.toFixed(4)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(emergency.created_at)}
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleAcceptEmergency(emergency)}
                              className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Accept
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
                      <p className="text-slate-400">Waiting for emergency requests...</p>
                      <p className="text-xs text-slate-500 mt-2">
                        You will be notified when a patient needs help
                      </p>
                    </div>
                  )}
                </Card>
              )}

              {/* Patient Location / Stats */}
              <div className="space-y-6">
                {activeEmergency ? (
                  <Card className="p-0 overflow-hidden border-slate-700 bg-slate-800 rounded-xl h-64">
                    <div className="w-full h-full relative">
                      <img
                        src={`https://staticmap.openstreetmap.de/staticmap.php?center=${activeEmergency.latitude},${activeEmergency.longitude}&zoom=14&size=400x300&maptype=osmarenderer&markers=${activeEmergency.latitude},${activeEmergency.longitude},ol-marker`}
                        alt="Patient location map"
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-slate-900/80 backdrop-blur rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">Patient Location</p>
                          <p className="text-sm font-mono text-orange-400">
                            {activeEmergency.latitude.toFixed(4)}, {activeEmergency.longitude.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6 border-slate-700 bg-slate-800 rounded-xl">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      Today's Stats
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Emergencies Handled</span>
                        <span className="font-bold text-cyan-400">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Average Response Time</span>
                        <span className="font-bold text-green-400">--</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Time Online</span>
                        <span className="font-bold text-amber-400">
                          {isOnline ? 'Active' : '--'}
                        </span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card className="p-6 border-slate-700 bg-slate-800 rounded-xl">
                  <h4 className="font-bold mb-4">Quick Actions</h4>
                  <div className="space-y-3">
                    <Button
                      onClick={() => setSelectedDoctor(null)}
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Switch Profile
                    </Button>
                    <a href="/" className="block">
                      <Button
                        variant="outline"
                        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        User View
                      </Button>
                    </a>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
