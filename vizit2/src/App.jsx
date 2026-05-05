import './App.css';
import coach from "./png/coach.png"
const programs = [
  { title: 'Похудение', text: 'План тренировок и питания без жестких ограничений.' },
  { title: 'Набор формы', text: 'Силовые тренировки, техника и отслеживание прогресса.' },
  { title: 'Онлайн-ведение', text: 'Поддержка, корректировки и отчеты каждую неделю.' },
];

export default function FitnessTrainer() {
  return (
    <main className="fit-page">
      <section className="fit-hero">
        <div className="fit-left">
          <span className="fit-label">Personal trainer</span>
          <h1>Приведи тело в форму без хаоса и догадок</h1>
          <p>
            Индивидуальные тренировки для новичков и тех, кто хочет стабильный
            результат: техника, дисциплина, план и поддержка.
          </p>
          <a href="https://wa.me/996700000000" className="fit-button">Получить консультацию</a>
        </div>

        <div className="fit-photo-wrap">
          <div className="fit-stat top"><strong>4.9</strong><span>рейтинг клиентов</span></div>
          <img
            src={coach}
            alt="Тренировка в зале"
          />
          <div className="fit-stat bottom"><strong>120+</strong><span>результатов</span></div>
        </div>
      </section>

      <section className="fit-programs">
        {programs.map((program) => (
          <article key={program.title}>
            <h3>{program.title}</h3>
            <p>{program.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
