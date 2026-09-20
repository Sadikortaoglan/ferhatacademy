import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserStatusActions } from "@/features/admin/components/user-status-actions";

// Mock the server actions
vi.mock("@/app/[locale]/admin/users/[userId]/actions", () => ({
  activateUser: vi.fn().mockResolvedValue(undefined),
  deactivateUser: vi.fn().mockResolvedValue(undefined),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      userStatusActive: "Aktif",
      userStatusInactive: "Pasif",
      activateUser: "Hesabı Aktifleştir",
      deactivateUser: "Hesabı Pasifleştir",
      confirmActivateTitle: "Hesabı Aktifleştir",
      confirmDeactivateTitle: "Hesabı Pasifleştir",
      confirmActivate: "Bu kullanıcının hesabını aktifleştirmek istediğinize emin misiniz?",
      confirmDeactivate: "Bu kullanıcının hesabını pasifleştirmek istediğinize emin misiniz?",
      cancel: "İptal",
    };
    return map[key] ?? key;
  },
}));

import { activateUser, deactivateUser } from "@/app/[locale]/admin/users/[userId]/actions";

describe("UserStatusActions — active user", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows Active badge and Deactivate button for an active user", () => {
    render(<UserStatusActions userId="u1" isBanned={false} />);
    expect(screen.getByText("Aktif")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pasifleştir/i })).toBeInTheDocument();
  });

  it("opens deactivate confirmation dialog on button click", async () => {
    render(<UserStatusActions userId="u1" isBanned={false} />);
    await userEvent.click(screen.getByRole("button", { name: /Pasifleştir/i }));
    expect(screen.getByText(/pasifleştirmek istediğinize emin misiniz/i)).toBeInTheDocument();
  });

  it("calls deactivateUser with correct userId on confirm", async () => {
    render(<UserStatusActions userId="u1" isBanned={false} />);
    await userEvent.click(screen.getByRole("button", { name: /Pasifleştir/i }));
    const confirmBtn = screen.getAllByRole("button", { name: /Pasifleştir/i }).at(-1)!;
    await userEvent.click(confirmBtn);
    await waitFor(() => expect(deactivateUser).toHaveBeenCalledWith("u1"));
  });

  it("dismisses dialog on İptal click without calling server action", async () => {
    render(<UserStatusActions userId="u1" isBanned={false} />);
    await userEvent.click(screen.getByRole("button", { name: /Pasifleştir/i }));
    await userEvent.click(screen.getByRole("button", { name: /İptal/i }));
    expect(screen.queryByText(/emin misiniz/i)).not.toBeInTheDocument();
    expect(deactivateUser).not.toHaveBeenCalled();
  });
});

describe("UserStatusActions — banned user", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows Pasif badge and Activate button for a banned user", () => {
    render(<UserStatusActions userId="u2" isBanned={true} banReason="Spam" />);
    expect(screen.getByText("Pasif")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Aktifleştir/i })).toBeInTheDocument();
  });

  it("shows banReason next to the badge", () => {
    render(<UserStatusActions userId="u2" isBanned={true} banReason="Kural ihlali" />);
    expect(screen.getByText(/Kural ihlali/)).toBeInTheDocument();
  });

  it("calls activateUser with correct userId on confirm", async () => {
    render(<UserStatusActions userId="u2" isBanned={true} />);
    await userEvent.click(screen.getByRole("button", { name: /Aktifleştir/i }));
    const confirmBtn = screen.getAllByRole("button", { name: /Aktifleştir/i }).at(-1)!;
    await userEvent.click(confirmBtn);
    await waitFor(() => expect(activateUser).toHaveBeenCalledWith("u2"));
  });
});
