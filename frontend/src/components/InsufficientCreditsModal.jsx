import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  IconButton
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StarIcon from "@mui/icons-material/Star";
import { useNavigate } from "react-router-dom";

export default function InsufficientCreditsModal({
  open,
  onClose,
  requiredCredits = 1,
  availableCredits = 0,
  actionName = "this operation"
}) {
  const navigate = useNavigate();

  const handleBuyCredits = () => {
    onClose();
    navigate("/user/subscription");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "20px",
          padding: 1,
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ef4444"
            }}
          >
            <BoltIcon />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            Insufficient Credits
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          You need <strong>{requiredCredits} credits</strong> to execute {actionName}, but you currently have only <strong>{availableCredits} credits</strong>.
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
            border: "1px dashed #cbd5e1",
            display: "flex",
            justify: "space-between",
            alignItems: "center",
            mb: 2
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Required
            </Typography>
            <Typography variant="h6" fontWeight={700} color="error.main">
              {requiredCredits} ⚡
            </Typography>
          </Box>

          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Your Balance
            </Typography>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              {availableCredits} ⚡
            </Typography>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1, flexDirection: "column" }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<ShoppingCartIcon />}
          onClick={handleBuyCredits}
          sx={{
            borderRadius: "12px",
            py: 1.2,
            fontWeight: 700,
            textTransform: "none",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
          }}
        >
          Buy Top-Up Credit Pack
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          startIcon={<StarIcon />}
          onClick={handleBuyCredits}
          sx={{
            borderRadius: "12px",
            py: 1,
            fontWeight: 600,
            textTransform: "none"
          }}
        >
          Upgrade Subscription Plan
        </Button>
      </DialogActions>
    </Dialog>
  );
}
