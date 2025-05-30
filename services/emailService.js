import { Resend } from 'resend';

export class EmailService {
  constructor(apiKey = process.env.RESEND_API_KEY) {
    this.client = new Resend(apiKey);
  }

  async send({ from, to, subject, text }) {
    return await this.client.emails.send({
      from,
      to,
      subject,
      text
    });
  }
}

export default EmailService; 