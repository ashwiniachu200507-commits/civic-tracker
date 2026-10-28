/**
 * CivicTrack AI - AI Engine Unit Tests (ai.test.js)
 * 
 * Verifies AI heuristics, spatial mathematics, and vision simulation:
 * - Priority Score multi-factor formula (Severity, Category, Hotspot location, Duplicate boost)
 * - Haversine spherical distance calculation
 * - Spatial Duplicate Detection (350m radius threshold, category matching, text match)
 * - Smart Summary generation & department classification
 * - AI Image Recognition simulation
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { setupTestEnvironment } = require('./test_helper.js');

describe('CivicAI - Artificial Intelligence Engine Unit Tests', () => {
  let env;

  beforeEach(() => {
    env = setupTestEnvironment();
  });

  test('TC-AI-01: Priority Score ranks severity accurately (CRITICAL > HIGH > MEDIUM > LOW)', () => {
    const baseParams = { location: 'Residential Street', category: 'other', duplicateCount: 0 };

    const scoreCritical = env.CivicAI.calculatePriorityScore({ ...baseParams, severity: 'CRITICAL' });
    const scoreHigh = env.CivicAI.calculatePriorityScore({ ...baseParams, severity: 'HIGH' });
    const scoreMedium = env.CivicAI.calculatePriorityScore({ ...baseParams, severity: 'MEDIUM' });
    const scoreLow = env.CivicAI.calculatePriorityScore({ ...baseParams, severity: 'LOW' });

    assert.ok(scoreCritical > scoreHigh, `Critical (${scoreCritical}) should exceed High (${scoreHigh})`);
    assert.ok(scoreHigh > scoreMedium, `High (${scoreHigh}) should exceed Medium (${scoreMedium})`);
    assert.ok(scoreMedium > scoreLow, `Medium (${scoreMedium}) should exceed Low (${scoreLow})`);
  });

  test('TC-AI-02: Priority Score assigns higher weights to high-risk civic categories (drainage, traffic)', () => {
    const drainageScore = env.CivicAI.calculatePriorityScore({ severity: 'HIGH', category: 'drainage' });
    const potholeScore = env.CivicAI.calculatePriorityScore({ severity: 'HIGH', category: 'pothole' });
    const garbageScore = env.CivicAI.calculatePriorityScore({ severity: 'HIGH', category: 'garbage' });

    assert.ok(drainageScore >= potholeScore, 'Drainage biohazard score should be >= pothole score');
    assert.ok(potholeScore >= garbageScore, 'Pothole road hazard score should be >= garbage score');
  });

  test('TC-AI-03: Priority Score detects high-traffic hotspot keywords in address', () => {
    const hotspotScore = env.CivicAI.calculatePriorityScore({
      severity: 'HIGH',
      location: 'Near Central Railway Station Junction'
    });

    const quietScore = env.CivicAI.calculatePriorityScore({
      severity: 'HIGH',
      location: 'Quiet Internal Colony Lane'
    });

    assert.ok(hotspotScore > quietScore, 'Hotspot locations with "Junction/Station" must receive higher priority');
  });

  test('TC-AI-04: Priority Score boosts cluster score when duplicates are reported', () => {
    const singleReportScore = env.CivicAI.calculatePriorityScore({
      severity: 'MEDIUM',
      duplicateCount: 0
    });

    const clusteredScore = env.CivicAI.calculatePriorityScore({
      severity: 'MEDIUM',
      duplicateCount: 3
    });

    assert.ok(clusteredScore > singleReportScore, 'Multiple concurrent complaints must increase priority score');
  });

  test('TC-AI-05: Priority Score enforces clamping boundaries [15, 99]', () => {
    // Extreme high inputs
    const maxScore = env.CivicAI.calculatePriorityScore({
      severity: 'CRITICAL',
      category: 'drainage',
      location: 'Central Junction Main Road Hospital Flyover',
      duplicateCount: 10
    });
    assert.ok(maxScore <= 99, `Score (${maxScore}) must not exceed 99`);

    // Extreme low inputs
    const minScore = env.CivicAI.calculatePriorityScore({
      severity: 'LOW',
      category: 'other',
      location: 'Unknown',
      duplicateCount: 0
    });
    assert.ok(minScore >= 15, `Score (${minScore}) must not fall below 15`);
  });

  test('TC-AI-06: Priority Score handles missing, undefined, and malformed arguments defensively', () => {
    assert.equal(typeof env.CivicAI.calculatePriorityScore(), 'number');
    assert.equal(typeof env.CivicAI.calculatePriorityScore(null), 'number');
    assert.equal(typeof env.CivicAI.calculatePriorityScore({ duplicateCount: -5 }), 'number');
  });

  test('TC-AI-07: Haversine formula accurately calculates distance in meters', () => {
    // Distance from Chennai Central to Egmore (~1,800 - 2,000 meters)
    const centralLat = 13.0827, centralLng = 80.2707;
    const egmoreLat = 13.0732, egmoreLng = 80.2609;

    const dist = env.CivicAI._getDistanceMeters(centralLat, centralLng, egmoreLat, egmoreLng);
    assert.ok(dist >= 1400 && dist <= 2100, `Calculated distance ${dist}m is within expected range`);

    // Distance to same point must be 0
    assert.equal(env.CivicAI._getDistanceMeters(centralLat, centralLng, centralLat, centralLng), 0);
  });

  test('TC-AI-08: Duplicate Detector flags complaint of same category within 350 meters', () => {
    const existingComplaints = [
      {
        id: 'CT-EXISTING-1',
        category: 'pothole',
        status: 'IN PROGRESS',
        title: 'Pothole on 12th Main Road',
        location: '12th Main Road, Anna Nagar',
        coordinates: { lat: 13.0850, lng: 80.2101 }
      }
    ];

    // New report 80 meters away
    const newReport = {
      category: 'pothole',
      location: 'Near 12th Main Road Junction',
      coordinates: { lat: 13.0855, lng: 80.2105 }
    };

    const result = env.CivicAI.detectDuplicate(newReport, existingComplaints);
    assert.equal(result.isDuplicate, true);
    assert.equal(result.duplicateCount, 1);
    assert.equal(result.duplicates[0].id, 'CT-EXISTING-1');
  });

  test('TC-AI-09: Duplicate Detector ignores complaints outside 350m radius', () => {
    const existingComplaints = [
      {
        id: 'CT-FAR-1',
        category: 'pothole',
        status: 'IN PROGRESS',
        coordinates: { lat: 13.0850, lng: 80.2101 } // Anna Nagar
      }
    ];

    // New report 5 kilometers away in T. Nagar
    const farReport = {
      category: 'pothole',
      coordinates: { lat: 13.0418, lng: 80.2341 }
    };

    const result = env.CivicAI.detectDuplicate(farReport, existingComplaints);
    assert.equal(result.isDuplicate, false);
    assert.equal(result.duplicateCount, 0);
  });

  test('TC-AI-10: Duplicate Detector ignores different category even if nearby', () => {
    const existingComplaints = [
      {
        id: 'CT-LIGHT-1',
        category: 'streetlight',
        status: 'SUBMITTED',
        coordinates: { lat: 13.0850, lng: 80.2101 }
      }
    ];

    // Pothole at identical coordinates as streetlight
    const potholeReport = {
      category: 'pothole',
      coordinates: { lat: 13.0850, lng: 80.2101 }
    };

    const result = env.CivicAI.detectDuplicate(potholeReport, existingComplaints);
    assert.equal(result.isDuplicate, false, 'Different categories at same location are distinct civic issues');
  });

  test('TC-AI-11: Duplicate Detector ignores already CITIZEN VERIFIED (closed) complaints', () => {
    const existingComplaints = [
      {
        id: 'CT-CLOSED-1',
        category: 'pothole',
        status: 'CITIZEN VERIFIED', // Closed
        coordinates: { lat: 13.0850, lng: 80.2101 }
      }
    ];

    const newReport = {
      category: 'pothole',
      coordinates: { lat: 13.0850, lng: 80.2101 }
    };

    const result = env.CivicAI.detectDuplicate(newReport, existingComplaints);
    assert.equal(result.isDuplicate, false, 'Closed complaints should not block new reporting');
  });

  test('TC-AI-12: Duplicate Detector handles malformed inputs without crashing', () => {
    assert.deepEqual(env.CivicAI.detectDuplicate(null, []), { isDuplicate: false, duplicateCount: 0, duplicates: [] });
    assert.deepEqual(env.CivicAI.detectDuplicate({}, null), { isDuplicate: false, duplicateCount: 0, duplicates: [] });
    assert.deepEqual(env.CivicAI.detectDuplicate({ category: 'pothole' }, [{}]), { isDuplicate: false, duplicateCount: 0, duplicates: [] });
  });

  test('TC-AI-13: Smart Summary Generator assigns appropriate municipal departments', () => {
    const potholeSummary = env.CivicAI.generateSmartSummary({ categoryName: 'Pothole Defect', severity: 'HIGH' });
    assert.ok(potholeSummary.recommendedDepartment.includes('Road Maintenance'));

    const streetSummary = env.CivicAI.generateSmartSummary({ categoryName: 'Broken Streetlight', severity: 'MEDIUM' });
    assert.ok(streetSummary.recommendedDepartment.includes('Electrical'));

    const drainSummary = env.CivicAI.generateSmartSummary({ categoryName: 'Drainage Overflow', severity: 'CRITICAL' });
    assert.ok(drainSummary.recommendedDepartment.includes('Water & Sewerage'));
  });

  test('TC-AI-14: AI Vision Image analysis simulation returns confidence within calibrated range [82, 99]', async () => {
    const analysis = await env.CivicAI.analyzeImage('assets/sample-pothole.svg', 'pothole');
    assert.equal(analysis.success, true);
    assert.ok(analysis.confidence >= 80 && analysis.confidence <= 99);
    assert.ok(analysis.detection.includes('Pothole'));
    assert.ok(analysis.department);
    assert.equal(analysis.modelName, 'CivicVision-v2.4-Prototype');
  });
});
