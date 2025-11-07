
// API Configuration for IMEI Checker
export const API_CONFIG = {
  // Default test API key
  API_KEY: 'imei_r_lQhdSAq8PTeVCrat....................', // Replace with full key
  BASE_URL: window.location.origin,
  ENDPOINTS: {
    check: '/api/v1/check',
    stats: '/api/v1/stats',
    export: '/api/v1/export',
    mySearches: '/api/v1/my/searches'
  }
};

// Helper function to get headers with API key
export const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_CONFIG.API_KEY}`
});
