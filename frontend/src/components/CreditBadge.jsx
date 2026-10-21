import React from "react";
import { Chip, Tooltip, Box, Typography, LinearProgress } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CreditBadge() {
  const navigate = useNavigate();
  const { credits, user } = useAuth();

  const balance = credits && credits.balance !== undefined ? credits.balance : (user?.credit_balance || 0);
  const limit = credits && credits.limit ? credits.limit : 500;
  const percentage = limit > 0 ? Math.min(100, Math.round((balance / limit) * 100)) : 0;

  const tooltipContent = (
    <Box sx={{ p: 0.75, minWidth: 175 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
        <BoltIcon sx={{ fontSize: "1rem", color: "#2dd4bf" }} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#2dd4bf", letterSpacing: "0.01em" }}>
          Credit Wallet
        </Typography>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 0.5 }}>
        <Typography variant="caption" sx={{ color: "#cbd5e1" }}>Available:</Typography>
        <Typography variant="caption" fontWeight={700} sx={{ color: "#ffffff" }}>
          {balance.toLocaleString()} Credits
        </Typography>
      </Box>
      {limit > 0 && (
        <Box sx={{ my: 0.75 }}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.15)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: balance <= 10 ? "#ef4444" : balance <= 50 ? "#f59e0b" : "#14b8a6",
                borderRadius: 3
              }
            }}
          />
        </Box>
      )}
      <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mt: 0.75, fontSize: "0.72rem", lineHeight: 1.3 }}>
        Click to buy top-up credits or view ledger
      </Typography>
    </Box>
  );

  return (
    <Tooltip
      title={tooltipContent}
      arrow
      placement="bottom"
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: "#0f172a",
            color: "#ffffff",
            borderRadius: "12px",
            border: "1px solid rgba(45, 212, 191, 0.25)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 15px rgba(20, 184, 166, 0.15)",
            p: 1
          }
        },
        arrow: {
          sx: {
            color: "#0f172a"
          }
        }
      }}
    >
      <Chip
        icon={
          <BoltIcon
            sx={{
              fontSize: "1.1rem !important",
              color: balance <= 10 ? "#ef4444" : balance <= 50 ? "#f59e0b" : "#0f766e"
            }}
          />
        }
        label={`${balance.toLocaleString()} Credits`}
        clickable
        onClick={() => navigate("/user/subscription")}
        sx={{
          fontWeight: 700,
          borderRadius: "10px",
          height: 32,
          px: 0.5,
          backgroundColor:
            balance <= 10
              ? "rgba(239, 68, 68, 0.1)"
              : balance <= 50
              ? "rgba(245, 158, 11, 0.08)"
              : "rgba(15, 118, 110, 0.08)",
          color:
            balance <= 10
              ? "#dc2626"
              : balance <= 50
              ? "#d97706"
              : "#0f766e",
          border: "1px solid",
          borderColor:
            balance <= 10
              ? "rgba(239, 68, 68, 0.3)"
              : balance <= 50
              ? "rgba(245, 158, 11, 0.3)"
              : "rgba(15, 118, 110, 0.25)",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow:
              balance <= 10
                ? "0 4px 12px rgba(239, 68, 68, 0.25)"
                : balance <= 50
                ? "0 4px 12px rgba(245, 158, 11, 0.25)"
                : "0 4px 12px rgba(15, 118, 110, 0.25)",
            backgroundColor:
              balance <= 10
                ? "rgba(239, 68, 68, 0.15)"
                : balance <= 50
                ? "rgba(245, 158, 11, 0.15)"
                : "rgba(15, 118, 110, 0.14)"
          }
        }}
      />
    </Tooltip>
  );
}
