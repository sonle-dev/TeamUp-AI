/**
 * TeamUp AI - Real-Time Collaborative Kanban Board
 */

class KanbanBoard {
  constructor(socket, roomId, containerId) {
    this.socket = socket;
    this.roomId = roomId;
    this.container = document.getElementById(containerId);
    this.tasks = [];

    this.init();
  }

  init() {
    // Load local storage initial tasks if any
    const saved = localStorage.getItem('teamup_kanban_tasks');
    if (saved) {
      try {
        this.tasks = JSON.parse(saved);
        this.render();
      } catch (e) {}
    }

    // Listen to real-time updates from other peers
    if (this.socket) {
      this.socket.on('kanban-synced', (remoteTasks) => {
        this.tasks = remoteTasks;
        localStorage.setItem('teamup_kanban_tasks', JSON.stringify(this.tasks));
        this.render();
      });

      this.socket.on('room-joined', ({ tasks }) => {
        if (tasks && tasks.length > 0) {
          this.tasks = tasks;
          localStorage.setItem('teamup_kanban_tasks', JSON.stringify(this.tasks));
          this.render();
        }
      });
    }
  }

  setTasks(newTasks, sync = true) {
    this.tasks = newTasks;
    localStorage.setItem('teamup_kanban_tasks', JSON.stringify(this.tasks));
    this.render();

    if (sync && this.socket) {
      this.socket.emit('update-kanban', {
        roomId: this.roomId,
        tasks: this.tasks
      });
    }
  }

  updateTaskStatus(taskId, newStatus) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = newStatus;
      this.setTasks(this.tasks, true);
    }
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    const badge = document.getElementById('kanbanCountBadge');
    if (badge) {
      badge.innerText = `${this.tasks.length} thẻ`;
    }

    if (this.tasks.length === 0) {
      this.container.innerHTML = `
        <div class="text-center py-8 text-xs" style="color: var(--text-sub);">
          <i class="fa-solid fa-clipboard-list text-2xl mb-2 block opacity-40"></i>
          Chưa có thẻ nào. Bấm "AI Tự Động Phân Việc" ở trên để tạo danh sách nhiệm vụ.
        </div>
      `;
      return;
    }

    this.tasks.forEach((t, index) => {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-xl border space-y-2 transition-all hover:translate-x-0.5 shadow-sm';
      card.style.backgroundColor = 'var(--bg-card)';
      card.style.borderColor = 'var(--border-color)';

      const statusColors = {
        'TODO': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        'IN_PROGRESS': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        'DONE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      };

      const statusBadge = statusColors[t.status] || statusColors['TODO'];

      card.innerHTML = `
        <div class="flex justify-between items-start gap-1">
          <span class="font-semibold text-xs leading-snug">${t.title}</span>
          <span class="px-1.5 py-0.5 rounded font-mono text-[10px] text-primary-var bg-primary-light shrink-0">
            ${t.story_points || 3} pts
          </span>
        </div>
        <p class="text-[11px] leading-relaxed" style="color: var(--text-sub);">${t.description || ''}</p>
        <div class="flex items-center justify-between pt-1.5 border-t text-[10px]" style="border-color: var(--border-color);">
          <span class="text-purple-400 font-medium flex items-center gap-1">
            <i class="fa-regular fa-user"></i> ${t.assignee || 'Chưa gán'}
          </span>
          <select onchange="window.kanban.updateTaskStatus('${t.id || 'task_' + index}', this.value)" 
                  class="rounded px-1.5 py-0.5 font-medium border text-[10px] cursor-pointer focus:outline-none"
                  style="background-color: var(--bg-input); border-color: var(--border-color); color: var(--text-main);">
            <option value="TODO" ${t.status === 'TODO' ? 'selected' : ''}>📋 Cần làm</option>
            <option value="IN_PROGRESS" ${t.status === 'IN_PROGRESS' ? 'selected' : ''}>⚡ Đang làm</option>
            <option value="DONE" ${t.status === 'DONE' ? 'selected' : ''}>✅ Hoàn thành</option>
          </select>
        </div>
      `;
      this.container.appendChild(card);
    });
  }
}

window.KanbanBoard = KanbanBoard;
