import { describe, it, expect } from 'vitest';
import { CvEntity } from '../../../src/domain/cv/cv.entity';

describe('CvEntity', () => {
  const validData = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    role: 'Frontend Developer',
    summary: 'Frontend engineer focused on accessibility and performance.',
    skills: ['React', 'TypeScript', 'CSS'],
    education: [
      {
        institution: 'MIT',
        degree: 'BS',
        field: 'Computer Science',
        startDate: '2016-09',
        endDate: '2020-06',
      },
    ],
    experience: [
      {
        company: 'TechCorp',
        position: 'Senior Developer',
        startDate: '2020-07',
        endDate: '2023-12',
        description: 'Led frontend team',
      },
    ],
  };

  it('creates a CvEntity with all fields', () => {
    const cv = CvEntity.create(validData);

    expect(cv.id).toBeDefined();
    expect(cv.name).toBe('John Doe');
    expect(cv.email).toBe('john@example.com');
    expect(cv.phone).toBe('+1234567890');
    expect(cv.role).toBe('Frontend Developer');
    expect(cv.summary).toBe('Frontend engineer focused on accessibility and performance.');
    expect(cv.skills).toEqual(['React', 'TypeScript', 'CSS']);
    expect(cv.education).toHaveLength(1);
    expect(cv.experience).toHaveLength(1);
    expect(cv.createdAt).toBeInstanceOf(Date);
  });

  it('creates with optional fields undefined', () => {
    const cv = CvEntity.create({
      name: 'Jane',
      role: 'Designer',
      skills: [],
      education: [],
      experience: [],
    });

    expect(cv.email).toBeUndefined();
    expect(cv.phone).toBeUndefined();
    expect(cv.photoPath).toBeUndefined();
    expect(cv.pdfPath).toBeUndefined();
  });

  it('skills returns a defensive copy', () => {
    const cv = CvEntity.create({ ...validData, skills: ['A', 'B'] });
    const skills = cv.skills;
    skills.push('C');
    expect(cv.skills).toEqual(['A', 'B']);
  });

  it('education returns a defensive copy', () => {
    const cv = CvEntity.create(validData);
    const edu = cv.education;
    edu.push({ institution: 'X', degree: 'MS', field: 'Math', startDate: '2020' });
    expect(cv.education).toHaveLength(1);
  });

  it('experience returns a defensive copy', () => {
    const cv = CvEntity.create(validData);
    const exp = cv.experience;
    exp.push({ company: 'X', position: 'Dev', startDate: '2024', description: '' });
    expect(cv.experience).toHaveLength(1);
  });

  it('constructs with an explicit id', () => {
    const cv = new CvEntity(
      {
        ...validData,
        createdAt: new Date(),
      },
      'fixed-id'
    );

    expect(cv.id).toBe('fixed-id');
  });

  it('entity equals compares by id', () => {
    const cv1 = CvEntity.create(validData);
    const cv2 = CvEntity.create(validData);

    expect(cv1.equals(cv2)).toBe(false);
    expect(cv1.equals(cv1)).toBe(true);
    expect(cv1.equals(undefined)).toBe(false);
    expect(cv1.equals(null as any)).toBe(false);
  });
});