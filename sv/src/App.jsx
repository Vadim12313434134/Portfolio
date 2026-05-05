import "./App.css";

export default function WeddingInvite() {
  return (
    <main className="wedding-page">
      <section className="hero">
        <p className="eyebrow">Приглашаем на свадьбу</p>
        <h1>Алины & Тимура</h1>
        <p className="date">24 августа 2025</p>
        <p className="hero-text">
          С радостью приглашаем вас разделить с нами день нашей свадьбы.
        </p>
        <a href="#rsvp" className="hero-btn">Подтвердить присутствие</a>
      </section>

      <section className="card">
        <h2>Дорогие гости</h2>
        <p>
          Мы будем счастливы видеть вас на нашем празднике любви, семьи и
          красивых моментов.
        </p>
      </section>

      <section className="details">
        <div>
          <span>Церемония</span>
          <h3>15:00</h3>
          <p>Загородный комплекс “Белый сад”</p>
        </div>
        <div>
          <span>Банкет</span>
          <h3>17:00</h3>
          <p>Ресторан “Aurora Hall”</p>
        </div>
        <div>
          <span>Dress code</span>
          <h3>Pastel</h3>
          <p>Нежные светлые оттенки</p>
        </div>
      </section>

      <section className="timeline">
        <h2>Программа дня</h2>
        <ul>
          <li><b>14:30</b> Сбор гостей</li>
          <li><b>15:00</b> Церемония</li>
          <li><b>16:00</b> Фотосессия</li>
          <li><b>17:00</b> Банкет</li>
          <li><b>21:00</b> Торт и танцы</li>
        </ul>
      </section>

      <section className="location">
        <h2>Локация</h2>
        <p>г. Москва, ул. Цветочная, 12</p>
        <a
          href="https://maps.google.com"
          target="_blank"
          rel="noreferrer"
          className="outline-btn"
        >
          Открыть карту
        </a>
      </section>

      <section className="rsvp" id="rsvp">
        <h2>Будете с нами?</h2>
        <p>Пожалуйста, подтвердите присутствие до 1 августа.</p>
        <button>Да, я буду</button>
      </section>
    </main>
  );
}