// API Base URL configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Validate API URL
if (!API_BASE_URL) {
  console.error('API_BASE_URL is not defined. Please set REACT_APP_API_BASE_URL environment variable.');
}

// Log the API base URL for debugging (remove in production)
console.log('API Base URL:', API_BASE_URL);

export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "432906890842-1rc8ck80iu07h6r4cjjrd4nmcbnjc204.apps.googleusercontent.com";
export default API_BASE_URL;

