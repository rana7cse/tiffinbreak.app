import { Avatar } from "~/components/avatar";
import { HeartIcon, ShareIcon } from "~/components/icons";
import { ShareButton } from "~/components/share-button";
import { bn } from "~/lib/bangla-digits";
import { relativeTime } from "~/lib/dhaka-date";
import type { FeedStory } from "~/lib/feed";
import { coverUrl } from "~/lib/story-share";
import { strings } from "~/strings";

const AVATAR_VARIANTS = [undefined, "yellow", "sky", "pink"] as const;

/** A stable colour per Writer, since the theme varies the avatar background. */
function avatarVariant(writerId: string) {
  let h = 0;
  for (const c of writerId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_VARIANTS[h % AVATAR_VARIANTS.length];
}

/**
 * A Story card (theme/feed.html `<StoryCard />`), shared by the Feed, School
 * and Profile pages.
 */
export function StoryCard({ story: s }: { story: FeedStory }) {
  const storyHref = `/stories/${s.id}`;
  const writerHref = s.writer.handle ? `/writers/${s.writer.handle}` : null;
  const profileLabel = strings.writer.profileOf(s.writer.name);

  const avatar = (
    <Avatar
      name={s.writer.name}
      image={s.writer.image}
      variant={avatarVariant(s.writer.id)}
      href={writerHref ?? undefined}
      label={writerHref ? profileLabel : undefined}
    />
  );

  return (
    <article className="tb-card">
      {s.coverKey ? (
        <a className="tb-story-card__photo tb-photo" href={storyHref}>
          <img
            src={coverUrl("", s.coverKey) ?? undefined}
            alt=""
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </a>
      ) : null}
      <div className="tb-story-card__body">
        <div className="tb-author">
          {avatar}
          <div className="tb-author__text">
            {writerHref ? (
              <a className="tb-author__name" href={writerHref}>
                {s.writer.name}
              </a>
            ) : (
              <span className="tb-author__name">{s.writer.name}</span>
            )}
            <div className="tb-meta">
              <a
                href={`/schools/${s.school.id}`}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {s.school.name}
              </a>
              {" · "}
              {relativeTime(s.createdAt)}
            </div>
          </div>
        </div>
        <a className="tb-story-card__link" href={storyHref}>
          <h3 className="tb-story-card__title">{s.title}</h3>
          <p className="tb-story-card__excerpt">{s.excerpt}</p>
        </a>
        <div className="tb-story-card__actions">
          {/* Giving Love happens on the Story page; the card links there. */}
          <a
            className="tb-love"
            href={storyHref}
            aria-label={strings.love.give}
            style={{ textDecoration: "none" }}
          >
            <HeartIcon />
            <span className="tb-love__count">{bn(s.loveTotal)}</span>
          </a>
          <ShareButton
            path={storyHref}
            title={s.title}
            className="tb-ghost-btn"
            label={strings.story.share}
          >
            <ShareIcon size={20} color="var(--tb-muted)" />
            {strings.feed.share}
          </ShareButton>
        </div>
      </div>
    </article>
  );
}
