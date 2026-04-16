import React from "react";
import { useAuth } from "../context/AuthContext";
import SubscriptionExpiredBlock from "./SubscriptionExpiredBlock";
import { CircularProgress, Container, Box } from "@mui/material";

/**
 * PlanGuard Component
 * Wraps premium features and blocks access if user doesn't have an active subscription.
 */
const PlanGuard = ({ children }) => {
    const { user, subscription, loading } = useAuth();

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 10, textAlign: "center" }}>
                <CircularProgress />
            </Container>
        );
    }

    // Check if user has an active subscription
    // If we have detailed subscription data, trust its 'is_active' status
    // Otherwise fallback to the user document's cached flag
    const hasActivePlan = subscription
        ? subscription.is_active
        : user?.has_active_subscription;

    if (!hasActivePlan) {
        return <SubscriptionExpiredBlock />;
    }

    return children;
};

export default PlanGuard;
