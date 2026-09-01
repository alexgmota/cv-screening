import { describe, it, expect } from 'vitest';
import { CvData } from '../../../src/domain/cv/cv-data.entity';

describe('CvData', () => {
  const validData = {
    name: 'Alex Smith',
    email: 'alex@test.com',
    phone: '+1234567890',
    role: 'Backend Developer',
    photoUrl: 'https://example.com/photo.jpg',
    summary: 'Backend engineer with a passion for distributed systems.',
    skills: ['Node.js', 'TypeScript', 'PostgreSQL'],
    education: [
      {
        institution: 'Stanford',
        degree: 'MS',
        field: 'Computer Science',
        startDate: '2018-09',
        endDate: '2020-06',
        gpa: 3.9,
      },
    ],
    experience: [
      {
        company: 'BigTech',
        position: 'Senior Engineer',
        startDate: '2020-07',
        description: 'Built microservices.',
        technologies: ['Go', 'Kubernetes'],
      },
    ],
  };

  it('creates CvData with all fields', () => {
    const cv = CvData.create(validData);

    expect(cv.id).toBeDefined();
    expect(cv.name).toBe('Alex Smith');
    expect(cv.email).toBe('alex@test.com');
    expect(cv.phone).toBe('+1234567890');
    expect(cv.role).toBe('Backend Developer');
    expect(cv.photoUrl).toBe('https://example.com/photo.jpg');
    expect(cv.summary).toBe('Backend engineer with a passion for distributed systems.');
    expect(cv.skills).toEqual(['Node.js', 'TypeScript', 'PostgreSQL']);
    expect(cv.education).toHaveLength(1);
    expect(cv.experience).toHaveLength(1);
  });

  it('skills returns a defensive copy', () => {
    const cv = CvData.create(validData);
    const skills = cv.skills;
    skills.push('Docker');
    expect(cv.skills).toEqual(['Node.js', 'TypeScript', 'PostgreSQL']);
  });

  it('education returns a defensive copy', () => {
    const cv = CvData.create(validData);
    const edu = cv.education;
    edu.push({ institution: 'MIT', degree: 'BS', field: 'Math', startDate: '2014' });
    expect(cv.education).toHaveLength(1);
  });

  it('experience returns a defensive copy', () => {
    const cv = CvData.create(validData);
    const exp = cv.experience;
    exp.push({ company: 'X', position: 'Dev', startDate: '2024', description: '' });
    expect(cv.experience).toHaveLength(1);
  });

  it('reconstitute restores with given id', () => {
    const cv = CvData.reconstitute('fixed-id', validData);
    expect(cv.id).toBe('fixed-id');
    expect(cv.name).toBe('Alex Smith');
  });

  it('entity equals compares by id', () => {
    const cv1 = CvData.create(validData);
    const cv2 = CvData.create(validData);

    expect(cv1.equals(cv2)).toBe(false);
    expect(cv1.equals(cv1)).toBe(true);
    expect(cv1.equals(undefined)).toBe(false);
    expect(cv1.equals(null as any)).toBe(false);
  });
});
