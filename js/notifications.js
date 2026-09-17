/**
 * CivicTrack AI - Notifications & Toast Manager (notifications.js)
 */

const NotificationService = {
  init() {
    this.updateBadgeCount();
    this.renderNotificationsList();
  },

  // Subtle web audio synthetic beep for realistic alert feedback
  playNotificationSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  },

  showToast({ title, message, type = 'info', duration = 4500, complaintId = null }) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    this.playNotificationSound();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '🔔';
    if (type === 'success') icon = '✅';
    else if (type === 'warning') icon = '⚠️';
    else if (type === 'danger') icon = '🚨';
    else if (type === 'ai') icon = '✨';

    toast.innerHTML = `
      <div style="font-size: 1.3rem; flex-shrink: 0;">${icon}</div>
      <div style="flex: 1;">
        <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 0.2rem; color: var(--text-primary);">${title}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${message}</div>
        ${complaintId ? `<button onclick="AppRouter.navigate('details', {id: '${complaintId}'})" style="margin-top: 0.4rem; font-size: 0.75rem; font-weight: 700; color: var(--brand-primary);">View Complaint &rarr;</button>` : ''}
      </div>
      <button onclick="this.parentElement.remove()" style="color: var(--text-muted); font-size: 1.1rem; padding: 0 0.2rem;">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  },

  updateBadgeCount() {
    const list = StorageService.getNotifications();
    const unreadCount = list.filter(n => n.unread).length;
    
    document.querySelectorAll('.notif-badge-count').forEach(el => {
      if (unreadCount > 0) {
        el.textContent = unreadCount;
        el.style.display = 'inline-flex';
      } else {
        el.style.display = 'none';
      }
    });
  },

  renderNotificationsList() {
    const container = document.getElementById('notifications-list-container');
    if (!container) return;

    const list = StorageService.getNotifications();

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔕</div>
          <h3>No notifications yet</h3>
          <p>You will receive updates when authorities assign or resolve your civic complaints.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(item => {
      let icon = '🔔';
      let tagClass = 'badge-submitted';
      if (item.type === 'verification') { icon = '🛡️'; tagClass = 'badge-verified'; }
      else if (item.type === 'escalation') { icon = '⚠️'; tagClass = 'badge-reopened'; }
      else if (item.type === 'progress') { icon = '🛠️'; tagClass = 'badge-in-progress'; }
      else if (item.type === 'success') { icon = '✅'; tagClass = 'badge-resolved'; }

      const timeAgo = formatTimeAgo(new Date(item.timestamp));

      return `
        <div class="card" style="margin-bottom: 0.85rem; border-left: 4px solid ${item.unread ? 'var(--brand-primary)' : 'transparent'}; opacity: ${item.unread ? 1 : 0.85};">
          <div style="display: flex; gap: 1rem; align-items: flex-start;">
            <div style="font-size: 1.5rem; flex-shrink: 0; padding-top: 0.2rem;">${icon}</div>
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <h4 style="font-size: 0.95rem; font-weight: 700;">${item.title}</h4>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${timeAgo}</span>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.4;">${item.message}</p>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                ${item.complaintId ? `
                  <button class="btn btn-sm btn-primary" onclick="AppRouter.navigate('details', {id: '${item.complaintId}'})">
                    Inspect Complaint (${item.complaintId})
                  </button>
                ` : ''}
                ${item.unread ? `
                  <button class="btn btn-sm btn-secondary" onclick="NotificationService.markAsRead('${item.id}')">
                    Mark as Read
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  markAsRead(id) {
    StorageService.markNotificationRead(id);
    this.updateBadgeCount();
    this.renderNotificationsList();
  },

  markAllAsRead() {
    StorageService.markAllNotificationsRead();
    this.updateBadgeCount();
    this.renderNotificationsList();
    this.showToast({ title: 'Notifications Cleared', message: 'All notifications marked as read.', type: 'info' });
  }
};

function formatTimeAgo(date) {
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  return `${Math.floor(diffSec / 86400)} days ago`;
}
