import Subject from '@/components/Subject';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Narrative from '@/components/Narrative';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import Credentials from '@/components/Credentials';

export default function Home() {
  return (
    <>
      <Header />
      <Subject />
      <main>
        <Hero />
        <Narrative />
        <Experience />
        <Projects />
        <Skills />
        <Credentials />
      </main>
    </>
  );
}
