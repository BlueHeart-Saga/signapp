export const setFavicon = (iconUrl, fallback = "/favicon.ico") => {
  const finalUrl = iconUrl || fallback;

  let link = document.querySelector("#dynamic-favicon");

  if (!link) {
    link = document.createElement("link");
    link.id = "dynamic-favicon";
    link.rel = "icon";
    document.head.appendChild(link);
  }

  // 🔥 cache-buster
  link.href = `${finalUrl}?v=${Date.now()}`;
};
