export const setPageTitle = (pageName, metaDescription, options = {}) => {
  const platform = window.__PLATFORM_NAME__ || "Esigniva";
  const tagline = "AI-Powered E-Signature & Document Management";

  // Browser tab title - Professional Format: Page | Platform - Tagline
  const fullTitle = pageName
    ? `${pageName} | ${platform} - ${tagline}`
    : `${platform} | ${tagline}`;
  document.title = fullTitle;

  // Helper for meta tags
  const setMetaTag = (attrName, attrValue, content) => {
    if (!content) return;
    let el = document.querySelector(`meta[${attrName}='${attrValue}']`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  const defaultDesc =
    "Esigniva is the enterprise-grade AI-powered e-signature and document management platform. Securely sign, track, and automate agreements online.";
  const desc = metaDescription || defaultDesc;

  // Standard SEO Meta Tags
  setMetaTag("name", "description", desc);
  setMetaTag("name", "title", fullTitle);

  // Canonical URL
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const currentUrl = options.canonicalUrl || `https://esigniva.com${currentPath === "/" ? "" : currentPath}`;

  let canonical = document.querySelector("link[rel='canonical']");
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", currentUrl);

  // OpenGraph Meta Tags
  setMetaTag("property", "og:title", pageName ? `${pageName} | ${platform}` : `${platform} - ${tagline}`);
  setMetaTag("property", "og:description", desc);
  setMetaTag("property", "og:url", currentUrl);
  setMetaTag("property", "og:type", options.ogType || "website");
  setMetaTag("property", "og:site_name", platform);
  if (options.ogImage) {
    setMetaTag("property", "og:image", options.ogImage);
  }

  // Twitter Card Meta Tags
  setMetaTag("name", "twitter:card", "summary_large_image");
  setMetaTag("name", "twitter:title", pageName ? `${pageName} | ${platform}` : `${platform} - ${tagline}`);
  setMetaTag("name", "twitter:description", desc);
  setMetaTag("name", "twitter:url", currentUrl);
  if (options.ogImage) {
    setMetaTag("name", "twitter:image", options.ogImage);
  }

  // Optional Keywords
  if (options.keywords) {
    setMetaTag("name", "keywords", options.keywords);
  }
};
