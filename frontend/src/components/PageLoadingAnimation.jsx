import React from "react";
import "./PageLoadingAnimation.css";

/**
 * PageLoadingAnimation:
 * Premium logo loading animation for page navigation and lazy loading across eSigniva portal.
 * Features logo-animation-transparent_2.gif with smooth pulsing aura and modern loader indicators.
 */
export default function PageLoadingAnimation({
  message = "",
  fullScreen = false,
  size = 120,
  minHeight = "calc(100vh - 140px)",
}) {
  return (
    <div
      className={`esigniva-page-loader ${
        fullScreen ? "esigniva-page-loader--fullscreen" : "esigniva-page-loader--inline"
      }`}
      style={!fullScreen && minHeight ? { minHeight } : undefined}
    >
      <div className="esigniva-page-loader__content">
        <div
          className="esigniva-page-loader__logo-wrapper"
          style={{ width: size, height: size }}
        >
          {/* Subtle luminous ambient aura */}
          <div className="esigniva-page-loader__aura" />
          <img
            src="/assets/logo-animation-transparent_2.gif"
            alt="eSigniva Loading"
            className="esigniva-page-loader__gif"
          />
        </div>
      </div>
    </div>
  );
}
