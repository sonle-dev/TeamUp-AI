/**
 * TeamUp AI - WebRTC Multi-Peer Mesh Signaling & Room Management
 */

module.exports = function setupSignaling(io) {
  // Store rooms: { [roomId]: { members: Map<socketId, { name, role, streamId }>, pomoState: { ... } } }
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // User joins a room
    socket.on('join-room', ({ roomId, userName, userRole }) => {
      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          members: new Map(),
          tasks: [],
          pomoState: { seconds: 25 * 60, isRunning: false }
        });
      }

      const room = rooms.get(roomId);
      const memberInfo = {
        id: socket.id,
        name: userName || 'Thành viên mới',
        role: userRole || 'Developer',
        joinedAt: Date.now()
      };

      room.members.set(socket.id, memberInfo);

      // 1. Notify the new user of all existing peers in the room
      const existingPeers = Array.from(room.members.entries())
        .filter(([id]) => id !== socket.id)
        .map(([id, info]) => info);

      socket.emit('room-joined', {
        roomId,
        yourId: socket.id,
        peers: existingPeers,
        tasks: room.tasks,
        pomoState: room.pomoState
      });

      // 2. Broadcast to all existing peers in room that a new peer joined
      socket.to(roomId).emit('peer-joined', memberInfo);

      console.log(`[Room ${roomId}] User ${memberInfo.name} (${socket.id}) joined. Total: ${room.members.size}`);
    });

    // Relay WebRTC signaling messages (SDP Offer, SDP Answer, ICE Candidate)
    socket.on('signal', ({ targetId, signalData }) => {
      io.to(targetId).emit('signal', {
        senderId: socket.id,
        signalData
      });
    });

    // Synchronize Pomodoro Timer across the room
    socket.on('sync-pomodoro', ({ roomId, action, seconds, isRunning }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.pomoState = { seconds, isRunning };
        socket.to(roomId).emit('pomodoro-updated', { action, seconds, isRunning, by: socket.id });
      }
    });

    // Broadcast Floating Emoji Reaction
    socket.on('send-reaction', ({ roomId, emoji, senderName }) => {
      socket.to(roomId).emit('reaction-received', {
        emoji,
        senderName: senderName || 'Thành viên',
        senderId: socket.id
      });
    });

    // Broadcast Kanban Board Changes
    socket.on('update-kanban', ({ roomId, tasks }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.tasks = tasks;
        socket.to(roomId).emit('kanban-synced', tasks);
      }
    });

    // Active Speaker Volume / Speaking State Broadcast
    socket.on('speaking-state', ({ roomId, isSpeaking }) => {
      socket.to(roomId).emit('peer-speaking-state', {
        peerId: socket.id,
        isSpeaking: !!isSpeaking
      });
    });

    // Camera On/Off State Broadcast
    socket.on('cam-state', ({ roomId, isCamOn }) => {
      socket.to(roomId).emit('peer-cam-state', {
        peerId: socket.id,
        isCamOn: !!isCamOn
      });
    });

    // Microphone On/Off State Broadcast
    socket.on('mic-state', ({ roomId, isMicOn }) => {
      socket.to(roomId).emit('peer-mic-state', {
        peerId: socket.id,
        isMicOn: !!isMicOn
      });
    });

    // User leaves / disconnects
    socket.on('disconnecting', () => {
      for (const roomId of socket.rooms) {
        if (rooms.has(roomId)) {
          const room = rooms.get(roomId);
          const memberInfo = room.members.get(socket.id);
          room.members.delete(socket.id);

          socket.to(roomId).emit('peer-left', {
            peerId: socket.id,
            name: memberInfo ? memberInfo.name : 'Thành viên'
          });

          if (room.members.size === 0) {
            rooms.delete(roomId);
            console.log(`[Room ${roomId}] Empty room cleaned up.`);
          }
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
};
