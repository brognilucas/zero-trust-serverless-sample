import { Resend } from 'resend';

export class EmailService {
  constructor() {
  }

  async send({ from, to, subject, text }) {
    const client = new Resend(process.env.RESEND_API_KEY);
    return await client.emails.send({
      from,
      to,
      subject,
      text
    });
  }
}

export default EmailService; 