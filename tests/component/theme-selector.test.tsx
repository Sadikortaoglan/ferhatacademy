import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeSelector } from "@/app/[locale]/admin/website/appearance/theme-selector";

vi.mock("@/app/[locale]/admin/website/appearance/actions", () => ({
  activateTheme: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("ThemeSelector", () => {
  it("renders all three theme cards", () => {
    render(<ThemeSelector activeThemeId="signature" />);
    expect(screen.getByText("Ferhat Signature")).toBeInTheDocument();
    expect(screen.getByText("Modern Akademi")).toBeInTheDocument();
    expect(screen.getByText("Creator Editorial")).toBeInTheDocument();
  });

  it("shows active badge on the active theme", () => {
    render(<ThemeSelector activeThemeId="academy" />);
    expect(screen.getByText("Aktif")).toBeInTheDocument();
    expect(screen.getByText("Şu an aktif tema")).toBeInTheDocument();
  });

  it("shows activate buttons for non-active themes", () => {
    render(<ThemeSelector activeThemeId="signature" />);
    const activateButtons = screen.getAllByText("Aktive Et");
    expect(activateButtons).toHaveLength(2);
  });

  it("does not show activate button for active theme", () => {
    render(<ThemeSelector activeThemeId="editorial" />);
    const activateButtons = screen.getAllByText("Aktive Et");
    expect(activateButtons).toHaveLength(2);
  });

  it("shows theme descriptions", () => {
    render(<ThemeSelector activeThemeId="signature" />);
    expect(screen.getByText(/koyu, editoryal/i)).toBeInTheDocument();
    expect(screen.getByText(/temiz, yapılandırılmış/i)).toBeInTheDocument();
    expect(screen.getByText(/krem zemin/i)).toBeInTheDocument();
  });
});
