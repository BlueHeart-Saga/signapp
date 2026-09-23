import { createContext, useContext, useEffect, useState } from "react";
import API, { setAuthToken } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUserState] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [subscription, setSubscription] = useState(null);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(() => {
    try {
      const hasToken = !!localStorage.getItem("token");
      const hasUser = !!localStorage.getItem("user");
      return hasToken && !hasUser;
    } catch {
      return false;
    }
  });
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const setUser = (userData, activeToken = null) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));

      const tokenToSave = activeToken || localStorage.getItem("token");

      // Save lightweight version for "Fast Login" popup
      const recentUser = {
        full_name: userData.full_name || userData.name,
        email: userData.email,
        profile_image: userData.profile_image,
        is_google: userData.is_google || !!userData.google_id,
        remembered_token: tokenToSave // Use the passed token or fallback to localStorage
      };
      localStorage.setItem("recent-user", JSON.stringify(recentUser));
    } else {
      localStorage.removeItem("user");
    }
  };

  // Update token in axios and localStorage
  useEffect(() => {
    if (token) {
      setAuthToken(token);
      localStorage.setItem("token", token);

      // Proactive check for expiration
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded.exp * 1000 < Date.now()) {
          console.warn("Token already expired on load");
          logout();
        }
      } catch (e) {
        console.error("Invalid token format");
        logout();
      }
    } else {
      setAuthToken(null);
      localStorage.removeItem("token");
    }
  }, [token]);

  const fetchCredits = async () => {
    if (!token) return;
    try {
      const res = await API.get("/credits/balance");
      setCredits(res.data);
      if (res.data && res.data.balance !== undefined) {
        setUserState((prev) => (prev ? { ...prev, credit_balance: res.data.balance } : prev));
      }
    } catch (err) {
      console.error("Failed to fetch credits balance", err);
    }
  };

  useEffect(() => {
    const handleCreditsUpdated = () => {
      fetchCredits();
    };
    window.addEventListener("credits_updated", handleCreditsUpdated);
    return () => {
      window.removeEventListener("credits_updated", handleCreditsUpdated);
    };
  }, [token]);

  const fetchSubscription = async () => {
    if (!token) return;
    try {
      setSubscriptionLoading(true);
      const res = await API.get("/subscription/current");
      setSubscription(res.data);
    } catch (err) {
      console.error("Failed to fetch subscription", err);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Only load user if we have token but no user data
  useEffect(() => {
    // If no token, clear user and stop loading
    if (!token) {
      setUser(null);
      setSubscription(null);
      setCredits(null);
      setLoading(false);
      return;
    }

    // Refresh user and subscription on mount or token change
    const initializeAuth = async () => {
      try {
        if (!user) {
          setLoading(true);
        }
        // Run fetches in parallel safely
        const [userRes, subRes, creditRes] = await Promise.all([
          API.get("/auth/me").catch((err) => {
            if (err.response?.status === 401) throw err;
            return { data: null };
          }),
          API.get("/subscription/current").catch(() => ({ data: null })),
          API.get("/credits/balance").catch(() => ({ data: null }))
        ]);

        const userData = userRes.data || user;
        const subData = subRes.data;
        const creditData = creditRes.data;

        // Synchronize user flag with actual entitlement status (positive credits or active subscription)
        if (userData) {
          const hasCredits = (creditData?.balance > 0) || (userData?.credit_balance > 0);
          userData.has_active_subscription = hasCredits || (subData ? subData.is_active : false);
          setUser(userData);
        }

        if (subData) setSubscription(subData);
        if (creditData) setCredits(creditData);
      } catch (err) {
        console.error("Session expired or invalid", err);
        if (err.response?.status === 401) {
          setToken(null);
          setUser(null);
          setSubscription(null);
          setCredits(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [token]);

  const logout = () => {
    setToken(null);
    setUserState(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setSubscription(null);
    setCredits(null);
    /* global google */
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  const updateOnboardingStatus = async (onboardingData) => {
    if (!token) return;
    try {
      await API.post("/auth/update-onboarding", onboardingData);
      // Update local user state as well
      if (user) {
        const updatedUser = { ...user, ...onboardingData };
        setUser(updatedUser);
      }
    } catch (err) {
      console.error("Failed to update onboarding status", err);
    }
  };

  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  const refreshCredits = async () => {
    await fetchCredits();
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const [userRes, subRes, creditRes] = await Promise.all([
        API.get("/auth/me"),
        API.get("/subscription/current").catch(() => ({ data: null })),
        API.get("/credits/balance").catch(() => ({ data: null }))
      ]);

      const userData = userRes.data;
      const subData = subRes.data;
      const creditData = creditRes.data;

      // Synchronize user flag with actual entitlement status (positive credits or active subscription)
      if (userData) {
        const hasCredits = (creditData?.balance > 0) || (userData?.credit_balance > 0);
        userData.has_active_subscription = hasCredits || (subData ? subData.is_active : false);
      }

      setUser(userData);
      setSubscription(subData);
      setCredits(creditData);
    } catch (err) {
      console.error("Failed to refresh user session:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        setToken,
        loading,
        subscription,
        subscriptionLoading,
        credits,
        refreshCredits,
        refreshSubscription,
        refreshUser,
        updateOnboardingStatus,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
