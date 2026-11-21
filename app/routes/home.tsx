import type { CSSProperties } from "react";
import { PenIcon } from "~/components/icons";
import {
  BellIcon,
  BrandMark,
  FacebookIcon,
  LunchBox,
  PaperClip,
  PaperPlane,
  Pencil,
  StarDeco,
  WordUnderline,
} from "~/components/landing-art";
import { bn } from "~/lib/bangla-digits";
import type { ShellHandle } from "~/lib/shell";
import { strings } from "~/strings";
import type { Route } from "./+types/home";

const t = strings.landing;

export const handle = {
  shellClass: ["tb-app--ruled", "tb-anim"],
} satisfies ShellHandle;

export function meta(_: Route.MetaArgs) {
  return [{ title: strings.brand.name }];
}

type NoteStyle = {
  tone: "yellow" | "pink" | "mint" | "sky";
  rot: number;
  clip: string;
  clipRot: number;
  marker?: string;
  wide?: boolean;
};

/** Look of each prompt note, in the same order as `strings.landing.prompts`. */
const noteStyles: readonly NoteStyle[] = [
  {
    tone: "yellow",
    rot: -2,
    clip: "#D94A8C",
    clipRot: -8,
    marker: "rgba(255,110,170,0.55)",
  },
  { tone: "pink", rot: 2, clip: "#2F7FD8", clipRot: 6 },
  { tone: "mint", rot: 1.5, clip: "#E0702A", clipRot: -4 },
  {
    tone: "sky",
    rot: -1.5,
    clip: "#7A4FD0",
    clipRot: 10,
    marker: "rgba(120,230,110,0.7)",
  },
  {
    tone: "sky",
    rot: -2,
    clip: "#2E9E6A",
    clipRot: -10,
    marker: "rgba(255,150,60,0.55)",
  },
  {
    tone: "yellow",
    rot: 2,
    clip: "#E04545",
    clipRot: 4,
    marker: "rgba(90,200,255,0.6)",
  },
  { tone: "pink", rot: -1, clip: "#2F7FD8", clipRot: -6, wide: true },
];

const stepColors = ["yellow", "mint", "pink"] as const;

export default function Home() {
  return (
    <>
      <header className="tb-header">
        <a className="tb-brand" href="/">
          <BrandMark />
          <span className="tb-brand__name">{strings.brand.name}</span>
        </a>
        <a className="tb-btn tb-btn--pill" href="/login">
          {strings.nav.login}
        </a>
      </header>

      <section className="tb-board">
        <StarDeco
          className="tb-board__deco tb-star"
          size={18}
          style={{ top: 20, right: 118 }}
        />
        <StarDeco
          className="tb-board__deco tb-star2"
          size={14}
          color="#F3F1E7"
          style={{ top: 196, right: 26 }}
        />
        <PaperPlane
          className="tb-board__deco tb-plane"
          style={{ top: 112, left: 0 }}
        />
        <LunchBox className="tb-board__deco" style={{ top: 58, right: 18 }} />

        <div className="tb-board__chip tb-rise">
          <BellIcon className="tb-bell" />
          <span>{t.chip}</span>
        </div>

        <h1 className="tb-board__title tb-rise2">
          {t.titleBefore}{" "}
          <span className="tb-underline-word">
            {t.titleWord}
            <WordUnderline />
          </span>{" "}
          {t.titleAfter}
        </h1>

        <p className="tb-board__text tb-rise3">{t.lead}</p>

        <div className="tb-stack tb-rise4" style={{ gap: 12, marginTop: 22 }}>
          <form
            method="post"
            action="/login/facebook"
            style={{ display: "contents" }}
          >
            <input type="hidden" name="returnTo" value="/feed" />
            <button
              type="submit"
              className="tb-btn tb-btn--facebook tb-btn--lg tb-btn--block tb-btn--on-board"
            >
              <FacebookIcon />
              {t.loginToStart}
            </button>
          </form>
          <a
            className="tb-link"
            href="#how"
            style={{ alignSelf: "center", color: "var(--tb-chalk-2)" }}
          >
            {t.lookAround}
          </a>
        </div>
      </section>

      <section className="tb-section">
        <h2 className="tb-h2">{t.promptsTitle}</h2>
        <p className="tb-lead" style={{ margin: "4px 0 18px" }}>
          {t.promptsLead}
        </p>
        <div className="tb-notes">
          {t.prompts.map((prompt, i) => {
            const s = noteStyles[i];
            return (
              <div
                key={prompt.label}
                className={`tb-note tb-note--${s.tone}${s.wide ? " tb-note--wide" : ""}`}
                style={{ "--r": `${s.rot}deg` } as CSSProperties}
              >
                <PaperClip color={s.clip} rotate={s.clipRot} />
                <p>
                  <span
                    className="tb-marker tb-note__label"
                    style={s.marker ? { background: s.marker } : undefined}
                  >
                    {prompt.label}
                  </span>
                </p>
                <p className="tb-note__q">{prompt.question}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="tb-section" id="how">
        <Pencil
          style={{
            position: "absolute",
            top: 40,
            right: 24,
            transform: "rotate(-12deg)",
          }}
        />
        <h2 className="tb-h2" style={{ marginBottom: 20 }}>
          {t.stepsTitle}
        </h2>
        <div className="tb-steps">
          {t.steps.map((step, i) => (
            <div className="tb-step" key={step.title}>
              <div
                className="tb-step__num"
                style={{ background: `var(--tb-${stepColors[i]})` }}
              >
                {bn(i + 1)}
              </div>
              <div>
                <h3 className="tb-step__title">{step.title}</h3>
                <p className="tb-step__text">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        className="tb-board"
        style={{ marginTop: 40, paddingTop: 30, textAlign: "center" }}
      >
        <StarDeco className="tb-board__deco" style={{ top: 18, left: 22 }} />
        <StarDeco
          className="tb-board__deco"
          size={13}
          color="#F3F1E7"
          style={{ top: 34, right: 26 }}
        />
        <img
          src="/logo-mark-dark.svg"
          alt=""
          width={64}
          height={70}
          style={{ margin: "0 auto 14px", width: 64, height: "auto" }}
        />
        <h2
          className="tb-display"
          style={{ fontSize: 28, lineHeight: 1.35, color: "#fff" }}
        >
          {t.ctaTitle}
        </h2>
        <p className="tb-board__text" style={{ margin: "10px 0 22px" }}>
          {t.ctaText}
        </p>
        <form method="post" action="/login/google">
          <input type="hidden" name="returnTo" value="/feed" />
          <button
            className="tb-btn tb-btn--primary tb-btn--lg tb-btn--block tb-btn--on-board"
            type="submit"
          >
            <PenIcon size={20} color="#FFFFFF" />
            {t.ctaButton}
          </button>
        </form>
      </section>

      <footer className="tb-footer">
        <span
          className="tb-display"
          style={{ fontSize: 22, color: "var(--tb-board)" }}
        >
          {strings.brand.name}
        </span>
        <span>{t.footer}</span>
      </footer>
    </>
  );
}
