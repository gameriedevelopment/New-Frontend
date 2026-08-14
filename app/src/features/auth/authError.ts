export type SocialProvider = "google" | "facebook" | "discord" | "apple";

export function getRequiredSocialProvider(error: unknown): SocialProvider | null {
  const response = (
    error as {
      response?: { data?: { errorCode?: unknown; provider?: unknown } };
    }
  ).response?.data;

  if (response?.errorCode !== "SOCIAL_PROVIDER_REQUIRED") return null;
  return response.provider === "google" ||
    response.provider === "facebook" ||
    response.provider === "discord" ||
    response.provider === "apple"
    ? response.provider
    : null;
}
