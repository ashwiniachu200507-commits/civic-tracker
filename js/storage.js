/**
 * CivicTrack AI - Storage Layer (storage.js)
 * Clean data abstraction wrapping browser localStorage.
 * Structured so it can be seamlessly swapped with Python REST API & PostgreSQL.
 */

const STORAGE_KEYS = {
  COMPLAINTS: 'civictrack_complaints_v1',
  NOTIFICATIONS: 'civictrack_notifications_v1',
  USER_PROFILE: 'civictrack_user_profile_v1',
  APP_SETTINGS: 'civictrack_settings_v1',
  INITIALIZED: 'civictrack_initialized_v1'
};

// Default Realistic Demo Complaints (Chennai Region)
const DEFAULT_COMPLAINTS = [
  {
    id: 'CT-2026-001284',
    category: 'pothole',
    categoryName: 'Pothole',
    categoryIcon: '🕳️',
    title: 'Severe deep crater pothole near junction',
    description: 'Deep 4-foot pothole on the middle of the road causing two-wheeler skidding risk near the main traffic junction.',
    location: '12th Main Road, Anna Nagar, Chennai',
    coordinates: { lat: 13.0850, lng: 80.2101 },
    severity: 'HIGH',
    priorityScore: 88,
    estimatedImpact: 'High - Risk of vehicle accidents during peak hours',
    recommendedDepartment: 'Greater Chennai Corporation - Road Maintenance',
    assignedOfficer: 'K. Senthil Kumar (AE - Zone 8)',
    status: 'IN PROGRESS',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    expectedResolutionDays: 3,
    deadlineAt: new Date(Date.now() + 70 * 3600 * 1000).toISOString(),
    imageUrl: 'assets/sample-pothole.svg',
    citizenFeedback: null,
    escalationAlert: false,
    timeline: [
      {
        stage: 'Submitted',
        title: 'Complaint Submitted',
        description: 'Complaint registered by citizen with GPS location and photo evidence.',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        actor: 'Citizen'
      },
      {
        stage: 'Verified',
        title: 'AI Vision & Geolocation Verified',
        description: 'AI Prototype Analysis verified pothole severity with 92% confidence score. Duplicate check cleared.',
        timestamp: new Date(Date.now() - 1.9 * 3600 * 1000).toISOString(),
        actor: 'CivicTrack AI Engine'
      },
      {
        stage: 'Assigned',
        title: 'Assigned to Ward Engineer',
        description: 'Routed to Road Maintenance Division (Zone 8 Anna Nagar). Work order generated.',
        timestamp: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
        actor: 'Central Dispatch System'
      },
      {
        stage: 'In Progress',
        title: 'Road Repair Work Initiated',
        description: 'Asphalt cold mix and levelling machinery deployed on site.',
        timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        actor: 'K. Senthil Kumar (AE - Zone 8)'
      }
    ]
  },
  {
    id: 'CT-2026-001280',
    category: 'streetlight',
    categoryName: 'Broken Streetlight',
    categoryIcon: '💡',
    title: 'Dark stretch with 4 continuous non-functional LED streetlights',
    description: 'Streetlights #14 through #17 have been completely dark for 3 days, causing safety concerns for pedestrians.',
    location: 'North Usman Road, T. Nagar, Chennai',
    coordinates: { lat: 13.0418, lng: 80.2341 },
    severity: 'MEDIUM',
    priorityScore: 68,
    estimatedImpact: 'Medium - Pedestrian safety and crime prevention',
    recommendedDepartment: 'TANGEDCO / GCC Electrical Division',
    assignedOfficer: 'M. Anandhan (Inspector)',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    expectedResolutionDays: 5,
    deadlineAt: new Date(Date.now() + 84 * 3600 * 1000).toISOString(),
    imageUrl: 'assets/sample-streetlight.svg',
    citizenFeedback: null, // Awaiting citizen verification
    escalationAlert: false,
    timeline: [
      {
        stage: 'Submitted',
        title: 'Complaint Submitted',
        description: 'Reported by resident of North Usman Road.',
        timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        actor: 'Citizen'
      },
      {
        stage: 'Verified',
        title: 'AI Verification Completed',
        description: 'Streetlight pole tag and defect identified.',
        timestamp: new Date(Date.now() - 35.8 * 3600 * 1000).toISOString(),
        actor: 'CivicTrack AI'
      },
      {
        stage: 'Assigned',
        title: 'Assigned to Electrical Division',
        description: 'Assigned to T. Nagar Substation team.',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        actor: 'Central Dispatch'
      },
      {
        stage: 'In Progress',
        title: 'LED Fixture Replacement in Progress',
        description: 'Capacitor replacement and driver board swap.',
        timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
        actor: 'M. Anandhan (Inspector)'
      },
      {
        stage: 'Resolved',
        title: 'Marked Resolved by Authority',
        description: 'Department reported LED fixture repaired and illuminated.',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        actor: 'M. Anandhan (Inspector)'
      }
    ]
  },
  {
    id: 'CT-2026-001275',
    category: 'drainage',
    categoryName: 'Drainage Overflow',
    categoryIcon: '🌊',
    title: 'Monsoon storm water drain blocked with heavy sewage backup',
    description: 'Black water overflowing onto pedestrian sidewalk near school zone. Severe stench and health hazard.',
    location: '100 Feet Bypass Road, Velachery, Chennai',
    coordinates: { lat: 12.9750, lng: 80.2210 },
    severity: 'CRITICAL',
    priorityScore: 94,
    estimatedImpact: 'Critical - Severe public health hazard & water contamination',
    recommendedDepartment: 'CMWSSB (Metro Water & Sewerage Board)',
    assignedOfficer: 'P. Rajesh (Executive Engineer)',
    status: 'REOPENED',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    expectedResolutionDays: 1, // 24h deadline exceeded!
    deadlineAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    imageUrl: 'assets/sample-drainage.svg',
    citizenFeedback: {
      verified: false,
      reason: 'Authority marked resolved without unclogging main underground pipe. Overflow returned within 2 hours.',
      submittedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
    },
    escalationAlert: true,
    timeline: [
      {
        stage: 'Submitted',
        title: 'Complaint Submitted',
        description: 'Reported with high urgency.',
        timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        actor: 'Citizen'
      },
      {
        stage: 'Verified',
        title: 'AI Critical Severity Flagged',
        description: 'Flagged as High Health Hazard. Priority Score 94/100.',
        timestamp: new Date(Date.now() - 71.9 * 3600 * 1000).toISOString(),
        actor: 'CivicTrack AI'
      },
      {
        stage: 'Assigned',
        title: 'Assigned to CMWSSB Velachery Unit',
        description: 'Suction jetting machine requisitioned.',
        timestamp: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
        actor: 'Emergency Cell'
      },
      {
        stage: 'Resolved',
        title: 'Prematurely Marked Resolved',
        description: 'Surface cleaning logged by contractor.',
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        actor: 'CMWSSB Field Staff'
      },
      {
        stage: 'Reopened',
        title: 'REOPENED BY CITIZEN (Verification Failed)',
        description: 'Citizen rejected resolution: "Main pipe still clogged, overflow returned". Escalated to Superintending Engineer.',
        timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        actor: 'Citizen Accountability Verification'
      }
    ]
  },
  {
    id: 'CT-2026-001262',
    category: 'garbage',
    categoryName: 'Garbage Dump',
    categoryIcon: '🗑️',
    title: 'Overflowing community bin with construction debris on corner',
    description: 'Commercial waste and dry trash spilling across road width preventing normal traffic flow.',
    location: 'Luz Church Road, Mylapore, Chennai',
    coordinates: { lat: 13.0339, lng: 80.2676 },
    severity: 'MEDIUM',
    priorityScore: 62,
    estimatedImpact: 'Medium - Hygiene, odor and street blockage',
    recommendedDepartment: 'GCC Solid Waste Management (Urbaser Sumeet)',
    assignedOfficer: 'R. Balaji (Sanitation Officer)',
    status: 'CITIZEN VERIFIED',
    createdAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    expectedResolutionDays: 3,
    deadlineAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    imageUrl: 'assets/sample-garbage.svg',
    citizenFeedback: {
      verified: true,
      reason: 'Compactor vehicle arrived and cleared entire trash pile cleanly. Bleaching powder applied.',
      submittedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
    },
    escalationAlert: false,
    timeline: [
      {
        stage: 'Submitted',
        title: 'Complaint Submitted',
        description: 'Photo uploaded showing overflow.',
        timestamp: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
        actor: 'Citizen'
      },
      {
        stage: 'Verified',
        title: 'AI Verification Done',
        description: 'Identified solid waste cluster.',
        timestamp: new Date(Date.now() - 95.8 * 3600 * 1000).toISOString(),
        actor: 'CivicTrack AI'
      },
      {
        stage: 'Assigned',
        title: 'Assigned to Ward 124 Conservancy Team',
        description: 'Truck dispatched.',
        timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        actor: 'Urbaser Sumeet'
      },
      {
        stage: 'In Progress',
        title: 'Waste Clearance in Progress',
        description: 'Bin cleared and sanitized.',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        actor: 'Sanitation Crew'
      },
      {
        stage: 'Resolved',
        title: 'Department Marked Resolved',
        description: 'Clearance verified by supervisor.',
        timestamp: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
        actor: 'R. Balaji (Sanitation Officer)'
      },
      {
        stage: 'Citizen Verified',
        title: 'CITIZEN VERIFIED & CLOSED',
        description: 'Citizen confirmed problem was 100% resolved on-ground.',
        timestamp: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
        actor: 'Citizen'
      }
    ]
  },
  {
    id: 'CT-2026-001255',
    category: 'traffic',
    categoryName: 'Traffic Signal',
    categoryIcon: '🚦',
    title: 'Blinking amber malfunction on 4-way intersection signal',
    description: 'Traffic light is stuck in emergency flashing mode causing vehicular chaos during morning rush hour.',
    location: 'Central Junction (EVR Periyar Salai), Chennai',
    coordinates: { lat: 13.0827, lng: 80.2707 },
    severity: 'HIGH',
    priorityScore: 89,
    estimatedImpact: 'High - Heavy traffic gridlock and pedestrian crossing danger',
    recommendedDepartment: 'Greater Chennai Traffic Police (Signals Division)',
    assignedOfficer: 'S. Karthikeyan (Traffic SI)',
    status: 'ASSIGNED',
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    expectedResolutionDays: 1,
    deadlineAt: new Date(Date.now() + 16 * 3600 * 1000).toISOString(),
    imageUrl: 'assets/sample-traffic.svg',
    citizenFeedback: null,
    escalationAlert: false,
    timeline: [
      {
        stage: 'Submitted',
        title: 'Complaint Submitted',
        description: 'Reported by commuter at Central Junction.',
        timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        actor: 'Citizen'
      },
      {
        stage: 'Verified',
        title: 'AI Signal Anomaly Detected',
        description: 'Auto-categorized as Signal Controller fault.',
        timestamp: new Date(Date.now() - 7.9 * 3600 * 1000).toISOString(),
        actor: 'CivicTrack AI'
      },
      {
        stage: 'Assigned',
        title: 'Assigned to Signal Tech Unit',
        description: 'Technician dispatched for motherboard inspection.',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        actor: 'Traffic Control Room'
      }
    ]
  },
  {
    id: 'CT-2026-001248',
    category: 'road_damage',
    categoryName: 'Road Damage',
    categoryIcon: '🛣️',
    title: 'Sunken trench from optical fiber cable digging',
    description: 'Road surface excavated for cable laying was filled with loose sand without proper asphalt sealing.',
    location: 'LB Road, Adyar, Chennai',
    coordinates: { lat: 13.0012, lng: 80.2565 },
    severity: 'MEDIUM',
    priorityScore: 58,
    estimatedImpact: 'Medium - Unstable surface for two-wheelers',
    recommendedDepartment: 'GCC Special Projects / Roads',
    assignedOfficer: 'D. Vinod (Engineer)',
    status: 'SUBMITTED',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    expectedResolutionDays: 5,
    deadlineAt: new Date(Date.now() + 117 * 3600 * 1000).toISOString(),
    imageUrl: 'assets/sample-pothole.svg',
    citizenFeedback: null,
    escalationAlert: false,
    timeline: [
      {
        stage: 'Submitted',
        title: 'Complaint Submitted',
        description: 'Logged with geolocation tag.',
        timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        actor: 'Citizen'
      }
    ]
  },
  {
    id: 'CT-2026-001240',
    category: 'drainage',
    categoryName: 'Drainage Issue',
    categoryIcon: '🌊',
    title: 'Manhole cover broken and open on walkway',
    description: 'Missing concrete slab cover over drainage line on pedestrian footpath. Fatal fall hazard at night.',
    location: 'Gandhi Irwin Road, Egmore, Chennai',
    coordinates: { lat: 13.0780, lng: 80.2610 },
    severity: 'CRITICAL',
    priorityScore: 96,
    estimatedImpact: 'Critical - Fatal pedestrian hazard',
    recommendedDepartment: 'CMWSSB & GCC Roads',
    assignedOfficer: 'V. Prakash (AEE)',
    status: 'IN PROGRESS',
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    expectedResolutionDays: 1,
    deadlineAt: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
    imageUrl: 'assets/sample-drainage.svg',
    citizenFeedback: null,
    escalationAlert: false,
    timeline: [
      {
        stage: 'Submitted',
        title: 'Emergency Complaint Submitted',
        description: 'Hazard tagged by pedestrian.',
        timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        actor: 'Citizen'
      },
      {
        stage: 'Verified',
        title: 'AI Emergency Tagged',
        description: 'Auto-prioritized with 96/100 Priority Score.',
        timestamp: new Date(Date.now() - 13.9 * 3600 * 1000).toISOString(),
        actor: 'CivicTrack AI'
      },
      {
        stage: 'In Progress',
        title: 'Barricade Placed & Replacement Slab Dispatched',
        description: 'Temporary red warning barricade positioned.',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        actor: 'CMWSSB Emergency Response Unit'
      }
    ]
  },
  {
    id: 'CT-2026-001235',
    category: 'pothole',
    categoryName: 'Pothole',
    categoryIcon: '🕳️',
    title: 'Series of 3 deep potholes on flyover descent',
    description: 'Flyover exit ramp has asphalt erosion creating sudden braking hazard.',
    location: 'G.S.T. Road, Guindy, Chennai',
    coordinates: { lat: 13.0067, lng: 80.2024 },
    severity: 'HIGH',
    priorityScore: 84,
    estimatedImpact: 'High - High-speed flyover vehicle collision hazard',
    recommendedDepartment: 'Highways Department (Chennai City Roads)',
    assignedOfficer: 'N. Raghavan (Highways AE)',
    status: 'VERIFIED',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4.9 * 3600 * 1000).toISOString(),
    expectedResolutionDays: 3,
    deadlineAt: new Date(Date.now() + 67 * 3600 * 1000).toISOString(),
    imageUrl: 'assets/sample-pothole.svg',
    citizenFeedback: null,
    escalationAlert: false,
    timeline: [
      {
        stage: 'Submitted',
        title: 'Complaint Submitted',
        description: 'Reported with flyover ramp coordinates.',
        timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        actor: 'Citizen'
      },
      {
        stage: 'Verified',
        title: 'AI Verified & Categorized',
        description: 'Pothole cluster confirmed via image edge detection.',
        timestamp: new Date(Date.now() - 4.9 * 3600 * 1000).toISOString(),
        actor: 'CivicTrack AI'
      }
    ]
  },
  {
    id: 'CT-2026-001220',
    category: 'property_damage',
    categoryName: 'Public Property',
    categoryIcon: '🌳',
    title: 'Heavy fallen bough blocking bus stop shelter',
    description: 'Uprooted tree branch cracked bus stop roof sheet and partially blocks road.',
    location: 'Sterling Road, Nungambakkam, Chennai',
    coordinates: { lat: 13.0604, lng: 80.2390 },
    severity: 'MEDIUM',
    priorityScore: 65,
    estimatedImpact: 'Medium - Bus passenger access blocked',
    recommendedDepartment: 'GCC Parks & Tree Pruning Unit',
    assignedOfficer: 'G. Murugan (Parks Superintendent)',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    expectedResolutionDays: 2,
    deadlineAt: new Date(Date.now() - 0 * 3600 * 1000).toISOString(),
    imageUrl: 'assets/sample-garbage.svg',
    citizenFeedback: null,
    escalationAlert: false,
    timeline: [
      {
        stage: 'Submitted',
        title: 'Complaint Submitted',
        description: 'Reported by commuter.',
        timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        actor: 'Citizen'
      },
      {
        stage: 'Verified',
        title: 'AI Verification',
        description: 'Identified fallen branch tree debris.',
        timestamp: new Date(Date.now() - 47.8 * 3600 * 1000).toISOString(),
        actor: 'CivicTrack AI'
      },
      {
        stage: 'Resolved',
        title: 'Branch Cleared & Roof Sheet Re-fastened',
        description: 'Hydraulic saw team removed obstruction.',
        timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        actor: 'G. Murugan (Parks Superintendent)'
      }
    ]
  },
  {
    id: 'CT-2026-001210',
    category: 'garbage',
    categoryName: 'Garbage Dump',
    categoryIcon: '🗑️',
    title: 'Plastic waste piling near storm drain inlet',
    description: 'Single-use plastic bags accumulated around rainwater inlet grate risking blockage during rain.',
    location: '1st Avenue, Besant Nagar, Chennai',
    coordinates: { lat: 13.0002, lng: 80.2690 },
    severity: 'LOW',
    priorityScore: 42,
    estimatedImpact: 'Low - Preventive maintenance before rains',
    recommendedDepartment: 'GCC Sanitation Ward 175',
    assignedOfficer: 'S. Selvaraj (Supervisor)',
    status: 'CITIZEN VERIFIED',
    createdAt: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
    expectedResolutionDays: 7,
    deadlineAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    imageUrl: 'assets/sample-garbage.svg',
    citizenFeedback: {
      verified: true,
      reason: 'Inlet grate completely cleared and swept.',
      submittedAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString()
    },
    escalationAlert: false,
    timeline: [
      {
        stage: 'Submitted',
        title: 'Complaint Submitted',
        description: 'Preventive report filed.',
        timestamp: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
        actor: 'Citizen'
      },
      {
        stage: 'Resolved',
        title: 'Inlet Cleared & Waste Bagged',
        description: 'Sanitation team cleared inlet grate.',
        timestamp: new Date(Date.now() - 42 * 3600 * 1000).toISOString(),
        actor: 'S. Selvaraj (Supervisor)'
      },
      {
        stage: 'Citizen Verified',
        title: 'CITIZEN VERIFIED & CLOSED',
        description: 'Citizen verified resolution on-site.',
        timestamp: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
        actor: 'Citizen'
      }
    ]
  }
];

// Default Initial Notifications
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'NOTIF-1',
    complaintId: 'CT-2026-001280',
    title: 'Verification Needed: Broken Streetlight',
    message: 'Department has marked complaint CT-2026-001280 as RESOLVED. Please verify if the streetlights are working.',
    type: 'verification',
    unread: true,
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  },
  {
    id: 'NOTIF-2',
    complaintId: 'CT-2026-001275',
    title: '⚠️ Escalation Recommended: Drainage Overflow',
    message: 'Complaint CT-2026-001275 exceeded its 24h SLA deadline and was reopened by citizen verification.',
    type: 'escalation',
    unread: true,
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  },
  {
    id: 'NOTIF-3',
    complaintId: 'CT-2026-001284',
    title: 'Repair Work In Progress: Pothole',
    message: 'Road Maintenance crew has started asphalt repair work on 12th Main Road.',
    type: 'progress',
    unread: true,
    timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
  },
  {
    id: 'NOTIF-4',
    complaintId: 'CT-2026-001255',
    title: 'Assigned: Traffic Signal Issue',
    message: 'Your report regarding Central Junction traffic light was assigned to Signals Tech Unit.',
    type: 'assigned',
    unread: false,
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  }
];

// Default User Profile
const DEFAULT_PROFILE = {
  name: 'Arun Kumar',
  phone: '+91 98401 23456',
  email: 'arun.civic@example.com',
  ward: 'Ward 104 - Anna Nagar (Zone 8)',
  city: 'Chennai',
  notificationsEnabled: true,
  language: 'en',
  theme: 'light'
};

// Default Settings
const DEFAULT_SETTINGS = {
  language: 'en', // 'en' or 'ta'
  theme: 'light',   // 'light' or 'dark'
  gpsAllowed: true,
  autoVerifyWithAI: true
};

/**
 * Storage Service API Layer
 */
const StorageService = {
  // Initialize storage with demo data if first run
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      this.resetDemoData();
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  },

  // Get all complaints
  getComplaints() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPLAINTS);
      return data ? JSON.parse(data) : DEFAULT_COMPLAINTS;
    } catch (e) {
      console.error('Failed to load complaints from localStorage', e);
      return DEFAULT_COMPLAINTS;
    }
  },

  // Save complaints array
  saveComplaints(complaints) {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
    } catch (e) {
      console.error('Failed to save complaints', e);
    }
  },

  // Get single complaint by ID
  getComplaintById(id) {
    const list = this.getComplaints();
    return list.find(c => c.id === id) || null;
  },

  // Add new complaint
  addComplaint(newComplaint) {
    const list = this.getComplaints();
    list.unshift(newComplaint);
    this.saveComplaints(list);
    return newComplaint;
  },

  // Update existing complaint
  updateComplaint(id, updates) {
    const list = this.getComplaints();
    const index = list.findIndex(c => c.id === id);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveComplaints(list);
      return list[index];
    }
    return null;
  },

  // Notifications
  getNotifications() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : DEFAULT_NOTIFICATIONS;
    } catch (e) {
      return DEFAULT_NOTIFICATIONS;
    }
  },

  saveNotifications(notifications) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  addNotification(notif) {
    const list = this.getNotifications();
    list.unshift({
      id: 'NOTIF-' + Date.now(),
      unread: true,
      timestamp: new Date().toISOString(),
      ...notif
    });
    this.saveNotifications(list);
  },

  markNotificationRead(id) {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.unread = false;
      this.saveNotifications(list);
    }
  },

  markAllNotificationsRead() {
    const list = this.getNotifications().map(n => ({ ...n, unread: false }));
    this.saveNotifications(list);
  },

  // User Profile
  getProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : DEFAULT_PROFILE;
    } catch (e) {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile) {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  // Settings
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
  },

  // Reset demo data
  resetDemoData() {
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(DEFAULT_COMPLAINTS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(DEFAULT_PROFILE));
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    console.log('CivicTrack AI: Demo data loaded successfully.');
  },

  // Clear all data
  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.COMPLAINTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.APP_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  }
};

// Initialize immediately on script load
StorageService.init();
