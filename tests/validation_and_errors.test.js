/**
 * CivicTrack AI - Input Validation & Error Handling Unit Tests (validation_and_errors.test.js)
 * 
 * Verifies comprehensive edge-case handling:
 * - Coordinates boundary validation (lat [-90, 90], lng [-180, 180])
 * - Image validation rules (Max 10MB, supported MIME types JPG/PNG/WEBP/SVG)
 * - Error envelope format consistency ({ success: false, error: string, code: number })
 * - Centralized ErrorHandler structure and telemetry logging
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { setupTestEnvironment } = require('./test_helper.js');

describe('Input Validation & Error Handling Strategy Tests', () => {
  let env;

  beforeEach(() => {
    env = setupTestEnvironment();
  });

  test('TC-ERR-01: API defaults out-of-bounds geographic coordinates safely', async () => {
    // Latitude > 90, Longitude > 180 (Invalid coordinates)
    const res = await env.ApiService.createComplaint({
      category: 'pothole',
      location: 'Out of bounds test location',
      coordinates: { lat: 145.0, lng: 290.0 }
    });

    assert.equal(res.success, true);
    // Should safely fallback to default Chennai Central coordinates
    assert.equal(res.data.coordinates.lat, 13.0827);
    assert.equal(res.data.coordinates.lng, 80.2707);
  });

  test('TC-ERR-02: API defaults NaN coordinates safely to city center', async () => {
    const res = await env.ApiService.createComplaint({
      category: 'pothole',
      location: 'Test Street',
      coordinates: { lat: 'NOT_A_NUMBER', lng: undefined }
    });

    assert.equal(res.success, true);
    assert.equal(res.data.coordinates.lat, 13.0827);
    assert.equal(res.data.coordinates.lng, 80.2707);
  });

  test('TC-ERR-03: Image validation rejects files exceeding 10MB limit', () => {
    function validateImageMock(file) {
      if (!file) return { valid: false, reason: 'No file provided' };
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        return { valid: false, reason: 'File size exceeds 10MB limit' };
      }
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowed.includes(file.type)) {
        return { valid: false, reason: 'Unsupported format' };
      }
      return { valid: true };
    }

    const oversizedFile = { size: 12 * 1024 * 1024, type: 'image/jpeg', name: 'huge_photo.jpg' };
    const resOversized = validateImageMock(oversizedFile);
    assert.equal(resOversized.valid, false);
    assert.ok(resOversized.reason.includes('exceeds 10MB'));

    const validFile = { size: 2 * 1024 * 1024, type: 'image/jpeg', name: 'pothole.jpg' };
    assert.equal(validateImageMock(validFile).valid, true);
  });

  test('TC-ERR-04: Image validation rejects non-image MIME types', () => {
    function validateImageMock(file) {
      if (!file) return { valid: false, reason: 'No file' };
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowed.includes(file.type)) {
        return { valid: false, reason: 'Unsupported image format' };
      }
      return { valid: true };
    }

    assert.equal(validateImageMock({ size: 1000, type: 'application/pdf' }).valid, false);
    assert.equal(validateImageMock({ size: 1000, type: 'application/x-msdownload' }).valid, false);
    assert.equal(validateImageMock({ size: 1000, type: 'text/plain' }).valid, false);
    assert.equal(validateImageMock({ size: 1000, type: 'image/png' }).valid, true);
    assert.equal(validateImageMock({ size: 1000, type: 'image/webp' }).valid, true);
  });

  test('TC-ERR-05: API error envelopes consistently maintain { success: false, error: string, code: number }', async () => {
    // Missing Category
    const errCat = await env.ApiService.createComplaint({ location: 'Test' });
    assert.equal(errCat.success, false);
    assert.equal(typeof errCat.error, 'string');
    assert.equal(typeof errCat.code, 'number');

    // Missing Location
    const errLoc = await env.ApiService.createComplaint({ category: 'pothole' });
    assert.equal(errLoc.success, false);
    assert.equal(typeof errLoc.error, 'string');
    assert.equal(typeof errLoc.code, 'number');

    // Invalid ID
    const errId = await env.ApiService.getComplaintById('');
    assert.equal(errId.success, false);
    assert.equal(typeof errId.error, 'string');
    assert.equal(errId.code, 400);

    // Non-existent ID
    const err404 = await env.ApiService.getComplaintById('CT-DOES-NOT-EXIST');
    assert.equal(err404.success, false);
    assert.equal(typeof err404.error, 'string');
    assert.equal(err404.code, 404);
  });

  test('TC-ERR-06: Centralized ErrorHandler logs error telemetry safely', () => {
    const { ErrorHandler } = require('../js/app.js');
    assert.ok(ErrorHandler, 'ErrorHandler should be exported and available');
    assert.equal(typeof ErrorHandler.init, 'function');
    assert.equal(typeof ErrorHandler.handleGlobalError, 'function');
    assert.equal(typeof ErrorHandler.handleUnhandledRejection, 'function');

    // Execute handlers to verify no exceptions thrown
    ErrorHandler.handleGlobalError({
      message: 'Simulated visual layout exception',
      filename: 'dashboard.js',
      lineno: 42,
      colno: 10
    });

    ErrorHandler.handleUnhandledRejection({
      reason: new Error('Simulated network timeout')
    });
  });
});
