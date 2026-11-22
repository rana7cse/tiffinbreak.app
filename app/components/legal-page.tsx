import {
  CONTACT_EMAIL,
  type LegalPage,
  type LegalVersion,
} from "~/content/legal";
import { strings } from "~/strings";

const t = strings.legal;

/** Renders a paragraph, turning the contact email into a mailto link. */
function Paragraph({ text }: { text: string }) {
  const [before, ...rest] = text.split(CONTACT_EMAIL);
  if (rest.length === 0) return <p>{text}</p>;
  return (
    <p>
      {before}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      {rest.join(CONTACT_EMAIL)}
    </p>
  );
}

function Version({ lang, v }: { lang: "bn" | "en"; v: LegalVersion }) {
  return (
    <article lang={lang} style={{ marginBottom: 40 }}>
      <h1 className="tb-h1">{v.title}</h1>
      <p className="tb-meta" style={{ margin: "8px 0 24px" }}>
        {v.effective}
      </p>
      <div className="tb-prose">
        {v.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="tb-h2 tb-h2--sm" style={{ margin: "28px 0 12px" }}>
              {s.heading}
            </h2>
            {s.paragraphs.map((p) => (
              <Paragraph key={p} text={p} />
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}

export function LegalPageView({ page }: { page: LegalPage }) {
  return (
    <>
      <main className="tb-section">
        <a className="tb-link" href="/">
          {t.backToHome}
        </a>
        <Version lang="bn" v={page.bn} />
        <Version lang="en" v={page.en} />
      </main>
      <footer className="tb-footer">
        <span>{t.poweredBy}</span>
      </footer>
    </>
  );
}
