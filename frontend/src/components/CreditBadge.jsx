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

  const getChipColor = () => {
    if (balance <= 10) return "error";
    if (balance <= 50) return "warning";
    return "primary";
  };

  const tooltipContent = (
    <Box sx={{ p: 0.5, minWidth: 160 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#38bdf8" }}>
        Credit Wallet
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between", my: 0.5 }}>
        <Typography variant="caption">Available:</Typography>
        <Typography variant="caption" fontWeight={700}>
          {balance.toLocaleString()} Credits
        </Typography>
      </Box>
      {limit > 0 && (
        <Box sx={{ my: 0.5 }}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.2)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: balance <= 10 ? "#ef4444" : balance <= 50 ? "#f59e0b" : "#3b82f6"
              }
            }}
          />
        </Box>
      )}
      <Typography variant="caption" color="gray" display="block" sx={{ mt: 0.5 }}>
        Click to buy top-up credits or view ledger
      </Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="bottom">
      <Chip
        icon={<BoltIcon sx={{ fontSize: "1.1rem !important", color: balance <= 10 ? "#ef4444" : "#f59e0b" }} />}
        label={`${balance.toLocaleString()} Credits`}
        clickable
        onClick={() => navigate("/user/subscription")}
        sx={{
          fontWeight: 700,
          borderRadius: "10px",
          height: 32,
          px: 0.5,
          backgroundColor: balance <= 10 ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.08)",
          color: balance <= 10 ? "#dc2626" : "#d97706",
          border: "1px solid",
          borderColor: balance <= 10 ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)",
            backgroundColor: balance <= 10 ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)"
          }
        }}
      />
    </Tooltip>
  );
}
