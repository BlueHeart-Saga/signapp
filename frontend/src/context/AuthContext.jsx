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
  const [loading, setLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const setUser = (userData) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
  };

  // Update token in axios and localStorage
  useEffect(() => {
    if (token) {
      setAuthToken(token);
      localStorage.setItem("token", token);
    } else {
      setAuthToken(null);
      localStorage.removeItem("token");
    }
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
      setLoading(false);
      return;
    }

    // Refresh user and subscription on mount or token change
    const initializeAuth = async () => {
      try {
        setLoading(true);
        // Run both fetches in parallel
        const [userRes, subRes] = await Promise.all([
          API.get("/auth/me"),
          API.get("/subscription/current").catch(() => ({ data: null }))
        ]);

        const userData = userRes.data;
        const subData = subRes.data;

        // Synchronize user flag with actual subscription status if sub data is available
        if (userData) {
          userData.has_active_subscription = subData ? subData.is_active : false;
        }

        setUser(userData);
        setSubscription(subData);
      } catch (err) {
        console.error("Session expired or invalid", err);
        setToken(null);
        setUser(null);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [token]);

  const logout = () => {
    setToken(null);
    setUser(null);
    setSubscription(null);
  };

  const refreshSubscription = async () => {
    await fetchSubscription();
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
        refreshSubscription,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);