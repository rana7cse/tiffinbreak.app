import { Avatar } from "~/components/avatar";
import { HomeIcon, PenIcon, UserIcon } from "~/components/icons";
import { BrandMark } from "~/components/landing-art";
import { strings } from "~/strings";

const t = strings.nav;

type Writer = { name: string; image?: string | null };

/** The signed-in header (theme/feed.html `<AppHeader />`). */
export function AppHeader({ writer }: { writer: Writer }) {
  return (
    <header className="tb-header">
      <a className="tb-brand" href="/feed">
        <BrandMark />
        <span className="tb-brand__name">{strings.brand.name}</span>
      </a>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Logout stays here until the Profile page owns it. */}
        <form method="post" action="/logout">
          <button className="tb-btn tb-btn--pill" type="submit">
            {t.logout}
          </button>
        </form>
        <a href="/profile" aria-label={t.myProfile}>
          <Avatar name={writer.name} image={writer.image} />
        </a>
      </div>
    </header>
  );
}

export type NavTab = "home" | "write" | "profile";

/** The signed-in bottom nav (theme/feed.html `<BottomNav />`). */
export function BottomNav({ active }: { active: NavTab }) {
  const current = (tab: NavTab) =>
    active === tab ? ({ "aria-current": "page" } as const) : {};
  return (
    <nav className="tb-bottom-nav" aria-label={t.label}>
      <a className="tb-bottom-nav__item" href="/feed" {...current("home")}>
        <HomeIcon
          color={active === "home" ? "#1E2A25" : "#4F5A54"}
          fill={active === "home" ? "#FFE9A8" : "none"}
        />
        {t.home}
      </a>
      <a
        className="tb-bottom-nav__item tb-bottom-nav__fab-wrap"
        href="/write"
        {...current("write")}
      >
        <span className="tb-fab">
          <PenIcon color="#FFFFFF" strokeWidth={2.2} />
        </span>
        {t.write}
      </a>
      <a
        className="tb-bottom-nav__item"
        href="/profile"
        {...current("profile")}
      >
        <UserIcon
          color={active === "profile" ? "#1E2A25" : "#4F5A54"}
          fill={active === "profile" ? "#FFE9A8" : "none"}
        />
        {t.profile}
      </a>
    </nav>
  );
}

/** Marks the `.tb-app` column as having a bottom nav (room for it). */
export const withNavShell = {
  shellClass: ["tb-app--with-nav"],
} as const;
