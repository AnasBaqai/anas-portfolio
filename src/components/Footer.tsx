import { resume } from '@/content/resume';

export default function Footer() {
  return (
    <footer className="relative z-[2] border-t border-[var(--line)] px-[6vw] py-10">
      <div className="mx-auto flex max-w-[1240px] flex-wrap gap-x-8 gap-y-2 font-body text-[12.5px] text-[var(--faint)]">
        <span>{resume.languages}</span>
        <span>{resume.authorisation}</span>
        <span className="ml-auto">
          © {new Date().getFullYear()} {resume.name}
        </span>
      </div>
    </footer>
  );
}
