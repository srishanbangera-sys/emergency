'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Doctor, Ambulance, EmergencyLocation } from './emergency-interface';

interface EmergencyMapProps {
  userLocation: EmergencyLocation;
  doctors: Doctor[];
  ambulances: Ambulance[];
  emergencyReported: boolean;
}

export default function EmergencyMap({
  userLocation,
  doctors,
  ambulances,
  emergencyReported,
}: EmergencyMapProps) {
  const [iconsReady, setIconsReady] = useState(false);
  const [emergencyMarkerIcon, setEmergencyMarkerIcon] = useState<any>(null);
  const [ambulanceMarkerIcon, setAmbulanceMarkerIcon] = useState<any>(null);
  const [doctorMarkerIcon, setDoctorMarkerIcon] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const emergencyIcon = new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNSIgZmlsbD0iI2ZmNmIzNSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSIxNiIgeT0iMjAiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjZmZmIiBhbmNob3I9Im1pZGRsZSI+IUk8L3RleHQ+PC9zdmc+',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const ambulanceIcon = new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB4PSI0IiB5PSI4IiB3aWR0aD0iMzIiIGhlaWdodD0iMjQiIHJ4PSI0IiBmaWxsPSIjMDA0ZTg5IiBzdHJva2U9IiMxZGQxYTEiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjIwIiB5PSIyNCIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxZGQxYTEiIGFuY2hvcj0ibWlkZGxlIj7QmdCYPC90ZXh0Pjwvc3ZnPg==',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });

    const doctorIcon = new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDMyIDQwIj48cmVjdCB4PSI0IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiMxZGQxYTEiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMTYiIHk9IjI0IiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2ZmZiIgYW5jaG9yPSJtaWRkbGUiPisoPC90ZXh0Pjwvc3ZnPg==',
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40],
    });

    setEmergencyMarkerIcon(emergencyIcon);
    setAmbulanceMarkerIcon(ambulanceIcon);
    setDoctorMarkerIcon(doctorIcon);
    setIconsReady(true);
  }, []);

  if (!iconsReady || !emergencyMarkerIcon) {
    return <div className="w-full h-96 bg-slate-700 rounded flex items-center justify-center text-slate-300">Loading map...</div>;
  }

  return (
    <MapContainer center={[userLocation.latitude, userLocation.longitude]} zoom={13} className="h-full w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {/* User Location */}
      <Marker position={[userLocation.latitude, userLocation.longitude]} icon={emergencyMarkerIcon}>
        <Popup>Your Location (Emergency Reported)</Popup>
      </Marker>

      {/* Search Radius Circle */}
      {emergencyReported && (
        <CircleMarker
          center={[userLocation.latitude, userLocation.longitude]}
          radius={10}
          color="#ff6b35"
          fill={true}
          fillColor="#ff6b35"
          fillOpacity={0.1}
        />
      )}

      {/* Ambulances */}
      {ambulances.map((ambulance) => (
        <Marker key={ambulance.id} position={[ambulance.latitude, ambulance.longitude]} icon={ambulanceMarkerIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold">{ambulance.name}</p>
              <p className="text-xs text-gray-600">Status: {ambulance.status}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Doctors */}
      {doctors.map((doctor) => (
        <Marker key={doctor.id} position={[doctor.latitude, doctor.longitude]} icon={doctorMarkerIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold">{doctor.name}</p>
              <p className="text-xs text-gray-600">{doctor.specialty}</p>
              <p className="text-xs text-green-600 mt-1">✓ Available</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
