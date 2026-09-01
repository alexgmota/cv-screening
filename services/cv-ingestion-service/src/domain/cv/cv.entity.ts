import { Entity } from '../shared/entity';

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
}

interface CvEntityProps {
  name: string;
  email?: string;
  phone?: string;
  role: string;
  summary?: string;
  photoPath?: string;
  pdfPath?: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
  createdAt: Date;
}

export class CvEntity extends Entity<CvEntityProps> {
  get name(): string {
    return this.props.name;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get role(): string {
    return this.props.role;
  }

  get summary(): string | undefined {
    return this.props.summary;
  }

  get photoPath(): string | undefined {
    return this.props.photoPath;
  }

  get pdfPath(): string | undefined {
    return this.props.pdfPath;
  }

  get skills(): string[] {
    return [...this.props.skills];
  }

  get education(): Education[] {
    return [...this.props.education];
  }

  get experience(): Experience[] {
    return [...this.props.experience];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(data: Omit<CvEntityProps, 'createdAt'>): CvEntity {
    return new CvEntity({
      ...data,
      createdAt: new Date(),
    });
  }
}
