# TeamUp AI - Real-time Collaborative Workspace & AI War-room

> Không gian họp trực tuyến và điều phối đồ án nhóm thời gian thực cho sinh viên, tích hợp WebRTC đa điểm, bảng Kanban cộng tác và Trợ lý Trí tuệ Nhân tạo Google Gemini 3.1 Flash-Lite.

---

## 🚀 Tính Năng Chính

1. **Phòng Họp Trực Tuyến Đa Bố Cục (WebRTC Multi-Peer Mesh):**
   - Hỗ trợ gọi Video/Audio thời gian thực độ trễ thấp thông qua Socket.io và máy chủ STUN của Google.
   - 4 Bố cục hiển thị: **Google Meet Stage**, **Bento Grid Workspace**, **Developer Focus IDE**, **Giảng Đường & Thuyết Trình**.
   - 4 Tông màu chủ đạo: **Deep Indigo**, **Cyber Emerald**, **Modern Tech Blue**, **Sunset Amber**.
   - 3 Chế độ nền: **Sáng (Light)**, **Tối (Dark)**, **Theo hệ thống (Auto)**.

2. **Trợ Lý AI Điều Phối (Gemini Copilot 3.1 Flash-Lite):**
   - **Bóc tách đề bài 1 chạm:** Chuyển đổi giáo trình/đề tài thành danh sách thẻ việc Agile có Story Points và gán người phụ trách.
   - **SOS Bug Debugger:** Phân tích log lỗi StackTrace, chỉ rõ nguyên nhân, dòng sai và sinh đoạn code vá chuẩn.
   - **Git Commit Feed & Leak Guard:** Quét commit diff phát hiện lộ Secret/Password và tóm tắt tiến độ kiểu Gen Z.

3. **Bảng Công Việc Kanban & Đồng Hồ Pomodoro Đồng Bộ:**
   - Quản lý trạng thái: `Cần làm`, `Đang làm`, `Hoàn thành` theo thời gian thực.
   - Đồng bộ thời gian Pomodoro 25:00 cho toàn bộ thành viên trong phòng họp.

---

## 🛠️ Cấu Trúc Mã Nguồn (Production Architecture)

```
d:\TeamUp AI\
├── package.json                   # Cấu hình dependency Node.js & scripts
├── server/
│   ├── server.js                  # Máy chủ Express HTTP & Socket.io
│   ├── routes/
│   │   └── ai.js                  # API proxy gọi Google Gemini (Decompose, SOS, Git Guard)
│   └── signaling/
│       └── socketHandler.js       # Máy chủ báo hiệu WebRTC mesh & điều phối phòng họp
└── public/
    ├── index.html                 # Ứng dụng Single Page App chính thức
    ├── css/
    │   └── style.css              # Hệ thống Design System biến CSS động
    └── js/
        ├── webrtc.js              # Quản lý luồng MediaStream & RTCPeerConnection P2P
        ├── copilot.js             # Kết nối AI Copilot
        ├── kanban.js              # Xử lý bảng công việc Kanban
        ├── settings.js            # Điều khiển Modal Cài đặt (Theme, Màu, Bố cục, API)
        └── app.js                 # Điều phối giao diện phòng họp và sự kiện
```

---

## 💻 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Cài đặt thư viện:
```bash
npm install
```

### 2. Khởi chạy máy chủ:
```bash
npm start
```

Máy chủ sẽ chạy tại: **`http://localhost:3000`**

- Để thử nghiệm 2 người gọi video với nhau: Mở 2 tab trình duyệt hoặc 2 máy tính khác nhau truy cập vào:
  `http://localhost:3000?room=teamup-dev-warroom&name=TenCuaBan`
