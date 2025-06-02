class FakeS3Service {
  constructor() {
    this.presignedUrls = new Map();
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
}

export default FakeS3Service; 