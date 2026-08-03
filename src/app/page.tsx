import Subject from '@/components/Subject';

export default function Home() {
  return (
    <main>
      <Subject />
      <section id="hero" className="relative z-[2] min-h-screen" />
      <section id="story" className="relative z-[2]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[110vh]" />
        ))}
      </section>
      <section className="relative z-[2] min-h-[70vh]" />
    </main>
  );
}
