/**
 * TeamUp AI - Real-Time WebRTC Multi-Peer Mesh Manager
 * Connects browsers together via Socket.io signaling & Google STUN
 */

class WebRTCManager {
  constructor(socket, roomId, userName, onStreamUpdate) {
    this.socket = socket;
    this.roomId = roomId;
    this.userName = userName;
    this.onStreamUpdate = onStreamUpdate;

    this.localStream = null;
    this.isMicOn = true;
    this.isCamOn = false;
    this.isScreenSharing = false;

    // Map: peerId -> RTCPeerConnection
    this.peerConnections = new Map();

    // Google Public STUN Configuration
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.setupSocketListeners();
  }

  // Initialize Local Media Stream
  async initLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      // Start with camera off by default (user avatar)
      this.localStream.getVideoTracks().forEach(t => t.enabled = false);
      this.isCamOn = false;
      return this.localStream;
    } catch (err) {
      console.warn('[WebRTC] Camera/Mic not found or permission denied. Using audio-only or fallback stream.', err);
      // Try audio only fallback
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (audioErr) {
        // Create dummy silence stream if no devices
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const dst = osc.connect(ctx.createMediaStreamDestination());
        osc.start();
        this.localStream = dst.stream;
      }
      return this.localStream;
    }
  }

  setupSocketListeners() {
    // 1. You joined room: initiate connections to all existing peers
    this.socket.on('room-joined', async ({ yourId, peers }) => {
      console.log(`[WebRTC] Connected to room as ${yourId}. Connecting to ${peers.length} existing peers...`);
      for (const peer of peers) {
        await this.createPeerConnection(peer.id, true);
      }
    });

    // 2. New peer joined: prepare to receive offer
    this.socket.on('peer-joined', async (peer) => {
      console.log(`[WebRTC] Peer joined: ${peer.name} (${peer.id})`);
      await this.createPeerConnection(peer.id, false);
    });

    // 3. Signaling message received (Offer, Answer, ICE Candidate)
    this.socket.on('signal', async ({ senderId, signalData }) => {
      let pc = this.peerConnections.get(senderId);
      if (!pc) {
        pc = await this.createPeerConnection(senderId, false);
      }

      if (signalData.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.socket.emit('signal', {
          targetId: senderId,
          signalData: pc.localDescription
        });
      } else if (signalData.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData));
      } else if (signalData.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        } catch (e) {
          console.warn('[WebRTC] Error adding ICE candidate:', e);
        }
      }
    });

    // 4. Peer disconnected
    this.socket.on('peer-left', ({ peerId, name }) => {
      console.log(`[WebRTC] Peer left: ${name} (${peerId})`);
      const pc = this.peerConnections.get(peerId);
      if (pc) {
        pc.close();
        this.peerConnections.delete(peerId);
      }
      if (this.onStreamUpdate) {
        this.onStreamUpdate('remove', peerId);
      }
    });
  }

  // Create RTCPeerConnection for a specific peer
  async createPeerConnection(peerId, isInitiator) {
    if (this.peerConnections.has(peerId)) {
      return this.peerConnections.get(peerId);
    }

    const pc = new RTCPeerConnection(this.iceServers);
    this.peerConnections.set(peerId, pc);

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('signal', {
          targetId: peerId,
          signalData: { candidate: event.candidate }
        });
      }
    };

    // Remote Track handler (Audio/Video from peer)
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote stream from peer ${peerId}`);
      if (this.onStreamUpdate) {
        this.onStreamUpdate('add', peerId, event.streams[0]);
      }
    };

    // If initiator, create and send Offer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.socket.emit('signal', {
          targetId: peerId,
          signalData: pc.localDescription
        });
      } catch (err) {
        console.error('[WebRTC] Error creating offer:', err);
      }
    }

    return pc;
  }

  // Toggle Camera
  toggleCam() {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      this.isCamOn = !this.isCamOn;
      videoTrack.enabled = this.isCamOn;
      return this.isCamOn;
    }
    return false;
  }

  // Toggle Microphone
  toggleMic() {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      this.isMicOn = !this.isMicOn;
      audioTrack.enabled = this.isMicOn;
      return this.isMicOn;
    }
    return false;
  }

  // Toggle Screen Share
  async toggleScreenShare() {
    if (!this.isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace track on all active peer connections
        this.peerConnections.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          this.stopScreenShare();
        };

        this.isScreenSharing = true;
        return { isSharing: true, stream: screenStream };
      } catch (err) {
        console.warn('[WebRTC] Screen share cancelled or rejected:', err);
        return { isSharing: false };
      }
    } else {
      this.stopScreenShare();
      return { isSharing: false };
    }
  }

  stopScreenShare() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      this.peerConnections.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });
    }
    this.isScreenSharing = false;
  }
}

window.WebRTCManager = WebRTCManager;
