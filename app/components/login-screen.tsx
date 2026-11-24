import {
  BellIcon,
  FacebookIcon,
  GoogleIcon,
  LunchBox,
  StarDeco,
} from "~/components/landing-art";
import { SiteHeader } from "~/components/site-header";
import { strings } from "~/strings";

const t = strings.login;

/** Same order and look as the landing page's login buttons. */
const providers = [
  {
    id: "facebook",
    label: t.withFacebook,
    className: "tb-btn--facebook",
    icon: <FacebookIcon />,
  },
  { id: "google", label: t.withGoogle, className: null, icon: <GoogleIcon /> },
];

/**
 * The login page body, shared by `/login` and logged-out Story URLs.
 * Uses the same chalkboard hero as the top of the landing page.
 */
export function LoginScreen({
  returnTo,
  write = false,
}: {
  returnTo: string;
  write?: boolean;
}) {
  return (
    <>
      <SiteHeader writer={null} brandHref="/" showLogin={false} />

      <main className="tb-board">
        <StarDeco
          className="tb-board__deco tb-star"
          size={18}
          style={{ top: 20, right: 118 }}
        />
        <StarDeco
          className="tb-board__deco tb-star2"
          size={14}
          color="#F3F1E7"
          style={{ top: 30, right: 30 }}
        />
        <LunchBox className="tb-board__deco" style={{ top: 58, right: 18 }} />

        <div className="tb-board__chip tb-rise">
          <BellIcon className="tb-bell" />
          <span>{strings.landing.chip}</span>
        </div>

        <h1 className="tb-board__title tb-rise2">
          {write ? t.writeTitle : t.title}
        </h1>
        {/* Keep the lead clear of the lunch box on the right. */}
        <p
          className="tb-board__text tb-rise3"
          style={{ maxWidth: "calc(100% - 84px)" }}
        >
          {write ? t.writeLead : t.lead}
        </p>

        <div className="tb-stack tb-rise4" style={{ gap: 12, marginTop: 22 }}>
          {providers.map((p) => (
            <form
              key={p.id}
              method="post"
              action={`/login/${p.id}`}
              style={{ display: "contents" }}
            >
              <input type="hidden" name="returnTo" value={returnTo} />
              <button
                className={[
                  "tb-btn",
                  p.className,
                  "tb-btn--lg tb-btn--block tb-btn--on-board",
                ]
                  .filter(Boolean)
                  .join(" ")}
                type="submit"
              >
                {p.icon}
                {p.label}
              </button>
            </form>
          ))}
        </div>
      </main>

      <nav
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          justifyContent: "center",
          padding: "22px 20px",
        }}
      >
        <a className="tb-link" href="/privacy">
          {strings.legal.privacyLink}
        </a>
        <a className="tb-link" href="/data-deletion">
          {strings.legal.dataDeletionLink}
        </a>
      </nav>
    </>
  );
}
