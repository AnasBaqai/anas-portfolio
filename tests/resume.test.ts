import { describe, it, expect } from 'vitest';
import { resume } from '@/content/resume';

describe('resume content', () => {
  it('has the four narrative acts in order', () => {
    expect(resume.acts).toHaveLength(4);
    expect(resume.acts.map((a) => a.kicker)).toEqual([
      '01 — Retrieval', '02 — Extraction', '03 — Agents', '04 — Shipped',
    ]);
  });

  it('has four roles, most recent first', () => {
    expect(resume.experience).toHaveLength(4);
    expect(resume.experience[0].company).toBe('Redseven Entertainment GmbH');
  });

  it('has three projects and seven skill groups', () => {
    expect(resume.projects).toHaveLength(3);
    expect(resume.skills).toHaveLength(7);
  });

  it('exposes contact links only — no form endpoint', () => {
    expect(resume.contact.email).toBe('anashabib139@gmail.com');
    expect(resume.contact).not.toHaveProperty('formEndpoint');
  });
});

describe('outbound links', () => {
  // These URLs were extracted from the hyperlink annotations in the source CV
  // PDF, not typed from memory. Keep them in sync with public/anas-cv.pdf.
  const EXPECTED = {
    InsightQL: 'https://github.com/AnasBaqai/InsightQL',
    bugSage: 'https://github.com/AnasBaqai/bugSage',
    'CLI Assistant': 'https://github.com/AnasBaqai/personal_cli_assistant',
  } as const;

  it('gives every project the repo link from the CV', () => {
    for (const project of resume.projects) {
      expect(project.url, `${project.name} has no url`).toBe(
        EXPECTED[project.name as keyof typeof EXPECTED],
      );
    }
  });

  it('links the publication to its IEEE Xplore record', () => {
    expect(resume.publication.url).toBe('https://ieeexplore.ieee.org/document/11119895');
  });

  it('uses https everywhere, so no link downgrades the connection', () => {
    const urls = [
      ...resume.projects.map((p) => p.url),
      resume.publication.url,
      resume.contact.linkedin,
      resume.contact.github,
    ];
    for (const u of urls) expect(u.startsWith('https://'), `${u} is not https`).toBe(true);
  });
});
