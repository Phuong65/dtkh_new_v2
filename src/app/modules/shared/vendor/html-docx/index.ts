import JSZip from 'jszip';
import { addFiles, DocumentOptions, generateDocument } from './internal';

export async function asBlob(html: string, options: Partial<DocumentOptions> = {}): Promise<Blob | Buffer> {
  const zip = new JSZip();
  addFiles(zip, html, options);
  return generateDocument(zip);
}
