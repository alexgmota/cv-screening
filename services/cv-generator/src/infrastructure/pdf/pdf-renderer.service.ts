import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join } from 'path';
import { CvData } from '../../domain/cv/cv-data.entity';
import { CvDomainError } from '../../domain/shared/app-error';

/**
 * Renders structured CV data into a PDF document buffer using PDFKit.
 */
export class PdfRendererService {
  private readonly photoWidth = 90;
  private readonly margin = 50;
  private readonly pageWidth = 595.28;
  private readonly contentWidth = 595.28 - 50 * 2;
  private readonly storageRoot: string;

  constructor(storageRoot = process.env.CV_STORAGE_PATH || process.env.PDF_STORAGE_PATH || '/data/cvs') {
    this.storageRoot = storageRoot;
  }

  /**
   * Render a CvData entity into a PDF byte buffer.
   */
  async render(cvData: CvData): Promise<Buffer> {
    try {
      const photoPath = cvData.photoUrl ?? null;
      const photo = photoPath ? await this.preparePhoto(photoPath) : null;

      const doc = new PDFDocument({ size: 'A4', margin: this.margin });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      const done = new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
      });

      this.renderHeader(doc, cvData, photo);
      this.renderSection(doc, 'Professional Summary', cvData.summary || cvData.role);
      this.renderSection(doc, 'Skills', cvData.skills.join(', '));
      this.renderExperience(doc, cvData.experience);
      this.renderEducation(doc, cvData.education);

      doc.end();
      return await done;
    } catch (error) {
      throw CvDomainError.pdfRenderingFailed(error);
    }
  }

  private async preparePhoto(photoPath: string): Promise<Buffer | null> {
    try {
      const safeKey = photoPath.replace(/[/\\]/g, '/');
      const source = await fs.readFile(join(this.storageRoot, safeKey));
      const image = sharp(source).resize(this.photoWidth, this.photoWidth, { fit: 'cover' });
      return await image.jpeg().toBuffer();
    } catch {
      return null;
    }
  }

  private renderHeader(doc: PDFKit.PDFDocument, cvData: CvData, photo: Buffer | null): void {
    if (photo) {
      this.renderRoundPhoto(doc, photo);
    }

    const textWidth = photo ? this.contentWidth - this.photoWidth - 20 : this.contentWidth;

    doc.font('Helvetica-Bold').fontSize(22).fillColor('#1a1a2e').text(cvData.name, {
      width: textWidth
    });
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(14).fillColor('#2d2d2d').text(cvData.role, {
      width: textWidth
    });
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#555555').text(cvData.email, { width: textWidth });
    doc.text(cvData.phone, { width: textWidth });
    doc.moveDown(1);

    doc.x = this.margin;
    this.drawDivider(doc);
  }

  private renderRoundPhoto(doc: PDFKit.PDFDocument, photo: Buffer): void {
    const x = this.pageWidth - this.margin - this.photoWidth;
    const y = this.margin;
    const radius = this.photoWidth / 2;

    doc.save();
    doc.circle(x + radius, y + radius, radius).clip();
    doc.image(photo, x, y, {
      width: this.photoWidth,
      height: this.photoWidth
    });
    doc.restore();
  }

  private renderSection(doc: PDFKit.PDFDocument, title: string, content: string): void {
    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1a1a2e').text(title);
    this.drawDivider(doc);
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(11).fillColor('#333333').text(content, {
      width: this.contentWidth
    });
  }

  private renderExperience(doc: PDFKit.PDFDocument, experience: CvData['experience']): void {
    this.renderSectionTitle(doc, 'Work Experience');
    for (const entry of experience) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1a1a2e').text(entry.position);
      doc.font('Helvetica').fontSize(10).fillColor('#555555')
        .text(`${entry.company}  |  ${entry.startDate} - ${entry.endDate ?? 'Present'}`);
      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(11).fillColor('#333333').text(entry.description, {
        width: this.contentWidth
      });
      if (entry.technologies && entry.technologies.length > 0) {
        doc.moveDown(0.2);
        doc.font('Helvetica-Oblique').fontSize(10).fillColor('#444444')
          .text(`Technologies: ${entry.technologies.join(', ')}`);
      }
    }
  }

  private renderEducation(doc: PDFKit.PDFDocument, education: CvData['education']): void {
    this.renderSectionTitle(doc, 'Education');
    for (const entry of education) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1a1a2e')
        .text(`${entry.degree} in ${entry.field}`);
      doc.font('Helvetica').fontSize(10).fillColor('#555555')
        .text(`${entry.institution}  |  ${entry.startDate} - ${entry.endDate ?? 'Present'}`);
      if (entry.gpa !== undefined) {
        doc.font('Helvetica').fontSize(10).fillColor('#555555').text(`GPA: ${entry.gpa}`);
      }
    }
  }

  private renderSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1a1a2e').text(title);
    this.drawDivider(doc);
  }

  private drawDivider(doc: PDFKit.PDFDocument): void {
    const y = doc.y;
    doc.moveTo(this.margin, y)
      .lineTo(this.margin + this.contentWidth, y)
      .strokeColor('#1a1a2e')
      .lineWidth(0.8)
      .stroke();
    doc.y = y + 6;
  }
}
