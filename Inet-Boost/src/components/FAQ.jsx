import { content } from '../data.js';

export default function FAQ({ lang }) {
  const c = content[lang];
  return (
    <section id="faq">
      <div className="wrap">
        <div className="center"><h2>{c.faqTitle}</h2></div>
        <div className="faq">
          {c.faq.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p className="muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
