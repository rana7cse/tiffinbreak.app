import { AppHeader, BottomNav, withNavShell } from "~/components/app-shell";
import { SchoolIcon } from "~/components/icons";
import { StoryCard } from "~/components/story-card";
import { cloudflareContext } from "~/context";
import { bn } from "~/lib/bangla-digits";
import { countSchoolStories, listSchoolStories } from "~/lib/feed";
import { requireWriter } from "~/lib/require-writer";
import { findSchoolById } from "~/lib/schools";
import type { ShellHandle } from "~/lib/shell";
import { strings } from "~/strings";
import type { Route } from "./+types/school";

const t = strings.school;

export const handle = withNavShell satisfies ShellHandle;

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: strings.meta.pageTitle(loaderData?.school.name ?? t.addTitle) },
  ];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const { user } = await requireWriter({ request, context });
  const { env } = context.get(cloudflareContext);
  const school = await findSchoolById(env, params.id);
  if (!school) throw new Response("Not Found", { status: 404 });
  const cursor = new URL(request.url).searchParams.get("cursor");
  const [page, total] = await Promise.all([
    listSchoolStories(env, school.id, cursor),
    countSchoolStories(env, school.id),
  ]);
  return {
    writer: { name: user.name, image: user.image },
    school,
    total,
    stories: page.stories,
    nextCursor: page.nextCursor,
  };
}

export default function SchoolPage({ loaderData }: Route.ComponentProps) {
  const { writer, school, total, stories, nextCursor } = loaderData;
  return (
    <>
      <AppHeader writer={writer} />
      <main className="tb-main">
        <header style={{ margin: "6px 4px 0" }}>
          <h1
            className="tb-display"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 26,
              lineHeight: 1.3,
            }}
          >
            <SchoolIcon size={24} />
            {school.name}
          </h1>
          <p className="tb-meta" style={{ fontSize: 15, marginTop: 4 }}>
            {t.storyCount(bn(total))}
          </p>
        </header>
        {stories.length === 0 ? (
          <p className="tb-lead">{t.noStories}</p>
        ) : (
          stories.map((s) => <StoryCard key={s.id} story={s} />)
        )}
        {nextCursor ? (
          <a
            className="tb-btn tb-btn--block"
            href={`/schools/${school.id}?cursor=${encodeURIComponent(nextCursor)}`}
          >
            {strings.feed.loadOlder}
          </a>
        ) : null}
      </main>
      <BottomNav active="home" />
    </>
  );
}
