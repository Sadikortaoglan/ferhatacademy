"use client";

import { useState, useCallback, useRef, useTransition, useEffect } from "react";
import { THEME_CONFIGS, DEFAULT_THEME_ID, type ThemeId } from "@/lib/themes";
import { resolveTheme, type ThemeOverrides } from "@/lib/theme-resolver";
import {
  saveGlobalAppearance,
  savePageOverride,
  deletePageOverride,
} from "./actions";
import { ControlsPanel } from "./controls-panel";
import { PreviewPanel } from "./preview-panel";
import type { PageKey } from "./actions";

type FullState = {
  activeTheme: string;
  globalOverrides: ThemeOverrides;
  pageOverrides: Record<string, ThemeOverrides>;
};

interface Props {
  locale: string;
  initialState: FullState;
}

export function VisualCustomizer({ locale, initialState }: Props) {
  const [state, setState] = useState<FullState>(initialState);
  const [selectedPage, setSelectedPage] = useState<PageKey | "OVERVIEW">("HOME");
  const [scope, setScope] = useState<"global" | "page">("global");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [hasChanges, setHasChanges] = useState(false);
  const [isPending, startTransition] = useTransition();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const effectiveCssVars = useCallback(() => {
    const pageKey = selectedPage === "OVERVIEW" ? null : selectedPage;
    const pageOverrides = pageKey ? (state.pageOverrides[pageKey] ?? null) : null;
    const resolved = resolveTheme(state.activeTheme, state.globalOverrides, pageOverrides);
    return resolved.effectiveColors;
  }, [state, selectedPage]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type: "FA_THEME_UPDATE", cssVars: effectiveCssVars() }, "*");
  }, [effectiveCssVars]);

  function handleIframeLoad() {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type: "FA_THEME_UPDATE", cssVars: effectiveCssVars() }, "*");
  }

  function updateGlobalOverride(key: keyof ThemeOverrides, value: string) {
    setState((prev) => ({ ...prev, globalOverrides: { ...prev.globalOverrides, [key]: value } }));
    setHasChanges(true);
  }

  function updatePageOverride(pageKey: PageKey, key: keyof ThemeOverrides, value: string) {
    setState((prev) => ({
      ...prev,
      pageOverrides: {
        ...prev.pageOverrides,
        [pageKey]: { ...(prev.pageOverrides[pageKey] ?? {}), [key]: value },
      },
    }));
    setHasChanges(true);
  }

  function switchTheme(themeId: ThemeId) {
    setState((prev) => ({ ...prev, activeTheme: themeId, globalOverrides: {} }));
    setHasChanges(true);
  }

  function handleSave() {
    startTransition(async () => {
      if (scope === "global") {
        await saveGlobalAppearance(state.activeTheme, state.globalOverrides);
      } else if (selectedPage !== "OVERVIEW") {
        const pageKey = selectedPage as PageKey;
        await savePageOverride(pageKey, state.pageOverrides[pageKey] ?? {});
      }
      setHasChanges(false);
    });
  }

  function handleDiscard() {
    setState(initialState);
    setHasChanges(false);
  }

  function handleResetToTheme() {
    setState((prev) => ({ ...prev, globalOverrides: {} }));
    setHasChanges(true);
  }

  function handleDeletePageOverride(pageKey: PageKey) {
    setState((prev) => {
      const next = { ...prev.pageOverrides };
      delete next[pageKey];
      return { ...prev, pageOverrides: next };
    });
    startTransition(async () => {
      await deletePageOverride(pageKey);
    });
  }

  const currentPageKey = selectedPage === "OVERVIEW" ? null : (selectedPage as PageKey);
  const currentPageOverrides = currentPageKey ? (state.pageOverrides[currentPageKey] ?? null) : null;
  const hasPageOverride = currentPageKey !== null && state.pageOverrides[currentPageKey] !== undefined;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface shrink-0">
        <div>
          <h1 className="text-sm font-black text-foreground">Görünüm Ayarları</h1>
          <p className="text-xs text-muted-foreground">
            Değişiklikler kaydedilene kadar ziyaretçilere uygulanmaz.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-warning font-medium">Kaydedilmemiş değişiklikler</span>
          )}
          <button
            onClick={handleDiscard}
            disabled={!hasChanges || isPending}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isPending}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[42%] shrink-0 overflow-y-auto border-r border-border bg-background">
          <ControlsPanel
            locale={locale}
            activeTheme={state.activeTheme as ThemeId}
            globalOverrides={state.globalOverrides}
            pageOverrides={currentPageOverrides}
            hasPageOverride={hasPageOverride}
            currentPageKey={currentPageKey}
            scope={scope}
            onScopeChange={setScope}
            onThemeSwitch={switchTheme}
            onGlobalChange={updateGlobalOverride}
            onPageChange={updatePageOverride}
            onResetToTheme={handleResetToTheme}
            onDeletePageOverride={handleDeletePageOverride}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
          <PreviewPanel
            locale={locale}
            selectedPage={selectedPage}
            viewport={viewport}
            iframeRef={iframeRef}
            onPageChange={setSelectedPage}
            onViewportChange={setViewport}
            onIframeLoad={handleIframeLoad}
          />
        </div>
      </div>
    </div>
  );
}
