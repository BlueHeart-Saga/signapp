import React from "react";
import { Chip, Tooltip, Box, Typography } from "@mui/material";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import WarningIcon from "@mui/icons-material/Warning";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ErrorIcon from "@mui/icons-material/Error";
import { useNavigate } from "react-router-dom";

export default function SubscriptionBadge({ subscription }) {
  const navigate = useNavigate();

  if (!subscription) {
    return (
      <Tooltip title="Unlock full features with a premium plan" arrow>
        <Chip
          icon={<WorkspacePremiumIcon />}
          label="Upgrade"
          variant="outlined"
          clickable
          onClick={() => navigate("/user/subscription")}
          sx={{
            fontWeight: 700,
            borderRadius: "8px",
            borderWidth: "1.5px",
            px: 0.5,
            height: 30,
            color: '#3b82f6',
            borderColor: 'rgba(59, 130, 246, 0.4)',
            background: 'rgba(59, 130, 246, 0.04)',
            "&:hover": {
              borderColor: '#3b82f6',
              background: 'rgba(59, 130, 246, 0.08)',
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)"
            }
          }}
        />
      </Tooltip>
    );
  }

  const { plan_name, days_remaining, expiry_date, status, plan_type } =
    subscription;

  // PLAN BASED COLOR
  const getColor = () => {
    if (status === "expired") return "error";
    if (status === "cancelled") return "primary";
    if (days_remaining <= 5) return "warning";

    switch (plan_type) {
      case "trial":
        return "info";
      case "monthly":
        return "primary";
      case "yearly":
        return "success";
      case "lifetime":
        return "secondary";
      default:
        return "default";
    }
  };

  // PLAN LABEL
  const getLabel = () => {
    if (status === "expired") return "Expired";
    if (status === "cancelled") return "Upgrade";
    if (plan_type === "trial") return "Trial";
    if (plan_type === "monthly") return `${plan_name}`;
    if (plan_type === "yearly") return `${plan_name}`;
    if (plan_type === "lifetime") return "Lifetime";
    return plan_name;
  };

  // ICON
  const getIcon = () => {
    if (status === "expired") return <ErrorIcon />;
    if (days_remaining <= 5) return <WarningIcon />;
    if (plan_type === "trial") return <AccessTimeIcon />;
    return <WorkspacePremiumIcon />;
  };

  const tooltipContent = (
    <Box>
      <Typography fontWeight={600}>{plan_name}</Typography>

      <Typography variant="body2">
        Plan: {plan_type?.toUpperCase()}
      </Typography>

      <Typography variant="body2">
        Expires: {plan_type === 'lifetime' ? 'Never' : new Date(expiry_date).toLocaleDateString()}
      </Typography>

      <Typography variant="body2">
        {status === "expired"
          ? "Subscription expired"
          : plan_type === 'lifetime'
            ? "Permanent access"
            : `${days_remaining} days remaining`}
      </Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow>
      <Chip
        icon={getIcon()}
        label={getLabel()}
        color={getColor()}
        clickable
        onClick={() => navigate("/user/subscription")}
        sx={{
          fontWeight: 600,
          borderRadius: "8px",
          px: 1,
          height: 32,
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: 3
          }
        }}
      />
    </Tooltip>
  );
}