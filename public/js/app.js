/**
 * TeamUp AI - Core Application Orchestrator
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Parse Room ID & User Info from URL or Authenticated Session
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room') || 'teamup-dev-warroom';

  let savedUser = null;
  try {
    const raw = localStorage.getItem('teamup_user');
    if (raw) savedUser = JSON.parse(raw);
  } catch (e) {}

  const userName = urlParams.get('name') || (savedUser ? savedUser.name : 'Sơn Lê');
  const userRole = urlParams.get('role') || (savedUser ? savedUser.role : 'Team Leader');

  const roomTitleEl = document.getElementById('roomTitleDisplay');
  if (roomTitleEl) roomTitleEl.innerText = roomId;

  const bottomCodeEl = document.getElementById('bottomMeetingCode');
  if (bottomCodeEl) bottomCodeEl.innerText = roomId;

  // Helper: Initials calculation (e.g. "Đức Nguyễn" -> "ĐN")
  function getInitials(name) {
    if (!name) return 'TU';
    const clean = name.replace(/\(.*?\)/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'TU';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Helper: Vibrant gradient palette for avatars
  const avatarGradients = [
    'bg-gradient-to-tr from-cyan-600 to-blue-600',
    'bg-gradient-to-tr from-amber-600 to-rose-600',
    'bg-gradient-to-tr from-emerald-600 to-teal-600',
    'bg-gradient-to-tr from-purple-600 to-indigo-600',
    'bg-gradient-to-tr from-fuchsia-600 to-pink-600',
    'bg-gradient-to-tr from-indigo-600 to-violet-600'
  ];
  function getAvatarGradient(id) {
    let hash = 0;
    for (let i = 0; i < (id || '').length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % avatarGradients.length;
    return avatarGradients[idx];
  }

  // Update Local User Tile in UI
  const localInitialsEl = document.getElementById('localInitials');
  if (localInitialsEl) localInitialsEl.innerText = getInitials(userName);

  const localUserTagEl = document.getElementById('localUserTag');
  if (localUserTagEl) localUserTagEl.innerText = `${userName} (Bạn - ${userRole})`;

  // 2. Connect to Socket.io Signaling Server
  const socket = io();

  // 3. Initialize Modules
  const settings = new SettingsManager();
  window.settings = settings;

  const copilot = new CopilotEngine();
  window.copilot = copilot;

  const kanban = new KanbanBoard(socket, roomId, 'cardsContainer');
  window.kanban = kanban;

  // 4. Remote Peers & Streams Manager
  const videoStage = document.getElementById('videoStage');
  const copilotTile = document.getElementById('copilotTile');
  const remoteTiles = new Map(); // peerId -> element
  const peerMetadata = new Map(); // peerId -> { id, name, role }

  // Callback when local speaking state changes
  const onSpeakingChange = (target, isSpeaking) => {
    if (target === 'local') {
      const localTile = document.getElementById('localTile');
      if (localTile) {
        localTile.classList.toggle('is-speaking', isSpeaking);
      }
    }
  };

  const onStreamUpdate = (action, peerId, stream) => {
    if (action === 'add') {
      let tile = remoteTiles.get(peerId);
      const info = peerMetadata.get(peerId) || { name: `Thành viên (${peerId.slice(0, 5)})`, role: 'Thành viên' };
      const initials = getInitials(info.name);
      const gradient = getAvatarGradient(peerId);

      if (!tile) {
        tile = document.createElement('div');
        tile.className = 'tile group';
        tile.id = `peer-tile-${peerId}`;
        tile.innerHTML = `
          <video autoplay playsinline class="w-full h-full object-cover hidden"></video>

          <div class="peer-avatar flex flex-col items-center justify-center gap-3">
            <div class="w-24 h-24 rounded-full ${gradient} flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4" style="ring-color: var(--border-color);">
              ${initials}
            </div>
            <div class="flex items-center gap-1.5 text-xs" style="color: var(--text-sub);">
              <span class="px-2 py-0.5 rounded font-mono text-[10px] border text-primary-var bg-primary-light" style="border-color: var(--primary-border);">${info.role}</span>
            </div>
            <span class="text-xs font-medium peer-cam-status" style="color: var(--text-sub);">Camera đang tắt</span>
          </div>

          <div class="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs text-white">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="peer-name">${info.name}</span>
            <i class="peer-mic-icon fa-solid fa-microphone text-[10px] text-slate-300 ml-1"></i>
          </div>
        `;

        if (copilotTile && copilotTile.parentNode === videoStage) {
          videoStage.insertBefore(tile, copilotTile);
        } else {
          videoStage.appendChild(tile);
        }
        remoteTiles.set(peerId, tile);
      }

      const video = tile.querySelector('video');
      const avatar = tile.querySelector('.peer-avatar');
      if (video && stream) {
        video.srcObject = stream;

        const syncStreamState = () => {
          const peerInfo = peerMetadata.get(peerId);
          const isCamOn = peerInfo ? !!peerInfo.isCamOn : false;
          if (isCamOn) {
            video.classList.remove('hidden');
            if (avatar) avatar.classList.add('hidden');
          } else {
            video.classList.add('hidden');
            if (avatar) avatar.classList.remove('hidden');
          }
        };

        syncStreamState();
      }
    } else if (action === 'remove') {
      const tile = remoteTiles.get(peerId);
      if (tile) {
        tile.remove();
        remoteTiles.delete(peerId);
      }
      peerMetadata.delete(peerId);
    }
  };

  // 5. Initialize WebRTC Manager
  const webrtc = new WebRTCManager(socket, roomId, userName, onStreamUpdate, onSpeakingChange);
  window.webrtc = webrtc;
  await webrtc.initLocalStream();

  // Socket: User Metadata & Speaking/Camera Synchronization
  socket.on('room-joined', ({ yourId, peers }) => {
    peers.forEach(p => peerMetadata.set(p.id, p));
  });

  socket.on('peer-joined', (peer) => {
    peerMetadata.set(peer.id, peer);
  });

  // Real-Time Active Speaker Visual Indicator
  socket.on('peer-speaking-state', ({ peerId, isSpeaking }) => {
    const tile = document.getElementById(`peer-tile-${peerId}`);
    if (tile) {
      tile.classList.toggle('is-speaking', !!isSpeaking);
    }
  });

  // Real-Time Peer Camera Toggle Synchronization
  socket.on('peer-cam-state', ({ peerId, isCamOn }) => {
    const info = peerMetadata.get(peerId);
    if (info) info.isCamOn = !!isCamOn;

    const tile = document.getElementById(`peer-tile-${peerId}`);
    if (tile) {
      const video = tile.querySelector('video');
      const avatar = tile.querySelector('.peer-avatar');
      if (isCamOn) {
        if (video) video.classList.remove('hidden');
        if (avatar) avatar.classList.add('hidden');
      } else {
        if (video) video.classList.add('hidden');
        if (avatar) avatar.classList.remove('hidden');
      }
    }
  });

  // Real-Time Peer Microphone Toggle Synchronization
  socket.on('peer-mic-state', ({ peerId, isMicOn }) => {
    const tile = document.getElementById(`peer-tile-${peerId}`);
    if (tile) {
      const micIcon = tile.querySelector('.peer-mic-icon');
      if (micIcon) {
        micIcon.className = isMicOn
          ? 'peer-mic-icon fa-solid fa-microphone text-[10px] text-slate-300 ml-1'
          : 'peer-mic-icon fa-solid fa-microphone-slash text-[10px] text-rose-400 ml-1';
      }
    }
  });

  // Join Room
  socket.emit('join-room', { roomId, userName, userRole });

  // 6. Header Clock
  setInterval(() => {
    const now = new Date();
    const clock = document.getElementById('meetingClock');
    if (clock) {
      clock.innerText = 
        now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    }
  }, 1000);

  // 7. Synchronized Pomodoro Focus
  let pomoSeconds = 25 * 60;
  let isPomoRunning = false;
  let pomoInterval = null;

  const pomoTimerEl = document.getElementById('pomoTimer');
  const btnPomoToggle = document.getElementById('btnPomoToggle');

  function updatePomoDisplay() {
    const m = Math.floor(pomoSeconds / 60).toString().padStart(2, '0');
    const s = (pomoSeconds % 60).toString().padStart(2, '0');
    if (pomoTimerEl) pomoTimerEl.innerText = `${m}:${s}`;
  }

  window.togglePomodoro = function() {
    if (!isPomoRunning) {
      isPomoRunning = true;
      if (btnPomoToggle) btnPomoToggle.innerText = 'Dừng';
      socket.emit('sync-pomodoro', { roomId, action: 'start', seconds: pomoSeconds, isRunning: true });
      startPomoInterval();
    } else {
      isPomoRunning = false;
      if (btnPomoToggle) btnPomoToggle.innerText = 'Tiếp tục';
      clearInterval(pomoInterval);
      socket.emit('sync-pomodoro', { roomId, action: 'pause', seconds: pomoSeconds, isRunning: false });
    }
  };

  function startPomoInterval() {
    clearInterval(pomoInterval);
    pomoInterval = setInterval(() => {
      pomoSeconds--;
      updatePomoDisplay();
      if (pomoSeconds <= 0) {
        clearInterval(pomoInterval);
        isPomoRunning = false;
        pomoSeconds = 25 * 60;
        updatePomoDisplay();
        if (btnPomoToggle) btnPomoToggle.innerText = 'Bắt đầu';
        alert('🎉 Chúc mừng! Đã hoàn thành phiên tập trung Pomodoro 25 phút.');
      }
    }, 1000);
  }

  socket.on('pomodoro-updated', ({ action, seconds, isRunning }) => {
    pomoSeconds = seconds;
    isPomoRunning = isRunning;
    updatePomoDisplay();
    if (isRunning) {
      if (btnPomoToggle) btnPomoToggle.innerText = 'Dừng';
      startPomoInterval();
    } else {
      if (btnPomoToggle) btnPomoToggle.innerText = 'Tiếp tục';
      clearInterval(pomoInterval);
    }
  });

  // 8. Meeting Control Buttons (Mic, Cam, Screen, Reaction)
  window.toggleMic = function() {
    const isOn = webrtc.toggleMic();
    const btn = document.getElementById('btnMic');
    const tileMic = document.getElementById('tileMicIcon');
    if (isOn) {
      btn.classList.remove('active');
      btn.innerHTML = '<i class="fa-solid fa-microphone text-sm"></i>';
      if (tileMic) tileMic.className = 'fa-solid fa-microphone text-[10px] text-slate-300 ml-1';
    } else {
      btn.classList.add('active');
      btn.innerHTML = '<i class="fa-solid fa-microphone-slash text-sm"></i>';
      if (tileMic) tileMic.className = 'fa-solid fa-microphone-slash text-[10px] text-rose-400 ml-1';
    }
  };

  window.toggleCam = async function() {
    const btn = document.getElementById('btnCam');
    const localVideo = document.getElementById('localVideo');
    const localAvatar = document.getElementById('localAvatar');

    const res = await webrtc.toggleCam();
    if (res.isCamOn) {
      btn.classList.remove('active');
      btn.innerHTML = '<i class="fa-solid fa-video text-sm"></i>';
      if (localVideo) {
        localVideo.srcObject = res.stream;
        localVideo.classList.remove('hidden');
      }
      if (localAvatar) localAvatar.classList.add('hidden');
    } else {
      btn.classList.add('active');
      btn.innerHTML = '<i class="fa-solid fa-video-slash text-sm"></i>';
      if (localVideo) localVideo.classList.add('hidden');
      if (localAvatar) localAvatar.classList.remove('hidden');
    }
  };

  window.toggleScreenShare = async function() {
    const btn = document.getElementById('btnScreen');
    const localVideo = document.getElementById('localVideo');
    const localAvatar = document.getElementById('localAvatar');

    const res = await webrtc.toggleScreenShare();
    if (res.isSharing) {
      btn.classList.add('accent');
      if (localVideo) {
        localVideo.srcObject = res.stream;
        localVideo.classList.remove('hidden');
      }
      if (localAvatar) localAvatar.classList.add('hidden');
    } else {
      btn.classList.remove('accent');
      if (!webrtc.isCamOn) {
        if (localVideo) localVideo.classList.add('hidden');
        if (localAvatar) localAvatar.classList.remove('hidden');
      } else {
        if (localVideo) localVideo.srcObject = webrtc.localStream;
      }
    }
  };

  window.toggleReactionMenu = function() {
    const menu = document.getElementById('reactionMenu');
    if (menu) menu.classList.toggle('hidden');
  };

  window.sendReaction = function(emoji) {
    const menu = document.getElementById('reactionMenu');
    if (menu) menu.classList.add('hidden');

    socket.emit('send-reaction', { roomId, emoji, senderName: userName });
    renderReaction(emoji);
  };

  function renderReaction(emoji) {
    const el = document.createElement('div');
    el.className = 'floating-reaction';
    el.innerText = emoji;
    videoStage.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  socket.on('reaction-received', ({ emoji }) => {
    renderReaction(emoji);
  });

  // 9. Side Panel Drawer & Tabs
  let sidePanelOpen = true;
  window.toggleSidePanel = function() {
    sidePanelOpen = !sidePanelOpen;
    const panel = document.getElementById('sidePanel');
    const btn = document.getElementById('btnSidePanelToggle');
    if (panel) {
      if (sidePanelOpen) {
        panel.classList.remove('hidden');
        if (btn) btn.classList.add('accent');
      } else {
        panel.classList.add('hidden');
        if (btn) btn.classList.remove('accent');
      }
    }
  };

  window.setSideTab = function(tab) {
    ['kanban', 'sos', 'git'].forEach(t => {
      const panel = document.getElementById(`panel-${t}`);
      const btn = document.getElementById(`tabBtn-${t}`);
      if (panel && btn) {
        if (t === tab) {
          panel.classList.remove('hidden');
          btn.className = 'flex-1 py-2.5 font-medium border-b-2 border-primary-var text-primary-var flex items-center justify-center gap-1.5';
        } else {
          panel.classList.add('hidden');
          btn.className = 'flex-1 py-2.5 font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5';
        }
      }
    });
  };

  // 10. AI Actions Trigger Binding
  window.runAutoDecompose = async function() {
    const text = document.getElementById('taskInputText').value.trim();
    if (!text) return alert('Vui lòng nhập nội dung đề tài bài tập lớn!');

    const btn = document.getElementById('btnDecompose');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> AI đang phân việc...';
    btn.disabled = true;

    try {
      const tasks = await copilot.decomposeTask(text);
      kanban.setTasks(tasks, true);
    } catch (e) {
      alert('Lỗi: ' + e.message);
    } finally {
      btn.innerHTML = orig;
      btn.disabled = false;
    }
  };

  window.runSOSDebugger = async function() {
    const text = document.getElementById('errorInputText').value.trim();
    if (!text) return alert('Vui lòng dán log lỗi StackTrace!');

    const btn = document.getElementById('btnDebug');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang soi bug...';
    btn.disabled = true;

    try {
      const solution = await copilot.runSOSDebugger(text);
      const resBox = document.getElementById('sosResultBox');
      const solEl = document.getElementById('sosSolution');
      if (solEl) solEl.innerText = solution;
      if (resBox) resBox.classList.remove('hidden');
    } catch (e) {
      alert('Lỗi: ' + e.message);
    } finally {
      btn.innerHTML = orig;
      btn.disabled = false;
    }
  };

  window.runGitGuard = async function() {
    const text = document.getElementById('gitInputText').value.trim();
    if (!text) return alert('Vui lòng dán commit diff!');

    const btn = document.getElementById('btnGitScan');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang quét...';
    btn.disabled = true;

    try {
      const result = await copilot.runGitGuard(text);
      const leakEl = document.getElementById('gitLeakMessage');
      const sumEl = document.getElementById('gitGenZSummary');
      const alertBox = document.getElementById('gitAlertBox');

      if (result.has_leak) {
        leakEl.className = 'p-2.5 rounded-lg border border-rose-600 bg-rose-950/80 text-rose-200 text-xs';
        leakEl.innerHTML = `<b>🚨 CẢNH BÁO BẢO MẬT:</b> ${result.leak_details}`;
      } else {
        leakEl.className = 'p-2.5 rounded-lg border border-emerald-600 bg-emerald-950/80 text-emerald-200 text-xs';
        leakEl.innerHTML = `✅ Commit an toàn, không có secret bị lộ.`;
      }

      if (sumEl) sumEl.innerText = result.genz_summary || 'Đã cập nhật code mới.';
      if (alertBox) alertBox.classList.remove('hidden');
    } catch (e) {
      alert('Lỗi: ' + e.message);
    } finally {
      btn.innerHTML = orig;
      btn.disabled = false;
    }
  };

  // Samples
  window.loadSampleSyllabus = function() {
    document.getElementById('taskInputText').value = 
`ĐỀ TÀI: Xây dựng ứng dụng quản lý phòng tập Gym thông minh (Smart Gym App).
Yêu cầu:
1. Thiết kế CSDL học viên, gói tập, lịch tập.
2. Xây dựng API xác thực JWT (Login, Register).
3. Làm giao diện ReactJS xem lịch tập và đặt lịch trực tuyến.
4. Tích hợp cổng thanh toán VNPay / MoMo.
5. Viết tài liệu kiểm thử và triển khai AWS.`;
  };

  window.loadSampleError = function() {
    document.getElementById('errorInputText').value = 
`TypeError: Cannot read properties of undefined (reading 'split')
    at authMiddleware (D:\\TeamUp\\server\\middleware\\auth.js:14:38)
Code:
const token = req.headers['authorization'].split(' ')[1];`;
  };

  window.loadSampleCommit = function() {
    document.getElementById('gitInputText').value = 
`commit 8f3a1d9b
Author: minh_dev <minh@teamup.io>
diff --git a/config/db.js b/config/db.js
+ const DB_URI = "mongodb+srv://admin:SuperSecretPass123@cluster0.abc.mongodb.net/gym_db";
+ const STRIPE_KEY = "sk_live_51M0abcdef1234567890XYZ";`;
  };

  window.copyMeetingLink = function() {
    const meetUrl = `${window.location.origin}/room?room=${encodeURIComponent(roomId)}`;
    navigator.clipboard.writeText(meetUrl);
    alert('Đã sao chép liên kết phòng họp vào bộ nhớ tạm: ' + meetUrl);
  };

  window.leaveCall = function() {
    if (confirm('Bạn có chắc chắn muốn rời phòng họp TeamUp AI?')) {
      window.location.href = '/';
    }
  };
});
