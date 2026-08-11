import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useFieldArray, useForm, type UseFormRegister } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../../components/ui";
import { getApiErrorMessage } from "../../../lib/errors";
import { useUpdatePlayerProfile } from "../../profile/hooks";
import type { PlayerProfile } from "../../profile/types";
import type { SettingsSection } from "../types";

const optionalUrl = z
  .string()
  .refine(
    (value) => !value || /^https?:\/\//i.test(value),
    "Enter a complete URL beginning with http:// or https://",
  );
const schema = z.object({
  username: z.string().trim().min(3, "Username must have at least 3 characters").max(40),
  gamerTitle: z
    .enum(["Player", "Streamer", "Spectator", "Coach", "Manager", "Trainer", "Analyst"])
    .or(z.literal("")),
  gameLevel: z.enum(["Hobbyist", "Amateur", "Advanced", "Competitor", "Pro"]).or(z.literal("")),
  region: z.string().max(80).optional(),
  bio: z.string().max(500, "Bio must be 500 characters or fewer").optional(),
  dateOfBirth: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true;
      const today = new Date();
      const born = new Date(`${value}T00:00:00`);
      let age = today.getFullYear() - born.getFullYear();
      if (today < new Date(today.getFullYear(), born.getMonth(), born.getDate())) age--;
      return age >= 16;
    }, "You must be 16 or older"),
  personalInfo: z.object({
    fullName: z.string().max(100).optional(),
    gender: z.string().max(40).optional(),
    location: z.string().max(120).optional(),
    profession: z.string().max(120).optional(),
  }),
  platforms: z.array(z.enum(["PC", "XBOX", "PS5", "Switch", "Mobile"])),
  skills: z.array(z.object({ name: z.string().trim().min(1, "Enter a skill").max(60) })).max(20),
  socialMedia: z.array(z.object({ platform: z.string(), username: z.string(), url: optionalUrl })),
  gamingAccounts: z.array(
    z.object({ platform: z.string(), username: z.string(), url: optionalUrl }),
  ),
});

type Values = z.infer<typeof schema>;
const platforms = ["PC", "XBOX", "PS5", "Switch", "Mobile"] as const;
const titles = [
  "Player",
  "Streamer",
  "Spectator",
  "Coach",
  "Manager",
  "Trainer",
  "Analyst",
] as const;
const levels = ["Hobbyist", "Amateur", "Advanced", "Competitor", "Pro"] as const;

function Field({
  children,
  error,
  label,
  hint,
}: {
  children: ReactNode;
  error?: string;
  label: string;
  hint?: string;
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      {children}
      {error ? (
        <small className="settings-field__error">{error}</small>
      ) : hint ? (
        <small>{hint}</small>
      ) : null}
    </label>
  );
}

export function ProfileEditor({
  profile,
  section,
}: {
  profile: PlayerProfile;
  section: Extract<SettingsSection, "profile" | "personal" | "skills" | "social">;
}) {
  const update = useUpdatePlayerProfile(profile.id);
  const [saved, setSaved] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: profile.username,
      gamerTitle: (profile.gamerTitle as Values["gamerTitle"]) || "",
      gameLevel: (profile.gameLevel as Values["gameLevel"]) || "",
      region: profile.region || "",
      bio: profile.bio || "",
      dateOfBirth: profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : "",
      personalInfo: {
        fullName: profile.personalInfo?.fullName || "",
        gender: profile.personalInfo?.gender || "",
        location: profile.personalInfo?.location || "",
        profession: profile.personalInfo?.profession || "",
      },
      platforms:
        profile.platforms?.filter((item): item is Values["platforms"][number] =>
          platforms.includes(item as Values["platforms"][number]),
        ) ?? [],
      skills:
        profile.skills?.map((item) => ({ name: item.name || "" })).filter((item) => item.name) ??
        [],
      socialMedia:
        profile.socialMedia?.map((item) => ({
          platform: item.platform || "",
          username: item.username || "",
          url: item.url || "",
        })) ?? [],
      gamingAccounts:
        profile.gamingAccounts?.map((item) => ({
          platform: item.platform || "",
          username: item.username || "",
          url: item.url || "",
        })) ?? [],
    },
  });
  const skills = useFieldArray({ control: form.control, name: "skills" });
  const social = useFieldArray({ control: form.control, name: "socialMedia" });
  const gaming = useFieldArray({ control: form.control, name: "gamingAccounts" });
  useEffect(() => {
    setSaved(false);
  }, [section]);

  const submit = form.handleSubmit(async (values) => {
    setSaved(false);
    await update.mutateAsync({
      ...values,
      gamerTitle: values.gamerTitle || undefined,
      gameLevel: values.gameLevel || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      skills: values.skills.map((item) => ({ name: item.name })),
      socialMedia: values.socialMedia.filter((item) => item.platform && item.username && item.url),
      gamingAccounts: values.gamingAccounts.filter((item) => item.platform && item.username),
    });
    form.reset(values);
    setSaved(true);
  });

  return (
    <form className="settings-form" onSubmit={submit}>
      {section === "profile" ? (
        <>
          <div className="settings-section-heading">
            <p>Public identity</p>
            <h2>Basic information</h2>
            <span>This is how you appear across feeds, conversations, teams, and competition.</span>
          </div>
          <div className="settings-form__grid">
            <Field label="Username" error={form.formState.errors.username?.message}>
              <input autoComplete="username" {...form.register("username")} />
            </Field>
            <Field label="Player title">
              <select {...form.register("gamerTitle")}>
                <option value="">Choose a title</option>
                {titles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Gaming level">
              <select {...form.register("gameLevel")}>
                <option value="">Choose a level</option>
                {levels.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Region">
              <input placeholder="West Africa" {...form.register("region")} />
            </Field>
            <Field
              label="Bio"
              error={form.formState.errors.bio?.message}
              hint={`${form.watch("bio")?.length ?? 0} / 500`}
            >
              <textarea
                rows={6}
                placeholder="A concise introduction to your game life, role, and ambitions."
                {...form.register("bio")}
              />
            </Field>
          </div>
        </>
      ) : null}
      {section === "personal" ? (
        <>
          <div className="settings-section-heading">
            <p>Private details</p>
            <h2>Personal information</h2>
            <span>
              These details only appear to others when the matching privacy permission is enabled.
            </span>
          </div>
          <div className="settings-form__grid settings-form__grid--two">
            <Field label="Full name">
              <input autoComplete="name" {...form.register("personalInfo.fullName")} />
            </Field>
            <Field label="Date of birth" error={form.formState.errors.dateOfBirth?.message}>
              <input type="date" {...form.register("dateOfBirth")} />
            </Field>
            <Field label="Gender">
              <select {...form.register("personalInfo.gender")}>
                <option value="">Prefer not to say</option>
                <option>Female</option>
                <option>Male</option>
                <option>Non-binary</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Location">
              <input
                autoComplete="address-level2"
                placeholder="City, country"
                {...form.register("personalInfo.location")}
              />
            </Field>
            <Field label="Profession">
              <input
                autoComplete="organization-title"
                placeholder="Player, designer, student…"
                {...form.register("personalInfo.profession")}
              />
            </Field>
          </div>
        </>
      ) : null}
      {section === "skills" ? (
        <>
          <div className="settings-section-heading">
            <p>Player strengths</p>
            <h2>Skills and platforms</h2>
            <span>Keep this specific. A focused identity is more useful than a long list.</span>
          </div>
          <fieldset className="settings-platforms">
            <legend>Platforms</legend>
            <div>
              {platforms.map((item) => (
                <label key={item}>
                  <input type="checkbox" value={item} {...form.register("platforms")} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="settings-array">
            <header>
              <div>
                <h3>Skills</h3>
                <p>Up to 20 player or professional skills.</p>
              </div>
              <button type="button" onClick={() => skills.append({ name: "" })}>
                <Plus size={14} />
                Add skill
              </button>
            </header>
            {skills.fields.length ? (
              skills.fields.map((field, index) => (
                <div className="settings-array__row" key={field.id}>
                  <input
                    aria-label={`Skill ${index + 1}`}
                    placeholder="e.g. Shot calling"
                    {...form.register(`skills.${index}.name`)}
                  />
                  <button
                    type="button"
                    aria-label={`Remove skill ${index + 1}`}
                    onClick={() => skills.remove(index)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            ) : (
              <p className="settings-array__empty">No skills added yet.</p>
            )}
          </div>
        </>
      ) : null}
      {section === "social" ? (
        <>
          <div className="settings-section-heading">
            <p>Connected identity</p>
            <h2>Social and gaming accounts</h2>
            <span>Give people trusted ways to find your work and your game identities.</span>
          </div>
          <AccountArray
            title="Social profiles"
            description="Public profiles such as Twitch, YouTube, X, or Instagram."
            fields={social.fields}
            prefix="socialMedia"
            register={form.register}
            append={() => social.append({ platform: "", username: "", url: "" })}
            remove={social.remove}
          />
          <AccountArray
            title="Gaming accounts"
            description="Steam, Riot, EA, Lichess, or another gaming identity."
            fields={gaming.fields}
            prefix="gamingAccounts"
            register={form.register}
            append={() => gaming.append({ platform: "", username: "", url: "" })}
            remove={gaming.remove}
          />
        </>
      ) : null}
      {update.isError ? (
        <p className="settings-error" role="alert">
          {getApiErrorMessage(update.error, "Your profile changes could not be saved.")}
        </p>
      ) : null}
      <footer className="settings-form__footer">
        <span aria-live="polite">
          {saved ? "Changes saved." : form.formState.isDirty ? "You have unsaved changes." : ""}
        </span>
        <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </footer>
    </form>
  );
}

function AccountArray({
  append,
  description,
  fields,
  prefix,
  register,
  remove,
  title,
}: {
  append: () => void;
  description: string;
  fields: Array<{ id: string }>;
  prefix: "socialMedia" | "gamingAccounts";
  register: UseFormRegister<Values>;
  remove: (index: number) => void;
  title: string;
}) {
  return (
    <div className="settings-array">
      <header>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <button type="button" onClick={append}>
          <Plus size={14} />
          Add account
        </button>
      </header>
      {fields.length ? (
        fields.map((field, index) => (
          <div className="settings-account-row" key={field.id}>
            <input
              aria-label="Platform"
              placeholder="Platform"
              {...register(`${prefix}.${index}.platform`)}
            />
            <input
              aria-label="Username"
              placeholder="Username"
              {...register(`${prefix}.${index}.username`)}
            />
            <input
              aria-label="Profile URL"
              placeholder="https://"
              {...register(`${prefix}.${index}.url`)}
            />
            <button type="button" aria-label="Remove account" onClick={() => remove(index)}>
              <Trash2 size={15} />
            </button>
          </div>
        ))
      ) : (
        <p className="settings-array__empty">No accounts connected yet.</p>
      )}
    </div>
  );
}
