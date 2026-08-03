import { resume } from '@/content/resume';

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative z-[2] flex min-h-screen flex-col justify-center px-[6vw] pt-32 pb-20"
    >
      <p className="eyebrow">{resume.eyebrow}</p>

      <h1 className="display-xl mt-6 max-w-[14ch]">
        <span className="reveal-line"><span>Muhammad</span></span>
        <span className="reveal-line"><span style={{ animationDelay: '0.1s' }}>Anas —</span></span>
        <span className="reveal-line">
          <span style={{ animationDelay: '0.2s' }}>
            <em className="emphasis">builds</em> AI systems
          </span>
        </span>
      </h1>

      <div className="mt-10 flex max-w-[760px] flex-wrap gap-x-12 gap-y-6 border-t border-[var(--line)] pt-6">
        <p className="max-w-[360px] font-body text-[15.5px] leading-relaxed text-[var(--dim)]">
          {resume.summary}
        </p>
        <dl className="flex gap-9">
          {resume.metrics.map((m) => (
            <div key={m.label} className="flex flex-col-reverse">
              <dt className="mt-1.5 font-body text-[10px] tracking-[0.14em] uppercase text-[var(--faint)]">
                {m.label}
              </dt>
              <dd className="font-display text-[30px] font-black tracking-tight">{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
