import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Ship,
  Search,
  FileCheck2,
  Calculator,
  MapPin,
  CheckCircle2,
  Phone,
  MessageCircle,
  ArrowRight,
  Star,
  Clock3,
  Car,
  BadgePercent
} from 'lucide-react';

const cars = [
  {
    name: 'Kia Carnival 2023',
    spec: '2.2 Diesel · 34 000 км · 7 мест',
    price: 'от 4,9 млн ₽',
    img: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop'
  },
  {
    name: 'Hyundai Palisade 2022',
    spec: '2.2 Diesel · 52 000 км · 4WD',
    price: 'от 5,7 млн ₽',
    img: 'https://images.unsplash.com/photo-1617814076668-395368f30d0e?q=80&w=1200&auto=format&fit=crop'
  },
  {
    name: 'Genesis GV70 2023',
    spec: '2.5 Turbo · 29 000 км · AWD',
    price: 'от 5,4 млн ₽',
    img: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop'
  }
];

const steps = [
  ['Заявка и бриф', 'Фиксируем бюджет, модель, год, пробег и город доставки.'],
  ['Подбор в Корее', 'Ищем варианты на Encar, дилерских площадках и закрытых предложениях.'],
  ['Проверка авто', 'Делаем инспекцию, фото/видеоотчёт, проверяем кузов, историю и документы.'],
  ['Выкуп и оформление', 'Согласовываем финальную смету, заключаем договор и выкупаем автомобиль.'],
  ['Доставка в РФ', 'Организуем логистику, таможню, СБКТС/ЭПТС и отправку в ваш регион.']
];

const benefits = [
  ['Экономия до 20%', 'Подбираем авто с прозрачной историей и адекватной рыночной ценой.', ShieldCheck],
  ['Без поездки в Корею', 'Все этапы дистанционно: договор, отчёты, оплата, документы и доставка.', Search],
  ['Проверка до выкупа', 'Не покупаем авто без фото, видео и технического заключения.', FileCheck2],
  ['Доставка по России', 'Владивосток, Москва, Санкт-Петербург, Краснодар и любой другой регион.', MapPin]
];

function Button({ children, variant = 'primary', size = 'default', className = '', ...props }) {
  return (
    <button className={`btn btn--${variant} btn--${size} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function App() {
  const [budget, setBudget] = useState('4–6 млн ₽');

  return (
    <div className="page">
      <style>{styles}</style>

      <header className="header">
        <div className="container header__inner">
          <div className="logo">
            <div className="logo__icon"><Car size={22} /></div>
            <div>
              <p className="logo__title">KORIMPORT</p>
              <p className="logo__subtitle">авто из Кореи под ключ</p>
            </div>
          </div>

          <nav className="nav">
            <a href="#cars">Примеры</a>
            <a href="#steps">Этапы</a>
            <a href="#guarantees">Гарантии</a>
            <a href="#faq">FAQ</a>
          </nav>

          <Button variant="light">Получить расчёт</Button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__bg" />
          <div className="container hero__grid">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="badge">
                <BadgePercent size={16} /> Тестовая ниша: быстро считаем спрос и качество заявок
              </div>

              <h1>Привезём автомобиль из Кореи под ключ с доставкой в ваш город</h1>

              <p className="hero__text">
                Подбор, инспекция, выкуп, логистика, таможня и отправка по России. Получите предварительный расчёт стоимости и 3 подходящих варианта под ваш бюджет.
              </p>

              <div className="hero__buttons">
                <Button size="large">Рассчитать стоимость <ArrowRight size={18} /></Button>
                <Button variant="outline" size="large"><MessageCircle size={18} /> Написать в WhatsApp</Button>
              </div>

              <div className="stats">
                {[
                  ['14–35 дней', 'средний срок доставки'],
                  ['0 ₽', 'первичный расчёт'],
                  ['100%', 'договор и отчёты'],
                  ['РФ', 'любой регион']
                ].map(([title, text]) => (
                  <div className="stat" key={title}>
                    <p className="stat__title">{title}</p>
                    <p className="stat__text">{text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card className="lead-card">
                <p className="eyebrow">Бесплатный расчёт за 15 минут</p>
                <h2>Подберём 3 варианта из Кореи</h2>

                <form className="form">
                  <input placeholder="Ваше имя" />
                  <input placeholder="Телефон или WhatsApp" />
                  <select value={budget} onChange={(e) => setBudget(e.target.value)}>
                    <option>до 3 млн ₽</option>
                    <option>3–4 млн ₽</option>
                    <option>4–6 млн ₽</option>
                    <option>6–9 млн ₽</option>
                    <option>9+ млн ₽</option>
                  </select>
                  <textarea placeholder="Какая модель интересует? Например: Palisade, Carnival, GV70" />
                  <Button className="form__button">Получить подборку</Button>
                  <p className="policy">Нажимая кнопку, вы соглашаетесь с обработкой персональных данных. Почту для заявок и юридические тексты можно заменить в коде.</p>
                </form>
              </Card>
            </motion.div>
          </div>
        </section>

        <section className="section benefits">
          <div className="container benefits__grid">
            {benefits.map(([title, text, Icon]) => (
              <Card key={title} className="benefit-card">
                <Icon className="card-icon" size={28} />
                <h3>{title}</h3>
                <p>{text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="cars" className="section section--light">
          <div className="container">
            <div className="section-head">
              <div>
                <p className="section-label">Популярные запросы</p>
                <h2 className="title-dark">Какие авто выгодно везти из Кореи</h2>
              </div>
              <p>Цены указаны как ориентир для тестового лендинга. Финальная стоимость зависит от курса, комплектации, пошлин, логистики и региона доставки.</p>
            </div>

            <div className="cars-grid">
              {cars.map((car) => (
                <Card key={car.name} className="car-card">
                  <img src={car.img} alt={car.name} />
                  <div className="car-card__body">
                    <h3>{car.name}</h3>
                    <p>{car.spec}</p>
                    <div className="car-card__footer">
                      <strong>{car.price}</strong>
                      <Button>Хочу такой</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="steps" className="section">
          <div className="container">
            <div className="section-head section-head--narrow">
              <div>
                <p className="section-label section-label--blue">Прозрачный процесс</p>
                <h2>От заявки до ключей — 5 понятных этапов</h2>
              </div>
            </div>

            <div className="steps-grid">
              {steps.map(([title, text], index) => (
                <div className="step-card" key={title}>
                  <div className="step-card__number">{index + 1}</div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="guarantees" className="section guarantees">
          <div className="container guarantees__grid">
            <div>
              <p className="section-label section-label--blue">Почему оставляют заявку</p>
              <h2>Снимаем главные страхи перед покупкой за границей</h2>
              <p className="guarantees__text">Лендинг сделан под холодный трафик: быстро объясняет выгоду, показывает процесс, собирает контакт и переводит сомневающихся в консультацию.</p>
            </div>

            <div className="check-list">
              {[
                'Договор с фиксированным перечнем услуг',
                'Фото- и видеоотчёт до выкупа',
                'Проверка кузова, салона, двигателя и документов',
                'Понятная смета: авто, комиссия, логистика, таможня',
                'Связь с менеджером на каждом этапе'
              ].map((item) => (
                <div className="check-item" key={item}>
                  <CheckCircle2 size={24} />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section metrics">
          <div className="container metrics__grid">
            {[
              [Star, '4.9/5', 'средняя оценка клиентов после выдачи'],
              [Clock3, '24/7', 'отчёты и статус сделки в мессенджере'],
              [Ship, 'до двери', 'доставка во Владивосток и дальше по РФ']
            ].map(([Icon, value, text]) => (
              <div className="metric" key={value}>
                <Icon size={32} />
                <p>{value}</p>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="section section--light">
          <div className="container container--small">
            <h2 className="title-dark">FAQ</h2>
            <div className="faq-list">
              {[
                ['Можно ли купить авто без поездки в Корею?', 'Да. Подбор, проверка, договор, оплата и отчёты проходят дистанционно.'],
                ['Сколько занимает доставка?', 'Обычно от 14 до 35 дней после выкупа, зависит от маршрута, порта, таможни и региона.'],
                ['Что входит в расчёт?', 'Стоимость авто в Корее, комиссия, доставка, таможенные платежи, оформление и отправка по России.'],
                ['Какие документы нужны?', 'Паспортные данные для договора и оформления. Точный список менеджер уточнит после заявки.']
              ].map(([question, answer]) => (
                <details className="faq-item" key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section final-cta-section">
          <div className="container">
            <div className="final-cta">
              <div>
                <h2>Получите расчёт авто из Кореи сегодня</h2>
                <p>Оставьте контакт — менеджер подготовит предварительную смету и покажет 3 актуальных варианта под ваш бюджет.</p>
              </div>
              <div className="final-cta__buttons">
                <Button variant="light" size="large"><Calculator size={18} /> Рассчитать стоимость</Button>
                <Button variant="outline" size="large"><Phone size={18} /> Заказать звонок</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <a href="#" className="whatsapp"><MessageCircle size={20} /> WhatsApp</a>

      <footer className="footer">
        © 2026 KORIMPORT. Тестовый лендинг. Замените реквизиты, почту для заявок, политику и оферту перед запуском рекламы.
      </footer>
    </div>
  );
}

export default App;

const styles = `
  * {
    box-sizing: border-box;
  }

  html {
    width: 100%;
    min-height: 100%;
    scroll-behavior: smooth;
  }

  body {
    width: 100%;
    min-height: 100%;
    margin: 0;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #09090b;
  }

  #root {
    width: 100%;
    min-height: 100vh;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  h1,
  h2,
  h3,
  p {
    margin-top: 0;
  }

  .page {
    width: 100%;
    min-height: 100vh;
    overflow-x: hidden;
    background: #09090b;
    color: #ffffff;
  }

  .container {
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    padding-left: clamp(16px, 4vw, 56px);
    padding-right: clamp(16px, 4vw, 56px);
  }

  .container--small {
    max-width: 960px;
  }

  .header {
    position: sticky;
    top: 0;
    z-index: 50;
    width: 100%;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(9, 9, 11, 0.82);
    backdrop-filter: blur(18px);
  }

  .header__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding-top: 16px;
    padding-bottom: 16px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo__icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    background: #ffffff;
    color: #09090b;
  }

  .logo__title {
    margin: 0;
    font-size: 18px;
    line-height: 1;
    font-weight: 800;
  }

  .logo__subtitle {
    margin: 4px 0 0;
    font-size: 12px;
    color: #a1a1aa;
  }

  .nav {
    display: flex;
    align-items: center;
    gap: 24px;
    color: #d4d4d8;
    font-size: 14px;
  }

  .nav a:hover {
    color: #ffffff;
  }

  .btn {
    border: 0;
    outline: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 44px;
    padding: 12px 20px;
    border-radius: 18px;
    font: inherit;
    font-weight: 750;
    cursor: pointer;
    transition: transform 0.2s ease, background 0.2s ease, border 0.2s ease;
  }

  .btn:hover {
    transform: translateY(-1px);
  }

  .btn--primary {
    background: #3b82f6;
    color: #ffffff;
  }

  .btn--primary:hover {
    background: #2563eb;
  }

  .btn--light {
    background: #ffffff;
    color: #09090b;
  }

  .btn--light:hover {
    background: #e4e4e7;
  }

  .btn--outline {
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(255, 255, 255, 0.07);
    color: #ffffff;
  }

  .btn--outline:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .btn--large {
    min-height: 54px;
    padding: 16px 28px;
    border-radius: 20px;
  }

  .card {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.06);
  }

  .hero {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    min-height: calc(100vh - 75px);
    overflow: hidden;
  }

  .hero__bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top right, rgba(59, 130, 246, 0.38), transparent 35%),
      radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.22), transparent 30%),
      linear-gradient(135deg, #09090b 0%, #111827 48%, #09090b 100%);
  }

  .hero__grid {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
    gap: clamp(28px, 5vw, 72px);
    align-items: center;
    padding-top: clamp(48px, 7vw, 96px);
    padding-bottom: clamp(48px, 7vw, 96px);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
    padding: 9px 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    color: #e4e4e7;
    font-size: 14px;
  }

  h1 {
    max-width: 900px;
    margin-bottom: 24px;
    font-size: clamp(42px, 6.4vw, 92px);
    line-height: 0.94;
    letter-spacing: -0.06em;
    font-weight: 950;
  }

  h2 {
    margin-bottom: 0;
    font-size: clamp(32px, 4vw, 58px);
    line-height: 1;
    letter-spacing: -0.04em;
    font-weight: 950;
  }

  h3 {
    margin-bottom: 10px;
    font-size: 20px;
    line-height: 1.15;
  }

  .title-dark {
    color: #09090b;
  }

  .hero__text {
    max-width: 720px;
    margin-bottom: 32px;
    color: #d4d4d8;
    font-size: clamp(17px, 1.5vw, 22px);
    line-height: 1.55;
  }

  .hero__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 40px;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .stat {
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.05);
  }

  .stat__title {
    margin-bottom: 4px;
    font-size: 25px;
    font-weight: 850;
  }

  .stat__text {
    margin: 0;
    color: #a1a1aa;
    font-size: 14px;
  }

  .lead-card {
    width: 100%;
    max-width: 520px;
    justify-self: end;
    padding: 30px;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(20px);
  }

  .lead-card h2 {
    font-size: 28px;
    line-height: 1.1;
  }

  .eyebrow {
    margin-bottom: 8px;
    color: #93c5fd;
    font-size: 14px;
    font-weight: 800;
  }

  .form {
    display: grid;
    gap: 14px;
    margin-top: 24px;
  }

  .form input,
  .form select,
  .form textarea {
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 18px;
    background: #18181b;
    color: #ffffff;
    padding: 16px;
    font: inherit;
    outline: 0;
  }

  .form textarea {
    min-height: 104px;
    resize: vertical;
  }

  .form input::placeholder,
  .form textarea::placeholder {
    color: #71717a;
  }

  .form__button {
    width: 100%;
    min-height: 56px;
  }

  .policy {
    margin: 0;
    color: #a1a1aa;
    font-size: 12px;
    line-height: 1.45;
  }

  .section {
    width: 100%;
    padding-top: clamp(56px, 6vw, 88px);
    padding-bottom: clamp(56px, 6vw, 88px);
  }

  .benefits__grid,
  .cars-grid,
  .metrics__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }

  .benefits__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .benefit-card {
    padding: 26px;
  }

  .benefit-card p,
  .step-card p,
  .guarantees__text {
    color: #a1a1aa;
    line-height: 1.55;
  }

  .card-icon {
    margin-bottom: 18px;
    color: #60a5fa;
  }

  .section--light {
    background: #ffffff;
    color: #09090b;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 32px;
    margin-bottom: 42px;
  }

  .section-head > p {
    max-width: 560px;
    margin: 0;
    color: #52525b;
    line-height: 1.55;
  }

  .section-head--narrow {
    max-width: 860px;
  }

  .section-label {
    margin-bottom: 10px;
    color: #2563eb;
    font-weight: 850;
  }

  .section-label--blue {
    color: #60a5fa;
  }

  .car-card {
    overflow: hidden;
    border-color: #e4e4e7;
    background: #ffffff;
    box-shadow: 0 16px 45px rgba(24, 24, 27, 0.08);
  }

  .car-card img {
    display: block;
    width: 100%;
    height: 260px;
    object-fit: cover;
  }

  .car-card__body {
    padding: 24px;
  }

  .car-card__body p {
    color: #52525b;
  }

  .car-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-top: 22px;
  }

  .car-card__footer strong {
    font-size: 22px;
  }

  .steps-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
  }

  .step-card {
    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.06);
  }

  .step-card__number {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    margin-bottom: 22px;
    border-radius: 16px;
    background: #3b82f6;
    font-weight: 950;
  }

  .guarantees {
    background: #18181b;
  }

  .guarantees__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 48px;
    align-items: start;
  }

  .guarantees__text {
    margin-top: 24px;
    font-size: 18px;
  }

  .check-list {
    display: grid;
    gap: 14px;
  }

  .check-item {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.06);
  }

  .check-item svg {
    flex: 0 0 auto;
    color: #22c55e;
  }

  .check-item p {
    margin: 0;
  }

  .metric {
    min-height: 220px;
    padding: 32px;
    border-radius: 30px;
    background: #3b82f6;
  }

  .metric p {
    margin: 40px 0 8px;
    font-size: 44px;
    line-height: 1;
    font-weight: 950;
  }

  .metric span {
    color: #dbeafe;
    line-height: 1.45;
  }

  .faq-list {
    display: grid;
    gap: 14px;
    margin-top: 34px;
  }

  .faq-item {
    padding: 22px;
    border: 1px solid #e4e4e7;
    border-radius: 24px;
    background: #f4f4f5;
  }

  .faq-item summary {
    cursor: pointer;
    font-size: 18px;
    font-weight: 850;
  }

  .faq-item p {
    margin: 14px 0 0;
    color: #52525b;
    line-height: 1.55;
  }

  .final-cta-section {
    padding-bottom: 72px;
  }

  .final-cta {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 380px;
    gap: 32px;
    align-items: center;
    padding: clamp(28px, 4vw, 56px);
    border-radius: 34px;
    background: linear-gradient(135deg, #2563eb, #27272a);
  }

  .final-cta p {
    max-width: 720px;
    margin: 18px 0 0;
    color: #dbeafe;
    line-height: 1.55;
  }

  .final-cta__buttons {
    display: grid;
    gap: 12px;
  }

  .whatsapp {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 60;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    border-radius: 999px;
    background: #22c55e;
    color: #ffffff;
    font-weight: 850;
    box-shadow: 0 18px 45px rgba(34, 197, 94, 0.35);
  }

  .footer {
    width: 100%;
    padding: 32px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: #71717a;
    text-align: center;
    font-size: 14px;
  }

  @media (max-width: 1100px) {
    .hero__grid,
    .guarantees__grid,
    .final-cta {
      grid-template-columns: 1fr;
    }

    .lead-card {
      max-width: 100%;
      justify-self: stretch;
    }

    .stats,
    .benefits__grid,
    .cars-grid,
    .metrics__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .steps-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .nav {
      display: none;
    }

    .header__inner > .btn {
      display: none;
    }

    .hero {
      min-height: auto;
    }

    .hero__grid {
      padding-top: 48px;
      padding-bottom: 56px;
    }

    .hero__buttons,
    .car-card__footer {
      flex-direction: column;
      align-items: stretch;
    }

    .stats,
    .benefits__grid,
    .cars-grid,
    .metrics__grid,
    .steps-grid {
      grid-template-columns: 1fr;
    }

    .lead-card,
    .final-cta {
      padding: 24px;
    }

    .section-head {
      align-items: start;
      flex-direction: column;
    }

    .whatsapp {
      left: 16px;
      right: 16px;
      justify-content: center;
    }
  }
`;
