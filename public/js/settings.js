/**
 * TeamUp AI - Settings & Customization Controller
 */

class SettingsManager {
  constructor() {
    this.init();
  }

  init() {
    // 1. Initialize Theme
    const savedTheme = localStorage.getItem('teamup_theme_mode') || 'system';
    this.applyTheme(savedTheme);

    // 2. Initialize Palette
    const savedPalette = localStorage.getItem('teamup_accent_palette') || 'indigo';
    this.applyPalette(savedPalette);

    // 3. Initialize Layout
    const savedLayout = localStorage.getItem('teamup_layout_mode') || 'meet';
    this.applyLayout(savedLayout);

    // 4. Initialize API Key & Model
    const savedKey = localStorage.getItem('teamup_gemini_api_key') || '';
    const keyInput = document.getElementById('modalApiKeyInput');
    if (keyInput) keyInput.value = savedKey;

    const savedModel = localStorage.getItem('teamup_gemini_model') || 'gemini-3.1-flash-lite';
    const modelSelect = document.getElementById('modalModelSelect');
    if (modelSelect) modelSelect.value = savedModel;

    // Listen for OS color scheme change
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const mode = localStorage.getItem('teamup_theme_mode') || 'system';
      if (mode === 'system') this.applyTheme('system');
    });
  }

  open(tab = 'appearance') {
    const modal = document.getElementById('settingsModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      this.setTab(tab);
    }
  }

  close() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';

      // Auto save API key & model
      const keyInput = document.getElementById('modalApiKeyInput');
      if (keyInput) {
        localStorage.setItem('teamup_gemini_api_key', keyInput.value.trim());
      }
      const modelSelect = document.getElementById('modalModelSelect');
      if (modelSelect) {
        localStorage.setItem('teamup_gemini_model', modelSelect.value);
      }
    }
  }

  setTab(tab) {
    ['appearance', 'ai', 'devices'].forEach(t => {
      const btn = document.getElementById('settingsTabBtn-' + t);
      const content = document.getElementById('settingsContent-' + t);
      if (btn && content) {
        if (t === tab) {
          btn.className = 'px-5 py-3 border-b-2 border-primary-var text-primary-var flex items-center gap-2 transition';
          content.classList.remove('hidden');
        } else {
          btn.className = 'px-5 py-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center gap-2 transition';
          content.classList.add('hidden');
        }
      }
    });
  }

  changeTheme(mode) {
    localStorage.setItem('teamup_theme_mode', mode);
    this.applyTheme(mode);
  }

  applyTheme(mode) {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveDark = mode === 'dark' || (mode === 'system' && isSystemDark);

    if (effectiveDark) {
      document.documentElement.classList.remove('theme-light');
    } else {
      document.documentElement.classList.add('theme-light');
    }

    ['light', 'dark', 'system'].forEach(m => {
      const btn = document.getElementById('modalThemeBtn-' + m);
      if (btn) {
        if (m === mode) {
          btn.classList.add('ring-2', 'ring-primary-var', 'border-primary-var', 'bg-primary-light/10');
        } else {
          btn.classList.remove('ring-2', 'ring-primary-var', 'border-primary-var', 'bg-primary-light/10');
        }
      }
    });
  }

  changePalette(paletteName) {
    localStorage.setItem('teamup_accent_palette', paletteName);
    this.applyPalette(paletteName);
  }

  applyPalette(paletteName) {
    document.documentElement.classList.remove('palette-indigo', 'palette-emerald', 'palette-blue', 'palette-orange');
    document.documentElement.classList.add('palette-' + paletteName);

    const hDot = document.getElementById('headerPaletteDot');
    const colors = { indigo: '#6366f1', emerald: '#10b981', blue: '#2563eb', orange: '#f97316' };
    if (hDot) {
      hDot.style.backgroundColor = colors[paletteName] || '#6366f1';
    }

    ['indigo', 'emerald', 'blue', 'orange'].forEach(p => {
      const card = document.getElementById('paletteCard-' + p);
      if (card) {
        if (p === paletteName) {
          card.classList.add('ring-2', 'ring-primary-var', 'bg-primary-light/10');
        } else {
          card.classList.remove('ring-2', 'ring-primary-var', 'bg-primary-light/10');
        }
      }
    });

    const modalPaletteText = document.getElementById('modalCurrentPaletteText');
    if (modalPaletteText) {
      const names = { indigo: 'Indigo Tím', emerald: 'Emerald Lục Bảo', blue: 'Tech Blue', orange: 'Sunset Cam' };
      modalPaletteText.innerText = 'Đang dùng: ' + (names[paletteName] || paletteName);
    }
  }

  changeLayout(layoutName) {
    localStorage.setItem('teamup_layout_mode', layoutName);
    this.applyLayout(layoutName);
  }

  applyLayout(layoutName) {
    document.body.classList.remove('layout-meet', 'layout-bento', 'layout-ide', 'layout-lecture');
    document.body.classList.add('layout-' + layoutName);

    const names = { meet: 'Mẫu 1 (Meet)', bento: 'Mẫu 2 (Bento)', ide: 'Mẫu 3 (Dev IDE)', lecture: 'Mẫu 4 (Giảng đường)' };
    const hPill = document.getElementById('headerLayoutPill');
    if (hPill) {
      hPill.innerText = names[layoutName] || layoutName;
    }

    ['meet', 'bento', 'ide', 'lecture'].forEach(l => {
      const card = document.getElementById('layoutCard-' + l);
      if (card) {
        card.classList.remove('ring-2', 'ring-primary-var', 'bg-primary-light/20');
      }
    });

    const activeCard = document.getElementById('layoutCard-' + layoutName);
    if (activeCard) {
      activeCard.classList.add('ring-2', 'ring-primary-var', 'bg-primary-light/20');
    }

    const modalLayoutText = document.getElementById('modalCurrentLayoutText');
    if (modalLayoutText) {
      modalLayoutText.innerText = 'Đang dùng: ' + (names[layoutName] || layoutName);
    }

    const ideArea = document.getElementById('ideWorkspaceArea');
    const lectureArea = document.getElementById('lectureScreenShareArea');

    if (ideArea) ideArea.classList.add('hidden');
    if (lectureArea) lectureArea.classList.add('hidden');

    if (layoutName === 'ide' && ideArea) ideArea.classList.remove('hidden');
    if (layoutName === 'lecture' && lectureArea) lectureArea.classList.remove('hidden');
  }

  toggleKeyVisibility() {
    const input = document.getElementById('modalApiKeyInput');
    const icon = document.getElementById('apiKeyEyeIcon');
    if (input) {
      if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.className = 'fa-solid fa-eye-slash';
      } else {
        input.type = 'password';
        if (icon) icon.className = 'fa-solid fa-eye';
      }
    }
  }
}

window.SettingsManager = SettingsManager;
