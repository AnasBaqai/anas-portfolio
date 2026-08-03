import { resume } from '@/content/resume';
import Act from './Act';

export default function Narrative() {
  return (
    <section id="story" className="relative z-[2]">
      <h2 className="sr-only">What I build</h2>
      {resume.acts.map((act) => (
        <Act key={act.kicker} act={act} />
      ))}
    </section>
  );
}
