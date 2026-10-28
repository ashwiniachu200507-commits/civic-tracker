/**
 * CivicTrack AI - Asynchronous API Layer Unit Tests (api.test.js)
 * 
 * Verifies all simulated API endpoints:
 * - POST /api/v1/complaints (Creation, SLA calculation, validation errors)
 * - GET /api/v1/complaints (Filtering, search, pagination count)
 * - GET /api/v1/complaints/:id (Single record retrieval & 404 handling)
 * - PATCH /api/v1/complaints/:id/status (Lifecycle transitions & timeline logging)
 * - POST /api/v1/complaints/:id/verify-resolution (Citizen verification approval & reopen escalation)
 * - GET /api/v1/stats (Public KPI metrics aggregation)
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { setupTestEnvironment } = require('./test_helper.js');

describe('ApiService - Asynchronous API Layer Unit Tests', () => {
  let env;

  beforeEach(() => {
    env = setupTestEnvironment();
  });

  test('TC-API-01: POST /api/v1/complaints creates valid complaint with automated SLA deadline', async () => {
    const payload = {
      category: 'pothole',
      categoryName: 'Pothole',
      title: 'Deep crater on EVR High Road',
      description: 'Dangerous pothole damaging two-wheelers',
      location: 'EVR High Road, Kilpauk, Chennai',
      severity: 'HIGH',
      priorityScore: 85,
      coordinates: { lat: 13.0780, lng: 80.2450 }
    };

    const res = await env.ApiService.createComplaint(payload);
    assert.equal(res.success, true);
    assert.equal(res.code, 201);
    assert.ok(res.data);
    assert.ok(res.data.id.startsWith('CT-'));
    assert.equal(res.data.status, 'SUBMITTED');
    assert.equal(res.data.expectedResolutionDays, 3, 'HIGH severity mandates 3-day SLA');
    assert.ok(res.data.deadlineAt);

    // Initial timeline must contain Submitted and AI Verification events
    assert.equal(res.data.timeline.length, 2);
    assert.equal(res.data.timeline[0].stage, 'Submitted');
    assert.equal(res.data.timeline[1].stage, 'Verified');
  });

  test('TC-API-02: POST /api/v1/complaints enforces CRITICAL severity SLA turnaround of 1 day', async () => {
    const res = await env.ApiService.createComplaint({
      category: 'drainage',
      location: 'Velachery Main Road',
      severity: 'CRITICAL'
    });

    assert.equal(res.success, true);
    assert.equal(res.data.expectedResolutionDays, 1, 'CRITICAL severity mandates 1-day SLA');
  });

  test('TC-API-03: POST /api/v1/complaints rejects submission missing category (400 Bad Request)', async () => {
    const res = await env.ApiService.createComplaint({
      location: '12th Main Road, Anna Nagar',
      severity: 'MEDIUM'
    });

    assert.equal(res.success, false);
    assert.equal(res.code, 400);
    assert.ok(res.error.includes('Category is required'));
  });

  test('TC-API-04: POST /api/v1/complaints rejects submission missing location (400 Bad Request)', async () => {
    const res = await env.ApiService.createComplaint({
      category: 'streetlight',
      severity: 'MEDIUM'
    });

    assert.equal(res.success, false);
    assert.equal(res.code, 400);
    assert.ok(res.error.includes('Location address is required'));
  });

  test('TC-API-05: POST /api/v1/complaints rejects invalid severity classification', async () => {
    const res = await env.ApiService.createComplaint({
      category: 'garbage',
      location: 'T. Nagar Market',
      severity: 'SUPER_URGENT_INVALID'
    });

    assert.equal(res.success, false);
    assert.equal(res.code, 400);
    assert.ok(res.error.includes('Invalid severity level'));
  });

  test('TC-API-06: GET /api/v1/complaints supports status filtering', async () => {
    // Fetch all complaints
    const allRes = await env.ApiService.getComplaints();
    assert.equal(allRes.success, true);
    assert.ok(allRes.count >= 4);

    // Filter by IN PROGRESS
    const inProgressRes = await env.ApiService.getComplaints({ status: 'IN PROGRESS' });
    assert.equal(inProgressRes.success, true);
    inProgressRes.data.forEach(c => {
      assert.equal(c.status, 'IN PROGRESS');
    });

    // Filter by RESOLVED
    const resolvedRes = await env.ApiService.getComplaints({ status: 'RESOLVED' });
    assert.equal(resolvedRes.success, true);
    resolvedRes.data.forEach(c => {
      assert.equal(c.status, 'RESOLVED');
    });
  });

  test('TC-API-07: GET /api/v1/complaints supports category filtering', async () => {
    const potholeRes = await env.ApiService.getComplaints({ category: 'pothole' });
    assert.equal(potholeRes.success, true);
    potholeRes.data.forEach(c => {
      assert.equal(c.category, 'pothole');
    });
  });

  test('TC-API-08: GET /api/v1/complaints supports full-text search', async () => {
    const searchRes = await env.ApiService.getComplaints({ search: 'Anna Nagar' });
    assert.equal(searchRes.success, true);
    assert.ok(searchRes.count > 0);
    searchRes.data.forEach(c => {
      const match = c.location.toLowerCase().includes('anna nagar') ||
                    c.title.toLowerCase().includes('anna nagar');
      assert.ok(match, 'Result should match search query');
    });
  });

  test('TC-API-09: GET /api/v1/complaints/:id returns existing record (200 OK)', async () => {
    const res = await env.ApiService.getComplaintById('CT-2026-001284');
    assert.equal(res.success, true);
    assert.equal(res.code, 200);
    assert.equal(res.data.id, 'CT-2026-001284');
  });

  test('TC-API-09b: GET /api/v1/complaints/:id returns 404 for non-existent ID', async () => {
    const res = await env.ApiService.getComplaintById('CT-UNKNOWN-99999');
    assert.equal(res.success, false);
    assert.equal(res.code, 404);
    assert.ok(res.error.includes('not found'));
  });

  test('TC-API-10: GET /api/v1/complaints/:id returns 400 for empty or invalid ID', async () => {
    const resEmpty = await env.ApiService.getComplaintById('');
    assert.equal(resEmpty.success, false);
    assert.equal(resEmpty.code, 400);

    const resNull = await env.ApiService.getComplaintById(null);
    assert.equal(resNull.success, false);
    assert.equal(resNull.code, 400);
  });

  test('TC-API-11: PATCH /api/v1/complaints/:id/status updates status and appends timeline stage', async () => {
    const targetId = 'CT-2026-001284';
    const updateRes = await env.ApiService.updateComplaintStatus(
      targetId,
      'RESOLVED',
      'Er. R. Ramanathan (GCC Ward 104 Engineer)',
      'Cold-mix bituminous asphalt patch applied and roller compacted.'
    );

    assert.equal(updateRes.success, true);
    assert.equal(updateRes.code, 200);
    assert.equal(updateRes.data.status, 'RESOLVED');

    const lastTimelineEvent = updateRes.data.timeline[updateRes.data.timeline.length - 1];
    assert.equal(lastTimelineEvent.stage, 'RESOLVED');
    assert.equal(lastTimelineEvent.actor, 'Er. R. Ramanathan (GCC Ward 104 Engineer)');
  });

  test('TC-API-12: PATCH /api/v1/complaints/:id/status rejects unrecognized status stages', async () => {
    const res = await env.ApiService.updateComplaintStatus('CT-2026-001284', 'COMPLETED_INVALID_STAGE');
    assert.equal(res.success, false);
    assert.equal(res.code, 400);
    assert.ok(res.error.includes('Invalid status'));
  });

  test('TC-API-13: Citizen Verification APPROVES resolution -> marks CITIZEN VERIFIED', async () => {
    // Target complaint CT-2026-001280 (initially RESOLVED)
    const targetId = 'CT-2026-001280';
    const verifyRes = await env.ApiService.verifyCitizenResolution(
      targetId,
      true,
      'Streetlights inspected at 8:30 PM. All luminaires operational.'
    );

    assert.equal(verifyRes.success, true);
    assert.equal(verifyRes.status, 'CITIZEN VERIFIED');
    assert.equal(verifyRes.data.status, 'CITIZEN VERIFIED');
    assert.equal(verifyRes.data.citizenFeedback.verified, true);
    assert.equal(verifyRes.data.escalationAlert, false);

    // Final timeline event must be Citizen Verified
    const timeline = verifyRes.data.timeline;
    assert.equal(timeline[timeline.length - 1].stage, 'Citizen Verified');
  });

  test('TC-API-14: Citizen Verification REJECTS resolution -> REOPENS & Escalates with +15 Priority', async () => {
    const targetId = 'CT-2026-001280';
    const initialComplaint = env.StorageService.getComplaintById(targetId);
    const initialPriority = initialComplaint.priorityScore || 70;

    const reopenRes = await env.ApiService.verifyCitizenResolution(
      targetId,
      false,
      'Streetlight luminaire still blinking and sparking intermittently.'
    );

    assert.equal(reopenRes.success, true);
    assert.equal(reopenRes.status, 'REOPENED');
    assert.equal(reopenRes.data.status, 'REOPENED');
    assert.equal(reopenRes.data.escalationAlert, true, 'Escalation alert must be active');
    assert.equal(reopenRes.data.citizenFeedback.verified, false);
    assert.equal(reopenRes.data.priorityScore, Math.min(100, initialPriority + 15), 'Priority score must be boosted by 15 pts');

    // Final timeline event must be Reopened
    const timeline = reopenRes.data.timeline;
    assert.equal(timeline[timeline.length - 1].stage, 'Reopened');
  });

  test('TC-API-15: Citizen Verification rejects empty feedback when reopening (400 Bad Request)', async () => {
    const targetId = 'CT-2026-001280';
    const res = await env.ApiService.verifyCitizenResolution(targetId, false, '');

    assert.equal(res.success, false);
    assert.equal(res.code, 400);
    assert.ok(res.error.includes('Feedback explanation is mandatory'));
  });

  test('TC-API-16: GET /api/v1/stats accurately aggregates city-wide metrics', async () => {
    const res = await env.ApiService.getPublicStats();
    assert.equal(res.success, true);
    assert.ok(res.stats);
    assert.ok(res.stats.total >= 4);
    assert.ok(Number(res.stats.resolutionRate) >= 0 && Number(res.stats.resolutionRate) <= 100);
    assert.ok(res.stats.categoryCounts);
    assert.ok(res.stats.areaCounts);
    assert.ok(Number.isFinite(res.stats.areaCounts['Anna Nagar']));
  });
});
