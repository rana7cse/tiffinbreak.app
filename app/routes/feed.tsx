import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { AppHeader, BottomNav, withNavShell } from "~/components/app-shell";
import { DiaryEmptyState } from "~/components/diary-empty-state";
import { StoryCard } from "~/components/story-card";
import { cloudflareContext } from "~/context";
import { countWriterStories, type FeedStory, listFeed } from "~/lib/feed";
import { requireWriter } from "~/lib/require-writer";
import type { ShellHandle } from "~/lib/shell";
import { strings } from "~/strings";
import type { Route } from "./+types/feed";

const t = strings.feed;

export const handle = withNavShell satisfies ShellHandle;

export function meta(_: Route.MetaArgs) {
  return [{ title: strings.meta.pageTitle(t.title) }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { user } = await requireWriter({ request, context });
  const { env } = context.get(cloudflareContext);
  const cursor = new URL(request.url).searchParams.get("cursor");
  const page = await listFeed(env, cursor);
  const ownStories = await countWriterStories(env, user.id);
  return {
    hasOwnStories: ownStories > 0,
    writer: { name: user.name, image: user.image },
    stories: page.stories,
    nextCursor: page.nextCursor,
    isFirstPage: !cursor,
  };
}

const olderHref = (cursor: string) =>
  `/feed?cursor=${encodeURIComponent(cursor)}`;

export default function Feed({ loaderData }: Route.ComponentProps) {
  const { writer, stories, nextCursor, isFirstPage, hasOwnStories } =
    loaderData;
  const fetcher = useFetcher<typeof loader>();

  // Older pages loaded on scroll, appended below the server-rendered page.
  const [older, setOlder] = useState<{
    base: typeof stories;
    items: FeedStory[];
    next: string | null;
  }>({ base: stories, items: [], next: nextCursor });
  if (older.base !== stories) {
    setOlder({ base: stories, items: [], next: nextCursor });
  }

  useEffect(() => {
    const page = fetcher.data;
    if (!page) return;
    setOlder((o) => {
      const seen = new Set([...o.base, ...o.items].map((s) => s.id));
      return {
        ...o,
        items: [...o.items, ...page.stories.filter((s) => !seen.has(s.id))],
        next: page.nextCursor,
      };
    });
  }, [fetcher.data]);

  const sentinel = useRef<HTMLAnchorElement>(null);
  const next = older.next;
  const { load, state } = fetcher;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !next || state !== "idle") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) load(olderHref(next));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [next, load, state]);

  const all = [...stories, ...older.items];

  return (
    <>
      <AppHeader writer={writer} />
      <main className="tb-main">
        {!hasOwnStories && isFirstPage ? <DiaryEmptyState /> : null}
        {all.length > 0 ? (
          <>
            <h2 className="tb-h2 tb-h2--sm" style={{ margin: "6px 4px -4px" }}>
              {t.newStories}
            </h2>
            {all.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </>
        ) : null}
        {next ? (
          <a
            ref={sentinel}
            className="tb-btn tb-btn--block"
            href={olderHref(next)}
          >
            {t.loadOlder}
          </a>
        ) : null}
      </main>
      <BottomNav active="home" />
    </>
  );
}
