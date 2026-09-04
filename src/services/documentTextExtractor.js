const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let pdfParse = null;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  // pdf-parse will be loaded if available
}

/**
 * Calculates SHA-256 checksum of a file
 * @param {string} filePath
 * @returns {Promise<string>}
 */
const calculateChecksum = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

/**
 * Extracts text from a supported document
 * @param {string} filePath
 * @param {string} mimeType
 * @param {string} originalName
 * @returns {Promise<{
 *   extractedText: string|null,
 *   pageCount: number|null,
 *   extractionStatus: 'COMPLETED'|'FAILED',
 *   extractionError: string|null,
 *   checksum: string
 * }>}
 */
const extractDocumentText = async (filePath, mimeType, originalName) => {
  const checksum = await calculateChecksum(filePath);
  const ext = path.extname(originalName || filePath).toLowerCase();

  try {
    // 1. Plain text and CSV files
    if (ext === '.txt' || ext === '.csv' || mimeType.startsWith('text/')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const normalized = content.trim();
      return {
        extractedText: normalized || null,
        pageCount: 1,
        extractionStatus: normalized ? 'COMPLETED' : 'FAILED',
        extractionError: normalized ? null : 'File is empty.',
        checksum,
      };
    }

    // 2. PDF files
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      if (!pdfParse) {
        return {
          extractedText: null,
          pageCount: null,
          extractionStatus: 'FAILED',
          extractionError: 'PDF parser module is unavailable.',
          checksum,
        };
      }

      const dataBuffer = fs.readFileSync(filePath);
      let text = '';
      let pageCount = 1;

      if (typeof pdfParse === 'function') {
        const pdfData = await pdfParse(dataBuffer);
        text = pdfData.text ? pdfData.text.trim() : '';
        pageCount = pdfData.numpages || 1;
      } else if (pdfParse && pdfParse.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: dataBuffer });
        const res = await parser.getText();
        text = res.text ? res.text.trim() : '';
        pageCount = res.total || 1;
      }

      if (!text || text.length === 0) {
        return {
          extractedText: null,
          pageCount: pageCount,
          extractionStatus: 'FAILED',
          extractionError: 'Text extraction unavailable. Document may contain scanned images only.',
          checksum,
        };
      }

      return {
        extractedText: text,
        pageCount: pageCount,
        extractionStatus: 'COMPLETED',
        extractionError: null,
        checksum,
      };
    }

    // 3. Formats currently without text extractors (DOCX, XLSX, XLS)
    return {
      extractedText: null,
      pageCount: null,
      extractionStatus: 'FAILED',
      extractionError: `Automated text extraction is not available for ${ext.toUpperCase()} files. Please upload PDF, TXT, or CSV for AI analysis.`,
      checksum,
    };
  } catch (error) {
    return {
      extractedText: null,
      pageCount: null,
      extractionStatus: 'FAILED',
      extractionError: `Failed to extract text: ${error.message}`,
      checksum,
    };
  }
};

module.exports = {
  calculateChecksum,
  extractDocumentText,
};
