import { BottomNav, withNavShell } from "~/components/app-shell";
import { Avatar } from "~/components/avatar";
import {
  BackIcon,
  SchoolIcon,
  ShareIcon,
  StoryTileIcon,
} from "~/components/icons";
import { ShareButton } from "~/components/share-button";
import { cloudflareContext } from "~/context";
import { bn } from "~/lib/bangla-digits";
import { formatStoryDate } from "~/lib/dhaka-date";
import { requireWriter } from "~/lib/require-writer";
import type { ShellHandle } from "~/lib/shell";
import { coverUrl } from "~/lib/story-share";
import { getWriterProfile } from "~/lib/writers";
import { strings } from "~/strings";
import type { Route } from "./+types/writer";

const t = strings.writer;

export const handle = withNavShell satisfies ShellHandle;

export function meta(_: Route.MetaArgs) {
  return [{ title: strings.meta.pageTitle(t.publicProfile) }];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const { user } = await requireWriter({ request, context });
  const { env } = context.get(cloudflareContext);
  const profile = await getWriterProfile(env, params.handle, user);
  if (!profile) throw new Response("Not Found", { status: 404 });
  return {
    own: profile.id === user.id,
    name: profile.name,
    handle: profile.handle,
    image: profile.image,
    schools: profile.schools,
    storyCount: profile.storyCount,
    loveTotal: profile.loveTotal,
    stories: profile.stories.map((s) => ({
      id: s.id,
      title: s.title,
      coverKey: s.coverKey,
      loveTotal: s.loveTotal,
      date: formatStoryDate(s.createdAt),
    })),
  };
}

/** The coloured tile (with an icon) a Story row shows when it has no cover. */
const TILES = [
  { background: "var(--tb-yellow-soft)", icon: "ball" },
  { background: "var(--tb-sky)", icon: "lamp" },
] as const;

function tileFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TILES[h % TILES.length] as (typeof TILES)[number];
}

// theme/profile.html `<StoryRow />`: the profile lists rows, not Feed cards.
function StoryRow({
  s,
}: {
  s: Route.ComponentProps["loaderData"]["stories"][number];
}) {
  const tile = tileFor(s.id);
  return (
    <a className="tb-row tb-row--top" href={`/stories/${s.id}`}>
      {s.coverKey ? (
        <div
          className="tb-row__thumb tb-photo"
          style={{
            backgroundImage: `url(${coverUrl("", s.coverKey)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : (
        <div className="tb-row__thumb" style={{ background: tile.background }}>
          <StoryTileIcon variant={tile.icon} color="var(--tb-ink)" />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <h3 className="tb-row__title">{s.title}</h3>
        <p className="tb-meta" style={{ marginTop: 6 }}>
          {`${s.date} · ${bn(s.loveTotal)} ${strings.story.loveCount}`}
        </p>
      </div>
    </a>
  );
}

export default function WriterProfile({ loaderData: p }: Route.ComponentProps) {
  const firstName = p.name.split(/\s+/)[0] ?? p.name;
  return (
    <>
      <header className="tb-header tb-header--compact">
        <a
          className="tb-icon-btn"
          href="/feed"
          aria-label={strings.nav.backToFeed}
        >
          <BackIcon size={22} color="var(--tb-ink)" />
        </a>
        <span className="tb-header__title">{strings.brand.name}</span>
        <ShareButton
          path={`/writers/${p.handle}`}
          title={p.name}
          className="tb-icon-btn"
          label={t.shareProfile}
        >
          <ShareIcon size={21} color="var(--tb-ink)" />
        </ShareButton>
      </header>

      <div style={{ padding: "24px 20px 24px" }}>
        {/* ProfileHeader */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar name={p.name} image={p.image} size="lg" />
          <div style={{ minWidth: 0 }}>
            <h1
              className="tb-display"
              style={{ fontSize: 26, lineHeight: 1.2 }}
            >
              {p.name}
            </h1>
            <p className="tb-meta" style={{ fontSize: 15 }}>
              {`@${p.handle}`}
            </p>
            {p.schools.length > 0 ? (
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 6,
                  fontSize: 15,
                }}
              >
                <SchoolIcon size={17} color="var(--tb-ink)" />
                {p.schools.join("، ")}
              </p>
            ) : null}
          </div>
        </div>

        {/* ProfileStats */}
        <div className="tb-stats" style={{ marginTop: 22 }}>
          <div className="tb-stat tb-stat--yellow">
            <div className="tb-stat__num">{bn(p.storyCount)}</div>
            <div className="tb-stat__label">{t.storiesWritten}</div>
          </div>
          <div className="tb-stat tb-stat--pink">
            <div className="tb-stat__num">{bn(p.loveTotal)}</div>
            <div className="tb-stat__label">{t.loveReceived}</div>
          </div>
        </div>

        <h2 className="tb-h2 tb-h2--sm" style={{ margin: "28px 0 14px" }}>
          {p.own ? t.myStories : t.storiesOf(firstName)}
        </h2>

        {p.stories.length > 0 ? (
          <div className="tb-stack">
            {p.stories.map((s) => (
              <StoryRow key={s.id} s={s} />
            ))}
          </div>
        ) : (
          <p className="tb-lead">{t.noStories}</p>
        )}

        {p.own ? (
          <a
            className="tb-btn tb-btn--pill"
            href="/profile/edit"
            style={{ marginTop: 32 }}
          >
            {t.editProfile}
          </a>
        ) : null}

        {p.own ? (
          <form method="post" action="/logout" style={{ marginTop: 32 }}>
            <button className="tb-btn tb-btn--pill" type="submit">
              {strings.nav.logout}
            </button>
          </form>
        ) : null}
      </div>

      <BottomNav active={p.own ? "profile" : null} />
    </>
  );
}
