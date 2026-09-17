/**
 * CivicTrack AI - API Layer (api.js)
 * Clean asynchronous interface that currently talks to StorageService.
 * Can be effortlessly pointed to a Python backend (e.g. FastAPI / Flask + PostgreSQL)
 * by updating the BASE_URL and fetch calls.
 */

const ApiService = {
  // Flag to simulate network delay for realistic UI loading states
  SIMULATE_LATENCY_MS: 300,

  async _delay(ms = this.SIMULATE_LATENCY_MS) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Fetch all complaints with optional filtering
   */
  async getComplaints(filters = {}) {
    await this._delay(150);
    let list = StorageService.getComplaints();

    if (filters.status && filters.status !== 'all') {
      list = list.filter(c => c.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.category && filters.category !== 'all') {
      list = list.filter(c => c.category.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.severity && filters.severity !== 'all') {
      list = list.filter(c => c.severity.toLowerCase() === filters.severity.toLowerCase());
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(c => 
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      data: list,
      count: list.length
    };
  },

  /**
   * Fetch single complaint by ID
   */
  async getComplaintById(id) {
    await this._delay(100);
    const complaint = StorageService.getComplaintById(id);
    if (!complaint) {
      return { success: false, error: 'Complaint not found' };
    }
    return { success: true, data: complaint };
  },

  /**
   * Submit new civic complaint
   */
  async createComplaint(complaintData) {
    await this._delay(400);

    // Generate unique complaint ID (CT-2026-XXXXXX)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const id = `CT-2026-00${randomNum}`;

    const now = new Date().toISOString();
    
    // Determine expected resolution time based on severity
    let resolutionDays = 5;
    if (complaintData.severity === 'CRITICAL') resolutionDays = 1;
    else if (complaintData.severity === 'HIGH') resolutionDays = 3;
    else if (complaintData.severity === 'MEDIUM') resolutionDays = 5;
    else if (complaintData.severity === 'LOW') resolutionDays = 7;

    const deadlineAt = new Date(Date.now() + resolutionDays * 24 * 3600 * 1000).toISOString();

    const newRecord = {
      id,
      category: complaintData.category || 'other',
      categoryName: complaintData.categoryName || 'Civic Issue',
      categoryIcon: complaintData.categoryIcon || '📌',
      title: complaintData.title || `${complaintData.categoryName} reported at ${complaintData.location}`,
      description: complaintData.description || '',
      location: complaintData.location || 'Detected Location',
      coordinates: complaintData.coordinates || { lat: 13.0827, lng: 80.2707 },
      severity: complaintData.severity || 'MEDIUM',
      priorityScore: complaintData.priorityScore || 70,
      estimatedImpact: complaintData.estimatedImpact || 'Moderate public impact',
      recommendedDepartment: complaintData.recommendedDepartment || 'City Administration',
      assignedOfficer: 'Auto-Routing Pending',
      status: 'SUBMITTED',
      createdAt: now,
      updatedAt: now,
      expectedResolutionDays: resolutionDays,
      deadlineAt,
      imageUrl: complaintData.imageUrl || 'assets/sample-pothole.svg',
      citizenFeedback: null,
      escalationAlert: false,
      timeline: [
        {
          stage: 'Submitted',
          title: 'Complaint Registered',
          description: 'Citizen complaint logged with photo proof and GPS location coordinates.',
          timestamp: now,
          actor: 'Citizen'
        },
        {
          stage: 'Verified',
          title: 'AI Verification & Routing',
          description: `AI Prototype Analysis verified issue with ${complaintData.confidence || 92}% confidence. Assigned initial Priority Score ${complaintData.priorityScore || 75}/100.`,
          timestamp: new Date(Date.now() + 1000).toISOString(),
          actor: 'CivicTrack AI Engine'
        }
      ]
    };

    StorageService.addComplaint(newRecord);

    // Trigger confirmation notification
    StorageService.addNotification({
      complaintId: id,
      title: `Complaint Filed: ${id}`,
      message: `Your report for ${newRecord.categoryName} has been submitted and verified by AI.`,
      type: 'submitted'
    });

    return {
      success: true,
      data: newRecord,
      message: 'Complaint submitted successfully'
    };
  },

  /**
   * Update complaint status (Simulated authority actions)
   */
  async updateComplaintStatus(id, newStatus, actorName = 'Authority Officer', note = '') {
    await this._delay(200);
    const complaint = StorageService.getComplaintById(id);
    if (!complaint) return { success: false, error: 'Not found' };

    const now = new Date().toISOString();
    const updatedTimeline = [...complaint.timeline];

    let stageTitle = `Status updated to ${newStatus}`;
    if (newStatus === 'ASSIGNED') {
      stageTitle = 'Assigned to Field Inspection Team';
    } else if (newStatus === 'IN PROGRESS') {
      stageTitle = 'Repair & Remediation Work In Progress';
    } else if (newStatus === 'RESOLVED') {
      stageTitle = 'Marked Resolved by Department';
    }

    updatedTimeline.push({
      stage: newStatus,
      title: stageTitle,
      description: note || `Action recorded by ${actorName}.`,
      timestamp: now,
      actor: actorName
    });

    const updated = StorageService.updateComplaint(id, {
      status: newStatus,
      timeline: updatedTimeline,
      assignedOfficer: actorName
    });

    // Notify citizen of status change
    let notifType = 'progress';
    if (newStatus === 'RESOLVED') notifType = 'verification';
    
    StorageService.addNotification({
      complaintId: id,
      title: `Update: Complaint ${id}`,
      message: `Status changed to ${newStatus}. ${newStatus === 'RESOLVED' ? 'Please verify if the issue is fixed on-ground.' : ''}`,
      type: notifType
    });

    return { success: true, data: updated };
  },

  /**
   * Citizen Verification Workflow (YES -> CITIZEN VERIFIED, NO -> REOPENED)
   */
  async verifyCitizenResolution(id, isFixed, feedbackText = '') {
    await this._delay(300);
    const complaint = StorageService.getComplaintById(id);
    if (!complaint) return { success: false, error: 'Not found' };

    const now = new Date().toISOString();
    const updatedTimeline = [...complaint.timeline];

    if (isFixed) {
      // Citizen verified resolution
      updatedTimeline.push({
        stage: 'Citizen Verified',
        title: 'CITIZEN VERIFIED & CLOSED',
        description: feedbackText || 'Citizen confirmed the issue was completely resolved on-ground.',
        timestamp: now,
        actor: 'Citizen'
      });

      const updated = StorageService.updateComplaint(id, {
        status: 'CITIZEN VERIFIED',
        citizenFeedback: {
          verified: true,
          reason: feedbackText || 'Confirmed fixed.',
          submittedAt: now
        },
        escalationAlert: false,
        timeline: updatedTimeline
      });

      StorageService.addNotification({
        complaintId: id,
        title: `Verification Complete: ${id}`,
        message: 'Thank you for verifying! This complaint is now officially closed with 100% accountability.',
        type: 'success'
      });

      return { success: true, data: updated, status: 'CITIZEN VERIFIED' };
    } else {
      // Citizen REOPENS complaint!
      updatedTimeline.push({
        stage: 'Reopened',
        title: 'REOPENED BY CITIZEN (Verification Failed)',
        description: `Citizen rejected resolution: "${feedbackText || 'Issue still persists on ground'}". Automatic escalation recommended.`,
        timestamp: now,
        actor: 'Citizen Accountability Check'
      });

      const updated = StorageService.updateComplaint(id, {
        status: 'REOPENED',
        priorityScore: Math.min(100, (complaint.priorityScore || 70) + 15),
        escalationAlert: true,
        citizenFeedback: {
          verified: false,
          reason: feedbackText || 'Issue still exists on ground.',
          submittedAt: now
        },
        timeline: updatedTimeline
      });

      StorageService.addNotification({
        complaintId: id,
        title: `⚠️ Complaint Reopened: ${id}`,
        message: 'Your complaint has been reopened and escalated to Senior Department Officials.',
        type: 'escalation'
      });

      return { success: true, data: updated, status: 'REOPENED' };
    }
  },

  /**
   * Get city-wide aggregated public statistics
   */
  async getPublicStats() {
    await this._delay(150);
    const complaints = StorageService.getComplaints();

    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CITIZEN VERIFIED').length;
    const citizenVerified = complaints.filter(c => c.status === 'CITIZEN VERIFIED').length;
    const pending = complaints.filter(c => ['SUBMITTED', 'VERIFIED', 'ASSIGNED', 'IN PROGRESS', 'REOPENED'].includes(c.status)).length;
    const highPriority = complaints.filter(c => c.severity === 'HIGH' || c.severity === 'CRITICAL' || c.priorityScore >= 80).length;
    const reopened = complaints.filter(c => c.status === 'REOPENED').length;

    const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;
    const citizenVerificationRate = resolved > 0 ? ((citizenVerified / resolved) * 100).toFixed(1) : 0;

    // Category breakdown
    const categoryCounts = {};
    complaints.forEach(c => {
      categoryCounts[c.categoryName] = (categoryCounts[c.categoryName] || 0) + 1;
    });

    // Area breakdown (Ward / Area)
    const areaCounts = {
      'Anna Nagar': 0,
      'T. Nagar': 0,
      'Velachery': 0,
      'Mylapore': 0,
      'Central Junction': 0,
      'Adyar': 0,
      'Egmore': 0,
      'Guindy': 0,
      'Nungambakkam': 0,
      'Besant Nagar': 0
    };

    complaints.forEach(c => {
      for (const area of Object.keys(areaCounts)) {
        if (c.location.includes(area)) {
          areaCounts[area]++;
          break;
        }
      }
    });

    return {
      success: true,
      stats: {
        total,
        resolved,
        citizenVerified,
        pending,
        highPriority,
        reopened,
        resolutionRate,
        citizenVerificationRate,
        avgResolutionDays: '2.4',
        categoryCounts,
        areaCounts
      }
    };
  }
};
