import React from "react";
import { useNavigate } from "react-router-dom";
 import { setPageTitle } from "../../utils/pageTitle";
import { useEffect } from "react";

export default function Unauthorized() {
  const navigate = useNavigate();

  useEffect(() => {
  setPageTitle(
    "Unauthorized Access",
    "You do not have permission to access this page. Please contact the administrator.."
  );
}, []);    

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9f9f9",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          maxWidth: "480px",
          width: "90%",
        }}
      >
        <h1 style={{ color: "#dc3545", fontSize: "2rem", marginBottom: "10px" }}>
          Access Denied
        </h1>
        <p style={{ color: "#555", fontSize: "1rem", marginBottom: "25px" }}>
          You don’t have permission to view this page.
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Go Back Home
        </button>
      </div>
    </div>
  );
}
