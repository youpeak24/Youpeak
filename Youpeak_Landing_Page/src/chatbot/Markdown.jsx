import React from "react";

// Minimal, safe markdown for chat replies: paragraphs, bullet and numbered
// lists, **bold**, [links](url), bare emails and URLs. Builds React elements
// (never raw HTML), so model output can't inject markup.

const INLINE =
  /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|(https?:\/\/[^\s)]+)/g;

function safeHref(raw) {
  const url = raw.replace(/^['"<]+|['">]+$/g, "");
  if (url.startsWith("#") || url.startsWith("mailto:")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/.test(url)) return `mailto:${url}`;
  return null;
}

function Link({ href, children, onNavigate }) {
  const internal = href.startsWith("#");
  return (
    <a
      href={href}
      className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-600"
      {...(internal
        ? { onClick: () => onNavigate?.(href) }
        : href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
    >
      {children}
    </a>
  );
}

function inline(text, onNavigate, keyPrefix) {
  const out = [];
  let last = 0;
  let m;
  // Fresh regex per call: bold text recurses, and a shared /g regex would
  // have its position reset by the inner call.
  const re = new RegExp(INLINE.source, "g");
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${m.index}`;
    const [, bold, label, url, email, bare] = m;
    if (bold) {
      out.push(
        <strong key={key} className="font-bold text-slate-900">
          {inline(bold, onNavigate, key)}
        </strong>,
      );
    } else if (label) {
      const href = safeHref(url);
      out.push(
        href ? (
          <Link key={key} href={href} onNavigate={onNavigate}>
            {label}
          </Link>
        ) : (
          label
        ),
      );
    } else {
      const value = email || bare;
      out.push(
        <Link key={key} href={email ? `mailto:${email}` : bare} onNavigate={onNavigate}>
          {value}
        </Link>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text, onNavigate }) {
  const blocks = [];
  let list = null;
  let para = [];

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", lines: para });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)/);
    const numbered = line.match(/^(\d+)[.)]\s+(.*)/);

    if (!line || /^\|?\s*:?-{3,}/.test(line)) {
      flushPara();
      flushList();
    } else if (bullet || numbered) {
      flushPara();
      const type = bullet ? "ul" : "ol";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [], start: numbered ? Number(numbered[1]) : 1 };
      }
      list.items.push(bullet ? bullet[1] : numbered[2]);
    } else {
      flushList();
      // Headings and table rows degrade to plain lines.
      const heading = line.match(/^#{1,6}\s+(.*)/);
      const cleaned = heading
        ? `**${heading[1]}**`
        : line.startsWith("|")
          ? line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()).join(" · ")
          : line;
      para.push(cleaned);
    }
  }
  flushPara();
  flushList();

  return (
    <div className="space-y-2.5">
      {blocks.map((b, i) => {
        if (b.type === "p") {
          return (
            <p key={i}>
              {b.lines.map((l, j) => (
                <React.Fragment key={j}>
                  {j > 0 && <br />}
                  {inline(l, onNavigate, `${i}-${j}`)}
                </React.Fragment>
              ))}
            </p>
          );
        }
        const Tag = b.type;
        return (
          <Tag
            key={i}
            start={b.type === "ol" ? b.start : undefined}
            className={`space-y-1.5 pl-5 ${b.type === "ul" ? "list-disc marker:text-emerald-500" : "list-decimal marker:font-bold marker:text-emerald-600"}`}
          >
            {b.items.map((item, j) => (
              <li key={j} className="pl-0.5">
                {inline(item, onNavigate, `${i}-${j}`)}
              </li>
            ))}
          </Tag>
        );
      })}
    </div>
  );
}
