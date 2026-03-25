import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  // allow public signing link
  if (location.pathname.startsWith("/sign")) {
    return children;
  }

  // not authenticated
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const decoded = jwtDecode(token);

    // read role from token OR storage
    const rawRole =
      decoded.role ||
      decoded.user_role ||
      decoded.role_name ||
      decoded.userType ||
      decoded.type ||
      localStorage.getItem("role") ||
      "user";

    const role = String(rawRole).toLowerCase();

    // expiration check
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      return <Navigate to="/login" replace />;
    }

    // role enforcement
    if (allowedRoles && !allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return children;
  } catch (err) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
