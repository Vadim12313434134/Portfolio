import { content } from '../data.js';

export default function Features({ lang }) {
  const c = content[lang];
  return (
    <section id="features">
      <div className="wrap features">
        {c.features.map(([icon, title, text]) => (
          <div className="feature" key={title}>
            <div className="ico">{icon}</div>
            <div><h3>{title}</h3><p className="muted">{text}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}
