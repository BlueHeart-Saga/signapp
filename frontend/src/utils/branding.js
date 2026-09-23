export const setFavicon = (iconUrl, fallback = "/favicon.png") => {
  const finalUrl = iconUrl || fallback;

  let link = document.querySelector("#dynamic-favicon");

  if (!link) {
    link = document.createElement("link");
    link.id = "dynamic-favicon";
    link.rel = "icon";
    document.head.appendChild(link);
  }

  // Clean up any legacy or static rel="icon" elements to prevent browser conflicts
  const otherIcons = document.querySelectorAll("link[rel*='icon']:not(#dynamic-favicon)");
  otherIcons.forEach((el) => {
    if (el.getAttribute("rel") === "icon") {
      el.remove();
    }
  });

  // Set mime type
  if (finalUrl.endsWith(".svg") || finalUrl.includes("image/svg")) {
    link.type = "image/svg+xml";
  } else if (finalUrl.endsWith(".ico")) {
    link.type = "image/x-icon";
  } else {
    link.type = "image/png";
  }

  // 🔥 cache-buster
  link.href = `${finalUrl}${finalUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
};
