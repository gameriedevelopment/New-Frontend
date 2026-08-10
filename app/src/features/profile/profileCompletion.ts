interface CompletionProfile {
  profileImage?: unknown;
  backgroundImage?: unknown;
  bio?: unknown;
  gamerTitle?: unknown;
  region?: unknown;
  platforms?: unknown;
  gamesPlayed?: unknown;
  games?: unknown;
  skills?: unknown;
  socialMedia?: unknown;
}

export interface CompletionRequirement {
  id: "avatar" | "cover" | "bio" | "title" | "platform" | "game" | "skill" | "social";
  label: string;
  route: string;
  action: string;
  weight: number;
  complete: boolean;
}

const hasText = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const hasItems = (value: unknown) => Array.isArray(value) && value.length > 0;

export function getProfileCompletion(profile: CompletionProfile | null | undefined) {
  const requirements: CompletionRequirement[] = [
    { id: "avatar", label: "add a profile image", route: "/settings?section=media", action: "Add image", weight: 20, complete: hasText(profile?.profileImage) },
    { id: "bio", label: "write a short bio", route: "/settings?section=profile", action: "Add bio", weight: 15, complete: hasText(profile?.bio) },
    { id: "title", label: "choose a player title", route: "/settings?section=profile", action: "Choose title", weight: 10, complete: hasText(profile?.gamerTitle) },
    { id: "game", label: "add at least one game", route: "?tab=games", action: "Add game", weight: 20, complete: hasItems(profile?.gamesPlayed) || hasItems(profile?.games) },
    { id: "skill", label: "add at least one skill", route: "/settings?section=skills", action: "Add skill", weight: 10, complete: hasItems(profile?.skills) },
    { id: "platform", label: "choose at least one platform", route: "/settings?section=skills", action: "Choose platform", weight: 10, complete: hasItems(profile?.platforms) },
    { id: "social", label: "add at least one social link", route: "/settings?section=social", action: "Add social link", weight: 10, complete: hasItems(profile?.socialMedia) },
    { id: "cover", label: "add a cover image", route: "/settings?section=media", action: "Add cover", weight: 5, complete: hasText(profile?.backgroundImage) },
  ];
  const completed = requirements.filter((item) => item.complete).length;
  const score = requirements.reduce((total, item) => total + (item.complete ? item.weight : 0), 0);
  return { score, completed, total: requirements.length, missing: requirements.filter((item) => !item.complete), requirements };
}
