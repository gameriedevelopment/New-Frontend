import { AlertCircle, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button, SafeImage, Skeleton, SkeletonText, StatePanel } from "../../components/ui";
import { useAuthStore } from "../auth/authStore";
import { usePlayerProfile } from "../profile/hooks";
import { CookiePreferencesCard } from "../privacy/CookieConsent";
import { MediaEditor } from "./components/MediaEditor";
import { PrivacyEditor } from "./components/PrivacyEditor";
import { ProfileEditor } from "./components/ProfileEditor";
import { SecurityEditor } from "./components/SecurityEditor";
import { usePlayerSettings } from "./hooks";
import type { PlayerSettings, SettingsSection } from "./types";
import "./settings.css";

const sections: Array<{ id: SettingsSection; group: string; label: string; description: string }> =
  [
    {
      id: "profile",
      group: "Profile",
      label: "Basic information",
      description: "Username, title, level, and bio",
    },
    {
      id: "personal",
      group: "Profile",
      label: "Personal details",
      description: "Name, location, and profession",
    },
    {
      id: "media",
      group: "Profile",
      label: "Profile media",
      description: "Avatar and cover image",
    },
    {
      id: "skills",
      group: "Identity",
      label: "Skills & platforms",
      description: "Strengths and devices",
    },
    {
      id: "social",
      group: "Identity",
      label: "Social & accounts",
      description: "Public and gaming identities",
    },
    {
      id: "privacy",
      group: "Account",
      label: "Privacy",
      description: "Visibility and information sharing",
    },
    {
      id: "security",
      group: "Account",
      label: "Security",
      description: "Password, email, and phone",
    },
  ];

const privacyDefaults: PlayerSettings = {
  privacy: {
    profileVisibility: "public",
    showOnlineStatus: true,
    showGameActivity: true,
    showEmail: false,
    showPhone: false,
    showFullName: false,
    showAge: false,
    showGender: false,
    showLocation: false,
    showProfession: false,
  },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

function SettingsSkeleton() {
  return (
    <div className="settings-skeleton" role="status" aria-label="Loading settings">
      <aside>
        <Skeleton width="55%" height={16} />
        <SkeletonText lines={7} />
      </aside>
      <section>
        <Skeleton width="32%" height={25} />
        <SkeletonText lines={2} />
        <Skeleton height={52} />
        <Skeleton height={52} />
        <Skeleton height={140} />
      </section>
    </div>
  );
}

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [params, setParams] = useSearchParams();
  const requested = params.get("section") as SettingsSection | null;
  const section = sections.some((item) => item.id === requested) ? requested! : "profile";
  const profile = usePlayerProfile(user?.username || user?.id);
  const settings = usePlayerSettings(user?.id);
  const change = (next: SettingsSection) => {
    const value = new URLSearchParams(params);
    if (next === "profile") value.delete("section");
    else value.set("section", next);
    setParams(value, { replace: true });
  };
  if (profile.isLoading) return <SettingsSkeleton />;
  if (profile.isError || !profile.data)
    return (
      <StatePanel
        tone="error"
        icon={<AlertCircle size={20} />}
        title="Settings could not open"
        description="Gamerie could not load the account information needed for this workspace."
        action={
          <Button size="small" variant="quiet" onClick={() => profile.refetch()}>
            <RefreshCw size={14} />
            Try again
          </Button>
        }
      />
    );
  const grouped = ["Profile", "Identity", "Account"];
  const editable =
    section === "profile" || section === "personal" || section === "skills" || section === "social";
  return (
    <main className="settings-page">
      <header className="settings-page__header">
        <p>Account workspace</p>
        <h1>Settings</h1>
        <span>Manage your public player identity and the private controls behind it.</span>
      </header>
      <div className="settings-workspace">
        <aside>
          <div className="settings-owner">
            <SafeImage src={profile.data.profileImage} alt="" />
            <div>
              <strong>{profile.data.username}</strong>
              <small>{profile.data.email}</small>
            </div>
          </div>
          <nav aria-label="Settings sections">
            {grouped.map((group) => (
              <div key={group}>
                <p>{group}</p>
                {sections
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-current={section === item.id ? "page" : undefined}
                      onClick={() => change(item.id)}
                    >
                      <span>{item.label}</span>
                      <small>{item.description}</small>
                    </button>
                  ))}
              </div>
            ))}
          </nav>
        </aside>
        <div className="settings-content">
          {editable ? <ProfileEditor profile={profile.data} section={section} /> : null}
          {section === "media" ? <MediaEditor profile={profile.data} /> : null}
          {section === "privacy" ? (
            settings.isLoading ? (
              <div className="settings-content-loader">
                <Skeleton width="30%" height={24} />
                <SkeletonText lines={3} />
                <Skeleton height={210} />
              </div>
            ) : settings.isError ? (
              <StatePanel
                tone="error"
                icon={<AlertCircle size={19} />}
                title="Privacy controls could not load"
                description="Try loading your privacy settings again."
                action={
                  <Button size="small" variant="quiet" onClick={() => settings.refetch()}>
                    Retry
                  </Button>
                }
              />
            ) : (
              <>
                <PrivacyEditor
                  key={JSON.stringify(settings.data)}
                  settings={{
                    ...privacyDefaults,
                    ...settings.data,
                    privacy: { ...privacyDefaults.privacy, ...settings.data?.privacy },
                  }}
                  userId={user!.id}
                />
                <CookiePreferencesCard />
              </>
            )
          ) : null}
          {section === "security" ? <SecurityEditor /> : null}
        </div>
      </div>
    </main>
  );
}
