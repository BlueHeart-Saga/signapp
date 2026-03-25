import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper, CircularProgress } from "@mui/material";
import { recipientAPI } from "../services/RecipientAPI";

export default function RecipientDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recipientAPI.getDashboard()
      .then(res => setDashboard(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const stats = dashboard?.statistics || {};

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="caption">Total Documents</Typography>
            <Typography variant="h4">{stats.total_documents || 0}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="caption">Signed</Typography>
            <Typography variant="h4" color="success.main">
              {stats.signed_documents || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="caption">Pending</Typography>
            <Typography variant="h4" color="warning.main">
              {stats.pending_documents || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
