import { BOT_LINK, content } from '../data.js';

export default function Pricing({ lang }) {
  const c = content[lang];
  return (
    <section id="pricing">
      <div className="wrap">
        <div className="center"><h2>{c.choose}</h2><p>{c.sub}</p></div>
        <div className="pricing">
          {c.plans.map((plan, i) => (
            <article className={`card ${i === 1 ? 'pop' : ''}`} key={plan[0]}>
              {i === 1 && <div className="popular">{c.popular}</div>}
              <h3>{plan[0]}</h3>
              <p className="muted">{plan[1]}</p>
              <div className="price">{plan[2]} <small>/month</small></div>
              <ul className="list">{plan[3].map((item) => <li key={item}>{item}</li>)}</ul>
              <a className="btn" href={BOT_LINK}>↗ {c.startTrial}</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
