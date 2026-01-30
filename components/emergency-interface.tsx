'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AlertCircle, Phone, MapPin, User, Video, XCircle, Mic, MicOff, VideoOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface EmergencyLocation {
  latitude: number;
  longitude: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  rating: number;
  phone: string;
  distance?: number;
}

export interface Ambulance {
  id: string;
  unit_number: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  eta_minutes: number;
  distance?: number;
}

export interface Emergency {
  id: string;
  user_id: string;
  status: string;
  doctor_name?: string;
  doctor_specialty?: string;
  doctor_phone?: string;
  response_status?: string;
}

export default function EmergencyInterface() {
  const [userLocation, setUserLocation] = useState<EmergencyLocation | null>(null);
  const [emergencyReported, setEmergencyReported] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [callActive, setCallActive] = useState(false);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [status, setStatus] = useState('Ready');
  const [searching, setSearching] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [userId] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('emergencyUserId') || crypto.randomUUID() : crypto.randomUUID());
  const [currentEmergency, setCurrentEmergency] = useState<Emergency | null>(null);
  const [emergencyAccepted, setEmergencyAccepted] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Save userId to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('emergencyUserId', userId);
    }
  }, [userId]);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Default location for demo (San Francisco)
          setUserLocation({
            latitude: 37.7749,
            longitude: -122.4194,
          });
        }
      );
    }
  }, []);

  // Fetch available doctors from database
  const fetchDoctors = useCallback(async () => {
    if (!userLocation) return;
    try {
      const response = await fetch(
        `/api/doctors/available?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}`
      );
      const data = await response.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  }, [userLocation]);

  // Fetch nearby ambulances from database
  const fetchAmbulances = useCallback(async () => {
    if (!userLocation) return;
    try {
      const response = await fetch(
        `/api/ambulances/nearby?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}`
      );
      const data = await response.json();
      setAmbulances(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching ambulances:', error);
    }
  }, [userLocation]);

  // Poll for emergency status updates
  const checkEmergencyStatus = useCallback(async () => {
    if (!currentEmergency?.id) return;
    try {
      const response = await fetch(`/api/emergency/user/${userId}`);
      const data = await response.json();
      
      if (data.hasActiveEmergency && data.emergency) {
        setCurrentEmergency(data.emergency);
        
        // Check if a doctor has accepted
        if (data.emergency.doctor_name && !emergencyAccepted) {
          setEmergencyAccepted(true);
          setDoctorName(data.emergency.doctor_name);
          setStatus(`Dr. ${data.emergency.doctor_name} has accepted your emergency!`);
          
          // Auto-start video call when doctor accepts
          setTimeout(() => {
            setCallActive(true);
            initializeVideoStream();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error checking emergency status:', error);
    }
  }, [currentEmergency?.id, userId, emergencyAccepted]);

  // Poll for updates when emergency is active
  useEffect(() => {
    if (emergencyReported && currentEmergency?.id && !emergencyAccepted) {
      const interval = setInterval(() => {
        checkEmergencyStatus();
        fetchDoctors();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [emergencyReported, currentEmergency?.id, emergencyAccepted, checkEmergencyStatus, fetchDoctors]);

  // Initialize local video stream
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

  // Handle emergency report
  const handleReportEmergency = async () => {
    if (!userLocation) {
      setStatus('Unable to get your location. Please enable location access.');
      return;
    }

    setEmergencyReported(true);
    setStatus('Emergency reported! Searching for available doctors...');

    try {
      // Report emergency to database
      const response = await fetch('/api/emergency/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName: 'Emergency User',
          userPhone: 'Unknown',
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          description: 'Medical Emergency',
          severity: 'high',
        }),
      });

      const data = await response.json();
      if (data.success && data.emergency) {
        setCurrentEmergency(data.emergency);
        setStatus('Emergency reported! Waiting for a doctor to respond...');
      }

      // Fetch available doctors and ambulances
      await fetchDoctors();
      await fetchAmbulances();
    } catch (error) {
      console.error('Error reporting emergency:', error);
      setStatus('Error reporting emergency. Please try again.');
    }
  };

  // Handle requesting a specific doctor
  const handleRequestDoctor = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSearching(true);
    setStatus(`Requesting Dr. ${doctor.name}...`);
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
    
    // Update emergency status to completed
    if (currentEmergency?.id) {
      try {
        await fetch(`/api/emergency/${currentEmergency.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        });
      } catch (error) {
        console.error('Error completing emergency:', error);
      }
    }

    setCallActive(false);
    setDoctorName(null);
    setEmergencyReported(false);
    setSearching(false);
    setStatus('Call ended');
    setSelectedDoctor(null);
    setCurrentEmergency(null);
    setEmergencyAccepted(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">Emergency Response System</h1>
            <p className="text-slate-400">Real-time emergency medical dispatch with doctor consultation</p>
            <p className="text-xs text-slate-500 mt-1">User ID: {userId.slice(0, 8)}...</p>
          </div>
          <a href="/doctor" className="text-sm text-cyan-400 hover:text-cyan-300 transition">
            Doctor Dashboard
          </a>
        </div>

        {/* Main Content */}
        {!emergencyReported ? (
          // Emergency Report Section
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Emergency Button */}
            <Card className="p-8 bg-slate-800 border-slate-700 flex flex-col justify-center items-center rounded-xl">
              <div className="mb-6 w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center animate-pulse">
                <AlertCircle className="w-12 h-12 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-center">Report Emergency</h2>
              <p className="text-slate-400 text-center mb-8">
                Click the button below to report an emergency and get immediate assistance from nearby doctors and ambulances.
              </p>
              <Button
                onClick={handleReportEmergency}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-6 px-8 text-lg rounded-lg w-full transition-all transform hover:scale-105"
              >
                <AlertCircle className="w-6 h-6 mr-3" />
                REPORT EMERGENCY
              </Button>
              <p className="text-xs text-slate-500 mt-4">Location access required for accurate response</p>
            </Card>

            {/* Status Section */}
            <Card className="p-8 bg-slate-800 border-slate-700 rounded-xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                System Status
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Current Status</p>
                  <p className="text-lg font-semibold text-cyan-400">{status}</p>
                </div>
                {userLocation && (
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Your Location</p>
                    <p className="text-sm font-mono bg-slate-900 p-3 rounded">
                      {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          // Active Emergency Section
          <div className="space-y-8">
            {/* Status Bar */}
            <Card className={`p-4 ${emergencyAccepted ? 'bg-green-600 border-green-500' : 'bg-orange-600 border-orange-500'} rounded-xl`}>
              <p className="text-white font-bold flex items-center gap-2">
                {emergencyAccepted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                {status}
              </p>
            </Card>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Video Call Section */}
              {callActive ? (
                <Card className="lg:col-span-2 p-0 overflow-hidden border-slate-700 bg-slate-800 rounded-xl">
                  <div className="relative bg-black h-96">
                    {/* Remote Video (Doctor) */}
                    <video
                      ref={remoteVideoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                    />
                    
                    {/* Placeholder when no remote video */}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                          <User className="w-12 h-12 text-cyan-400" />
                        </div>
                        <p className="text-lg font-semibold">{doctorName}</p>
                        <p className="text-sm text-green-400">Connected</p>
                      </div>
                    </div>

                    {/* Local Video (Self) - Picture in Picture */}
                    <div className="absolute bottom-4 right-4 w-24 h-32 bg-slate-900 rounded-lg overflow-hidden border-2 border-orange-500">
                      <video
                        ref={localVideoRef}
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                        autoPlay
                        muted
                        playsInline
                      />
                    </div>

                    {/* Doctor Info Overlay */}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-4 py-2 rounded-lg">
                      <p className="text-sm font-semibold">{doctorName}</p>
                      <p className="text-xs text-green-400">Connected</p>
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      <Button
                        onClick={toggleVideo}
                        variant={videoEnabled ? 'default' : 'destructive'}
                        size="lg"
                        className={`rounded-full w-12 h-12 p-0 ${
                          videoEnabled
                            ? 'bg-slate-600 hover:bg-slate-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {videoEnabled ? (
                          <Video className="w-5 h-5" />
                        ) : (
                          <VideoOff className="w-5 h-5" />
                        )}
                      </Button>

                      <Button
                        onClick={toggleAudio}
                        variant={audioEnabled ? 'default' : 'destructive'}
                        size="lg"
                        className={`rounded-full w-12 h-12 p-0 ${
                          audioEnabled
                            ? 'bg-slate-600 hover:bg-slate-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {audioEnabled ? (
                          <Mic className="w-5 h-5" />
                        ) : (
                          <MicOff className="w-5 h-5" />
                        )}
                      </Button>

                      <Button
                        onClick={handleEndCall}
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 rounded-full w-12 h-12 p-0"
                      >
                        <XCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                // Doctor Search Section
                <Card className="lg:col-span-2 p-6 border-slate-700 bg-slate-800 rounded-xl">
                  <h3 className="text-xl font-bold mb-2">Available Doctors</h3>
                  <p className="text-sm text-slate-400 mb-6">
                    {emergencyAccepted 
                      ? 'A doctor has accepted your emergency!'
                      : 'Waiting for a doctor to accept your emergency...'}
                  </p>
                  
                  {!emergencyAccepted && (
                    <div className="flex items-center gap-3 mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                      <p className="text-amber-400 text-sm">
                        Your emergency has been broadcast to all available doctors. Please wait...
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {doctors.length > 0 ? (
                      doctors.map((doctor) => (
                        <div
                          key={doctor.id}
                          className="p-4 bg-slate-700 rounded-lg flex items-center justify-between hover:bg-slate-600 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                              <User className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                              <p className="font-semibold">{doctor.name}</p>
                              <p className="text-sm text-slate-400">{doctor.specialty}</p>
                              {doctor.distance && (
                                <p className="text-xs text-cyan-400">{doctor.distance.toFixed(1)} km away</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-400">{doctor.rating}/5</span>
                            <Button
                              onClick={() => handleRequestDoctor(doctor)}
                              disabled={searching || emergencyAccepted}
                              className="bg-cyan-600 hover:bg-cyan-700 text-white"
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Request
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
                        <p className="text-slate-400">Searching for available doctors...</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Map Section */}
              <Card className="p-0 overflow-hidden border border-slate-700 bg-slate-800 h-96 rounded-xl">
                {userLocation && (
                  <div className="w-full h-full relative">
                    <img
                      src={`https://staticmap.openstreetmap.de/staticmap.php?center=${userLocation.latitude},${userLocation.longitude}&zoom=13&size=400x400&maptype=osmarenderer&markers=${userLocation.latitude},${userLocation.longitude},ol-marker`}
                      alt="Emergency location map"
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-slate-900/80 backdrop-blur rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">Your Location</p>
                        <p className="text-sm font-mono text-cyan-400">
                          {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-green-400">{doctors.length} doctors nearby</span>
                          <span className="text-amber-400">{ambulances.length} ambulances</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Ambulances List */}
            {ambulances.length > 0 && (
              <Card className="p-6 border-slate-700 bg-slate-800 rounded-xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-amber-500" />
                  Nearby Ambulances
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ambulances.map((ambulance) => (
                    <div
                      key={ambulance.id}
                      className="p-4 bg-slate-700 rounded-lg border-l-4 border-amber-500"
                    >
                      <p className="font-semibold mb-2">{ambulance.unit_number}</p>
                      <p className={`text-sm ${ambulance.is_available ? 'text-green-400' : 'text-slate-400'}`}>
                        Status: {ambulance.is_available ? 'Available' : 'Busy'}
                      </p>
                      <p className="text-xs text-cyan-400">ETA: {ambulance.eta_minutes} mins</p>
                      {ambulance.distance && (
                        <p className="text-xs text-slate-500 mt-1">
                          {ambulance.distance.toFixed(1)} km away
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Cancel Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleEndCall}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500/20"
              >
                Cancel Emergency
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
