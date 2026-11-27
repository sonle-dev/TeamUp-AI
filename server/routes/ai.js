const express = require('express');
const router = express.Router();

// Helper to call Google Gemini API with auto fallback to gemini-3.1-flash-lite
async function callGeminiApi({ prompt, apiKey, model = 'gemini-3.1-flash-lite', isJson = false }) {
  if (!apiKey) {
    throw new Error('Chưa cung cấp Google Gemini API Key.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  if (isJson) {
    payload.generationConfig = { response_mime_type: 'application/json' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Không nhận được phản hồi từ mô hình AI.');
    return text;
  } catch (err) {
    clearTimeout(timeoutId);
    // Automatic fallback if high demand or model not found
    if ((err.message.includes('high demand') || err.message.includes('503') || err.message.includes('not found')) && model !== 'gemini-3.1-flash-lite') {
      console.warn(`[Gemini Fallback] Model ${model} failed, falling back to gemini-3.1-flash-lite...`);
      return callGeminiApi({ prompt, apiKey, model: 'gemini-3.1-flash-lite', isJson });
    }
    throw err;
  }
}

// 1. Syllabus -> Kanban Auto-decomposition
router.post('/decompose', async (req, res) => {
  try {
    const { text, apiKey, model } = req.body;
    if (!text) return res.status(400).json({ error: 'Nội dung đề bài không được để trống.' });

    const prompt = `Bạn là Trợ lý Điều phối Đồ án Sinh viên của TeamUp AI.
Phân tích nội dung đề bài/cuộc họp sau và chia thành danh sách nhiệm vụ JSON:
[
  {
    "id": "task_1",
    "title": "Tên nhiệm vụ ngắn gọn, rõ ràng",
    "description": "Mô tả chi tiết việc cần làm",
    "assignee": "Đức (Backend, AWS) hoặc Minh (React, UI) hoặc Lan (Tester, Docs)",
    "story_points": 3,
    "status": "TODO"
  }
]
Quy tắc:
- story_points thuộc thang chuẩn Agile: [1, 2, 3, 5].
- status: "TODO"
- Phân bổ đều việc cho các thành viên.

Đề bài:
${text}`;

    const raw = await callGeminiApi({ prompt, apiKey, model, isJson: true });
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const tasks = JSON.parse(clean);
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. SOS Emergency Bug Debugger
router.post('/sos', async (req, res) => {
  try {
    const { stacktrace, apiKey, model } = req.body;
    if (!stacktrace) return res.status(400).json({ error: 'Log lỗi không được để trống.' });

    const prompt = `Bạn là Trợ lý Cứu Bug Khẩn Cấp (SOS Debugger) trong phòng họp kỹ thuật.
Hãy phân tích đoạn log lỗi sau và trả lời súc tích theo định dạng 3 phần:
1. 🔍 NGUYÊN NHÂN LỖI (Tối đa 1 câu ngắn gọn).
2. 📍 DÒNG VÀ FILE GÂY LỖI.
3. 🛠️ BẢN VÁ CODE CHUẨN (Kèm code block chỉnh sửa hoàn chỉnh).

Log lỗi:
${stacktrace}`;

    const solution = await callGeminiApi({ prompt, apiKey, model, isJson: false });
    res.json({ success: true, solution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Git Feed & Credential Leak Guard
router.post('/git-guard', async (req, res) => {
  try {
    const { diff, apiKey, model } = req.body;
    if (!diff) return res.status(400).json({ error: 'Diff commit không được để trống.' });

    const prompt = `Kiểm tra đoạn Git commit diff sau và phản hồi JSON theo định dạng:
{
  "has_leak": true hoặc false,
  "leak_details": "Tên khóa/secret bị lộ nếu có (ví dụ: DB password, Stripe API key, JWT secret)",
  "genz_summary": "1 câu tóm tắt tiến độ commit theo phong cách Gen Z vui vẻ, hài hước, tạo động lực cho nhóm"
}

Diff:
${diff}`;

    const raw = await callGeminiApi({ prompt, apiKey, model, isJson: true });
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(clean);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
