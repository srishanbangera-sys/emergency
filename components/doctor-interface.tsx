'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  AlertCircle,
  Phone,
  PhoneOff,
  MapPin,
  User,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Activity,
  Heart,
  Stethoscope,
  Send,
  CheckCircle,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// First Aid Instructions Database
const FIRST_AID_INSTRUCTIONS = {
  cpr: {
    title: 'CPR (Cardiopulmonary Resuscitation)',
    steps: [
      'Check if the scene is safe before approaching the victim.',
      'Tap the victim and shout "Are you okay?" to check responsiveness.',
      'Call emergency services (911) or ask someone nearby to call.',
      'Place the heel of one hand on the center of the chest, between the nipples.',
      'Place your other hand on top and interlace your fingers.',
      'Keep your arms straight and shoulders directly above your hands.',
      'Push hard and fast - at least 2 inches deep, 100-120 compressions per minute.',
      'After 30 compressions, give 2 rescue breaths (if trained).',
      'Continue the cycle of 30 compressions and 2 breaths until help arrives.',
    ],
    icon: Heart,
  },
  choking: {
    title: 'Choking (Heimlich Maneuver)',
    steps: [
      'Ask the person "Are you choking?" If they can\'t speak, cough, or breathe, proceed.',
      'Stand behind the person and wrap your arms around their waist.',
      'Make a fist with one hand and place it just above the navel.',
      'Grasp your fist with your other hand.',
      'Give quick, upward thrusts into the abdomen.',
      'Repeat until the object is expelled or the person becomes unconscious.',
      'If unconscious, lower them to the ground and begin CPR.',
    ],
    icon: Activity,
  },
  bleeding: {
    title: 'Severe Bleeding Control',
    steps: [
      'Put on gloves if available to protect yourself.',
      'Apply direct pressure to the wound with a clean cloth or bandage.',
      'If blood soaks through, add more layers - do not remove the first cloth.',
      'Elevate the injured area above heart level if possible.',
      'Apply a pressure bandage by wrapping firmly.',
      'For life-threatening limb bleeding, apply a tourniquet 2-3 inches above the wound.',
      'Note the time the tourniquet was applied.',
      'Keep the victim calm and warm to prevent shock.',
    ],
    icon: Activity,
  },
  burns: {
    title: 'Burn Treatment',
    steps: [
      'Remove the person from the source of the burn.',
      'Cool the burn with cool (not cold) running water for 10-20 minutes.',
      'Do NOT use ice, butter, or toothpaste on the burn.',
      'Remove jewelry or tight clothing near the burned area.',
      'Cover the burn with a sterile, non-stick bandage.',
      'Do not break blisters.',
      'Give over-the-counter pain medication if needed.',
      'Seek medical attention for severe or large burns.',
    ],
    icon: Activity,
  },
  fracture: {
    title: 'Fracture/Broken Bone',
    steps: [
      'Do not move the injured area unless absolutely necessary.',
      'Immobilize the injured limb in the position you find it.',
      'Apply ice wrapped in cloth to reduce swelling.',
      'For an open fracture, cover the wound with a clean bandage.',
      'Create a splint using rigid materials (boards, magazines) padded with cloth.',
      'Secure the splint above and below the injury.',
      'Check circulation below the injury (color, warmth, sensation).',
      'Keep the person calm and still until help arrives.',
    ],
    icon: Activity,
  },
  heartAttack: {
    title: 'Heart Attack Response',
    steps: [
      'Have the person sit down and rest in a comfortable position.',
      'Loosen any tight clothing.',
      'Ask if they take heart medication (like nitroglycerin) and help them take it.',
      'Give aspirin (325mg) if not allergic - have them chew it slowly.',
      'Call emergency services immediately.',
      'Monitor their breathing and be prepared to perform CPR.',
      'Do not leave the person alone.',
      'Keep them calm and reassure them help is coming.',
    ],
    icon: Heart,
  },
  stroke: {
    title: 'Stroke Response (FAST)',
    steps: [
      'F - Face: Ask the person to smile. Does one side droop?',
      'A - Arms: Ask them to raise both arms. Does one drift downward?',
      'S - Speech: Ask them to repeat a simple phrase. Is their speech slurred?',
      'T - Time: If you observe any of these signs, call 911 immediately.',
      'Note the time when symptoms first appeared.',
      'Keep the person lying down with head slightly elevated.',
      'Do not give them anything to eat or drink.',
      'Keep them calm and monitor their condition until help arrives.',
    ],
    icon: Activity,
  },
  seizure: {
    title: 'Seizure Response',
    steps: [
      'Clear the area of any hard or sharp objects.',
      'Do NOT restrain the person or put anything in their mouth.',
      'Gently guide them to the floor if standing.',
      'Place something soft under their head.',
      'Turn them on their side to prevent choking.',
      'Time the seizure - call 911 if it lasts more than 5 minutes.',
      'Stay with them until they are fully conscious.',
      'Speak calmly and reassuringly as they recover.',
    ],
    icon: Activity,
  },
};

interface IncomingCall {
  callSessionId: string;
  emergencyId: string;
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  text: string;
  timestamp: Date;
  type: 'text' | 'instruction';
  instructionKey?: string;
}

export default function DoctorInterface() {
  const [isOnline, setIsOnline] = useState(false);
  const [doctorId, setDoctorId] = useState('doc1');
  const [doctorName, setDoctorName] = useState('Dr. Sarah Johnson');
  const [incomingCalls, setIncomingCalls] = useState<IncomingCall[]>([]);
  const [activeCall, setActiveCall] = useState<IncomingCall | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [status, setStatus] = useState('Offline');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFirstAid, setSelectedFirstAid] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Initialize WebSocket connection
  const connectToServer = useCallback(() => {
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setStatus('Connected to server');
      socket.emit('doctor:register', { id: doctorId, name: doctorName });
    });

    socket.on('doctor:registered', (data) => {
      if (data.success) {
        setIsOnline(true);
        setStatus('Online - Ready to receive calls');
      }
    });

    socket.on('doctor:incomingCall', (data: IncomingCall) => {
      setIncomingCalls((prev) => [...prev, { ...data, timestamp: new Date() }]);
      setStatus('Incoming emergency call!');
    });

    socket.on('webrtc:offer', async (data) => {
      if (peerRef.current && data.offer) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.emit('webrtc:answer', {
          callSessionId: data.callSessionId,
          answer,
          fromRole: 'doctor',
        });
      }
    });

    socket.on('webrtc:iceCandidate', (data) => {
      if (peerRef.current && data.candidate) {
        peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    socket.on('call:ended', () => {
      handleEndCall();
    });

    socket.on('chat:message', (data: { message: ChatMessage }) => {
      setChatMessages((prev) => [...prev, data.message]);
    });

    socket.on('disconnect', () => {
      setIsOnline(false);
      setStatus('Disconnected from server');
    });

    socketRef.current = socket;
  }, [doctorId, doctorName]);

  // Go online/offline
  const toggleOnlineStatus = () => {
    if (isOnline) {
      socketRef.current?.disconnect();
      setIsOnline(false);
      setStatus('Offline');
    } else {
      connectToServer();
    }
  };

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
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setStatus('Unable to access camera/microphone');
    }
  };

  // Initialize WebRTC
  const initializeWebRTC = () => {
    try {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };

      const peerConnection = new RTCPeerConnection(configuration);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStreamRef.current!);
        });
      }

      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtc:iceCandidate', {
            callSessionId: activeCall?.callSessionId,
            candidate: event.candidate,
            fromRole: 'doctor',
          });
        }
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
          setStatus('Video call connected with patient');
        } else if (peerConnection.connectionState === 'failed') {
          setStatus('Video call connection failed');
        }
      };

      peerRef.current = peerConnection;
    } catch (err) {
      console.error('WebRTC initialization error:', err);
    }
  };

  // Accept incoming call
  const handleAcceptCall = async (call: IncomingCall) => {
    setActiveCall(call);
    setIncomingCalls((prev) => prev.filter((c) => c.callSessionId !== call.callSessionId));
    
    await initializeVideoStream();
    initializeWebRTC();
    
    socketRef.current?.emit('doctor:acceptCall', { callSessionId: call.callSessionId });
    setCallActive(true);
    setStatus('Call accepted - connecting...');
    
    // Add welcome message
    setChatMessages([
      {
        id: `msg_${Date.now()}`,
        sender: 'doctor',
        text: `Hello, I'm ${doctorName}. I'm here to help you. Please describe the emergency situation.`,
        timestamp: new Date(),
        type: 'text',
      },
    ]);
  };

  // Reject incoming call
  const handleRejectCall = (call: IncomingCall) => {
    socketRef.current?.emit('doctor:rejectCall', { callSessionId: call.callSessionId });
    setIncomingCalls((prev) => prev.filter((c) => c.callSessionId !== call.callSessionId));
  };

  // End call
  const handleEndCall = () => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    
    if (activeCall) {
      socketRef.current?.emit('call:end', { callSessionId: activeCall.callSessionId });
    }
    
    setCallActive(false);
    setActiveCall(null);
    setChatMessages([]);
    setSelectedFirstAid(null);
    setStatus('Online - Ready to receive calls');
  };

  // Toggle video/audio
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Send chat message
  const sendMessage = () => {
    if (!messageInput.trim() || !activeCall) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'doctor',
      text: messageInput,
      timestamp: new Date(),
      type: 'text',
    };

    setChatMessages((prev) => [...prev, message]);
    socketRef.current?.emit('chat:message', {
      callSessionId: activeCall.callSessionId,
      message,
    });
    setMessageInput('');
  };

  // Send first aid instructions
  const sendFirstAidInstructions = (key: string) => {
    if (!activeCall) return;

    const instruction = FIRST_AID_INSTRUCTIONS[key as keyof typeof FIRST_AID_INSTRUCTIONS];
    if (!instruction) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'doctor',
      text: `📋 **${instruction.title}**\n\n${instruction.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`,
      timestamp: new Date(),
      type: 'instruction',
      instructionKey: key,
    };

    setChatMessages((prev) => [...prev, message]);
    socketRef.current?.emit('chat:message', {
      callSessionId: activeCall.callSessionId,
      message,
    });
    setSelectedFirstAid(key);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-1">Doctor Dashboard</h1>
            <p className="text-slate-400">Emergency Response System - Medical Professional Portal</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-cyan-400" />
              <span className="font-medium">{doctorName}</span>
            </div>
            <Button
              onClick={toggleOnlineStatus}
              className={`${
                isOnline
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-slate-600 hover:bg-slate-700'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-300 animate-pulse' : 'bg-slate-400'}`} />
              {isOnline ? 'Online' : 'Go Online'}
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        <Card className="p-3 mb-6 bg-slate-800/50 border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-slate-300">Status: {status}</span>
            </div>
            {incomingCalls.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {incomingCalls.length} Incoming Call{incomingCalls.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </Card>

        {/* Main Content */}
        {!callActive ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incoming Calls Panel */}
            <Card className="p-6 bg-slate-800 border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-orange-500" />
                Incoming Emergency Calls
              </h2>
              
              {incomingCalls.length > 0 ? (
                <div className="space-y-4">
                  {incomingCalls.map((call) => (
                    <div
                      key={call.callSessionId}
                      className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg animate-pulse"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-orange-500" />
                          <span className="font-semibold text-orange-400">Emergency Call</span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {call.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-slate-300 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>
                            Location: {call.latitude.toFixed(4)}, {call.longitude.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAcceptCall(call)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleRejectCall(call)}
                          variant="destructive"
                          className="flex-1"
                        >
                          <PhoneOff className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No incoming calls</p>
                  <p className="text-sm mt-1">
                    {isOnline
                      ? 'Waiting for emergency calls...'
                      : 'Go online to receive calls'}
                  </p>
                </div>
              )}
            </Card>

            {/* Quick Reference Panel */}
            <Card className="p-6 bg-slate-800 border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                First Aid Quick Reference
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(FIRST_AID_INSTRUCTIONS).map(([key, instruction]) => {
                  const IconComponent = instruction.icon;
                  return (
                    <button
                      key={key}
                      className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left transition-colors"
                      onClick={() => setSelectedFirstAid(selectedFirstAid === key ? null : key)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <IconComponent className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-medium">{instruction.title}</span>
                      </div>
                      <p className="text-xs text-slate-400">{instruction.steps.length} steps</p>
                    </button>
                  );
                })}
              </div>

              {selectedFirstAid && (
                <div className="mt-4 p-4 bg-slate-700 rounded-lg">
                  <h3 className="font-bold text-cyan-400 mb-2">
                    {FIRST_AID_INSTRUCTIONS[selectedFirstAid as keyof typeof FIRST_AID_INSTRUCTIONS].title}
                  </h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-slate-300">
                    {FIRST_AID_INSTRUCTIONS[selectedFirstAid as keyof typeof FIRST_AID_INSTRUCTIONS].steps.map(
                      (step, index) => (
                        <li key={index} className="leading-relaxed">{step}</li>
                      )
                    )}
                  </ol>
                </div>
              )}
            </Card>
          </div>
        ) : (
          // Active Call Interface
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Call Section */}
            <Card className="lg:col-span-2 p-0 overflow-hidden border-slate-700 bg-slate-800">
              <div className="relative bg-black h-[400px] md:h-[500px]">
                {/* Remote Video (Patient) */}
                <video
                  ref={remoteVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />

                {/* Local Video (Self) */}
                <div className="absolute bottom-4 right-4 w-32 h-24 md:w-40 md:h-30 bg-slate-900 rounded-lg overflow-hidden border-2 border-cyan-500">
                  <video
                    ref={localVideoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                </div>

                {/* Patient Info Overlay */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-semibold">Emergency Patient</span>
                  </div>
                  <p className="text-xs text-green-400">Connected</p>
                  {activeCall && (
                    <p className="text-xs text-slate-400 mt-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {activeCall.latitude.toFixed(4)}, {activeCall.longitude.toFixed(4)}
                    </p>
                  )}
                </div>

                {/* Video Controls */}
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

            {/* Chat & First Aid Panel */}
            <Card className="p-0 border-slate-700 bg-slate-800 flex flex-col h-[500px]">
              <Tabs defaultValue="chat" className="flex flex-col h-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 rounded-none">
                  <TabsTrigger value="chat" className="data-[state=active]:bg-cyan-600">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="firstaid" className="data-[state=active]:bg-cyan-600">
                    <Heart className="w-4 h-4 mr-2" />
                    First Aid
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] p-3 rounded-lg ${
                              msg.sender === 'doctor'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-700 text-slate-200'
                            } ${msg.type === 'instruction' ? 'bg-green-700' : ''}`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {msg.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-3 border-t border-slate-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-700 border-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <Button onClick={sendMessage} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="firstaid" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full p-4">
                    <p className="text-sm text-slate-400 mb-3">
                      Click to send instructions to patient:
                    </p>
                    <div className="space-y-2">
                      {Object.entries(FIRST_AID_INSTRUCTIONS).map(([key, instruction]) => {
                        const IconComponent = instruction.icon;
                        return (
                          <button
                            key={key}
                            onClick={() => sendFirstAidInstructions(key)}
                            className={`w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3 ${
                              selectedFirstAid === key
                                ? 'bg-green-600 text-white'
                                : 'bg-slate-700 hover:bg-slate-600'
                            }`}
                          >
                            <IconComponent className="w-5 h-5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{instruction.title}</p>
                              <p className="text-xs opacity-70">{instruction.steps.length} steps</p>
                            </div>
                            {selectedFirstAid === key && (
                              <CheckCircle className="w-4 h-4 ml-auto" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
