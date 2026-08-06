export function preloadLcpImage(href: string): void {
  if (typeof document === "undefined" || !href) {
    return;
  }

  const alreadyPreloaded = !!document.head.querySelector(
    `link[rel="preload"][href="${href.replace(/"/g, '\\\"')}"]`,
  );

  if (alreadyPreloaded) {
    return;
  }

  const link = document.createElement("link");
  link.setAttribute("rel", "preload");
  link.setAttribute("as", "image");
  link.setAttribute("href", href);
  link.setAttribute("fetchpriority", "high");
  document.head.appendChild(link);
}
