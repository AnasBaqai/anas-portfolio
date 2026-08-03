import Header from '@/components/Header';
import Subject from '@/components/Subject';
import Hero from '@/components/Hero';
import Narrative from '@/components/Narrative';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import Credentials from '@/components/Credentials';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

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
        <Contact />
      </main>
      <Footer />
    </>
  );
}
