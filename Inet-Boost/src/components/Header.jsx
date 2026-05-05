import { BOT_LINK, content } from '../data.js';

export default function Header({ lang, setLang }) {
  const c = content[lang];
  const ids = ['features', 'pricing', 'how', 'ref', 'faq'];
  return (
    <header>
      <div className="wrap nav">
        <a className="logo" href="#top"><i className="bolt">ϟ</i><span>SPEED<br /><b>BOOST</b></span></a>
        <nav className="links">
          {c.nav.map((item, i) => <a key={item} href={`#${ids[i]}`}>{item}</a>)}
        </nav>
        <div className="actions">
          <button className="lang" type="button" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}>{lang.toUpperCase()}</button>
          <a className="btn header-btn" href={BOT_LINK}>{lang === 'en' ? 'Start Trial ↗' : 'Триал ↗'}</a>
          <span className="menu">☰</span>
        </div>
      </div>
    </header>
  );
}
