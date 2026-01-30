'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle, Phone, MapPin, User, Video, XCircle, Mic, MicOff, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Mock data for doctors and ambulances
const MOCK_DOCTORS: Doctor[] = [
  { id: 'doc1', name: 'Dr. Sarah Johnson', specialty: 'Emergency Medicine', latitude: 37.7749, longitude: -122.4194, isAvailable: true },
  { id: 'doc2', name: 'Dr. Michael Chen', specialty: 'Cardiology', latitude: 37.7751, longitude: -122.4180, isAvailable: true },
  { id: 'doc3', name: 'Dr. Emma Williams', specialty: 'Trauma Surgery', latitude: 37.7745, longitude: -122.4190, isAvailable: false },
];

const MOCK_AMBULANCES: Ambulance[] = [
  { id: 'amb1', name: 'Ambulance 1', latitude: 37.7740, longitude: -122.4200, status: 'Available' },
  { id: 'amb2', name: 'Ambulance 2', latitude: 37.7760, longitude: -122.4190, status: 'Available' },
  { id: 'amb3', name: 'Ambulance 3', latitude: 37.7750, longitude: -122.4170, status: 'En Route' },
];

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
  isAvailable: boolean;
}

export interface Ambulance {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
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

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

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
        (error) => {
          console.log('Using default location for demo');
          // Default location for demo (San Francisco)
          setUserLocation({
            latitude: 37.7749,
            longitude: -122.4194,
          });
        }
      );
    }
  }, []);

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
      setStatus('Video stream initialized');
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
    
    // Initialize video stream
    await initializeVideoStream();

    // Simulate loading nearby ambulances and doctors
    setTimeout(() => {
      setDoctors(MOCK_DOCTORS.filter(d => d.isAvailable));
      setAmbulances(MOCK_AMBULANCES);
      setStatus('Found nearby doctors and ambulances');
    }, 1500);
  };

  // Handle consulting doctor
  const handleConsultDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSearching(true);
    setStatus(`Calling Dr. ${doctor.name}...`);
    setDoctorName(doctor.name);

    // Simulate doctor accepting call
    setTimeout(() => {
      setStatus(`Dr. ${doctor.name} is joining the video call...`);
      setCallActive(true);
      initializeWebRTC();
    }, 2000);
  };

  // Simulate WebRTC connection (demo mode)
  const initializeWebRTC = () => {
    // In a real application, this would establish a WebRTC connection
    // For demo purposes, we simulate the connection
    console.log('Simulating video call connection...');
    setStatus('Video call connected (demo mode)');
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
  const handleEndCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setCallActive(false);
    setDoctorName(null);
    setEmergencyReported(false);
    setSearching(false);
    setStatus('Call ended');
    setSelectedDoctor(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">Emergency Response System</h1>
          <p className="text-slate-400">Real-time emergency medical dispatch with doctor consultation</p>
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
            <Card className="p-4 bg-orange-600 border-orange-500 rounded-xl">
              <p className="text-white font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Emergency Active: {status}
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

                    {/* Local Video (Self) - Picture in Picture */}
                    <div className="absolute bottom-4 right-4 w-24 h-32 bg-slate-900 rounded-lg overflow-hidden border-2 border-orange-500">
                      <video
                        ref={localVideoRef}
                        className="w-full h-full object-cover mirror"
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
                  <h3 className="text-xl font-bold mb-6">Available Doctors</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
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
                            </div>
                          </div>
                          <Button
                            onClick={() => handleConsultDoctor(doctor)}
                            disabled={searching}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-center py-8">
                        Searching for available doctors...
                      </p>
                    )}
                  </div>
                </Card>
              )}

              {/* Map Section */}
              <Card className="p-0 overflow-hidden border border-slate-700 bg-slate-800 h-96 rounded-xl">
                {userLocation && (
                  <div className="w-full h-full relative">
                    {/* Static Map using OpenStreetMap tiles */}
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
                  Nearby Ambulances (Within 10km)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ambulances.map((ambulance) => (
                    <div
                      key={ambulance.id}
                      className="p-4 bg-slate-700 rounded-lg border-l-4 border-amber-500"
                    >
                      <p className="font-semibold mb-2">{ambulance.name}</p>
                      <p className={`text-sm ${
                        ambulance.status === 'Available'
                          ? 'text-green-400'
                          : ambulance.status === 'En Route'
                          ? 'text-cyan-400'
                          : 'text-slate-400'
                      }`}>
                        Status: {ambulance.status}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Coordinates: {ambulance.latitude.toFixed(4)}, {ambulance.longitude.toFixed(4)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
