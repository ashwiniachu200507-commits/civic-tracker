/**
 * CivicTrack AI - Core Application & SPA Router (app.js)
 */

const AppRouter = {
  currentRoute: 'dashboard',
  routeParams: {},

  init() {
    window.addEventListener('hashchange', () => this.handleHashChange());
    this.handleHashChange();
  },

  navigate(route, params = {}) {
    this.routeParams = params;
    let hash = `#${route}`;
    if (params.id) {
      hash += `?id=${params.id}`;
    }
    window.location.hash = hash;
  },

  handleHashChange() {
    const rawHash = window.location.hash.replace('#', '') || 'dashboard';
    const parts = rawHash.split('?');
    const route = parts[0] || 'dashboard';
    
    // Parse query params (e.g. ?id=CT-2026-001284)
    const params = {};
    if (parts[1]) {
      const searchParams = new URLSearchParams(parts[1]);
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
    }

    this.currentRoute = route;
    this.routeParams = params;

    this.activateView(route, params);
  },

  activateView(route, params) {
    // Hide all views
    document.querySelectorAll('.spa-view').forEach(view => {
      view.classList.remove('active');
    });

    // Show target view
    const targetView = document.getElementById(`view-${route}`);
    if (targetView) {
      targetView.classList.add('active');
    } else {
      // Fallback to dashboard
      const defaultView = document.getElementById('view-dashboard');
      if (defaultView) defaultView.classList.add('active');
      route = 'dashboard';
    }

    // Update active nav links in sidebar and mobile bottom nav
    document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(link => {
      const linkRoute = link.getAttribute('data-route');
      link.classList.toggle('active', linkRoute === route);
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger view-specific render logic
    this.onViewLoaded(route, params);
  },

  onViewLoaded(route, params) {
    if (route === 'dashboard') {
      DashboardController.renderHomeDashboard();
    } else if (route === 'complaints') {
      ComplaintsController.renderComplaintsList();
    } else if (route === 'details') {
      if (params.id) {
        ComplaintsController.renderComplaintDetails(params.id);
      } else {
        this.navigate('complaints');
      }
    } else if (route === 'map') {
      MapController.loadMap();
    } else if (route === 'public-dashboard') {
      DashboardController.renderPublicDashboard();
    } else if (route === 'insights') {
      DashboardController.renderAIInsights();
    } else if (route === 'notifications') {
      NotificationService.renderNotificationsList();
      NotificationService.updateBadgeCount();
    } else if (route === 'profile') {
      ProfileController.renderProfile();
    }
  }
};

/**
 * Profile & Settings Controller
 */
const ProfileController = {
  renderProfile() {
    const profile = StorageService.getProfile();
    const settings = StorageService.getSettings();

    const nameInput = document.getElementById('prof-name-input');
    const phoneInput = document.getElementById('prof-phone-input');
    const emailInput = document.getElementById('prof-email-input');
    const wardInput = document.getElementById('prof-ward-input');

    if (nameInput) nameInput.value = profile.name || '';
    if (phoneInput) phoneInput.value = profile.phone || '';
    if (emailInput) emailInput.value = profile.email || '';
    if (wardInput) wardInput.value = profile.ward || '';
  },

  saveProfile(e) {
    e.preventDefault();
    const name = document.getElementById('prof-name-input').value;
    const phone = document.getElementById('prof-phone-input').value;
    const email = document.getElementById('prof-email-input').value;
    const ward = document.getElementById('prof-ward-input').value;

    StorageService.saveProfile({
      name,
      phone,
      email,
      ward,
      notificationsEnabled: true
    });

    NotificationService.showToast({
      title: 'Profile Updated',
      message: 'Your citizen profile and contact settings have been saved.',
      type: 'success'
    });
  }
};

/**
 * Theme & UI Manager
 */
const ThemeManager = {
  init() {
    const settings = StorageService.getSettings();
    const theme = settings.theme || 'light';
    this.applyTheme(theme);

    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => this.toggleTheme());
    });
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);

    const settings = StorageService.getSettings();
    settings.theme = next;
    StorageService.saveSettings(settings);
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-icon').forEach(icon => {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    });

    // Re-draw canvas charts with updated theme contrast if in public dashboard
    if (AppRouter.currentRoute === 'public-dashboard') {
      DashboardController.renderPublicDashboard();
    }
  }
};

/**
 * Global App Initialization on DOM Ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize storage
  StorageService.init();

  // Initialize theme
  ThemeManager.init();

  // Initialize i18n
  I18nService.init();

  // Initialize notifications
  NotificationService.init();

  // Initialize feature controllers
  ReportController.init();
  ComplaintsController.init();
  MapController.init();
  DashboardController.init();

  // Start SPA Router
  AppRouter.init();

  console.log('CivicTrack AI initialized successfully in Hackathon Prototype Mode.');
});
