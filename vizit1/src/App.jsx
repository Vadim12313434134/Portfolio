import './App.css';
import room1 from "./png/tt.webp"
import room2 from "./png/room.jpg"
import room3 from "./png/flash.jpg"
const steps = ['Концепция', 'Планировка', 'Визуализация', 'Авторский надзор'];

export default function App() {
  return (
    <main className="studio-page">
      <header className="studio-header">
        <div className="studio-brand">Luma Interior</div>
        <a href="mailto:hello@luma.studio">hello@luma.studio</a>
      </header>

      <section className="studio-hero">
        <div className="studio-copy">
          <span>Дизайн интерьера</span>
          <h1>Спокойные пространства, в которых хочется жить</h1>
          <p>
            Проектируем квартиры, дома и коммерческие помещения: от идеи и
            планировки до визуализации и сопровождения ремонта.
          </p>
          <div className="studio-actions">
            <a href="mailto:hello@luma.studio">Обсудить проект</a>
            <p>Проекты от 35 м²</p>
          </div>
        </div>

        <div className="studio-gallery">
          <img className="large" src={room1}/>
          <img src={room2} />
          <img src={room3}/>
        </div>
      </section>

      <section className="studio-steps">
        {steps.map((step, index) => (
          <article key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{step}</h3>
          </article>
        ))}
      </section>
    </main>
  );
}
