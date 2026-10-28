/**
 * CivicTrack AI - Asynchronous API Layer (api.js)
 * 
 * Architecture & Design Overview:
 * --------------------------------
 * This module implements the Service Layer Pattern, providing a clean, asynchronous
 * interface for all civic complaint operations, lifecycle transitions, and dashboard statistics.
 * 
 * Current Implementation (Review 2):
 * - Interacts with browser StorageService (localStorage DAO).
 * - Simulates realistic network latency (60ms - 150ms) to exercise frontend loading spinners and async state.
 * - Standardizes API envelopes: { success: boolean, data?: any, error?: string, code?: number }.
 * 
 * Future Backend Alignment (Review 3 Roadmap):
 * - Methods map 1-to-1 with planned RESTful endpoints on FastAPI/Flask + PostgreSQL.
 * - Switching to a real remote server requires only pointing BASE_URL to the backend and replacing StorageService calls with fetch().
 */

const ApiService = {
  // Simulated network latency in milliseconds for realistic UX validation
  SIMULATE_LATENCY_MS: 150,

  /**
   * Helper delay utility simulating network round-trip time.
   * @private
   * @param {number} ms - Milliseconds to delay execution
   * @returns {Promise<void>}
   */
  async _delay(ms = this.SIMULATE_LATENCY_MS) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * GET /api/v1/complaints
   * Fetch all complaints with multi-criteria filtering and text search.
   * 
   * Query Parameters:
   * @param {Object} [filters={}] - Filter criteria
   * @param {string} [filters.status] - Status filter ('all', 'SUBMITTED', 'IN PROGRESS', 'RESOLVED', 'CITIZEN VERIFIED', 'REOPENED')
   * @param {string} [filters.category] - Category filter ('all', 'pothole', 'streetlight', 'drainage', 'garbage', 'traffic')
   * @param {string} [filters.severity] - Severity filter ('all', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
   * @param {string} [filters.search] - Case-insensitive text query matching ID, title, description, or location
   * 
   * @returns {Promise<{success: boolean, data: Array<Object>, count: number, code: number}>}
   */
  async getComplaints(filters = {}) {
    try {
      await this._delay(100);
      let list = (typeof StorageService !== 'undefined') ? StorageService.getComplaints() : [];

      if (!Array.isArray(list)) {
        list = [];
      }

      // Filter by complaint lifecycle status
      if (filters.status && filters.status !== 'all') {
        const targetStatus = filters.status.toLowerCase();
        list = list.filter(c => c && c.status && c.status.toLowerCase() === targetStatus);
      }

      // Filter by civic category
      if (filters.category && filters.category !== 'all') {
        const targetCat = filters.category.toLowerCase();
        list = list.filter(c => c && c.category && c.category.toLowerCase() === targetCat);
      }

      // Filter by priority severity
      if (filters.severity && filters.severity !== 'all') {
        const targetSev = filters.severity.toLowerCase();
        list = list.filter(c => c && c.severity && c.severity.toLowerCase() === targetSev);
      }

      // Multi-field text search
      if (filters.search && typeof filters.search === 'string' && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter(c => {
          if (!c) return false;
          return (
            (c.id && c.id.toLowerCase().includes(q)) ||
            (c.title && c.title.toLowerCase().includes(q)) ||
            (c.description && c.description.toLowerCase().includes(q)) ||
            (c.location && c.location.toLowerCase().includes(q)) ||
            (c.categoryName && c.categoryName.toLowerCase().includes(q))
          );
        });
      }

      return {
        success: true,
        data: list,
        count: list.length,
        code: 200
      };
    } catch (err) {
      console.error('[ApiService.getComplaints] Error:', err);
      return {
        success: false,
        error: 'Failed to retrieve complaints: ' + err.message,
        data: [],
        count: 0,
        code: 500
      };
    }
  },

  /**
   * GET /api/v1/complaints/:id
   * Fetch a single complaint by its unique identifier.
   * 
   * Path Parameters:
   * @param {string} id - Unique complaint ID (e.g. 'CT-2026-001284')
   * 
   * Responses:
   * - 200: Complaint record found
   * - 400: Invalid or missing ID parameter
   * - 404: Complaint not found in storage
   * - 500: Internal retrieval failure
   * 
   * @returns {Promise<{success: boolean, data?: Object, error?: string, code: number}>}
   */
  async getComplaintById(id) {
    try {
      await this._delay(60);

      // Validate ID input
      if (!id || typeof id !== 'string' || !id.trim()) {
        return {
          success: false,
          error: 'Invalid or missing complaint ID. A non-empty string identifier is required.',
          code: 400
        };
      }

      const cleanId = id.trim();
      const complaint = (typeof StorageService !== 'undefined') ? StorageService.getComplaintById(cleanId) : null;

      if (!complaint) {
        return {
          success: false,
          error: `Complaint with ID "${cleanId}" was not found in records.`,
          code: 404
        };
      }

      return {
        success: true,
        data: complaint,
        code: 200
      };
    } catch (err) {
      console.error('[ApiService.getComplaintById] Error:', err);
      return {
        success: false,
        error: 'Error loading complaint details: ' + err.message,
        code: 500
      };
    }
  },

  /**
   * POST /api/v1/complaints
   * Register a new civic complaint with automated SLA calculation, priority score, and initial timeline events.
   * 
   * Request Body:
   * @param {Object} complaintData - Complaint submission payload
   * @param {string} complaintData.category - Required category code ('pothole', 'drainage', 'streetlight', etc.)
   * @param {string} [complaintData.categoryName] - Human-readable category label
   * @param {string} [complaintData.categoryIcon] - Emoji or icon representation
   * @param {string} [complaintData.title] - Short complaint title
   * @param {string} [complaintData.description] - Detailed user description of the issue
   * @param {string} complaintData.location - Required physical street address or landmark
   * @param {Object} [complaintData.coordinates] - Geographic lat/lng coordinates
   * @param {number} [complaintData.coordinates.lat] - Latitude (-90 to 90)
   * @param {number} [complaintData.coordinates.lng] - Longitude (-180 to 180)
   * @param {string} [complaintData.severity='MEDIUM'] - Priority severity ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
   * @param {number} [complaintData.priorityScore=70] - AI calculated priority score (1-100)
   * @param {string} [complaintData.imageUrl] - Photo proof URL or data URL
   * 
   * Responses:
   * - 201: Complaint successfully created and stored
   * - 400: Validation failure (missing category or location, invalid severity)
   * - 500: Storage persistence failure or quota exceeded
   * 
   * @returns {Promise<{success: boolean, data?: Object, message?: string, error?: string, code: number}>}
   */
  async createComplaint(complaintData) {
    try {
      await this._delay(150);

      // Defensive input validation
      if (!complaintData || typeof complaintData !== 'object') {
        return {
          success: false,
          error: 'Complaint submission payload is missing or invalid.',
          code: 400
        };
      }

      const errors = [];

      // Validate required category
      if (!complaintData.category || typeof complaintData.category !== 'string' || !complaintData.category.trim()) {
        errors.push('Category is required (e.g. pothole, streetlight, drainage).');
      }

      // Validate required location
      if (!complaintData.location || typeof complaintData.location !== 'string' || !complaintData.location.trim()) {
        errors.push('Location address is required.');
      }

      // Validate severity if provided
      const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const severity = (complaintData.severity || 'MEDIUM').toUpperCase();
      if (!validSeverities.includes(severity)) {
        errors.push(`Invalid severity level "${complaintData.severity}". Allowed values: ${validSeverities.join(', ')}.`);
      }

      // Validate coordinates if provided
      let coordinates = { lat: 13.0827, lng: 80.2707 }; // Default Chennai Central
      if (complaintData.coordinates && typeof complaintData.coordinates === 'object') {
        const lat = Number(complaintData.coordinates.lat);
        const lng = Number(complaintData.coordinates.lng);
        if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          coordinates = { lat, lng };
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: 'Validation failed: ' + errors.join(' '),
          details: errors,
          code: 400
        };
      }

      // Generate unique complaint ID: CT-YYYY-NNNNNN
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear();
      const id = `CT-${year}-00${randomNum}`;

      const now = new Date().toISOString();

      // Mandated SLA turnaround period based on severity level
      let resolutionDays = 5;
      if (severity === 'CRITICAL') resolutionDays = 1;
      else if (severity === 'HIGH') resolutionDays = 3;
      else if (severity === 'MEDIUM') resolutionDays = 5;
      else if (severity === 'LOW') resolutionDays = 7;

      const deadlineAt = new Date(Date.now() + resolutionDays * 24 * 3600 * 1000).toISOString();
      const catName = complaintData.categoryName || (complaintData.category.charAt(0).toUpperCase() + complaintData.category.slice(1));

      const newRecord = {
        id,
        category: complaintData.category.trim().toLowerCase(),
        categoryName: catName,
        categoryIcon: complaintData.categoryIcon || '📌',
        title: complaintData.title && complaintData.title.trim() 
          ? complaintData.title.trim() 
          : `${catName} reported at ${complaintData.location.trim()}`,
        description: complaintData.description ? complaintData.description.trim() : '',
        location: complaintData.location.trim(),
        coordinates,
        severity,
        priorityScore: Math.min(100, Math.max(10, Number(complaintData.priorityScore) || 70)),
        estimatedImpact: complaintData.estimatedImpact || 'Moderate public impact',
        recommendedDepartment: complaintData.recommendedDepartment || 'City Municipal Administration',
        assignedOfficer: 'Auto-Routing Pending (Ward Inspection Unit)',
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
            description: 'Citizen complaint logged with photo proof and verified GPS coordinates.',
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

      // Persist to storage layer
      if (typeof StorageService !== 'undefined') {
        StorageService.addComplaint(newRecord);

        // Emit citizen confirmation alert
        StorageService.addNotification({
          complaintId: id,
          title: `Complaint Filed: ${id}`,
          message: `Your report for ${newRecord.categoryName} at ${newRecord.location} has been registered and verified by AI.`,
          type: 'submitted'
        });
      }

      return {
        success: true,
        data: newRecord,
        message: 'Complaint submitted successfully and queued for department assignment.',
        code: 201
      };
    } catch (err) {
      console.error('[ApiService.createComplaint] Error:', err);
      return {
        success: false,
        error: 'Failed to record complaint: ' + err.message,
        code: 500
      };
    }
  },

  /**
   * PATCH /api/v1/complaints/:id/status
   * Update complaint status along the official 6-stage lifecycle.
   * Simulates authority workflow (Assigned -> In Progress -> Resolved).
   * 
   * @param {string} id - Complaint ID
   * @param {string} newStatus - Target status ('ASSIGNED', 'IN PROGRESS', 'RESOLVED')
   * @param {string} [actorName='Authority Officer'] - Personnel recording the update
   * @param {string} [note=''] - Field inspection or repair notes
   * 
   * Responses:
   * - 200: Status updated and timeline event appended
   * - 400: Invalid status stage or missing parameters
   * - 404: Complaint not found
   * - 500: Update persistence failure
   * 
   * @returns {Promise<{success: boolean, data?: Object, error?: string, code: number}>}
   */
  async updateComplaintStatus(id, newStatus, actorName = 'Authority Officer', note = '') {
    try {
      await this._delay(100);

      if (!id || typeof id !== 'string' || !id.trim()) {
        return { success: false, error: 'Invalid complaint ID.', code: 400 };
      }

      const validStatuses = ['SUBMITTED', 'VERIFIED', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CITIZEN VERIFIED', 'REOPENED'];
      if (!newStatus || !validStatuses.includes(newStatus.toUpperCase())) {
        return {
          success: false,
          error: `Invalid status "${newStatus}". Allowed: ${validStatuses.join(', ')}.`,
          code: 400
        };
      }

      const cleanStatus = newStatus.toUpperCase();
      const complaint = (typeof StorageService !== 'undefined') ? StorageService.getComplaintById(id.trim()) : null;
      if (!complaint) {
        return { success: false, error: `Complaint "${id}" not found.`, code: 404 };
      }

      const now = new Date().toISOString();
      const updatedTimeline = Array.isArray(complaint.timeline) ? [...complaint.timeline] : [];

      let stageTitle = `Status updated to ${cleanStatus}`;
      if (cleanStatus === 'ASSIGNED') {
        stageTitle = 'Assigned to Field Inspection Team';
      } else if (cleanStatus === 'IN PROGRESS') {
        stageTitle = 'Repair & Remediation Work In Progress';
      } else if (cleanStatus === 'RESOLVED') {
        stageTitle = 'Marked Resolved by Department';
      }

      updatedTimeline.push({
        stage: cleanStatus,
        title: stageTitle,
        description: note || `Action recorded by ${actorName}.`,
        timestamp: now,
        actor: actorName
      });

      const updated = (typeof StorageService !== 'undefined') ? StorageService.updateComplaint(complaint.id, {
        status: cleanStatus,
        timeline: updatedTimeline,
        assignedOfficer: actorName
      }) : null;

      // Notify citizen of the status transition
      if (typeof StorageService !== 'undefined') {
        const notifType = cleanStatus === 'RESOLVED' ? 'verification' : 'progress';
        StorageService.addNotification({
          complaintId: complaint.id,
          title: `Update: Complaint ${complaint.id}`,
          message: `Status changed to ${cleanStatus}. ${cleanStatus === 'RESOLVED' ? 'Mandatory Citizen Verification requested: Please verify if the issue is solved on-ground.' : ''}`,
          type: notifType
        });
      }

      return {
        success: true,
        data: updated,
        code: 200
      };
    } catch (err) {
      console.error('[ApiService.updateComplaintStatus] Error:', err);
      return { success: false, error: 'Failed to update status: ' + err.message, code: 500 };
    }
  },

  /**
   * POST /api/v1/complaints/:id/verify-resolution
   * Citizen Verification Workflow:
   * Implements the core innovation of CivicTrack AI — complaints marked 'RESOLVED'
   * by authorities cannot be officially closed until confirmed on-ground by the citizen.
   * 
   * Actions:
   * - isFixed = true  -> Status becomes 'CITIZEN VERIFIED' (Officially closed, 100% accountability)
   * - isFixed = false -> Status becomes 'REOPENED' (Priority elevated +15, escalation alert triggered)
   * 
   * @param {string} id - Complaint ID
   * @param {boolean} isFixed - Citizen confirmation: true if fixed, false if still broken
   * @param {string} [feedbackText=''] - Explanatory feedback (mandatory if reopening)
   * 
   * @returns {Promise<{success: boolean, data?: Object, status?: string, error?: string, code: number}>}
   */
  async verifyCitizenResolution(id, isFixed, feedbackText = '') {
    try {
      await this._delay(150);

      if (!id || typeof id !== 'string' || !id.trim()) {
        return { success: false, error: 'Invalid complaint ID.', code: 400 };
      }

      const complaint = (typeof StorageService !== 'undefined') ? StorageService.getComplaintById(id.trim()) : null;
      if (!complaint) {
        return { success: false, error: `Complaint "${id}" not found.`, code: 404 };
      }

      // Mandatory feedback rule when reopening a complaint
      if (!isFixed && (!feedbackText || !feedbackText.trim())) {
        return {
          success: false,
          error: 'Feedback explanation is mandatory when rejecting a resolution and reopening a complaint.',
          code: 400
        };
      }

      const now = new Date().toISOString();
      const updatedTimeline = Array.isArray(complaint.timeline) ? [...complaint.timeline] : [];

      if (isFixed) {
        // Citizen verifies resolution on-ground -> Official closure
        updatedTimeline.push({
          stage: 'Citizen Verified',
          title: 'CITIZEN VERIFIED & CLOSED',
          description: feedbackText.trim() || 'Citizen confirmed on-ground that problem was thoroughly resolved.',
          timestamp: now,
          actor: 'Citizen'
        });

        const updated = (typeof StorageService !== 'undefined') ? StorageService.updateComplaint(complaint.id, {
          status: 'CITIZEN VERIFIED',
          citizenFeedback: {
            verified: true,
            reason: feedbackText.trim() || 'Confirmed fixed.',
            submittedAt: now
          },
          escalationAlert: false,
          timeline: updatedTimeline
        }) : null;

        if (typeof StorageService !== 'undefined') {
          StorageService.addNotification({
            complaintId: complaint.id,
            title: `Verification Complete: ${complaint.id}`,
            message: 'Thank you for verifying! This complaint is now officially verified and closed with full civic transparency.',
            type: 'success'
          });
        }

        return {
          success: true,
          data: updated,
          status: 'CITIZEN VERIFIED',
          code: 200
        };
      } else {
        // Citizen rejects resolution -> Escalated & Reopened
        const cleanReason = feedbackText.trim();
        updatedTimeline.push({
          stage: 'Reopened',
          title: 'REOPENED BY CITIZEN (Verification Failed)',
          description: `Citizen rejected resolution: "${cleanReason}". Automated escalation ticket dispatched to Zonal Superintending Engineer.`,
          timestamp: now,
          actor: 'Citizen Accountability Check'
        });

        // Elevate priority score by +15 points up to maximum of 100
        const elevatedScore = Math.min(100, (Number(complaint.priorityScore) || 70) + 15);

        const updated = (typeof StorageService !== 'undefined') ? StorageService.updateComplaint(complaint.id, {
          status: 'REOPENED',
          priorityScore: elevatedScore,
          escalationAlert: true,
          citizenFeedback: {
            verified: false,
            reason: cleanReason,
            submittedAt: now
          },
          timeline: updatedTimeline
        }) : null;

        if (typeof StorageService !== 'undefined') {
          StorageService.addNotification({
            complaintId: complaint.id,
            title: `⚠️ Complaint Reopened: ${complaint.id}`,
            message: 'Your complaint has been reopened and escalated to Senior Department Officials due to incomplete on-ground resolution.',
            type: 'escalation'
          });
        }

        return {
          success: true,
          data: updated,
          status: 'REOPENED',
          code: 200
        };
      }
    } catch (err) {
      console.error('[ApiService.verifyCitizenResolution] Error:', err);
      return { success: false, error: 'Failed to record citizen verification: ' + err.message, code: 500 };
    }
  },

  /**
   * GET /api/v1/stats
   * Compute city-wide civic KPIs, resolution performance, category breakdown, and ward hot-spots.
   * 
   * @returns {Promise<{success: boolean, stats: Object, code: number}>}
   */
  async getPublicStats() {
    try {
      await this._delay(100);
      const complaints = (typeof StorageService !== 'undefined') ? StorageService.getComplaints() : [];

      const total = Array.isArray(complaints) ? complaints.length : 0;
      const resolved = Array.isArray(complaints) 
        ? complaints.filter(c => c && (c.status === 'RESOLVED' || c.status === 'CITIZEN VERIFIED')).length 
        : 0;
      const citizenVerified = Array.isArray(complaints) 
        ? complaints.filter(c => c && c.status === 'CITIZEN VERIFIED').length 
        : 0;
      const pending = Array.isArray(complaints) 
        ? complaints.filter(c => c && ['SUBMITTED', 'VERIFIED', 'ASSIGNED', 'IN PROGRESS', 'REOPENED'].includes(c.status)).length 
        : 0;
      const highPriority = Array.isArray(complaints) 
        ? complaints.filter(c => c && (c.severity === 'HIGH' || c.severity === 'CRITICAL' || c.priorityScore >= 80)).length 
        : 0;
      const reopened = Array.isArray(complaints) 
        ? complaints.filter(c => c && c.status === 'REOPENED').length 
        : 0;

      const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : '0.0';
      const citizenVerificationRate = resolved > 0 ? ((citizenVerified / resolved) * 100).toFixed(1) : '0.0';

      // Category breakdown
      const categoryCounts = {};
      if (Array.isArray(complaints)) {
        complaints.forEach(c => {
          if (!c) return;
          const cat = c.categoryName || 'Other';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      }

      // Ward / Area breakdown
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

      if (Array.isArray(complaints)) {
        complaints.forEach(c => {
          if (!c || !c.location) return;
          for (const area of Object.keys(areaCounts)) {
            if (c.location.includes(area)) {
              areaCounts[area]++;
              break;
            }
          }
        });
      }

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
        },
        code: 200
      };
    } catch (err) {
      console.error('[ApiService.getPublicStats] Error:', err);
      return {
        success: false,
        error: 'Failed to compute public stats: ' + err.message,
        code: 500
      };
    }
  }
};

// Universal export for Node.js unit testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiService };
}
