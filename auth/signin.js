import bcrypt from "bcrypt";
import { DatabaseService } from "../database/database.js";
import EmailService from "../services/emailService.js";

export const createHandler = (database = new DatabaseService(), emailService = new EmailService()) => {
  return async (event) => {
    try {
      const { email, password } = JSON.parse(event.body);

      if (!email || !password) {
        return { statusCode: 400, body: JSON.stringify({ message: "Email and password required" }) };
      }

      const user = await database.getUser(email);

      if (!user) {
        return { statusCode: 401, body: JSON.stringify({ message: "Invalid credentials" }) };
      }

      const passwordHash = user.passwordHash;
      const isValid = await bcrypt.compare(password, passwordHash);

      if (!isValid) {
        return { statusCode: 401, body: JSON.stringify({ message: "Invalid credentials" }) };
      }

      const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
      await database.setMfaCode(email, mfaCode);

      await emailService.send({
          from: process.env.EMAIL_FROM,
          to: [email],
          subject: 'MFA CODE',
          text: `Your MFA code is: ${mfaCode}`,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "MFA code sent" })
      };

    } catch (error) {
      console.error("Signin error:", error);
      return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
    }
  };
};


export const handler = createHandler();