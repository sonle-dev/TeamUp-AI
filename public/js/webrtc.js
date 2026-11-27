/**
 * TeamUp AI - Real-Time WebRTC Multi-Peer Mesh Manager
 * Connects browsers together via Socket.io signaling & Google STUN
 * Supports Dynamic Camera Acquisition, Screen Sharing & Web Audio Speaking Analysis
 */

class WebRTCManager {
  constructor(socket, roomId, userName, onStreamUpdate, onSpeakingChange) {
    this.socket = socket;
    this.roomId = roomId;
    this.userName = userName;
    this.onStreamUpdate = onStreamUpdate;
    this.onSpeakingChange = onSpeakingChange;

    this.localStream = null;
    this.isMicOn = true;
    this.isCamOn = false;
    this.isScreenSharing = false;
    this.isSpeaking = false;

    // Map: peerId -> RTCPeerConnection
    this.peerConnections = new Map();

    // Google Public STUN Configuration
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    this.audioContext = null;
    this.audioAnalyser = null;
    this.analyzerTimer = null;

    this.setupSocketListeners();
  }

  // Initialize Local Media Stream
  async initLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      // Start with camera off by default (user avatar view)
      this.localStream.getVideoTracks().forEach(t => t.enabled = false);
      this.isCamOn = false;
    } catch (err) {
      console.warn('[WebRTC] Full AV stream not available. Trying audio-only fallback.', err);
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.isCamOn = false;
      } catch (audioErr) {
        console.warn('[WebRTC] No mic available, generating silent dummy audio track.', audioErr);
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const dst = osc.connect(ctx.createMediaStreamDestination());
        osc.start();
        this.localStream = dst.stream;
        this.isCamOn = false;
      }
    }

    // Start Real-Time Speaking Detection
    this.initAudioAnalyzer();

    return this.localStream;
  }

  // Real-Time Audio Level Analyzer using Web Audio API
  initAudioAnalyzer() {
    if (!this.localStream) return;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 256;
      this.audioAnalyser.smoothingTimeConstant = 0.4;
      source.connect(this.audioAnalyser);

      const bufferLength = this.audioAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      if (this.analyzerTimer) clearInterval(this.analyzerTimer);

      this.analyzerTimer = setInterval(() => {
        if (!this.isMicOn || !this.audioAnalyser) {
          if (this.isSpeaking) {
            this.setSpeaking(false);
          }
          return;
        }

        this.audioAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const volumeThreshold = 12; // Sound threshold to trigger speaking pulse

        const active = average > volumeThreshold;
        if (active !== this.isSpeaking) {
          this.setSpeaking(active);
        }
      }, 100);
    } catch (e) {
      console.warn('[WebRTC] Audio Analyzer could not initialize:', e);
    }
  }

  setSpeaking(speaking) {
    this.isSpeaking = speaking;
    if (this.onSpeakingChange) {
      this.onSpeakingChange('local', speaking);
    }
    if (this.socket) {
      this.socket.emit('speaking-state', {
        roomId: this.roomId,
        isSpeaking: speaking
      });
    }
  }

  setupSocketListeners() {
    // 1. You joined room: initiate connections to all existing peers
    this.socket.on('room-joined', async ({ yourId, peers }) => {
      console.log(`[WebRTC] Connected as ${yourId}. Connecting to ${peers.length} existing peer(s)...`);
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

      try {
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
      } catch (err) {
        console.error('[WebRTC] Signaling error handling payload:', err);
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
      console.log(`[WebRTC] Received remote stream from peer ${peerId}`, event.track.kind);
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

  // Toggle Camera (Dynamic Request if track is missing)
  async toggleCam() {
    if (!this.localStream) {
      await this.initLocalStream();
    }

    let videoTrack = this.localStream ? this.localStream.getVideoTracks()[0] : null;

    if (!videoTrack) {
      // Need to dynamically request camera permission & stream
      try {
        const freshStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        videoTrack = freshStream.getVideoTracks()[0];
        this.localStream.addTrack(videoTrack);

        // Replace or add track on all connected peers
        for (const [peerId, pc] of this.peerConnections.entries()) {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            await sender.replaceTrack(videoTrack);
          } else {
            pc.addTrack(videoTrack, this.localStream);
            // Renegotiate offer
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              this.socket.emit('signal', {
                targetId: peerId,
                signalData: pc.localDescription
              });
            } catch (reErr) {
              console.warn('[WebRTC] Renegotiation offer error:', reErr);
            }
          }
        }
        this.isCamOn = true;
      } catch (camErr) {
        console.error('[WebRTC] Failed to access camera:', camErr);
        this.isCamOn = false;
        return { isCamOn: false, stream: this.localStream };
      }
    } else {
      this.isCamOn = !this.isCamOn;
      videoTrack.enabled = this.isCamOn;

      // Update senders
      for (const [peerId, pc] of this.peerConnections.entries()) {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(this.isCamOn ? videoTrack : null);
        }
      }
    }

    // Broadcast Camera state to room
    if (this.socket) {
      this.socket.emit('cam-state', {
        roomId: this.roomId,
        isCamOn: this.isCamOn
      });
    }

    return { isCamOn: this.isCamOn, stream: this.localStream };
  }

  // Toggle Microphone
  toggleMic() {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      this.isMicOn = !this.isMicOn;
      audioTrack.enabled = this.isMicOn;

      if (!this.isMicOn && this.isSpeaking) {
        this.setSpeaking(false);
      }

      if (this.socket) {
        this.socket.emit('mic-state', {
          roomId: this.roomId,
          isMicOn: this.isMicOn
        });
      }

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
        if (sender) {
          sender.replaceTrack(this.isCamOn && videoTrack ? videoTrack : null);
        }
      });
    }
    this.isScreenSharing = false;
  }
}

window.WebRTCManager = WebRTCManager;
