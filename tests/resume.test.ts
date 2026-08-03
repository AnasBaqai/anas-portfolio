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

  it('gives every act a formation index matching its position', () => {
    resume.acts.forEach((act, i) => expect(act.formation).toBe(i + 1));
  });
});
