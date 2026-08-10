import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, ImagePlus, Shield, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import {
  Button,
  SafeImage,
  SearchSelect,
  SkeletonText,
  StatePanel,
} from "../../components/ui";
import { getApiErrorMessage } from "../../lib/errors";
import { useGames } from "../games/hooks";
import type { Game } from "../games/types";
import {
  useCommunityDetail,
  useCreateCommunity,
  useUpdateCommunity,
} from "./hooks";
import { COMMUNITY_REGIONS, getTimezoneOptions, TEAM_LEVELS } from "./options";
import type {
  CommunityFormPayload,
  CommunityGame,
  HubSummary,
  TeamSummary,
} from "./types";
import "./communities.css";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters.")
    .max(60, "Keep the name under 60 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Add at least 20 characters so people understand the purpose.")
    .max(700, "Keep the description under 700 characters."),
  country: z.string().trim().max(80),
  region: z.string().trim().max(80),
  timezone: z.string().trim().max(80),
  level: z.string(),
  teamMessage: z
    .string()
    .trim()
    .max(300, "Keep this message under 300 characters."),
  type: z.enum(["community", "organization"]),
  visibility: z.enum(["public", "private"]),
  joinPolicy: z.enum(["open", "request"]),
  organizationName: z.string().trim().max(100),
  vatNumber: z.string().trim().max(80),
  platforms: z.array(z.string()),
  games: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        platforms: z.array(z.string()),
      }),
    )
    .max(12),
});

type FormValues = z.infer<typeof formSchema>;
const platformOptions = [
  "PC",
  "PlayStation",
  "Xbox",
  "Nintendo Switch",
  "Mobile",
];
const timezoneOptions = getTimezoneOptions();
const selectTimezones = (current: string, filtered: typeof timezoneOptions) => {
  const options = filtered.map((zone) => ({ value: zone.value, label: zone.label }));
  return current && !options.some((option) => option.value === current)
    ? [{ value: current, label: current }, ...options]
    : options;
};
const emptyValues: FormValues = {
  name: "",
  description: "",
  country: "",
  region: "",
  timezone: "UTC",
  level: "Amateur",
  teamMessage: "",
  type: "community",
  visibility: "public",
  joinPolicy: "request",
  organizationName: "",
  vatNumber: "",
  platforms: [],
  games: [],
};
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function valuesFor(
  item: TeamSummary | HubSummary,
  kind: "team" | "hub",
): FormValues {
  const hub = item as HubSummary;
  const team = item as TeamSummary;
  return {
    ...emptyValues,
    name: item.name || "",
    description: item.description || "",
    country: item.country || "",
    region: item.region || "",
    timezone: item.timezone || "UTC",
    platforms: item.platforms || [],
    games: (item.games || [])
      .map((game) => ({
        id: game.id || "",
        name: game.name,
        platforms: game.platforms || [],
      }))
      .filter((game) => game.id),
    level: kind === "team" ? team.level || "Amateur" : "Amateur",
    teamMessage: kind === "team" ? team.teamMessage || "" : "",
    type:
      kind === "hub" && hub.type === "organization"
        ? "organization"
        : "community",
    visibility:
      kind === "hub" && hub.visibility === "private" ? "private" : "public",
    joinPolicy:
      kind === "hub" && hub.joinPolicy === "open" ? "open" : "request",
    organizationName: hub.organizationName || "",
    vatNumber: hub.vatNumber || "",
  };
}

function usePreview(file?: File, current?: string) {
  const [url, setUrl] = useState(current || "");
  useEffect(() => {
    if (!file) {
      setUrl(current || "");
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [current, file]);
  return url;
}

function MediaField({
  acceptFile,
  current,
  file,
  kind,
  label,
  shape,
}: {
  acceptFile: (file?: File) => void;
  current?: string;
  file?: File;
  kind: "team" | "hub";
  label: string;
  shape: "logo" | "cover";
}) {
  const preview = usePreview(file, current);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className={`community-media-field community-media-field--${shape}`}>
      <div>
        <span>{label}</span>
        <small>
          {shape === "logo"
            ? "Square image, at least 400 × 400"
            : "Wide image, at least 1400 × 500"}
        </small>
      </div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-label={`Choose ${label.toLowerCase()}`}
      >
        <SafeImage
          src={preview}
          fallback={
            shape === "logo"
              ? "/avatar-fallback.svg"
              : "/profile-cover-fallback.jpg"
          }
          alt={`${kind} ${label.toLowerCase()} preview`}
        />
        <i>
          <ImagePlus size={15} />
          Replace
        </i>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => acceptFile(event.target.files?.[0])}
      />
      {file ? (
        <button
          className="community-media-remove"
          type="button"
          onClick={() => {
            acceptFile(undefined);
            if (input.current) input.current.value = "";
          }}
        >
          <Trash2 size={13} />
          Undo selection
        </button>
      ) : null}
    </div>
  );
}

export function CommunityFormPage({
  kind,
  mode,
}: {
  kind: "team" | "hub";
  mode: "create" | "edit";
}) {
  const { communitySlug } = useParams();
  const navigate = useNavigate();
  const editing = mode === "edit";
  const detail = useCommunityDetail(kind, editing ? communitySlug : undefined);
  const create = useCreateCommunity(kind);
  const update = useUpdateCommunity(kind, communitySlug);
  const [logo, setLogo] = useState<File>();
  const [background, setBackground] = useState<File>();
  const [mediaError, setMediaError] = useState("");
  const [gameSearch, setGameSearch] = useState("");
  const [gameSelection, setGameSelection] = useState("");
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const saved = useRef(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyValues,
    mode: "onBlur",
  });
  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = form;
  const type = watch("type");
  const visibility = watch("visibility");
  const platforms = watch("platforms");
  const games = watch("games");
  const dirty = isDirty || Boolean(logo || background);
  const gameQuery = useGames({ search: gameSearch });
  const gameOptions = useMemo(
    () =>
      gameQuery.data?.pages
        .flatMap((page) => page.data)
        .filter(
          (game, index, all) =>
            all.findIndex((entry) => entry.id === game.id) === index &&
            !games.some((savedGame) => savedGame.id === game.id),
        ) ?? [],
    [gameQuery.data, games],
  );
  const filteredTimezones = useMemo(() => {
    const query = timezoneSearch.trim().toLowerCase();
    return query
      ? timezoneOptions.filter((zone) =>
          zone.label.toLowerCase().includes(query),
        )
      : timezoneOptions;
  }, [timezoneSearch]);

  useEffect(() => {
    if (editing && detail.data) reset(valuesFor(detail.data, kind));
  }, [detail.data, editing, kind, reset]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty || saved.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  useEffect(() => {
    const intercept = (event: MouseEvent) => {
      if (
        !dirty ||
        saved.current ||
        event.defaultPrevented ||
        event.button !== 0
      )
        return;
      const anchor = (event.target as Element).closest("a");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        !anchor.href.startsWith(window.location.origin)
      )
        return;
      if (!window.confirm("Discard your unsaved changes?"))
        event.preventDefault();
    };
    document.addEventListener("click", intercept, true);
    return () => document.removeEventListener("click", intercept, true);
  }, [dirty]);

  const acceptMedia = useCallback(
    (next: File | undefined, setter: (file?: File) => void) => {
      setMediaError("");
      if (
        next &&
        (!next.type.startsWith("image/") || next.size > 5 * 1024 * 1024)
      ) {
        setMediaError("Use a PNG, JPEG, or WebP image smaller than 5 MB.");
        return;
      }
      setter(next);
    },
    [],
  );
  const leave = () => {
    if (!dirty || window.confirm("Discard your unsaved changes?"))
      navigate(editing ? `/${kind}s/${communitySlug}` : `/${kind}s`);
  };
  const addGame = (id: string) => {
    const game = gameOptions.find((entry) => entry.id === id);
    if (!game) return;
    setValue(
      "games",
      [
        ...games,
        {
          id: game.id,
          name: game.name,
          platforms:
            game.platforms?.filter((entry) => platforms.includes(entry)) || [],
        },
      ],
      { shouldDirty: true, shouldValidate: true },
    );
    setGameSelection("");
    setGameSearch("");
  };
  const removeGame = (id: string) =>
    setValue(
      "games",
      games.filter((game) => game.id !== id),
      { shouldDirty: true },
    );
  const submit = handleSubmit(async (values) => {
    if (
      kind === "hub" &&
      values.type === "organization" &&
      !values.organizationName
    ) {
      setError("organizationName", {
        message: "Add the organization’s legal or public name.",
      });
      return;
    }
    const payload: CommunityFormPayload = {
      name: values.name,
      description: values.description || undefined,
      country: values.country || undefined,
      region: values.region || undefined,
      timezone: values.timezone || undefined,
      platforms: values.platforms,
      games: values.games.map((game) => ({
        ...game,
        platforms: game.platforms.length ? game.platforms : values.platforms,
      })),
    };
    if (kind === "team")
      Object.assign(payload, {
        level: values.level,
        teamMessage: values.teamMessage || undefined,
      });
    else
      Object.assign(payload, {
        type: values.type,
        visibility: values.visibility,
        joinPolicy:
          values.visibility === "private" ? "request" : values.joinPolicy,
        organizationName:
          values.type === "organization" ? values.organizationName : undefined,
        vatNumber:
          values.type === "organization"
            ? values.vatNumber || undefined
            : undefined,
      });
    try {
      const result =
        editing && detail.data
          ? await update.mutateAsync({
              id: detail.data.id,
              payload,
              files: { logo, background },
            })
          : await create.mutateAsync({ payload, files: { logo, background } });
      saved.current = true;
      navigate(
        `/${kind}s/${encodeURIComponent(result.slug || (editing ? communitySlug || result.id : slugify(result.name)))}`,
        { replace: true },
      );
    } catch {
      /* Error is rendered in the form. */
    }
  });
  const mutation = editing ? update : create;
  const item = detail.data;
  const noun = kind === "team" ? "team" : "hub";

  if (editing && detail.isLoading)
    return (
      <main className="community-form-page">
        <SkeletonText lines={8} />
      </main>
    );
  if (editing && (detail.isError || !item))
    return (
      <main className="community-form-page">
        <StatePanel
          tone="error"
          title={`${noun[0].toUpperCase() + noun.slice(1)} unavailable`}
          description={getApiErrorMessage(
            detail.error,
            `This ${noun} could not be loaded for editing.`,
          )}
          action={
            <Button variant="secondary" onClick={() => detail.refetch()}>
              Try again
            </Button>
          }
        />
      </main>
    );
  if (editing && !item?.viewerRelationship?.isOwner)
    return (
      <main className="community-form-page">
        <StatePanel
          icon={<Shield size={20} />}
          title="Owner access required"
          description={`Only the ${noun} owner can change its identity and access settings.`}
          action={
            <Button
              variant="secondary"
              onClick={() => navigate(`/${kind}s/${communitySlug}`)}
            >
              Back to {noun}
            </Button>
          }
        />
      </main>
    );

  return (
    <main className="community-form-page">
      <button className="community-form-back" type="button" onClick={leave}>
        <ArrowLeft size={15} />
        Back to {noun}s
      </button>
      <header className="community-form-heading">
        <p>{editing ? `Edit ${noun}` : `New ${noun}`}</p>
        <h1>
          {editing
            ? `Refine ${item?.name || `your ${noun}`}.`
            : kind === "team"
              ? "Build your team identity."
              : "Create a space worth joining."}
        </h1>
        <span>
          {kind === "team"
            ? "Set the identity players will recognize before you manage the roster and competitive record."
            : "Define the purpose, access, and identity before inviting people and teams in."}
        </span>
      </header>
      <form className="community-form" noValidate onSubmit={submit}>
        <section className="community-form-section community-form-section--media">
          <header>
            <span>01</span>
            <div>
              <h2>Identity media</h2>
              <p>
                Keep it recognizable at avatar size and composed across wide
                screens.
              </p>
            </div>
          </header>
          <div className="community-media-grid">
            <MediaField
              kind={kind}
              shape="logo"
              label="Logo"
              current={item?.logo}
              file={logo}
              acceptFile={(file) => acceptMedia(file, setLogo)}
            />
            <MediaField
              kind={kind}
              shape="cover"
              label="Cover image"
              current={item?.backgroundImage}
              file={background}
              acceptFile={(file) => acceptMedia(file, setBackground)}
            />
          </div>
          {mediaError ? (
            <p className="community-form-error" role="alert">
              {mediaError}
            </p>
          ) : null}
        </section>
        <section className="community-form-section">
          <header>
            <span>02</span>
            <div>
              <h2>Core information</h2>
              <p>
                Clear, specific details make the right players stop and look.
              </p>
            </div>
          </header>
          <div className="community-form-fields">
            <label className="community-field community-field--wide">
              <span>
                {kind === "team" ? "Team" : "Hub"} name <b aria-hidden>*</b>
              </span>
              <input
                {...register("name")}
                maxLength={60}
                autoComplete="organization"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={
                  errors.name ? "community-name-error" : undefined
                }
                placeholder={
                  kind === "team"
                    ? "e.g. Lagos Sentinels"
                    : "e.g. West Africa Arena"
                }
              />
              {errors.name ? (
                <small id="community-name-error" role="alert">
                  {errors.name.message}
                </small>
              ) : null}
            </label>
            <label className="community-field community-field--wide">
              <span>Description</span>
              <textarea
                {...register("description")}
                rows={5}
                maxLength={700}
                aria-invalid={Boolean(errors.description)}
                placeholder={`What is this ${noun} building, and who is it for?`}
              />
              {errors.description ? (
                <small role="alert">{errors.description.message}</small>
              ) : (
                <small>{watch("description").length} / 700</small>
              )}
            </label>
            {kind === "team" ? (
              <>
                <label className="community-field">
                  <span>Team level</span>
                  <select {...register("level")}>
                    {TEAM_LEVELS.map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                  <small>Set for the team—not inferred from members.</small>
                </label>
                <Controller
                  control={control}
                  name="timezone"
                  render={({ field }) => (
                    <SearchSelect
                      label="Timezone"
                      value={field.value}
                      onChange={field.onChange}
                      onSearch={setTimezoneSearch}
                      options={selectTimezones(field.value, filteredTimezones)}
                      placeholder="Select timezone"
                      searchPlaceholder="Search city or timezone"
                      emptyText="No timezones match"
                    />
                  )}
                />
                <label className="community-field community-field--wide">
                  <span>Message for prospective members</span>
                  <textarea
                    {...register("teamMessage")}
                    rows={3}
                    maxLength={300}
                    placeholder="What should someone know before requesting to join?"
                  />
                  {errors.teamMessage ? (
                    <small role="alert">{errors.teamMessage.message}</small>
                  ) : (
                    <small>{watch("teamMessage").length} / 300</small>
                  )}
                </label>
              </>
            ) : null}
          </div>
        </section>
        {kind === "hub" ? (
          <section className="community-form-section">
            <header>
              <span>03</span>
              <div>
                <h2>Purpose and access</h2>
                <p>
                  These choices shape who can discover the hub and how
                  membership works.
                </p>
              </div>
            </header>
            <div className="community-choice-group">
              <fieldset>
                <legend>Hub type</legend>
                <div>
                  {(
                    [
                      [
                        "community",
                        "Community",
                        "For players and teams around a shared interest.",
                      ],
                      [
                        "organization",
                        "Organization",
                        "For a formal club, league, brand, or institution.",
                      ],
                    ] as const
                  ).map(([value, label, copy]) => (
                    <label key={value}>
                      <input type="radio" value={value} {...register("type")} />
                      <span>
                        <strong>{label}</strong>
                        <small>{copy}</small>
                        <Check size={15} />
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Visibility</legend>
                <div>
                  {(
                    [
                      ["public", "Public", "Anyone can discover this hub."],
                      [
                        "private",
                        "Private",
                        "Identity is visible; activity stays member-only.",
                      ],
                    ] as const
                  ).map(([value, label, copy]) => (
                    <label key={value}>
                      <input
                        type="radio"
                        value={value}
                        {...register("visibility")}
                      />
                      <span>
                        <strong>{label}</strong>
                        <small>{copy}</small>
                        <Check size={15} />
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {visibility === "public" ? (
                <fieldset>
                  <legend>Joining</legend>
                  <div>
                    {(
                      [
                        [
                          "request",
                          "Request approval",
                          "Admins review each membership request.",
                        ],
                        [
                          "open",
                          "Open membership",
                          "Players can join immediately.",
                        ],
                      ] as const
                    ).map(([value, label, copy]) => (
                      <label key={value}>
                        <input
                          type="radio"
                          value={value}
                          {...register("joinPolicy")}
                        />
                        <span>
                          <strong>{label}</strong>
                          <small>{copy}</small>
                          <Check size={15} />
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <p className="community-policy-note">
                  Private hubs always require an approved request or invitation.
                </p>
              )}
            </div>
            {type === "organization" ? (
              <div className="community-form-fields community-form-fields--organization">
                <label className="community-field">
                  <span>
                    Organization name <b aria-hidden>*</b>
                  </span>
                  <input
                    {...register("organizationName")}
                    aria-invalid={Boolean(errors.organizationName)}
                    placeholder="Registered or public name"
                  />
                  {errors.organizationName ? (
                    <small role="alert">
                      {errors.organizationName.message}
                    </small>
                  ) : null}
                </label>
                <label className="community-field">
                  <span>
                    VAT or tax number <em>Optional</em>
                  </span>
                  <input
                    {...register("vatNumber")}
                    autoComplete="off"
                    placeholder="Organization identifier"
                  />
                </label>
              </div>
            ) : null}
          </section>
        ) : null}
        <section className="community-form-section">
          <header>
            <span>{kind === "hub" ? "04" : "03"}</span>
            <div>
              <h2>Games and platforms</h2>
              <p>
                Connect the identity to the titles and places where the
                community plays.
              </p>
            </div>
          </header>
          <div
            className="community-platforms"
            role="group"
            aria-label="Platforms"
          >
            {platformOptions.map((platform) => (
              <label key={platform}>
                <input
                  type="checkbox"
                  value={platform}
                  {...register("platforms")}
                />
                <span>
                  {platform}
                  <Check size={13} />
                </span>
              </label>
            ))}
          </div>
          <Controller
            control={control}
            name="games"
            render={() => (
              <SearchSelect
                label="Add games"
                value={gameSelection}
                onChange={(value) => {
                  setGameSelection(value);
                  addGame(value);
                }}
                onSearch={setGameSearch}
                loading={gameQuery.isLoading}
                loadingMore={gameQuery.isFetchingNextPage}
                hasMore={gameQuery.hasNextPage}
                onLoadMore={() => {
                  if (!gameQuery.isFetchingNextPage)
                    void gameQuery.fetchNextPage();
                }}
                options={gameOptions.map((game: Game) => ({
                  value: game.id,
                  label: game.name,
                  description: game.gameType || game.company,
                }))}
                placeholder="Choose from the games catalogue"
                searchPlaceholder="Search games"
                emptyText="No other games match"
              />
            )}
          />
          {games.length ? (
            <div className="community-selected-games">
              {games.map((game: CommunityGame) => (
                <span key={game.id}>
                  <strong>{game.name}</strong>
                  <button
                    type="button"
                    onClick={() => removeGame(game.id || "")}
                    aria-label={`Remove ${game.name}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="community-form-hint">
              Games can be added now or refined later from the {noun} settings.
            </p>
          )}
        </section>
        <section className="community-form-section">
          <header>
            <span>{kind === "hub" ? "05" : "04"}</span>
            <div>
              <h2>Location</h2>
              <p>
                Optional context for regional discovery, scheduling, and
                competition.
              </p>
            </div>
          </header>
          <div className="community-form-fields">
            <label className="community-field">
              <span>Country</span>
              <input
                {...register("country")}
                autoComplete="country-name"
                placeholder="e.g. Nigeria"
              />
            </label>
            <label className="community-field">
              <span>Region</span>
              <select {...register("region")}>
                <option value="">Select region</option>
                {item?.region &&
                !COMMUNITY_REGIONS.includes(
                  item.region as (typeof COMMUNITY_REGIONS)[number],
                ) ? (
                  <option>{item.region}</option>
                ) : null}
                {COMMUNITY_REGIONS.map((region) => (
                  <option key={region}>{region}</option>
                ))}
              </select>
            </label>
            {kind === "hub" ? (
              <Controller
                control={control}
                name="timezone"
                render={({ field }) => (
                  <SearchSelect
                    label="Timezone"
                    value={field.value}
                    onChange={field.onChange}
                    onSearch={setTimezoneSearch}
                    options={selectTimezones(field.value, filteredTimezones)}
                    placeholder="Select timezone"
                    searchPlaceholder="Search city or timezone"
                    emptyText="No timezones match"
                  />
                )}
              />
            ) : null}
          </div>
        </section>
        {mutation.isError ? (
          <div className="community-form-submit-error" role="alert">
            <strong>
              {editing
                ? "Changes were not saved."
                : `${noun[0].toUpperCase() + noun.slice(1)} was not created.`}
            </strong>
            <span>
              {getApiErrorMessage(
                mutation.error,
                "Check the information and try again.",
              )}
            </span>
          </div>
        ) : null}
        <footer className="community-form-footer">
          <div>
            <span>
              {dirty
                ? "Unsaved changes"
                : editing
                  ? "Everything is up to date"
                  : "Ready when you are"}
            </span>
            <small>Required fields are marked with an asterisk.</small>
          </div>
          <Button variant="quiet" onClick={leave}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? editing
                ? "Saving changes…"
                : `Creating ${noun}…`
              : editing
                ? "Save changes"
                : `Create ${noun}`}
          </Button>
        </footer>
      </form>
    </main>
  );
}
