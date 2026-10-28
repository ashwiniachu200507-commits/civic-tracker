/**
 * CivicTrack AI - Storage Layer Unit Tests (storage.test.js)
 * 
 * Tests the Data Storage Layer (StorageService):
 * - Initialization & Idempotence
 * - Complaint CRUD operations (Create, Read, Update, Delete)
 * - Defensive input validation (missing/invalid IDs, malformed objects)
 * - Corrupted data recovery & fallback
 * - Storage Quota Exceeded error handling & telemetry
 * - Notifications, User Profile, and App Settings persistence
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { setupTestEnvironment } = require('./test_helper.js');

describe('StorageService - Data Storage Layer Unit Tests', () => {
  let env;

  beforeEach(() => {
    env = setupTestEnvironment();
  });

  test('TC-STOR-01: Storage initializes with default demo complaints on first run', () => {
    const complaints = env.StorageService.getComplaints();
    assert.ok(Array.isArray(complaints), 'Complaints should be an array');
    assert.ok(complaints.length >= 4, 'Should load initial default demo complaints');
    
    // Check initialized sentinel flag
    const initializedFlag = env.mockStorage.getItem(env.StorageService.STORAGE_KEYS || 'civictrack_initialized_v1');
    assert.equal(initializedFlag, 'true', 'Storage initialized sentinel should be true');
  });

  test('TC-STOR-02: Storage initialization is idempotent and does not overwrite existing data', () => {
    const customComplaint = {
      id: 'CT-TEST-001',
      title: 'Custom Pothole',
      category: 'pothole',
      status: 'SUBMITTED',
      location: 'Custom Road, Chennai'
    };
    env.StorageService.addComplaint(customComplaint);

    // Re-run init
    env.StorageService.init();

    const complaints = env.StorageService.getComplaints();
    const found = complaints.find(c => c.id === 'CT-TEST-001');
    assert.ok(found, 'Pre-existing complaint should be preserved after re-init');
  });

  test('TC-STOR-03: getComplaints gracefully recovers from corrupted JSON in localStorage', () => {
    // Corrupt the storage key with non-JSON string
    env.mockStorage.setItem('civictrack_complaints_v1', 'INVALID_CORRUPTED_JSON{{{');

    const result = env.StorageService.getComplaints();
    assert.ok(Array.isArray(result), 'Should fallback to default complaints array on JSON parse error');
    assert.ok(result.length > 0, 'Should return non-empty fallback data');
    assert.ok(env.StorageService.lastError !== null, 'lastError should capture the JSON parse error');
  });

  test('TC-STOR-04: getComplaintById returns matching complaint for valid existing ID', () => {
    const complaint = env.StorageService.getComplaintById('CT-2026-001284');
    assert.ok(complaint, 'Should find existing demo complaint');
    assert.equal(complaint.id, 'CT-2026-001284');
    assert.equal(complaint.category, 'pothole');
  });

  test('TC-STOR-05: getComplaintById returns null for non-existent or invalid ID', () => {
    assert.equal(env.StorageService.getComplaintById('NON-EXISTENT-ID'), null);
    assert.equal(env.StorageService.getComplaintById(''), null);
    assert.equal(env.StorageService.getComplaintById(null), null);
    assert.equal(env.StorageService.getComplaintById(undefined), null);
    assert.equal(env.StorageService.getComplaintById(12345), null);
  });

  test('TC-STOR-06: addComplaint adds valid record to the front of the list', () => {
    const newRecord = {
      id: 'CT-2026-NEW999',
      category: 'drainage',
      categoryName: 'Drainage Overflow',
      title: 'Sewage overflow near school gate',
      location: 'Gandhi Road, Velachery',
      severity: 'CRITICAL',
      status: 'SUBMITTED'
    };

    const added = env.StorageService.addComplaint(newRecord);
    assert.equal(added.id, 'CT-2026-NEW999');

    const list = env.StorageService.getComplaints();
    assert.equal(list[0].id, 'CT-2026-NEW999', 'New record should be at the head of the complaints array');
  });

  test('TC-STOR-07: addComplaint throws descriptive error on invalid record missing ID', () => {
    assert.throws(() => {
      env.StorageService.addComplaint(null);
    }, /Invalid complaint record/);

    assert.throws(() => {
      env.StorageService.addComplaint({ title: 'Missing ID' });
    }, /Invalid complaint record: ID is required/);
  });

  test('TC-STOR-08: Storage Quota Exceeded error is caught and reported gracefully', () => {
    // Simulate browser localStorage quota exceeded condition
    env.mockStorage._setQuotaExceeded(true);

    const complaints = env.StorageService.getComplaints();
    const saveResult = env.StorageService.saveComplaints(complaints);
    assert.equal(saveResult, false, 'saveComplaints should return false on quota error');
    assert.ok(env.StorageService.lastError, 'lastError should be populated');
    assert.equal(env.StorageService.lastError.name, 'QuotaExceededError');

    // addComplaint should throw clean user-facing error
    assert.throws(() => {
      env.StorageService.addComplaint({ id: 'CT-QUOTA-TEST', title: 'Test' });
    }, /quota exceeded or storage disabled/);

    // Restore quota
    env.mockStorage._setQuotaExceeded(false);
  });

  test('TC-STOR-09: updateComplaint updates fields and sets updatedAt timestamp', () => {
    const targetId = 'CT-2026-001284';
    const original = env.StorageService.getComplaintById(targetId);
    assert.ok(original);

    const updated = env.StorageService.updateComplaint(targetId, {
      status: 'RESOLVED',
      assignedOfficer: 'Officer John Doe'
    });

    assert.ok(updated, 'Updated record should be returned');
    assert.equal(updated.status, 'RESOLVED');
    assert.equal(updated.assignedOfficer, 'Officer John Doe');
    assert.ok(updated.updatedAt, 'updatedAt timestamp should be stamped');
  });

  test('TC-STOR-10: updateComplaint returns null when ID is not found or inputs invalid', () => {
    assert.equal(env.StorageService.updateComplaint('NON-EXISTENT-ID', { status: 'RESOLVED' }), null);
    assert.equal(env.StorageService.updateComplaint('', { status: 'RESOLVED' }), null);
    assert.equal(env.StorageService.updateComplaint('CT-2026-001284', null), null);
  });

  test('TC-STOR-11: Notifications management (create, read, mark all read)', () => {
    const notif = env.StorageService.addNotification({
      complaintId: 'CT-2026-001284',
      title: 'Test Notification',
      message: 'Inspection completed'
    });

    assert.ok(notif.id.startsWith('NOTIF-'));
    assert.equal(notif.unread, true);

    // Mark single notification read
    env.StorageService.markNotificationRead(notif.id);
    const notifications = env.StorageService.getNotifications();
    const found = notifications.find(n => n.id === notif.id);
    assert.equal(found.unread, false);

    // Add another unread notification
    env.StorageService.addNotification({ title: 'Alert 2', message: 'Work started' });
    env.StorageService.markAllNotificationsRead();

    const allRead = env.StorageService.getNotifications();
    allRead.forEach(n => {
      assert.equal(n.unread, false, 'All notifications should be marked as read');
    });
  });

  test('TC-STOR-12: User Profile and App Settings persistence', () => {
    const profile = {
      name: 'Priya Sundaram',
      phone: '+91 94440 98765',
      ward: 'Ward 104',
      email: 'priya@example.com'
    };
    const saved = env.StorageService.saveProfile(profile);
    assert.equal(saved, true);
    assert.deepEqual(env.StorageService.getProfile(), profile);

    const settings = { language: 'ta', theme: 'dark', gpsAllowed: true };
    const savedSettings = env.StorageService.saveSettings(settings);
    assert.equal(savedSettings, true);
    assert.deepEqual(env.StorageService.getSettings(), settings);
  });

  test('TC-STOR-13: Reset Demo Data and Clear All Data', () => {
    // Clear all data
    env.StorageService.clearAllData();
    assert.equal(env.mockStorage.length, 0, 'All storage keys should be removed');

    // Reset demo data
    env.StorageService.resetDemoData();
    assert.ok(env.StorageService.getComplaints().length >= 4, 'Demo complaints should be restored');
    assert.ok(env.StorageService.getNotifications().length >= 4, 'Demo notifications should be restored');
  });
});
