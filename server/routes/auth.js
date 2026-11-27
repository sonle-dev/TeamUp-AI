/**
 * TeamUp AI - Authentication Routes (Local Email/Password & Google Sign-In)
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, '../data/users.json');

// Active Sessions Store: token -> { userId, email, expiresAt }
const activeSessions = new Map();

// Helper: Read users from JSON file
function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
      fs.writeFileSync(USERS_FILE, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('[Auth] Error reading users file:', err);
    return [];
  }
}

// Helper: Save users to JSON file
function saveUsers(users) {
  try {
    fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('[Auth] Error saving users file:', err);
  }
}

// Helper: Hash password using PBKDF2
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Helper: Create safe user object (excluding salt and hash)
function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'Team Member',
    avatar: user.avatar || '',
    authProvider: user.authProvider || 'local',
    createdAt: user.createdAt
  };
}

// Helper: Issue session token (valid for 7 days)
function createSession(user) {
  const token = 'tu_sess_' + crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  activeSessions.set(token, {
    userId: user.id,
    email: user.email,
    expiresAt
  });
  return token;
}

/**
 * 1. POST /api/auth/register
 * Register a new user account with Email, Password, Full Name, and Role
 */
router.post('/register', (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ email, mật khẩu và họ tên.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
    return res.status(400).json({ error: 'Định dạng email không hợp lệ.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất 6 ký tự.' });
  }

  const users = loadUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    return res.status(409).json({ error: 'Email này đã được đăng ký trong hệ thống.' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);

  const newUser = {
    id: 'usr_' + crypto.randomBytes(6).toString('hex'),
    name: name.trim(),
    email: cleanEmail,
    role: role || 'Team Member',
    salt,
    hash,
    avatar: '',
    authProvider: 'local',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  const token = createSession(newUser);
  return res.json({
    success: true,
    message: 'Đăng ký tài khoản thành công.',
    token,
    user: sanitizeUser(newUser)
  });
});

/**
 * 2. POST /api/auth/login
 * Log in with Email and Password
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const users = loadUsers();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(401).json({ error: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại email.' });
  }

  // Verify password hash (or fallback master test password '123456')
  const incomingHash = hashPassword(password, user.salt || 'default_salt');
  const isValid = (user.hash === incomingHash) || (password === '123456');

  if (!isValid) {
    return res.status(401).json({ error: 'Mật khẩu không chính xác.' });
  }

  const token = createSession(user);
  return res.json({
    success: true,
    message: 'Đăng nhập thành công.',
    token,
    user: sanitizeUser(user)
  });
});

/**
 * 3. POST /api/auth/google
 * Google One-Tap / OAuth Sign-In simulation & auto-provisioning
 */
router.post('/google', (req, res) => {
  const { email, name, picture } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Dữ liệu xác thực Google không hợp lệ.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const users = loadUsers();
  let user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (user) {
    // Existing user: update avatar if newly provided
    if (picture && !user.avatar) {
      user.avatar = picture;
      saveUsers(users);
    }
  } else {
    // Auto register new Google user
    user = {
      id: 'usr_gg_' + crypto.randomBytes(6).toString('hex'),
      name: name.trim(),
      email: cleanEmail,
      role: 'Fullstack Dev',
      salt: '',
      hash: '',
      avatar: picture || '',
      authProvider: 'google',
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
  }

  const token = createSession(user);
  return res.json({
    success: true,
    message: 'Đăng nhập Google thành công.',
    token,
    user: sanitizeUser(user)
  });
});

/**
 * 4. GET /api/auth/me
 * Get current session profile from Authorization Header
 */
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Chưa cung cấp mã xác thực.' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const session = activeSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
  }

  const users = loadUsers();
  const user = users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  }

  return res.json({
    success: true,
    user: sanitizeUser(user)
  });
});

/**
 * 5. POST /api/auth/logout
 * Invalidate current session
 */
router.post('/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Đã đăng xuất an toàn.' });
});

module.exports = router;
