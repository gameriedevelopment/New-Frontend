import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiGet, apiPost, cookieRemove, cookieSet } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  cookieRemove: vi.fn(),
  cookieSet: vi.fn(),
}));

vi.mock("../../lib/api", () => ({ api: { get: apiGet, post: apiPost } }));
vi.mock("js-cookie", () => ({
  default: { get: vi.fn(), remove: cookieRemove, set: cookieSet },
}));

import { signInAdmin } from "./api";

describe("signInAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: { protocol: "http:" } },
    });
  });

  it("waits for the authenticated session before enforcing the admin role", async () => {
    apiPost.mockResolvedValue({
      data: { data: { token: "token", user: { id: "admin-id" } } },
    });
    apiGet.mockResolvedValue({
      data: { data: { id: "admin-id", email: "admin@gamerie.gg", role: "admin" } },
    });

    await expect(signInAdmin("admin@gamerie.gg", "password")).resolves.toEqual(
      expect.objectContaining({ id: "admin-id", role: "admin" }),
    );
    expect(cookieSet).toHaveBeenCalledWith(
      "admin_auth_token",
      "token",
      expect.objectContaining({ sameSite: "Lax", secure: false }),
    );
    expect(apiGet).toHaveBeenCalledWith("/admin/session");
    expect(cookieRemove).not.toHaveBeenCalled();
  });
});
