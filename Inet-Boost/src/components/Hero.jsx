import { BOT_LINK, content } from '../data.js';

export default function Hero({ lang }) {
  const c = content[lang];
  return (
    <section id="top" className="hero">
      <div className="wrap">
        <div className="hero-content">
          <div className="eyebrow">{c.eyebrow}</div>
          <h1>{c.heroTitleA} <span className="red">{c.heroTitleB}</span> {c.heroTitleC}</h1>
          <p>{c.heroText}</p>
          <div className="hero-actions">
            <a className="btn" href={BOT_LINK}>↗ {c.start}</a>
            <a className="btn dark" href="#how">▷ {c.how}</a>
          </div>
          <div className="badges">{c.badges.map((item) => <span key={item}>{item}</span>)}</div>
        </div>
      </div>
    </section>
  );
}
