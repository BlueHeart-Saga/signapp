import React from "react";
import { Chip, Tooltip, Box, Typography } from "@mui/material";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import WarningIcon from "@mui/icons-material/Warning";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ErrorIcon from "@mui/icons-material/Error";
import { useNavigate } from "react-router-dom";

export default function SubscriptionBadge({ subscription }) {
  const navigate = useNavigate();

  if (!subscription) return null;

  const { plan_name, days_remaining, expiry_date, status, plan_type } =
    subscription;

  // PLAN BASED COLOR
  const getColor = () => {
    if (status === "expired") return "error";
    if (days_remaining <= 5) return "warning";

    switch (plan_type) {
      case "trial":
        return "info";
      case "monthly":
        return "primary";
      case "yearly":
        return "success";
      default:
        return "default";
    }
  };

  // PLAN LABEL
  const getLabel = () => {
    if (status === "expired") return "Expired";
    if (plan_type === "trial") return "Trial";
    if (plan_type === "monthly") return `${plan_name}`;
    if (plan_type === "yearly") return `${plan_name}`;
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
        Expires: {new Date(expiry_date).toLocaleDateString()}
      </Typography>

      <Typography variant="body2">
        {status === "expired"
          ? "Subscription expired"
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