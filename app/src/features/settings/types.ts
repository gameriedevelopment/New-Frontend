export interface PrivacySettings {
  profileVisibility: "public" | "friends" | "private";
  showOnlineStatus: boolean;
  showGameActivity: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showFullName: boolean;
  showAge: boolean;
  showGender: boolean;
  showLocation: boolean;
  showProfession: boolean;
}

export interface PlayerSettings {
  privacy: PrivacySettings;
  timezone?: string;
}

export type SettingsSection = "profile" | "personal" | "media" | "skills" | "social" | "privacy" | "security";
