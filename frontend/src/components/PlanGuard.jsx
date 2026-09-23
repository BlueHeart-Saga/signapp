import React from "react";
import { useAuth } from "../context/AuthContext";
import SubscriptionExpiredBlock from "./SubscriptionExpiredBlock";
import { CircularProgress, Container, Box } from "@mui/material";

/**
 * PlanGuard Component
 * Pure Credit-Based Architecture: Unrestricted feature navigation.
 * Metered actions are authorized at execution time via credit balance.
 */
const PlanGuard = ({ children }) => {
    const { loading } = useAuth();

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 10, textAlign: "center" }}>
                <CircularProgress />
            </Container>
        );
    }

    // Pure Credit Model: Always allow navigation.
    // Metered actions handle authorization atomically on execution.
    return children;
};

export default PlanGuard;
