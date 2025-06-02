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

  putFile(key, file) {
    const email = key.split('/')[0];
    const files = this.files.get(email) || [];
    files.push(file);
    this.files.set(email, files);
  }

  getFiles(email) {
    return this.files.get(email) || [];
  }

}

export default FakeS3Service; 