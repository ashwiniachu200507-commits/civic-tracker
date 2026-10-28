/**
 * CivicTrack AI - Unit Testing Helper & Mock Environment (test_helper.js)
 * 
 * Purpose:
 * Provides a lightweight, headless browser abstraction for Node.js test runners.
 * Simulates HTML5 localStorage conforming to the W3C Web Storage specification,
 * with optional QuotaExceededError simulation for edge-case error handling tests.
 */

/**
 * Creates an in-memory localStorage mock conforming to the Web Storage API.
 * @returns {Object} Mock localStorage object with control methods
 */
function createMockLocalStorage() {
  let store = new Map();
  let simulateQuotaExceeded = false;

  return {
    getItem(key) {
      return store.has(String(key)) ? store.get(String(key)) : null;
    },

    setItem(key, value) {
      if (simulateQuotaExceeded) {
        const error = new Error('QuotaExceededError: DOM Exception 22');
        error.name = 'QuotaExceededError';
        error.code = 22;
        throw error;
      }
      store.set(String(key), String(value));
    },

    removeItem(key) {
      store.delete(String(key));
    },

    clear() {
      store.clear();
    },

    get length() {
      return store.size;
    },

    key(index) {
      const keys = Array.from(store.keys());
      return keys[index] || null;
    },

    // Testing control helpers
    _setQuotaExceeded(enabled) {
      simulateQuotaExceeded = Boolean(enabled);
    },

    _dump() {
      return Object.fromEntries(store.entries());
    }
  };
}

/**
 * Bootstraps the global Node.js environment before running tests.
 * Injects mock localStorage and safely requires the core modules.
 */
function setupTestEnvironment() {
  const mockStorage = createMockLocalStorage();
  globalThis.localStorage = mockStorage;

  // Clear module cache to allow fresh module instances across test suites
  delete require.cache[require.resolve('../js/storage.js')];
  delete require.cache[require.resolve('../js/api.js')];
  delete require.cache[require.resolve('../js/ai.js')];
  delete require.cache[require.resolve('../js/notifications.js')];

  const storageModule = require('../js/storage.js');
  const apiModule = require('../js/api.js');
  const aiModule = require('../js/ai.js');
  const notifModule = require('../js/notifications.js');

  // Provide global namespace bindings matching browser behavior
  globalThis.StorageService = storageModule.StorageService;
  globalThis.STORAGE_KEYS = storageModule.STORAGE_KEYS;
  globalThis.DEFAULT_COMPLAINTS = storageModule.DEFAULT_COMPLAINTS;
  globalThis.DEFAULT_NOTIFICATIONS = storageModule.DEFAULT_NOTIFICATIONS;
  globalThis.DEFAULT_PROFILE = storageModule.DEFAULT_PROFILE;
  globalThis.DEFAULT_SETTINGS = storageModule.DEFAULT_SETTINGS;

  globalThis.ApiService = apiModule.ApiService;
  globalThis.CivicAI = aiModule.CivicAI;
  globalThis.NotificationService = notifModule.NotificationService;

  // Initialize storage with demo records
  StorageService.init();

  return {
    mockStorage,
    StorageService: storageModule.StorageService,
    ApiService: apiModule.ApiService,
    CivicAI: aiModule.CivicAI,
    NotificationService: notifModule.NotificationService
  };
}

module.exports = {
  createMockLocalStorage,
  setupTestEnvironment
};
