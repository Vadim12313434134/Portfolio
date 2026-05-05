import { content } from '../data.js';

export default function HowItWorks({ lang }) {
  const c = content[lang];
  return (
    <section id="how">
      <div className="wrap">
        <div className="center"><h2>{c.howTitle}</h2></div>
        <div className="steps">
          {c.steps.map(([icon, title, text], i) => (
            <div className="step" key={title}>
              <div className="num">{i + 1}</div>
              <div className="big">{icon}</div>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
