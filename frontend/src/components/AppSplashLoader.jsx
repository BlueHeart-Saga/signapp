import React from "react";
import PageLoadingAnimation from "./PageLoadingAnimation";

/**
 * AppSplashLoader: Shown during initial application bootstrap or cold auth hydration.
 * Displays the high-end eSigniva logo drawing animation cleanly.
 */
export default function AppSplashLoader() {
  return <PageLoadingAnimation fullScreen={true} size={140} />;
}
