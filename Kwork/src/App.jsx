import './App.css'

function CalendarIcon() {
  return (
    <svg className="field-icon" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="3.5" y="5.5" width="13" height="11" rx="1.5" />
      <line x1="3.5" y1="8.5" x2="16.5" y2="8.5" />
      <line x1="7" y1="3.5" x2="7" y2="7" />
      <line x1="13" y1="3.5" x2="13" y2="7" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg className="mail-icon" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="2.75" y="4.75" width="14.5" height="10.5" rx="1.5" />
      <path d="M3.5 6.5L10 11.25L16.5 6.5" />
    </svg>
  )
}

export default function App() {
  return (
    <main className="travel-page">
      <header className="container header">
        <a className="logo" href="#">
          <span className="logo-mark" aria-hidden="true" />
          <span className="logo-text">
            <strong>trip</strong> страхование
          </span>
        </a>

        <nav className="menu">
          <a href="#" className="with-arrow">
            Продукты
          </a>
          <a href="#">Отзывы</a>
          <a href="#">Партнерам</a>
        </nav>

        <button className="discount-btn" type="button">
          <MailIcon />
          Скидки
        </button>
      </header>

      <section className="container hero">
        <h1>Страхование путешественников</h1>
        <p>Полис, который действительно работает</p>

        <div className="search-box" role="group" aria-label="Параметры полиса">
          <div className="search-field">Куда едем?</div>
          <div className="search-field">
            <CalendarIcon />
            05.03.2023
          </div>
          <div className="search-field">
            <CalendarIcon />
            05.03.2023
          </div>
          <div className="search-field last-field">
            <span>1 человек</span>
            <span className="arrow-down" aria-hidden="true" />
          </div>
        </div>

        <button className="cta" type="button">
          Узнать стоимость
        </button>
      </section>
    </main>
  )
}
