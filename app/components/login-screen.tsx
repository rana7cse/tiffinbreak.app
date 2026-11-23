import { FacebookIcon } from "~/components/landing-art";
import { strings } from "~/strings";

const t = strings.login;

const providers = [
  {
    id: "google",
    label: t.withGoogle,
    className: "tb-btn--primary",
    icon: null,
  },
  {
    id: "facebook",
    label: t.withFacebook,
    className: "tb-btn--facebook",
    icon: <FacebookIcon />,
  },
];

/** The login page body, shared by `/login` and logged-out Story URLs. */
export function LoginScreen({
  returnTo,
  write = false,
}: {
  returnTo: string;
  write?: boolean;
}) {
  return (
    <main className="tb-section">
      <h1 className="tb-h2">{write ? t.writeTitle : t.title}</h1>
      <p className="tb-lead">{write ? t.writeLead : t.lead}</p>
      <div className="tb-stack" style={{ gap: 12, marginTop: 22 }}>
        {providers.map((p) => (
          <form
            key={p.id}
            method="post"
            action={`/login/${p.id}`}
            style={{ display: "contents" }}
          >
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              className={`tb-btn ${p.className} tb-btn--lg tb-btn--block`}
              type="submit"
            >
              {p.icon}
              {p.label}
            </button>
          </form>
        ))}
      </div>
      <nav
        style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 22 }}
      >
        <a className="tb-link" href="/privacy">
          {strings.legal.privacyLink}
        </a>
        <a className="tb-link" href="/data-deletion">
          {strings.legal.dataDeletionLink}
        </a>
      </nav>
    </main>
  );
}
