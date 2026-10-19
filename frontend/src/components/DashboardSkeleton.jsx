import React from "react";
import { Box, Skeleton, Card, CardContent } from "@mui/material";

/**
 * Brevo-Style Content Skeletons
 * Keep sidebar and header intact and stable.
 * Shimmer fills the content container smoothly without layout jumping.
 */

export function DashboardOverviewSkeleton() {
  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        width: "100%",
        maxWidth: 1400,
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        animation: "dashboardFadeIn 0.2s ease-out",
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
        },
      }}
    >
      {/* Welcome / Header Skeleton */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ width: { xs: "100%", sm: 280 } }}>
          <Skeleton variant="text" width="85%" height={36} />
          <Skeleton variant="text" width="60%" height={22} />
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Skeleton variant="rounded" width={110} height={38} sx={{ borderRadius: "8px" }} />
          <Skeleton variant="rounded" width={110} height={38} sx={{ borderRadius: "8px" }} />
        </Box>
      </Box>

      {/* Quick Actions Row */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: "12px" }} />
        ))}
      </Box>

      {/* Stats Cards Grid (4 items) */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "12px", p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
              <Skeleton variant="text" width="50%" height={20} />
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
            <Skeleton variant="text" width="40%" height={36} />
            <Skeleton variant="text" width="65%" height={18} />
          </Card>
        ))}
      </Box>

      {/* Two Column Content / Analytics Placeholder */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 2.5 }}>
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "12px", p: 2.5, minHeight: 320 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Skeleton variant="text" width={160} height={26} />
            <Skeleton variant="rounded" width={90} height={30} sx={{ borderRadius: "6px" }} />
          </Box>
          <Skeleton variant="rounded" width="100%" height={220} sx={{ borderRadius: "8px" }} />
        </Card>
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "12px", p: 2.5, minHeight: 320 }}>
          <Skeleton variant="text" width={140} height={26} sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {[1, 2, 3, 4].map((i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Skeleton variant="circular" width={28} height={28} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="50%" height={16} />
                </Box>
              </Box>
            ))}
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

export function DocumentTableSkeleton() {
  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        width: "100%",
        maxWidth: 1400,
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        animation: "dashboardFadeIn 0.2s ease-out",
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
        },
      }}
    >
      {/* Title & Toolbar Skeleton */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ width: 220 }}>
          <Skeleton variant="text" width="90%" height={32} />
          <Skeleton variant="text" width="60%" height={20} />
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Skeleton variant="rounded" width={180} height={38} sx={{ borderRadius: "10px" }} />
          <Skeleton variant="rounded" width={120} height={38} sx={{ borderRadius: "10px" }} />
        </Box>
      </Box>

      {/* Upload Banner Placeholder */}
      <Skeleton variant="rounded" width="100%" height={88} sx={{ borderRadius: "14px" }} />

      {/* Table Container Skeleton */}
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
        {/* Table Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <Skeleton variant="text" width={40} height={20} />
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="text" width="18%" height={20} />
          <Skeleton variant="text" width="15%" height={20} />
          <Skeleton variant="text" width="12%" height={20} />
          <Skeleton variant="text" width="15%" height={20} sx={{ ml: "auto" }} />
        </Box>

        {/* Table Rows */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2,
              borderBottom: i < 6 ? "1px solid #f1f5f9" : "none",
            }}
          >
            <Skeleton variant="text" width={30} height={20} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "30%" }}>
              <Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: "8px" }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="90%" height={22} />
                <Skeleton variant="text" width="50%" height={16} />
              </Box>
            </Box>
            <Skeleton variant="text" width="18%" height={20} />
            <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: "12px" }} />
            <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: "12px" }} />
            <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
              <Skeleton variant="circular" width={28} height={28} />
              <Skeleton variant="circular" width={28} height={28} />
            </Box>
          </Box>
        ))}
      </Card>
    </Box>
  );
}

export function TemplateGridSkeleton() {
  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        width: "100%",
        maxWidth: 1400,
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        animation: "dashboardFadeIn 0.2s ease-out",
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
        },
      }}
    >
      {/* Header and Search */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ width: 200 }}>
          <Skeleton variant="text" width="80%" height={32} />
          <Skeleton variant="text" width="50%" height={20} />
        </Box>
        <Skeleton variant="rounded" width={260} height={40} sx={{ borderRadius: "10px" }} />
      </Box>

      {/* Grid of Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 2.5,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
            <Skeleton variant="rectangular" width="100%" height={140} />
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Skeleton variant="rounded" width={60} height={20} sx={{ borderRadius: "6px" }} />
                <Skeleton variant="text" width={40} height={18} />
              </Box>
              <Skeleton variant="text" width="85%" height={24} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="100%" height={18} />
              <Skeleton variant="text" width="60%" height={18} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" width="100%" height={36} sx={{ borderRadius: "8px" }} />
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

/**
 * Default fallback skeleton used by Layout Suspense
 */
export default function DashboardSkeleton({ type = "default" }) {
  if (type === "table") return <DocumentTableSkeleton />;
  if (type === "grid") return <TemplateGridSkeleton />;
  return <DashboardOverviewSkeleton />;
}
