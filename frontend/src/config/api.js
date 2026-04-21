// API Base URL configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Validate API URL
if (!API_BASE_URL) {
  console.error('API_BASE_URL is not defined. Please set REACT_APP_API_BASE_URL environment variable.');
}

// Log the API base URL for debugging (remove in production)
console.log('API Base URL:', API_BASE_URL);

export const GOOGLE_CLIENT_ID = "970128405795-i22pohhkf8bli0b1736eoa0rscs0c3qv.apps.googleusercontent.com";
export default API_BASE_URL;

