import axios from "axios";
import { setFavicon } from "../utils/branding";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

export const brandAPI = {
  /**
   * Load branding at app startup
   * - platform name
   * - favicon
   */
  loadBranding: async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/branding/config`);

      const platformName = res.data?.platform_name || "SafeSign";

      // 🌍 global platform name (used everywhere)
      window.__PLATFORM_NAME__ = platformName;

      // 🌐 ALWAYS try backend logo endpoint
      const logoUrl = `${API_BASE_URL}/branding/logo/file`;
      setFavicon(logoUrl, "/favicon.ico");

      return res.data;
    } catch (error) {
      console.warn("Branding load failed, using defaults");

      window.__PLATFORM_NAME__ = "SafeSign";
      setFavicon("/favicon.ico");

      return null;
    }
  },

  /**
   * Fetch branding config (Footer / Header)
   */
  getBrandingConfig: async () => {
    const res = await axios.get(`${API_BASE_URL}/branding/config`);
    return res.data;
  },

  /**
   * Logo URL helper (img src)
   */
  getLogoUrl: () => `${API_BASE_URL}/branding/logo/file`
};
