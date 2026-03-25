export const setPageTitle = (pageName, metaDescription) => {
  const platform = window.__PLATFORM_NAME__ || "SafeSign";

  // Browser tab title
  document.title = pageName
    ? `${platform} | ${pageName}`
    : platform;

  // Meta description
  let description = document.querySelector("meta[name='description']");
  if (!description) {
    description = document.createElement("meta");
    description.name = "description";
    document.head.appendChild(description);
  }
  if (metaDescription) {
    description.content = metaDescription;
  }

  // OpenGraph title
  let ogTitle = document.querySelector("meta[property='og:title']");
  if (!ogTitle) {
    ogTitle = document.createElement("meta");
    ogTitle.setAttribute("property", "og:title");
    document.head.appendChild(ogTitle);
  }
  ogTitle.content = pageName || platform;
};
