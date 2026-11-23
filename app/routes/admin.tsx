import { Form, redirect } from "react-router";
import { BackIcon } from "~/components/icons";
import { cloudflareContext } from "~/context";
import { listReviewItems, removeStory, restoreStory } from "~/lib/admin";
import { bn } from "~/lib/bangla-digits";
import { requireAdmin } from "~/lib/require-writer";
import { strings } from "~/strings";
import type { Route } from "./+types/admin";

const t = strings.admin;

export function meta(_: Route.MetaArgs) {
  return [{ title: strings.meta.pageTitle(t.title) }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAdmin({ request, context });
  const { env } = context.get(cloudflareContext);
  return { items: await listReviewItems(env) };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireAdmin({ request, context });
  const { env } = context.get(cloudflareContext);
  const form = await request.formData();
  const intent = form.get("intent");
  const storyId = form.get("storyId");
  if (typeof storyId !== "string" || !storyId) {
    throw new Response("Bad Request", { status: 400 });
  }
  let done: boolean;
  if (intent === "restore") done = await restoreStory(env, storyId);
  else if (intent === "remove") done = await removeStory(env, storyId);
  else throw new Response("Bad Request", { status: 400 });
  if (!done) throw new Response("Not Found", { status: 404 });
  return redirect("/admin", 303);
}

export default function AdminReview({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <header className="tb-header tb-header--compact">
        <a
          className="tb-icon-btn"
          href="/feed"
          aria-label={strings.nav.backToFeed}
        >
          <BackIcon size={22} color="#1E2A25" />
        </a>
        <span className="tb-header__title">{t.title}</span>
        <span style={{ width: 44 }} />
      </header>

      <div style={{ padding: "24px 20px" }}>
        <p className="tb-lead">{t.lead}</p>
        {loaderData.items.length === 0 ? (
          <p className="tb-lead" style={{ marginTop: 20 }}>
            {t.empty}
          </p>
        ) : (
          <div className="tb-stack" style={{ marginTop: 20 }}>
            {loaderData.items.map((s) => (
              <section
                key={s.id}
                className="tb-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: 16,
                }}
              >
                <a
                  href={`/stories/${s.id}`}
                  className="tb-row__title"
                  style={{ textDecoration: "none", color: "var(--tb-ink)" }}
                >
                  {s.title}
                </a>
                <p className="tb-meta">
                  {t.by(s.writer.name)} · {s.school.name}
                </p>
                <p className="tb-meta">
                  {s.hidden ? `${t.hidden} · ` : ""}
                  {bn(s.reportCount)} {t.reports}
                </p>
                {s.reasons.length + s.blankReports > 0 ? (
                  <div>
                    <p style={{ fontWeight: 600 }}>{t.reasonsTitle}</p>
                    <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                      {s.reasons.map((r, i) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: reasons can repeat
                        <li key={i}>{r}</li>
                      ))}
                      {s.blankReports > 0 ? (
                        <li style={{ color: "var(--tb-subtle)" }}>
                          {t.noReason}
                          {s.blankReports > 1 ? ` (${bn(s.blankReports)})` : ""}
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <Form method="post">
                    <input type="hidden" name="storyId" value={s.id} />
                    <button
                      type="submit"
                      name="intent"
                      value="restore"
                      className="tb-btn tb-btn--dark"
                    >
                      {t.restore}
                    </button>
                  </Form>
                  <Form
                    method="post"
                    onSubmit={(e) => {
                      if (!window.confirm(t.removeConfirm)) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="storyId" value={s.id} />
                    <button
                      type="submit"
                      name="intent"
                      value="remove"
                      className="tb-btn"
                    >
                      {t.remove}
                    </button>
                  </Form>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
