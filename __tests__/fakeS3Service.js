class FakeS3Service {
  
  constructor() {
    this.presignedUrls = new Map();
    this.files = new Map();
  }

  async getUploadPresignedUrl(key) {
    const fakeUrl = `https://fake-s3-bucket.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=300`;
    this.presignedUrls.set(key, fakeUrl);
    return fakeUrl;
  }

  getGeneratedUrls() {
    return this.presignedUrls;
  }

  clearGeneratedUrls() {
    this.presignedUrls.clear();
  }

  clearFiles() {
    this.files.clear();
  }

  putFile(key, file) {
    this.files.set(key, file);
  }

  putPdfFile(key) {
    // Create a fake PDF file with PDF magic number and some content
    const pdfContent = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, // %PDF
      0x2D, 0x31, 0x2E, 0x34, // -1.4
      0x0A, 0x25, 0xE2, 0xE3, // ... (PDF header)
      0xCF, 0xD3, 0x0A, 0x0A  // ... (PDF header)
    ]);
    this.files.set(key, pdfContent);
  }

  getFiles(email) {
    return Array.from(this.files.entries())
      .filter(([key]) => key.startsWith(`${email}/`))
      .map(([key]) => key.split('/').pop());
  }

  getDownloadPresignedUrl(email, fileName) {
    const key = `${email}/${fileName}`;
    if (!this.files.has(key)) {
      return null;
    }

    const fakeUrl = `https://fake-s3-bucket.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=300`;
    this.presignedUrls.set(key, fakeUrl);
    return fakeUrl;
  }

  async extractTextFromPdf(key) {
    const file = this.files.get(key);
    if (!file) {
      throw new Error('Failed to extract text from PDF: File not found');
    }

    const isPdf = file.length > 4 && 
      file[0] === 0x25 && // %
      file[1] === 0x50 && // P
      file[2] === 0x44 && // D
      file[3] === 0x46;   // F

    if (!isPdf) {
      throw new Error('File is not a PDF');
    }

    return 'This is a test PDF content';
  }
}

export default FakeS3Service; 