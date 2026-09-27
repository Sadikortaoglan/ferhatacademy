"use client";

import { useEffect } from "react";

export function PreviewListener() {
  useEffect(() => {
    if (!window.location.search.includes("__preview__=1")) return;

    function onMessage(e: MessageEvent) {
      if (!e.data) return;
      if (e.data.type === "FA_THEME_UPDATE" && e.data.cssVars) {
        const v = e.data.cssVars as Record<string, string>;
        for (const k in v) {
          if (Object.prototype.hasOwnProperty.call(v, k)) {
            document.documentElement.style.setProperty(k, v[k]);
          }
        }
      }
      if (e.data.type === "FA_THEME_ID" && e.data.themeId) {
        document.documentElement.setAttribute("data-theme", e.data.themeId);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
