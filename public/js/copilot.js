/**
 * TeamUp AI - Gemini Copilot Client Engine
 * Interfaces with Backend /api/ai endpoints and Google Gemini 3.1 Flash-Lite
 */

class CopilotEngine {
  constructor() {
    this.apiUrl = '/api/ai';
  }

  getApiKey() {
    return localStorage.getItem('teamup_gemini_api_key') || '';
  }

  getModel() {
    return localStorage.getItem('teamup_gemini_model') || 'gemini-3.1-flash-lite';
  }

  async decomposeTask(text) {
    const apiKey = this.getApiKey();
    const model = this.getModel();

    const response = await fetch(`${this.apiUrl}/decompose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, apiKey, model })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Lỗi bóc tách đề bài.');
    }
    return data.tasks;
  }

  async runSOSDebugger(stacktrace) {
    const apiKey = this.getApiKey();
    const model = this.getModel();

    const response = await fetch(`${this.apiUrl}/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stacktrace, apiKey, model })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Lỗi phân tích SOS.');
    }
    return data.solution;
  }

  async runGitGuard(diff) {
    const apiKey = this.getApiKey();
    const model = this.getModel();

    const response = await fetch(`${this.apiUrl}/git-guard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diff, apiKey, model })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Lỗi quét Git commit.');
    }
    return data;
  }
}

window.CopilotEngine = CopilotEngine;
