/**
 * CivicTrack AI - Complaints & Timeline Controller (complaints.js)
 * Manages Complaint Lists, Detailed 6-Stage Timeline, Citizen Verification & Reopen Workflow.
 */

const ComplaintsController = {
  currentFilter: 'all',
  searchQuery: '',
  currentDetailComplaintId: null,

  init() {
    this.bindFilterButtons();
    this.bindSearchInput();
  },

  bindFilterButtons() {
    document.querySelectorAll('.complaints-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.complaints-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.status || 'all';
        this.renderComplaintsList();
      });
    });
  },

  bindSearchInput() {
    const searchInput = document.getElementById('complaints-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderComplaintsList();
      });
    }
  },

  async renderComplaintsList() {
    const container = document.getElementById('my-complaints-grid');
    if (!container) return;

    const res = await ApiService.getComplaints({
      status: this.currentFilter,
      search: this.searchQuery
    });

    const list = res.data || [];

    if (list.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 0.75rem;">📂</div>
          <h3 style="margin-bottom: 0.5rem;">No complaints found</h3>
          <p>No complaints match the selected filter. Try choosing another category or submit a new report.</p>
          <button class="btn btn-primary" onclick="AppRouter.navigate('report')" style="margin-top: 1rem;">
            + Report a Problem
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(c => {
      const statusClass = c.status.toLowerCase().replace(/\s+/g, '-');
      const timeAgo = formatTimeAgo(new Date(c.createdAt));
      const deadline = new Date(c.deadlineAt);
      const isOverdue = Date.now() > deadline.getTime() && !['RESOLVED', 'CITIZEN VERIFIED'].includes(c.status);

      return `
        <div class="card complaint-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
          <div>
            <!-- Header Row -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <div>
                <span style="font-family: monospace; font-size: 0.8rem; font-weight: 800; color: var(--brand-primary);">${c.id}</span>
                <h3 style="font-size: 1.05rem; font-weight: 700; margin-top: 0.2rem; line-height: 1.3;">
                  ${c.categoryIcon} ${c.title}
                </h3>
              </div>
              <span class="badge badge-${statusClass}">
                ${c.status}
              </span>
            </div>

            <!-- Location & Meta -->
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.35rem;">
              📍 ${c.location}
            </p>

            <!-- Priority & Severity Row -->
            <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-tertiary); padding: 0.6rem 0.85rem; border-radius: var(--radius-md); margin-bottom: 0.75rem;">
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary);">
                Severity: <span class="severity-pill ${c.severity.toLowerCase()}">${c.severity}</span>
              </div>
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary);">
                Priority Score: <span style="color: var(--brand-primary); font-weight: 800;">${c.priorityScore}/100</span>
              </div>
            </div>

            <!-- SLA / Escalation Warning Alert -->
            ${isOverdue || c.escalationAlert ? `
              <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 700; color: #ef4444; background: #fee2e2; padding: 0.35rem 0.65rem; border-radius: var(--radius-sm); margin-bottom: 0.75rem;">
                ⚠️ <span>${c.escalationAlert ? 'Escalation Recommended (Citizen Reopened)' : 'SLA Exceeded - Delayed Action Alert'}</span>
              </div>
            ` : ''}

            <!-- Citizen Verification Needed Callout -->
            ${c.status === 'RESOLVED' && !c.citizenFeedback ? `
              <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%); border: 1px dashed #f59e0b; padding: 0.6rem 0.85rem; border-radius: var(--radius-md); margin-bottom: 0.75rem;">
                <div style="font-size: 0.8rem; font-weight: 800; color: #b45309; margin-bottom: 0.2rem;">
                  🛡️ Verification Requested
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                  Authority marked resolved. Please confirm if problem is fixed on-ground.
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Card Footer -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">${timeAgo}</span>
            <button class="btn btn-sm btn-primary" onclick="AppRouter.navigate('details', {id: '${c.id}'})">
              View Timeline &rarr;
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Render Complaint Details Page & 6-Stage Timeline
   */
  async renderComplaintDetails(id) {
    this.currentDetailComplaintId = id;
    const res = await ApiService.getComplaintById(id);
    if (!res.success) {
      NotificationService.showToast({ title: 'Error', message: 'Complaint not found', type: 'danger' });
      AppRouter.navigate('complaints');
      return;
    }

    const c = res.data;
    const statusClass = c.status.toLowerCase().replace(/\s+/g, '-');
    const deadline = new Date(c.deadlineAt);
    const isOverdue = Date.now() > deadline.getTime() && !['RESOLVED', 'CITIZEN VERIFIED'].includes(c.status);

    // Update Header Info
    document.getElementById('detail-complaint-id').textContent = c.id;
    document.getElementById('detail-title').textContent = `${c.categoryIcon} ${c.title}`;
    document.getElementById('detail-status-badge').textContent = c.status;
    document.getElementById('detail-status-badge').className = `badge badge-${statusClass}`;
    document.getElementById('detail-location-text').textContent = c.location;
    document.getElementById('detail-created-date').textContent = new Date(c.createdAt).toLocaleString();
    document.getElementById('detail-department').textContent = c.recommendedDepartment;
    document.getElementById('detail-officer').textContent = c.assignedOfficer || 'Not yet assigned';
    document.getElementById('detail-severity').textContent = c.severity;
    document.getElementById('detail-severity').className = `severity-pill ${c.severity.toLowerCase()}`;
    document.getElementById('detail-priority-score').textContent = `${c.priorityScore}/100`;
    document.getElementById('detail-priority-bar').style.width = `${c.priorityScore}%`;

    // Overdue Alert Banner in Details
    const escalationBox = document.getElementById('detail-escalation-alert');
    if (escalationBox) {
      if (isOverdue || c.escalationAlert || c.status === 'REOPENED') {
        escalationBox.style.display = 'flex';
        document.getElementById('detail-escalation-reason').textContent = 
          c.status === 'REOPENED' ? 'Citizen verified on-ground that problem was NOT fixed. Case escalated to Zonal Superintending Engineer.' :
          'Expected resolution period exceeded. Automated escalation ticket dispatched to Grievance Redressal Cell.';
      } else {
        escalationBox.style.display = 'none';
      }
    }

    // Photo Preview
    const photoEl = document.getElementById('detail-photo-preview');
    if (photoEl && c.imageUrl) {
      photoEl.src = c.imageUrl;
    }

    // Render 6-Stage Timeline
    this.renderTimelineTrack(c);

    // Render Citizen Verification Banner
    const verifyBox = document.getElementById('detail-citizen-verify-box');
    if (verifyBox) {
      if (c.status === 'RESOLVED' && !c.citizenFeedback) {
        verifyBox.style.display = 'block';
      } else if (c.status === 'CITIZEN VERIFIED') {
        verifyBox.style.display = 'block';
        verifyBox.innerHTML = `
          <div style="background: #d1fae5; border: 2px solid #059669; border-radius: var(--radius-lg); padding: 1.25rem; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.25rem;">✅</div>
            <h3 style="color: #065f46; font-weight: 800;">Citizen Verified & Completed</h3>
            <p style="color: #047857; font-size: 0.85rem; margin-top: 0.35rem;">
              Citizen confirmed on-ground resolution: "${c.citizenFeedback?.reason || 'Issue resolved cleanly'}".
            </p>
          </div>
        `;
      } else if (c.status === 'REOPENED') {
        verifyBox.style.display = 'block';
        verifyBox.innerHTML = `
          <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: var(--radius-lg); padding: 1.25rem; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.25rem;">🚨</div>
            <h3 style="color: #991b1b; font-weight: 800;">Complaint Reopened by Citizen</h3>
            <p style="color: #b91c1c; font-size: 0.85rem; margin-top: 0.35rem;">
              Citizen Feedback: "${c.citizenFeedback?.reason || 'Issue still exists on-ground'}"
            </p>
            <div style="margin-top: 0.75rem; font-weight: 700; font-size: 0.82rem; color: #7f1d1d;">
              ⚠️ Priority Score Elevated to ${c.priorityScore}/100 — Escalated to Superintending Engineer
            </div>
          </div>
        `;
      } else {
        verifyBox.style.display = 'none';
      }
    }
  },

  renderTimelineTrack(complaint) {
    const container = document.getElementById('detail-timeline-track');
    if (!container) return;

    const timeline = complaint.timeline || [];

    const STAGES_ORDER = [
      { key: 'Submitted', name: 'Complaint Submitted', icon: '📝' },
      { key: 'Verified', name: 'AI Vision & Geolocation Verified', icon: '✨' },
      { key: 'Assigned', name: 'Assigned to Ward Engineer', icon: '👷' },
      { key: 'In Progress', name: 'Repair Work In Progress', icon: '🛠️' },
      { key: 'Resolved', name: 'Marked Resolved by Authority', icon: '📋' },
      { key: 'Citizen Verified', name: 'Citizen Verified & Closed', icon: '🛡️' }
    ];

    container.innerHTML = timeline.map((event, index) => {
      let stepState = 'completed';
      if (index === timeline.length - 1) {
        stepState = event.stage === 'Reopened' ? 'reopened' : 'current';
      }

      let icon = '✓';
      if (event.stage === 'Submitted') icon = '📝';
      else if (event.stage === 'Verified') icon = '✨';
      else if (event.stage === 'Assigned') icon = '👷';
      else if (event.stage === 'In Progress') icon = '🛠️';
      else if (event.stage === 'Resolved') icon = '📋';
      else if (event.stage === 'Citizen Verified') icon = '🛡️';
      else if (event.stage === 'Reopened') icon = '🚨';

      const timeStr = new Date(event.timestamp).toLocaleString();

      return `
        <div class="timeline-step ${stepState}">
          <div class="timeline-step-icon">${icon}</div>
          <div class="timeline-step-content">
            <div class="timeline-step-title">
              <span>${event.title}</span>
              <span class="timeline-step-time">${timeStr}</span>
            </div>
            <div class="timeline-step-desc">${event.description}</div>
            <div style="font-size: 0.72rem; font-weight: 700; color: var(--brand-primary); margin-top: 0.35rem;">
              Actor: ${event.actor || 'System'}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Citizen Verification Action Handler
   */
  async handleCitizenVerification(isFixed) {
    if (!this.currentDetailComplaintId) return;

    let reason = '';
    if (!isFixed) {
      reason = prompt('Please specify why the issue is not fixed (e.g., "Pothole was only filled with loose sand and eroded again"):', 'Pothole was not patched properly, still exists on ground.');
      if (reason === null) return; // user cancelled prompt
    }

    const res = await ApiService.verifyCitizenResolution(this.currentDetailComplaintId, isFixed, reason);
    if (res.success) {
      if (isFixed) {
        NotificationService.showToast({
          title: 'Citizen Verification Confirmed',
          message: 'Thank you! Complaint marked CITIZEN VERIFIED and closed.',
          type: 'success'
        });
      } else {
        NotificationService.showToast({
          title: 'Complaint REOPENED',
          message: 'Thank you. The issue has been reopened for immediate escalation.',
          type: 'danger'
        });
      }

      // Re-render details view
      this.renderComplaintDetails(this.currentDetailComplaintId);
    }
  },

  /**
   * Judge & Demo Simulation Controls
   */
  async simulateStatusTransition(newStatus) {
    if (!this.currentDetailComplaintId) return;

    await ApiService.updateComplaintStatus(
      this.currentDetailComplaintId,
      newStatus,
      'Zonal Officer / Contractor Demo Staff',
      `Demonstration status update to ${newStatus}`
    );

    NotificationService.showToast({
      title: 'Demo Status Updated',
      message: `Complaint ${this.currentDetailComplaintId} transitioned to ${newStatus}`,
      type: 'info'
    });

    this.renderComplaintDetails(this.currentDetailComplaintId);
  }
};
