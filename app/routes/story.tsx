import type { ReactNode } from "react";
import { Form, redirect } from "react-router";
import { Avatar } from "~/components/avatar";
import { BackIcon, ChevronRightIcon, ShareIcon } from "~/components/icons";
import { LoveActionButton, LoveBox, useLove } from "~/components/love-box";
import { ShareButton } from "~/components/share-button";
import { cloudflareContext } from "~/context";
import { bn } from "~/lib/bangla-digits";
import { formatStoryDate } from "~/lib/dhaka-date";
import { getMyLove } from "~/lib/love";
import { overLimit, tooManyRequestsText } from "~/lib/rate-limit";
import { getWriter, requireWriter } from "~/lib/require-writer";
import type { ShellHandle } from "~/lib/shell";
import {
  canEditStory,
  canReadStory,
  deleteStory,
  getStoryById,
  hasReported,
  paragraphs,
  readingTimeMinutes,
  reportStory,
} from "~/lib/stories";
import { coverUrl, excerptOf, sharePreviewMeta } from "~/lib/story-share";
import { strings } from "~/strings";
import type { Route } from "./+types/story";

const t = strings.story;

// The reading page has its own action bar instead of the bottom nav.
export const handle = {
  shellClass: ["tb-app--reading", "tb-app--with-nav"],
} as const satisfies ShellHandle;

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: strings.meta.pageTitle(t.readTitle) }];
  return [
    { title: strings.meta.pageTitle(loaderData.title) },
    ...sharePreviewMeta(loaderData.preview),
  ];
}

const firstNameOf = (name: string) => name.split(/\s+/)[0] ?? name;

export async function action({ request, context, params }: Route.ActionArgs) {
  const { user } = await requireWriter({ request, context });
  const { env } = context.get(cloudflareContext);
  const found = await getStoryById(env, params.id);
  if (!found || !canReadStory(found, user)) {
    throw new Response("Not Found", { status: 404 });
  }
  const form = await request.formData();
  if (form.get("intent") === "delete") {
    if (!canEditStory(found, user)) {
      throw new Response("Forbidden", { status: 403 });
    }
    await deleteStory(env, found);
    return redirect("/feed", 303);
  }
  if (form.get("intent") !== "report") {
    throw new Response("Bad Request", { status: 400 });
  }
  if (found.writer.id === user.id) {
    throw new Response("Forbidden", { status: 403 });
  }
  if (await overLimit(env, "report", user.id)) {
    throw tooManyRequestsText();
  }
  const raw = form.get("reason");
  const reason = typeof raw === "string" ? raw.trim().slice(0, 500) : "";
  await reportStory(env, found.id, user.id, reason || null);
  return redirect(`/stories/${found.id}`, 303);
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  // Public Story pages (signed out too) are a temporary owner decision,
  // superseding the login wall of ADR-0001. Love, Report, Edit and Delete
  // still need a session. Hidden Stories stay 404 for everyone but their
  // Writer and Admins.
  const session = await getWriter({ request, context });
  const user = session?.user ?? null;
  const { env } = context.get(cloudflareContext);
  const found = await getStoryById(env, params.id);
  if (!found || !canReadStory(found, user)) {
    throw new Response("Not Found", { status: 404 });
  }
  const url = new URL(request.url);
  const storyUrl = url.origin + url.pathname;
  const excerpt = excerptOf(found.body);
  return {
    preview: {
      title: found.title,
      description: strings.story.shareDescription(
        excerpt,
        found.writer.name,
        found.school.name,
      ),
      url: storyUrl,
      cover: coverUrl(url.origin, found.coverKey),
      origin: url.origin,
      publishedAt: found.createdAt,
      author: found.writer.name,
    },
    signedIn: user !== null,
    loginHref: `/login?returnTo=${encodeURIComponent(url.pathname)}`,
    id: found.id,
    title: found.title,
    paragraphs: paragraphs(found.body),
    coverKey: found.coverKey,
    loveTotal: found.loveTotal,
    myLove: user ? await getMyLove(env, found.id, user.id) : 0,
    isOwn: user ? found.writer.id === user.id : false,
    date: formatStoryDate(found.createdAt),
    minutes: readingTimeMinutes(found.body),
    writer: found.writer,
    school: found.school,
    canReport: user ? found.writer.id !== user.id : false,
    canEdit: user ? canEditStory(found, user) : false,
    reported: user ? await hasReported(env, found.id, user.id) : false,
  };
}

export default function StoryPage({ loaderData }: Route.ComponentProps) {
  return <ReadStory s={loaderData} />;
}

/** The delete and report confirmation, shown inside a `<details>`. */
function ConfirmCard({
  intent,
  title,
  hint,
  submit,
  children,
}: {
  intent: "delete" | "report";
  title: string;
  hint: string;
  submit: string;
  children?: ReactNode;
}) {
  return (
    <Form
      method="post"
      className="tb-card tb-card--pad tb-stack"
      style={{ marginTop: 8, textAlign: "left" }}
    >
      <input type="hidden" name="intent" value={intent} />
      <p style={{ fontWeight: 600 }}>{title}</p>
      <p style={{ fontSize: 15, color: "var(--tb-muted)" }}>{hint}</p>
      {children}
      <button type="submit" className="tb-btn tb-btn--dark">
        {submit}
      </button>
    </Form>
  );
}

type ReadData = Route.ComponentProps["loaderData"];

function ReadStory({ s }: { s: ReadData }) {
  const love = useLove(s.id, { mine: s.myLove, total: s.loveTotal }, s.isOwn);
  const writerHref = s.writer.handle
    ? `/writers/${s.writer.handle}`
    : "/profile";
  const firstName = firstNameOf(s.writer.name);
  const path = `/stories/${s.id}`;
  return (
    <>
      <header className="tb-header tb-header--compact tb-header--reading">
        <a
          className="tb-icon-btn"
          href={s.signedIn ? "/feed" : "/"}
          aria-label={strings.nav.backToFeed}
        >
          <BackIcon size={22} color="var(--tb-ink)" />
        </a>
        <span className="tb-header__title">{strings.brand.name}</span>
        <ShareButton
          path={path}
          title={s.title}
          className="tb-icon-btn"
          label={t.share}
        >
          <ShareIcon size={21} color="var(--tb-ink)" />
        </ShareButton>
      </header>

      {s.coverKey ? (
        <div
          className="tb-photo"
          style={{ height: 210, borderBottom: "var(--tb-border)" }}
        >
          <img
            src={coverUrl("", s.coverKey) ?? undefined}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : null}

      <article style={{ padding: "22px 22px 24px" }}>
        <h1 className="tb-h1">{s.title}</h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "16px 0 24px",
          }}
        >
          <Avatar
            name={s.writer.name}
            image={s.writer.image}
            size="md"
            href={writerHref}
            label={strings.writer.profileOf(s.writer.name)}
          />
          <span style={{ fontSize: 15, lineHeight: 1.4 }}>
            <a
              href={writerHref}
              style={{
                display: "block",
                fontWeight: 600,
                color: "var(--tb-ink)",
                textDecoration: "none",
              }}
            >
              {s.writer.name}{" "}
              {s.writer.handle ? (
                <span style={{ fontWeight: 400, color: "var(--tb-subtle)" }}>
                  @{s.writer.handle}
                </span>
              ) : null}
            </a>
            <span style={{ display: "block", color: "var(--tb-subtle)" }}>
              <a
                href={`/schools/${s.school.id}`}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {s.school.name}
              </a>{" "}
              · {s.date} · {t.readingTime(bn(s.minutes))}
            </span>
          </span>
        </div>

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

        {s.signedIn ? (
          <LoveBox love={love} disabled={s.isOwn} />
        ) : (
          <a
            className="tb-link"
            href={s.loginHref}
            style={{ display: "block", textAlign: "center" }}
          >
            {t.loginToLove}
          </a>
        )}

        {s.canEdit ? (
          <div
            style={{
              marginTop: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <a className="tb-link" href={`${path}/edit`}>
              {strings.manage.edit}
            </a>
            <details>
              <summary
                className="tb-link"
                style={{ cursor: "pointer", listStyle: "none" }}
              >
                {strings.manage.delete}
              </summary>
              <ConfirmCard
                intent="delete"
                title={strings.manage.deleteConfirmTitle}
                hint={strings.manage.deleteConfirmHint}
                submit={strings.manage.deleteSubmit}
              />
            </details>
          </div>
        ) : null}

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
                <ConfirmCard
                  intent="report"
                  title={strings.report.confirmTitle}
                  hint={strings.report.confirmHint}
                  submit={strings.report.submit}
                >
                  <label className="tb-label" htmlFor="report-reason">
                    {strings.report.reasonLabel}
                  </label>
                  <input
                    id="report-reason"
                    name="reason"
                    className="tb-input"
                    maxLength={500}
                  />
                </ConfirmCard>
              </details>
            )}
          </div>
        ) : null}

        <a
          className="tb-row"
          href={writerHref}
          style={{ marginTop: 24, padding: 16, boxShadow: "var(--tb-shadow)" }}
        >
          <Avatar name={s.writer.name} image={s.writer.image} size="md" />
          <span style={{ flex: 1, fontSize: 15, lineHeight: 1.45 }}>
            <span style={{ display: "block", fontWeight: 600 }}>
              {t.moreFrom(firstName)}
            </span>
            <span style={{ display: "block", color: "var(--tb-subtle)" }}>
              {s.school.name}
            </span>
          </span>
          <ChevronRightIcon size={20} color="var(--tb-ink)" />
        </a>
      </article>

      <nav className="tb-action-bar" aria-label={t.actions}>
        {s.signedIn ? (
          <LoveActionButton love={love} disabled={s.isOwn} />
        ) : (
          <a
            className="tb-btn tb-btn--pill"
            href={s.loginHref}
            style={{ fontSize: 16, color: "var(--tb-accent)" }}
          >
            {t.loginToLove}
          </a>
        )}
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
