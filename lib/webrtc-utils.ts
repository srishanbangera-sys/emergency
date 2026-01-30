import SimplePeer from 'simple-peer';

export interface WebRTCConfig {
  initiator: boolean;
  trickleIce?: boolean;
  stream?: MediaStream;
  config?: {
    iceServers: Array<{ urls: string[] }>;
  };
}

export const createPeerConnection = (config: WebRTCConfig): SimplePeer.Instance => {
  return new SimplePeer({
    initiator: config.initiator,
    trickleIce: config.trickleIce !== false,
    stream: config.stream,
    config: config.config || {
      iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
    },
  });
};

export const getMediaStream = async (
  constraints: MediaStreamConstraints = {
    video: { width: 1280, height: 720 },
    audio: true,
  }
): Promise<MediaStream> => {
  return await navigator.mediaDevices.getUserMedia(constraints);
};

export const stopMediaStream = (stream: MediaStream | null) => {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
};

export const toggleVideoTrack = (stream: MediaStream | null, enabled: boolean) => {
  if (stream) {
    stream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }
};

export const toggleAudioTrack = (stream: MediaStream | null, enabled: boolean) => {
  if (stream) {
    stream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }
};

export const attachStreamToVideo = (video: HTMLVideoElement | null, stream: MediaStream) => {
  if (video) {
    video.srcObject = stream;
  }
};

export const destroyPeerConnection = (peer: SimplePeer.Instance | null) => {
  if (peer) {
    peer.destroy();
  }
};
