import { BOT_LINK, content } from '../data.js';

export default function FinalCTA({ lang }) {
  const c = content[lang];
  return (
    <section>
      <div className="wrap final">
        <h2>{c.finalA}<br />{c.finalB}</h2>
        <ul><li>{c.badges[0]}</li><li>{c.cancel}</li></ul>
        <a className="btn" href={BOT_LINK}>↗ {c.finalBtn}</a>
      </div>
    </section>
  );
}
