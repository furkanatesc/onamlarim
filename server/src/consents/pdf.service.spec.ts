import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { PdfService } from './pdf.service';

describe('PdfService', () => {
  const service = new PdfService();
  const id = 'test-consent-id';
  const path = join(process.cwd(), 'storage', 'consents', `${id}.pdf`);

  afterAll(() => { if (existsSync(path)) rmSync(path); });

  it('writes a non-empty PDF file and returns its relative path', async () => {
    const rel = await service.generateConsentPdf({
      id, procedure: 'Histeroskopi', doctorName: 'Dr. Müge', signatureData: 'data:image/svg+xml;utf8,<svg/>',
    });
    expect(rel).toBe(`storage/consents/${id}.pdf`);
    expect(existsSync(path)).toBe(true);
  });
});
