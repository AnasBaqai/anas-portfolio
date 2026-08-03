import Subject from '@/components/Subject';
import Header from '@/components/Header';
import Hero from '@/components/Hero';

export default function Home() {
  return (
    <>
      <Header />
      <Subject />
      <main>
        <Hero />
        <section id="story" className="relative z-[2]">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[110vh]" />
          ))}
        </section>
        <section className="relative z-[2] min-h-[70vh]" />
      </main>
    </>
  );
}
