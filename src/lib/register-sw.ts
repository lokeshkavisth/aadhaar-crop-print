// Registers the PWA service worker safely.
// - Never registers in iframes (Lovable preview runs in an iframe)
// - Never registers on Lovable preview/dev hosts
// - Only registers in production builds
export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("preview--") ||
    host.includes("lovableproject.com") ||
    host.includes("lovableproject-dev.com");

  if (isInIframe || isPreviewHost || !import.meta.env.PROD) {
    // Clean up any previously-registered SWs in unsupported contexts
    navigator.serviceWorker.getRegistrations?.().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    return;
  }

  // Dynamic import so workbox-window is only loaded in prod runtime
  import("workbox-window").then(({ Workbox }) => {
    const wb = new Workbox("/sw.js", { scope: "/" });
    wb.addEventListener("waiting", () => {
      // Auto-activate new SW
      wb.messageSkipWaiting();
    });
    wb.addEventListener("controlling", () => {
      window.location.reload();
    });
    wb.register().catch(() => {
      /* ignore */
    });
  });
}
