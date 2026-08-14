import { describe, expect, it } from "vitest";
import { getRequiredSocialProvider } from "./authError";

describe("getRequiredSocialProvider", () => {
  it("returns an allowlisted provider for the provider-required response", () => {
    expect(
      getRequiredSocialProvider({
        response: {
          data: { errorCode: "SOCIAL_PROVIDER_REQUIRED", provider: "google" },
        },
      }),
    ).toBe("google");
  });

  it("does not infer a provider from a generic credentials error", () => {
    expect(
      getRequiredSocialProvider({
        response: { data: { message: "Invalid credentials" } },
      }),
    ).toBeNull();
  });

  it("rejects unrecognised provider metadata", () => {
    expect(
      getRequiredSocialProvider({
        response: {
          data: { errorCode: "SOCIAL_PROVIDER_REQUIRED", provider: "unknown" },
        },
      }),
    ).toBeNull();
  });
});
