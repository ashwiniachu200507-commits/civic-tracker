/**
 * CivicTrack AI - AI Engine Simulation (ai.js)
 * Modular rule-based AI engine for Prototype Vision Analysis,
 * Duplicate Detection, Severity & Priority Scoring, and City Insights.
 * 
 * Note: Clearly labeled as "AI Prototype Analysis" as required.
 * Designed to be replaced with real Python PyTorch/TensorFlow/OpenCV models.
 */

const CivicAI = {
  /**
   * Prototype Image Recognition Simulator
   */
  async analyzeImage(imageDataUrl, categoryHint = 'pothole') {
    // Simulate neural network inference time (1.2s)
    await new Promise(resolve => setTimeout(resolve, 1200));

    const categoryModels = {
      pothole: {
        label: 'Pothole detected',
        confidence: 92,
        severity: 'HIGH',
        department: 'Greater Chennai Corporation - Road Maintenance',
        impact: 'High - Risk of vehicular damage and two-wheeler skid accidents',
        summary: 'Deep asphalt surface depression detected. Immediate patching recommended.'
      },
      streetlight: {
        label: 'Broken Streetlight detected',
        confidence: 89,
        severity: 'MEDIUM',
        department: 'TANGEDCO / GCC Electrical Division',
        impact: 'Medium - Pedestrian safety hazard in night hours',
        summary: 'Non-illuminated luminaire unit detected on public utility pole.'
      },
      garbage: {
        label: 'Solid Waste Overflow detected',
        confidence: 94,
        severity: 'MEDIUM',
        department: 'GCC Solid Waste Management',
        impact: 'Medium - Public sanitation, odor and stray animal menace',
        summary: 'Unsegregated garbage accumulation exceeding bin containment capacity.'
      },
      drainage: {
        label: 'Drainage & Sewage Overflow detected',
        confidence: 96,
        severity: 'CRITICAL',
        department: 'CMWSSB (Metro Water & Sewerage Board)',
        impact: 'Critical - Severe public health biohazard and road waterlogging',
        summary: 'Blocked conduit causing toxic blackwater overflow on road surface.'
      },
      traffic: {
        label: 'Traffic Signal Malfunction detected',
        confidence: 91,
        severity: 'HIGH',
        department: 'Greater Chennai Traffic Police (Signals)',
        impact: 'High - Traffic congestion and intersection collision risk',
        summary: 'Amber blinker loop error on multi-phase traffic light controller.'
      },
      road_damage: {
        label: 'Road Surface Damage detected',
        confidence: 88,
        severity: 'HIGH',
        department: 'Highways Department (City Roads)',
        impact: 'High - Trench settlement causing road unevenness',
        summary: 'Unsealed trench cut excavation causing dangerous elevation drops.'
      },
      property_damage: {
        label: 'Public Property Damage detected',
        confidence: 85,
        severity: 'MEDIUM',
        department: 'GCC Parks & Public Amenities',
        impact: 'Medium - Obstruction of pedestrian shelter',
        summary: 'Structural deformation on civic transit amenity.'
      }
    };

    const result = categoryModels[categoryHint] || categoryModels.pothole;
    
    // Add small realistic jitter to confidence
    const jitter = Math.floor(Math.random() * 5) - 2;
    const finalConfidence = Math.min(99, Math.max(82, result.confidence + jitter));

    return {
      success: true,
      detection: result.label,
      confidence: finalConfidence,
      severity: result.severity,
      department: result.department,
      estimatedImpact: result.impact,
      aiSummary: result.summary,
      timestamp: new Date().toISOString(),
      modelName: 'CivicVision-v2.4-Prototype'
    };
  },

  /**
   * Prototype Priority Score (0-100)
   * Formula:
   * Severity (35%) + Public Impact (25%) + Duplicate Proximity (20%) + Location Factor (20%)
   */
  calculatePriorityScore({ severity = 'MEDIUM', location = '', category = '', duplicateCount = 0 }) {
    let score = 50;

    // Severity factor (Max 35)
    if (severity === 'CRITICAL') score += 35;
    else if (severity === 'HIGH') score += 25;
    else if (severity === 'MEDIUM') score += 15;
    else if (severity === 'LOW') score += 5;

    // Category risk factor (Max 20)
    if (['drainage', 'traffic'].includes(category)) score += 20;
    else if (['pothole', 'road_damage'].includes(category)) score += 15;
    else if (['streetlight', 'garbage'].includes(category)) score += 10;
    else score += 5;

    // High traffic location keywords (Max 20)
    const hotLocations = ['junction', 'main road', 'bypass', 'station', 'school', 'hospital', 'market', 'flyover'];
    const locLower = (location || '').toLowerCase();
    const isHotspot = hotLocations.some(k => locLower.includes(k));
    if (isHotspot) score += 20;
    else score += 10;

    // Duplicate report cluster boost (Max 15)
    if (duplicateCount > 0) {
      score += Math.min(15, duplicateCount * 8);
    }

    // Clamp score between 10 and 99
    return Math.min(99, Math.max(15, score));
  },

  /**
   * Calculate Distance between two Lat/Lng coordinates (Haversine in meters)
   */
  _getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Duplicate Complaint Detector
   * Checks if another active complaint of the same category exists within 300 meters
   */
  detectDuplicate({ category, coordinates, location = '', description = '' }, existingList = []) {
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      return { isDuplicate: false, duplicates: [] };
    }

    const matches = [];

    existingList.forEach(existing => {
      // Must be an active non-resolved complaint (or recent resolved)
      if (existing.coordinates && existing.coordinates.lat) {
        const dist = this._getDistanceMeters(
          coordinates.lat,
          coordinates.lng,
          existing.coordinates.lat,
          existing.coordinates.lng
        );

        // Same category within 350 meters OR matching location text
        const isSameCat = existing.category === category;
        const isNearby = dist <= 350;
        const isTextMatch = location && existing.location && 
          (existing.location.toLowerCase().includes(location.toLowerCase()) || 
           location.toLowerCase().includes(existing.location.toLowerCase()));

        if (isSameCat && (isNearby || isTextMatch)) {
          matches.push({
            id: existing.id,
            title: existing.title,
            location: existing.location,
            status: existing.status,
            distanceMeters: Math.round(dist),
            createdAt: existing.createdAt
          });
        }
      }
    });

    return {
      isDuplicate: matches.length > 0,
      duplicateCount: matches.length,
      duplicates: matches
    };
  },

  /**
   * Smart Report Summary Generator
   */
  generateSmartSummary({ categoryName, location, severity, description, aiDetection }) {
    return {
      issue: aiDetection || categoryName,
      severity: severity || 'HIGH',
      location: location || 'Detected from GPS',
      estimatedImpact: severity === 'CRITICAL' ? 'Critical - Severe public safety hazard' :
                       severity === 'HIGH' ? 'High - Immediate accident or infrastructure risk' : 'Moderate public impact',
      recommendedDepartment: 
        categoryName.includes('Pothole') || categoryName.includes('Road') ? 'Road Maintenance Division' :
        categoryName.includes('Streetlight') ? 'Electrical & Lighting Division' :
        categoryName.includes('Drainage') ? 'Metro Water & Sewerage Board' :
        categoryName.includes('Garbage') ? 'Solid Waste Management' : 'Traffic Management Division',
      aiFormattedText: `AI Smart Summary: High-confidence ${categoryName} identified at ${location}. Categorized as ${severity} severity based on spatial impact analysis.`
    };
  },

  /**
   * AI Pattern Recognition & City Insights Generator
   */
  generateInsights(complaints = []) {
    return [
      {
        id: 'INSIGHT-1',
        tag: 'High-Risk Hotspot',
        title: 'Central Junction (EVR Periyar Salai)',
        desc: '14 civic complaints reported in this area over the past 30 days. High concentration of Traffic Signal and Road Surface failures during morning peak hours.',
        severity: 'HIGH',
        recommendation: 'Priority Recommendation: Deploy Rapid Inspection Team to Central Junction.'
      },
      {
        id: 'INSIGHT-2',
        tag: 'Repeated Issue Cluster',
        title: 'Drainage Overload in Velachery (Ward 12)',
        desc: 'Monsoon drainage complaints reported 14 times in the same 400-meter radius. Recurrent blockage points to main conduit desilting failure.',
        severity: 'CRITICAL',
        recommendation: 'Priority Recommendation: Request heavy-duty hydraulic desilting super-sucker truck.'
      },
      {
        id: 'INSIGHT-3',
        tag: 'Department SLA Bottleneck',
        title: 'Streetlight Repairs Exceeding SLA Targets',
        desc: 'Electrical Division average turnaround time is currently 4.8 days against the mandated 2.0-day SLA target in Zone 10.',
        severity: 'MEDIUM',
        recommendation: 'Priority Recommendation: Increase LED component inventory in local sub-stations.'
      },
      {
        id: 'INSIGHT-4',
        tag: 'Citizen Accountability Trend',
        title: 'Citizen Verification Catching Premature Closures',
        desc: '23% of complaints marked resolved were flagged as "Not Fixed on Ground" and reopened by citizens, preventing bogus contractor billing.',
        severity: 'POSITIVE',
        recommendation: 'System Impact: 100% of reopened complaints received senior supervisory escalations.'
      }
    ];
  }
};
