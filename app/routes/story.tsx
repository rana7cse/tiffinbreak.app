import { Form, redirect } from "react-router";
import { Avatar } from "~/components/avatar";
import {
  BackIcon,
  ChevronRightIcon,
  HeartIcon,
  ShareIcon,
} from "~/components/icons";
import { LoginScreen } from "~/components/login-screen";
import { ShareButton } from "~/components/share-button";
import { cloudflareContext } from "~/context";
import { bn } from "~/lib/bangla-digits";
import { getWriter, requireWriter } from "~/lib/require-writer";
import type { ShellHandle } from "~/lib/shell";
import {
  canReadStory,
  formatStoryDate,
  getStoryById,
  hasReported,
  paragraphs,
  readingTimeMinutes,
  reportStory,
} from "~/lib/stories";
import { coverUrl, sharePreviewMeta } from "~/lib/story-share";
import { strings } from "~/strings";
import type { Route } from "./+types/story";

const t = strings.story;

// The reading page has its own action bar instead of the bottom nav.
export const handle = {
  shellClass: ["tb-app--reading", "tb-app--with-nav"],
} as const satisfies ShellHandle;

export function meta({ loaderData }: Route.MetaArgs) {
  if (loaderData?.preview) {
    return [
      { title: strings.meta.pageTitle(loaderData.preview.title) },
      ...sharePreviewMeta(loaderData.preview),
    ];
  }
  return [{ title: strings.meta.pageTitle(loaderData?.title ?? t.readTitle) }];
}

const firstNameOf = (name: string) => name.split(/\s+/)[0] ?? name;

export async function action({ request, context, params }: Route.ActionArgs) {
  const { user } = await requireWriter({ request, context });
  const { env } = context.get(cloudflareContext);
  const found = await getStoryById(env, params.id);
  if (!found || !canReadStory(found, user as { id: string; role?: string })) {
    throw new Response("Not Found", { status: 404 });
  }
  const form = await request.formData();
  if (form.get("intent") !== "report") {
    throw new Response("Bad Request", { status: 400 });
  }
  if (found.writer.id === user.id) {
    throw new Response("Forbidden", { status: 403 });
  }
  const raw = form.get("reason");
  const reason = typeof raw === "string" ? raw.trim().slice(0, 500) : "";
  await reportStory(env, found.id, user.id, reason || null);
  return redirect(`/stories/${found.id}`, 303);
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const session = await getWriter({ request, context });
  const { env } = context.get(cloudflareContext);
  const found = await getStoryById(env, params.id);
  const url = new URL(request.url);

  if (!session) {
    // ADR-0001: logged-out visitors get the login page, with preview tags for
    // crawlers. Hidden or missing Stories get a plain redirect: no leaks.
    const returnTo = url.pathname + url.search;
    if (!found || found.hidden) {
      throw redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    return {
      preview: {
        title: found.title,
        description: t.shareDescription(firstNameOf(found.writer.name)),
        url: url.origin + url.pathname,
        image: coverUrl(url.origin, found.coverKey),
      },
      returnTo,
    };
  }

  const { user } = session;
  if (!found || !canReadStory(found, user as { id: string; role?: string })) {
    throw new Response("Not Found", { status: 404 });
  }
  return {
    preview: null,
    id: found.id,
    title: found.title,
    paragraphs: paragraphs(found.body),
    coverKey: found.coverKey,
    loveTotal: found.loveTotal,
    date: formatStoryDate(found.createdAt),
    minutes: readingTimeMinutes(found.body),
    writer: found.writer,
    school: found.school,
    canReport: found.writer.id !== user.id,
    reported: await hasReported(env, found.id, user.id),
  };
}

export default function StoryPage({ loaderData }: Route.ComponentProps) {
  if (loaderData.preview) {
    return <LoginScreen returnTo={loaderData.returnTo} />;
  }
  const s = loaderData;
  const firstName = firstNameOf(s.writer.name);
  const path = `/stories/${s.id}`;
  return (
    <>
      <header className="tb-header tb-header--compact tb-header--reading">
        <a
          className="tb-icon-btn"
          href="/feed"
          aria-label={strings.nav.backToFeed}
        >
          <BackIcon size={22} color="#1E2A25" />
        </a>
        <span className="tb-header__title">{strings.brand.name}</span>
        <ShareButton
          path={path}
          title={s.title}
          className="tb-icon-btn"
          label={t.share}
        >
          <ShareIcon size={21} color="#1E2A25" />
        </ShareButton>
      </header>

      {s.coverKey ? (
        <img
          src={coverUrl("", s.coverKey) ?? undefined}
          alt=""
          style={{
            display: "block",
            width: "100%",
            height: 210,
            objectFit: "cover",
            borderBottom: "var(--tb-border)",
          }}
        />
      ) : null}

      <article style={{ padding: "22px 22px 24px" }}>
        <h1 className="tb-h1">{s.title}</h1>

        <a
          href="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "16px 0 24px",
            textDecoration: "none",
            color: "var(--tb-ink)",
          }}
        >
          <Avatar name={s.writer.name} image={s.writer.image} />
          <span style={{ fontSize: 15, lineHeight: 1.4 }}>
            <span style={{ display: "block", fontWeight: 600 }}>
              {s.writer.name}{" "}
              {s.writer.handle ? (
                <span style={{ fontWeight: 400, color: "var(--tb-subtle)" }}>
                  @{s.writer.handle}
                </span>
              ) : null}
            </span>
            <span style={{ display: "block", color: "var(--tb-subtle)" }}>
              {s.school.name} · {s.date} · {t.readingTime(bn(s.minutes))}
            </span>
          </span>
        </a>

        <div className="tb-prose">
          {s.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <div
          aria-hidden="true"
          style={{
            textAlign: "center",
            margin: "4px 0 22px",
            fontSize: 20,
            letterSpacing: 12,
            color: "#8A938E",
          }}
        >
          • • •
        </div>

        {/* LoveBox: static until the Love ticket. */}
        <section
          className="tb-card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: "22px 16px",
            background: "var(--tb-peach)",
            overflow: "visible",
          }}
        >
          <p style={{ fontSize: 17, fontWeight: 600, textAlign: "center" }}>
            {t.loveBoxTitle}
          </p>
          <button
            type="button"
            className="tb-btn tb-love-big"
            aria-label={strings.love.give}
            style={{ width: 74, height: 74, padding: 0, borderRadius: "50%" }}
          >
            <HeartIcon size={36} color="#C0501D" />
          </button>
          <p style={{ fontSize: 15, color: "var(--tb-muted)" }}>
            <span>{bn(s.loveTotal)}</span> {t.loveCount} · {strings.love.hint}
          </p>
        </section>

        {s.canReport ? (
          <div style={{ marginTop: 20, textAlign: "center" }}>
            {s.reported ? (
              <p className="tb-link" style={{ textDecoration: "none" }}>
                {strings.report.done}
              </p>
            ) : (
              <details>
                <summary
                  className="tb-link"
                  style={{ cursor: "pointer", listStyle: "none" }}
                >
                  {strings.report.action}
                </summary>
                <Form
                  method="post"
                  className="tb-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    padding: 16,
                    marginTop: 8,
                    textAlign: "left",
                  }}
                >
                  <input type="hidden" name="intent" value="report" />
                  <p style={{ fontWeight: 600 }}>
                    {strings.report.confirmTitle}
                  </p>
                  <p style={{ fontSize: 15, color: "var(--tb-muted)" }}>
                    {strings.report.confirmHint}
                  </p>
                  <label className="tb-label" htmlFor="report-reason">
                    {strings.report.reasonLabel}
                  </label>
                  <input
                    id="report-reason"
                    name="reason"
                    className="tb-input"
                    maxLength={500}
                  />
                  <button type="submit" className="tb-btn tb-btn--dark">
                    {strings.report.submit}
                  </button>
                </Form>
              </details>
            )}
          </div>
        ) : null}

        <a
          className="tb-row"
          href="/profile"
          style={{ marginTop: 24, padding: 16, boxShadow: "var(--tb-shadow)" }}
        >
          <Avatar name={s.writer.name} image={s.writer.image} />
          <span style={{ flex: 1, fontSize: 15, lineHeight: 1.45 }}>
            <span style={{ display: "block", fontWeight: 600 }}>
              {t.moreFrom(firstName)}
            </span>
            <span style={{ display: "block", color: "var(--tb-subtle)" }}>
              {s.school.name}
            </span>
          </span>
          <ChevronRightIcon size={20} color="#1E2A25" />
        </a>
      </article>

      {/* StoryActionBar: Love is static until the Love ticket. */}
      <nav className="tb-action-bar" aria-label={t.actions}>
        <button
          type="button"
          className="tb-btn tb-btn--pill"
          aria-label={strings.love.give}
          style={{ fontSize: 16, color: "var(--tb-accent)" }}
        >
          <HeartIcon size={22} color="#C0501D" />
          <span>{bn(s.loveTotal)}</span>
        </button>
        <ShareButton
          path={path}
          title={s.title}
          className="tb-btn tb-btn--dark tb-btn--pill"
          style={{ fontSize: 16, padding: "0 18px" }}
        >
          <ShareIcon size={20} color="#FFFFFF" />
          {t.sendToFriends}
        </ShareButton>
      </nav>
    </>
  );
}
