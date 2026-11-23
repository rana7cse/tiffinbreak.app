import { Avatar } from "~/components/avatar";
import { BrandMark } from "~/components/landing-art";
import { strings } from "~/strings";

type SiteHeaderProps = {
  /** The signed-in Writer, or null for the login pill. */
  writer: { name: string; image?: string | null } | null;
  /** Where the brand links to: "/" signed out, "/feed" signed in. */
  brandHref: string;
};

/** The header shared by the landing page and the Feed. */
export function SiteHeader({ writer, brandHref }: SiteHeaderProps) {
  return (
    <header className="tb-header">
      <a className="tb-brand" href={brandHref}>
        <BrandMark />
        <span className="tb-brand__name">{strings.brand.name}</span>
      </a>
      {writer ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Logout stays here until the Profile page exists. */}
          <form method="post" action="/logout">
            <button className="tb-btn tb-btn--pill" type="submit">
              {strings.nav.logout}
            </button>
          </form>
          <Avatar
            name={writer.name}
            image={writer.image}
            size="header"
            variant="pink"
          />
        </div>
      ) : (
        <a className="tb-btn tb-btn--pill" href="/login">
          {strings.nav.login}
        </a>
      )}
    </header>
  );
}
