import { BOT_LINK, content } from '../data.js';

export default function Referral({ lang }) {
  const c = content[lang];
  return (
    <section id="ref">
      <div className="wrap">
        <div className="bonus">
          <div className="gift">🎁</div>
          <div>
            <h2>{c.referralTitleA}<br />{c.referralTitleB}</h2>
            <p className="muted">{c.referralText}</p>
            <br />
            <a className="btn" href={BOT_LINK}>{c.learn} ↗</a>
          </div>
        </div>
      </div>
    </section>
  );
}
