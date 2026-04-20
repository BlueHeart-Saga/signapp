export const setPageTitle = (pageName, metaDescription) => {
  const platform = window.__PLATFORM_NAME__ || "Safesign";
  const tagline = "AI-Powered E-Signature & Document Management";

  // Browser tab title - Professional Format: Page | Platform - Tagline
  document.title = pageName
    ? `${pageName} | ${platform} - ${tagline}`
    : `${platform} | ${tagline}`;

  // Meta description
  let description = document.querySelector("meta[name='description']");
  if (!description) {
    description = document.createElement("meta");
    description.name = "description";
    document.head.appendChild(description);
  }

  const defaultDesc = "Enterprise-grade AI-powered e-signature and document management platform.";
  description.content = metaDescription || defaultDesc;

  // OpenGraph title
  let ogTitle = document.querySelector("meta[property='og:title']");
  if (!ogTitle) {
    ogTitle = document.createElement("meta");
    ogTitle.setAttribute("property", "og:title");
    document.head.appendChild(ogTitle);
  }
  ogTitle.content = pageName ? `${pageName} | ${platform}` : `${platform} - ${tagline}`;
};
