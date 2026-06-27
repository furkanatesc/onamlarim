import { Injectable } from '@nestjs/common';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';

interface ConsentPdfInput {
  id: string;
  procedure: string;
  doctorName: string;
  signatureData: string | null;
}

@Injectable()
export class PdfService {
  private readonly dir = join(process.cwd(), 'storage', 'consents');

  generateConsentPdf(consent: ConsentPdfInput): Promise<string> {
    mkdirSync(this.dir, { recursive: true });
    const absPath = join(this.dir, `${consent.id}.pdf`);
    const relPath = `storage/consents/${consent.id}.pdf`;

    return new Promise<string>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = createWriteStream(absPath);
      doc.pipe(stream);
      doc.fontSize(18).text('Onam Belgesi', { align: 'center' }).moveDown();
      doc.fontSize(12).text(`Onam No: ${consent.id}`);
      doc.text(`İşlem: ${consent.procedure}`);
      doc.text(`Hekim: ${consent.doctorName}`);
      doc.moveDown().text(consent.signatureData ? 'İmzalanmıştır.' : 'İmza bekliyor.');
      doc.end();
      stream.on('finish', () => resolve(relPath));
      stream.on('error', reject);
    });
  }
}
