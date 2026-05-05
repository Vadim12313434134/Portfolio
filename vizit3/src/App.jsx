import './App.css'

const services = [
  'Мужские стрижки',
  'Оформление бороды',
  'Камуфляж седины',
  'Детские стрижки',
];

export default function App() {
  return (
    <main className="barber-page">
      <section className="barber-hero">
        <nav className="barber-nav">
          <div className="barber-logo">North Cut</div>
          <a href="tel:+996700000000">+996 312 905 959</a>
        </nav>

        <div className="barber-grid">
          <div className="barber-content">
            <span className="barber-tag">Barbershop • Бишкек</span>
            <h1>Стрижки, которые держат форму и стиль</h1>
            <p>
              Атмосферный барбершоп для тех, кто ценит аккуратность, уверенность
              и хороший сервис без лишней суеты.
            </p>
            <div className="barber-actions">
              <a className="barber-btn primary" href="tel:+996700000000">Записаться</a>
              <a className="barber-btn secondary" href="#services">Услуги</a>
            </div>
          </div>

          <div className="barber-card">
            <p>Сегодня свободно</p>
            <strong>14:00 / 17:30 / 20:00</strong>
            <span>Средний чек от 1200 сом</span>
          </div>
        </div>
      </section>

      <section className="barber-services" id="services">
        {services.map((service, index) => (
          <article key={service}>
            <span>0{index + 1}</span>
            <h3>{service}</h3>
            <p>Точная работа мастера, консультация по форме и уходу.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
