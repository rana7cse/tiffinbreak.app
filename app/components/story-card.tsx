import { HeartIcon, ShareIcon } from "~/components/icons";
import { bn } from "~/lib/bangla-digits";
import { type FeedStory, relativeTime } from "~/lib/feed";
import { coverUrl } from "~/lib/story-share";
import { strings } from "~/strings";

const AVATAR_VARIANTS = [
  "",
  " tb-avatar--yellow",
  " tb-avatar--sky",
  " tb-avatar--pink",
];

/** A stable colour per Writer, since the theme varies the avatar background. */
function avatarVariant(writerId: string): string {
  let h = 0;
  for (const c of writerId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_VARIANTS[h % AVATAR_VARIANTS.length] as string;
}

function initialOf(name: string) {
  const [first] = new Intl.Segmenter().segment(name.trim());
  return first?.segment ?? "";
}

/**
 * A Story card (theme/feed.html `<StoryCard />`), shared by the Feed, School
 * and Profile pages.
 */
export function StoryCard({ story: s }: { story: FeedStory }) {
  const storyHref = `/stories/${s.id}`;
  const writerHref = s.writer.handle ? `/writers/${s.writer.handle}` : null;
  const profileLabel = strings.writer.profileOf(s.writer.name);

  const avatarClass = `tb-avatar${avatarVariant(s.writer.id)}`;
  const avatarContent = s.writer.image ? (
    <img
      src={s.writer.image}
      alt=""
      referrerPolicy="no-referrer"
      width={38}
      height={38}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  ) : (
    initialOf(s.writer.name)
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
          {writerHref ? (
            <a
              className={avatarClass}
              href={writerHref}
              aria-label={profileLabel}
            >
              {avatarContent}
            </a>
          ) : (
            <span className={avatarClass}>{avatarContent}</span>
          )}
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
          <button
            type="button"
            className="tb-ghost-btn"
            aria-label={strings.story.share}
          >
            <ShareIcon size={20} color="#4F5A54" />
            {strings.feed.share}
          </button>
        </div>
      </div>
    </article>
  );
}
