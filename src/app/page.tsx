import Subject from '@/components/Subject';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Narrative from '@/components/Narrative';

export default function Home() {
  return (
    <>
      <Header />
      <Subject />
      <main>
        <Hero />
        <Narrative />
        <section className="relative z-[2] min-h-[70vh]" />
      </main>
    </>
  );
}
