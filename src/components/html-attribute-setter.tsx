"use client";

import { useEffect } from "react";

interface Props {
  locale: string;
  themeId: string;
  fontClass: string;
}

export function HtmlAttributeSetter({ locale, themeId, fontClass }: Props) {
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", locale);
    html.setAttribute("data-theme", themeId);
    html.classList.add(fontClass);
  }, [locale, themeId, fontClass]);

  return null;
}
