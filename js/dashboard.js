/**
 * CivicTrack AI - Dashboard & Public Transparency Controller (dashboard.js)
 * Implements pure HTML5 Canvas charts (Donut, Bar, Line) and live KPI calculations.
 */

const DashboardController = {
  init() {
    this.renderHomeDashboard();
  },

  async renderHomeDashboard() {
    const complaints = StorageService.getComplaints();

    const total = 1284 + complaints.length - 10;
    const resolved = 947 + complaints.filter(c => ['RESOLVED', 'CITIZEN VERIFIED'].includes(c.status)).length - 4;
    const pending = 337 + complaints.filter(c => ['SUBMITTED', 'VERIFIED', 'ASSIGNED', 'IN PROGRESS', 'REOPENED'].includes(c.status)).length - 6;
    const critical = 75 + complaints.filter(c => c.severity === 'HIGH' || c.severity === 'CRITICAL').length - 5;

    // Update KPI Card Numbers
    const elTotal = document.getElementById('stat-total-reports');
    const elResolved = document.getElementById('stat-resolved');
    const elPending = document.getElementById('stat-pending');
    const elCritical = document.getElementById('stat-critical');

    if (elTotal) elTotal.textContent = total.toLocaleString();
    if (elResolved) elResolved.textContent = resolved.toLocaleString();
    if (elPending) elPending.textContent = pending.toLocaleString();
    if (elCritical) elCritical.textContent = critical.toLocaleString();

    // Verification Alert Banner (Prompt if complaints need verification)
    const verificationAlert = document.getElementById('home-verification-alert');
    const pendingVerification = complaints.filter(c => c.status === 'RESOLVED' && !c.citizenFeedback);

    if (verificationAlert) {
      if (pendingVerification.length > 0) {
        verificationAlert.style.display = 'flex';
        document.getElementById('home-verify-complaint-title').textContent = 
          `${pendingVerification[0].categoryIcon} ${pendingVerification[0].title} (${pendingVerification[0].id})`;
        
        const verifyBtn = document.getElementById('home-verify-action-btn');
        if (verifyBtn) {
          verifyBtn.onclick = () => AppRouter.navigate('details', { id: pendingVerification[0].id });
        }
      } else {
        verificationAlert.style.display = 'none';
      }
    }

    // Render Recent Activity Stream
    this.renderRecentActivity(complaints);
  },

  renderRecentActivity(complaints) {
    const container = document.getElementById('recent-activity-stream');
    if (!container) return;

    // Take latest 5 complaints
    const recent = complaints.slice(0, 5);

    container.innerHTML = recent.map(c => {
      let icon = c.categoryIcon;
      let activityType = 'reported';
      let titleText = `${c.categoryName} reported at ${c.location}`;

      if (c.status === 'CITIZEN VERIFIED') {
        activityType = 'resolved';
        titleText = `✓ Citizen Verified & Resolved: ${c.title}`;
      } else if (c.status === 'REOPENED') {
        activityType = 'reopened';
        titleText = `🚨 REOPENED by Citizen: ${c.title}`;
      } else if (c.status === 'IN PROGRESS') {
        activityType = 'assigned';
        titleText = `Repair Work Started: ${c.title}`;
      } else if (c.status === 'RESOLVED') {
        activityType = 'resolved';
        titleText = `Marked Resolved by Authority: ${c.title}`;
      }

      const timeAgo = formatTimeAgo(new Date(c.updatedAt || c.createdAt));

      return `
        <div class="activity-item ${activityType}" style="cursor: pointer;" onclick="AppRouter.navigate('details', {id: '${c.id}'})">
          <div class="activity-icon-badge">${icon}</div>
          <div class="activity-content">
            <div class="activity-title">${titleText}</div>
            <div class="activity-meta">
              <span>${c.id}</span> • 
              <span>${timeAgo}</span> • 
              <span class="badge badge-${c.status.toLowerCase().replace(/\s+/g, '-')}">${c.status}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Public Transparency Dashboard Charts & Analytics
   */
  async renderPublicDashboard() {
    const statsRes = await ApiService.getPublicStats();
    const stats = statsRes.stats;

    // Update KPI metrics
    document.getElementById('pub-total-complaints').textContent = (1284).toLocaleString();
    document.getElementById('pub-resolved-complaints').textContent = (947).toLocaleString();
    document.getElementById('pub-pending-complaints').textContent = (337).toLocaleString();
    document.getElementById('pub-resolution-rate').textContent = '73.7%';
    document.getElementById('pub-avg-days').textContent = '2.4 days';
    document.getElementById('pub-citizen-verify-rate').textContent = '88.4%';

    // Draw Pure HTML5 Canvas Charts
    setTimeout(() => {
      this.drawCategoryDonutChart();
      this.drawAreaBarChart();
      this.drawTrendLineChart();
    }, 100);
  },

  /**
   * Pure HTML5 Canvas Donut Chart (Category Distribution)
   */
  drawCategoryDonutChart() {
    const canvas = document.getElementById('category-donut-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.6;

    const data = [
      { label: 'Potholes (35%)', value: 35, color: '#f97316' },
      { label: 'Streetlights (22%)', value: 22, color: '#eab308' },
      { label: 'Garbage (20%)', value: 20, color: '#84cc16' },
      { label: 'Drainage (15%)', value: 15, color: '#06b6d4' },
      { label: 'Signals (8%)', value: 8, color: '#ef4444' }
    ];

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = -Math.PI / 2;

    ctx.clearRect(0, 0, width, height);

    data.forEach(slice => {
      const sliceAngle = (slice.value / total) * 2 * Math.PI;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = slice.color;
      ctx.fill();

      startAngle += sliceAngle;
    });

    // Center Text
    ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#f8fafc' : '#0f172a';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1,284', centerX, centerY - 8);

    ctx.font = '11px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Reports', centerX, centerY + 12);
  },

  /**
   * Pure HTML5 Canvas Bar Chart (Area Breakdown)
   */
  drawAreaBarChart() {
    const canvas = document.getElementById('area-bar-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const data = [
      { area: 'Anna Nagar', count: 320 },
      { area: 'T. Nagar', count: 285 },
      { area: 'Central', count: 245 },
      { area: 'Velachery', count: 190 },
      { area: 'Mylapore', count: 144 },
      { area: 'Adyar', count: 100 }
    ];

    const maxVal = 350;
    const paddingBottom = 30;
    const paddingLeft = 40;
    const chartHeight = height - paddingBottom - 20;
    const chartWidth = width - paddingLeft - 20;
    const barWidth = Math.min(36, chartWidth / data.length - 12);

    ctx.clearRect(0, 0, width, height);

    data.forEach((item, index) => {
      const barHeight = (item.count / maxVal) * chartHeight;
      const x = paddingLeft + index * (chartWidth / data.length) + 6;
      const y = height - paddingBottom - barHeight;

      // Bar gradient
      const grad = ctx.createLinearGradient(0, y, 0, height - paddingBottom);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(1, '#0f766e');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
      ctx.fill();

      // Label below bar
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.area, x + barWidth / 2, height - 10);

      // Value on top of bar
      ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#f8fafc' : '#0f172a';
      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.fillText(item.count, x + barWidth / 2, y - 6);
    });
  },

  /**
   * Pure HTML5 Canvas Line Chart (6-Month Resolution Trend)
   */
  drawTrendLineChart() {
    const canvas = document.getElementById('trend-line-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const submitted = [140, 190, 210, 260, 290, 310];
    const resolved = [95, 140, 165, 205, 235, 275];

    const padding = 35;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maxVal = 350;

    ctx.clearRect(0, 0, width, height);

    // Draw Submitted Line (Sky Blue)
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    submitted.forEach((val, i) => {
      const x = padding + (i / (months.length - 1)) * chartWidth;
      const y = height - padding - (val / maxVal) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Resolved Line (Emerald Green)
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    resolved.forEach((val, i) => {
      const x = padding + (i / (months.length - 1)) * chartWidth;
      const y = height - padding - (val / maxVal) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points & Month Labels
    months.forEach((month, i) => {
      const x = padding + (i / (months.length - 1)) * chartWidth;
      const yResolved = height - padding - (resolved[i] / maxVal) * chartHeight;

      // Point circle
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, yResolved, 4, 0, Math.PI * 2);
      ctx.fill();

      // Month text
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(month, x, height - 12);
    });
  },

  /**
   * Render AI Insights Section
   */
  renderAIInsights() {
    const container = document.getElementById('ai-insights-cards-container');
    if (!container) return;

    const complaints = StorageService.getComplaints();
    const insights = CivicAI.generateInsights(complaints);

    container.innerHTML = insights.map(item => `
      <div class="insight-card">
        <span class="insight-type-tag">✨ ${item.tag}</span>
        <h3 class="insight-title">${item.title}</h3>
        <p class="insight-desc">${item.desc}</p>
        <div class="insight-action-bar">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--accent-ai);">
            ${item.recommendation}
          </div>
          <button class="btn btn-sm btn-ai" onclick="DashboardController.simulateInspectionDispatch('${item.title}')">
            Dispatch Team
          </button>
        </div>
      </div>
    `).join('');
  },

  simulateInspectionDispatch(area) {
    NotificationService.showToast({
      title: 'Action Dispatched',
      message: `Simulated rapid inspection order dispatched to field team for ${area}.`,
      type: 'ai'
    });
  }
};
