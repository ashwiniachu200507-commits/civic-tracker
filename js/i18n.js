/**
 * CivicTrack AI - Internationalization & Language Switcher (i18n.js)
 * Real-time dynamic English ↔ Tamil (தமிழ்) translation system.
 */

const I18N_TRANSLATIONS = {
  en: {
    app_title: 'CivicTrack AI',
    app_tagline: 'Report the Problem. Track the Action. Verify the Solution.',
    app_quote: 'Complaint poda mattum illa — resolution varaikkum track pannura system.',
    hero_headline: 'Your City. Your Voice. Your Impact.',
    hero_subheadline: 'Transparent civic reporting powered by AI verification, SLA accountability, and mandatory Citizen Verification.',
    
    // Navigation
    nav_dashboard: 'Dashboard',
    nav_report: 'Report Issue',
    nav_complaints: 'My Complaints',
    nav_map: 'Civic Map',
    nav_public: 'Public Dashboard',
    nav_insights: 'AI Insights',
    nav_notifications: 'Notifications',
    nav_profile: 'Profile & Settings',

    // Stats
    stat_total_reports: 'TOTAL REPORTS',
    stat_resolved: 'RESOLVED',
    stat_pending: 'PENDING',
    stat_high_priority: 'HIGH PRIORITY',
    stat_resolution_rate: 'Resolution Rate',
    stat_avg_time: 'Avg Resolution Time',

    // Buttons
    btn_report_problem: '+ Report a Problem',
    btn_view_map: 'View Civic Map',
    btn_public_stats: 'Public Dashboard',
    btn_submit_complaint: 'Submit Complaint',
    btn_use_location: 'Use My Location',
    btn_take_photo: 'Take Live Photo',
    btn_upload_photo: 'Upload Image',
    btn_view_details: 'View Timeline & Details',
    btn_yes_fixed: 'YES, ISSUE FIXED',
    btn_no_exists: 'NO, STILL EXISTS (REOPEN)',
    btn_simulate_resolution: 'Simulate Authority Resolution',
    btn_load_demo: 'Load Demo Data',
    btn_clear_data: 'Clear Storage',
    btn_submit_anyway: 'Submit Anyway',
    btn_view_existing: 'View Existing Complaint',

    // Categories
    cat_all: 'All Issues',
    cat_pothole: 'Pothole',
    cat_streetlight: 'Streetlight',
    cat_garbage: 'Garbage Dump',
    cat_drainage: 'Drainage Overflow',
    cat_traffic: 'Traffic Signal',
    cat_road_damage: 'Road Damage',
    cat_property_damage: 'Public Property',
    cat_other: 'Other Issue',

    // Statuses
    status_submitted: 'Submitted',
    status_verified: 'AI Verified',
    status_assigned: 'Assigned',
    status_in_progress: 'In Progress',
    status_resolved: 'Resolved',
    status_citizen_verified: 'Citizen Verified',
    status_reopened: 'Reopened',

    // Verification
    verify_heading: 'Has this problem actually been fixed?',
    verify_sub: 'Citizen verification prevents false closures. Your confirmation holds civic contractors accountable.',
    reopened_notice: 'Thank you. The issue has been reopened for immediate supervisor escalation.'
  },

  ta: {
    app_title: 'சிவிக் ட்ராக் AI',
    app_tagline: 'பிரச்சினையைப் பதிவு செய். நடவடிக்கையைக் கண்காணி. தீர்வை உறுதிசெய்.',
    app_quote: 'புகார் போட மட்டும் இல்ல — தீர்வு வரைக்கும் ட்ராக் பண்ணுற சிஸ்டம்.',
    hero_headline: 'உங்கள் நகரம். உங்கள் குரல். உங்கள் உரிமை.',
    hero_subheadline: 'AI சரிபார்ப்பு, காலக்கெடு பொறுப்புடைமை மற்றும் பொதுமக்கள் நேரடி உறுதிப்படுத்தலுடன் கூடிய வெளிப்படையான தீர்வு தளம்.',

    // Navigation
    nav_dashboard: 'முகப்பு பலகை',
    nav_report: 'புகார் பதிவு',
    nav_complaints: 'எனது புகார்கள்',
    nav_map: 'நகர வரைபடம்',
    nav_public: 'பொது புள்ளிவிவரம்',
    nav_insights: 'AI நுண்ணறிவு',
    nav_notifications: 'அறிவிப்புகள்',
    nav_profile: 'சுயவிவரம் & அமைப்புகள்',

    // Stats
    stat_total_reports: 'மொத்த புகார்கள்',
    stat_resolved: 'தீர்க்கப்பட்டவை',
    stat_pending: 'நிலுவையில் உள்ளவை',
    stat_high_priority: 'அவசர முன்னுரிமை',
    stat_resolution_rate: 'தீர்வு சதவீதம்',
    stat_avg_time: 'சராசரி தீர்வு நேரம்',

    // Buttons
    btn_report_problem: '+ புதிய புகார் பதிவு செய்',
    btn_view_map: 'வரைபடம் பார்க்க',
    btn_public_stats: 'பொது தளம்',
    btn_submit_complaint: 'புகாரை சமர்ப்பிக்கவும்',
    btn_use_location: 'என் இருப்பிடத்தைப் பயன்படுத்து',
    btn_take_photo: 'நேரடி புகைப்படம் எடு',
    btn_upload_photo: 'படம் பதிவேற்று',
    btn_view_details: 'விவரங்கள் & காலவரிசை',
    btn_yes_fixed: 'ஆம், பிரச்சனை தீர்க்கப்பட்டது',
    btn_no_exists: 'இல்லை, இன்னும் உள்ளது (மீண்டும் திற)',
    btn_simulate_resolution: 'தீர்வு நிலையை பரிசோதிக்க',
    btn_load_demo: 'மாதிரி தரவை ஏற்று',
    btn_clear_data: 'தரவை அழி',
    btn_submit_anyway: 'மீண்டும் சமர்ப்பி',
    btn_view_existing: 'ஏற்கனவே உள்ள புகாரைப் பார்',

    // Categories
    cat_all: 'அனைத்து பிரச்சனைகள்',
    cat_pothole: 'குண்டும் குழியும்',
    cat_streetlight: 'தெருவிளக்கு பழுது',
    cat_garbage: 'குப்பை குவியல்',
    cat_drainage: 'கழிவுநீர் / வடிகால்',
    cat_traffic: 'போக்குவரத்து சிக்னல்',
    cat_road_damage: 'சாலை சேதம்',
    cat_property_damage: 'பொதுச் சொத்து சேதம்',
    cat_other: 'இதர பிரச்சனைகள்',

    // Statuses
    status_submitted: 'சமர்ப்பிக்கப்பட்டது',
    status_verified: 'AI சரிபார்க்கப்பட்டது',
    status_assigned: 'அதிகாரிக்கு ஒதுக்கப்பட்டது',
    status_in_progress: 'பணி நடக்கிறது',
    status_resolved: 'தீர்வு காணப்பட்டது',
    status_citizen_verified: 'குடிமக்களால் உறுதிசெய்யப்பட்டது',
    status_reopened: 'மீண்டும் திறக்கப்பட்டது',

    // Verification
    verify_heading: 'இந்த பிரச்சனை உண்மையில் சரிசெய்யப்பட்டுவிட்டதா?',
    verify_sub: 'போலி தீர்வுகளைத் தடுக்க பொதுமக்கள் சரிபார்ப்பு அவசியம். உங்கள் உறுதிப்படுத்தல் அரசு அதிகாரிகளைப் பொறுப்பேற்க வைக்கும்.',
    reopened_notice: 'நன்றி. உங்கள் புகார் மீண்டும் திறக்கப்பட்டு உயர் அதிகாரிகளுக்குப் பரிந்துரைக்கப்பட்டுள்ளது.'
  }
};

const I18nService = {
  currentLang: 'en',

  init() {
    const settings = StorageService.getSettings();
    this.currentLang = settings.language || 'en';
    this.applyLanguage(this.currentLang);
  },

  setLanguage(lang) {
    if (I18N_TRANSLATIONS[lang]) {
      this.currentLang = lang;
      const settings = StorageService.getSettings();
      settings.language = lang;
      StorageService.saveSettings(settings);
      this.applyLanguage(lang);
    }
  },

  get(key) {
    return I18N_TRANSLATIONS[this.currentLang]?.[key] || I18N_TRANSLATIONS['en']?.[key] || key;
  },

  applyLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.get(key);
      if (text) {
        if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
          el.setAttribute('placeholder', text);
        } else {
          el.textContent = text;
        }
      }
    });

    // Update active language UI toggles
    document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }
};
