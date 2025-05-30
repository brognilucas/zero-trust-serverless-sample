class FakeEmailService {
  sentEmails = [];

  async send({ from, to, subject, text }) {
    this.sentEmails.push({
      from,
      to,
      subject,
      text,
      sentAt: new Date()
    });
    return { id: 'fake-email-id-' + Math.random().toString(36).substr(2, 9) };
  }

  getSentEmails() {
    return this.sentEmails;
  }

  clearSentEmails() {
    this.sentEmails = [];
  }
}

export default FakeEmailService; 