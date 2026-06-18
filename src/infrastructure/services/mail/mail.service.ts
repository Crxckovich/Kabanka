import nodemailer from "nodemailer";
import { SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER } from "@/config/email.config.ts";
import { BASE_URL } from "@/config/api.config.ts";

export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
  }

  sendActivationMail = async (to: string, activationLink: string) => {
    const link = `${BASE_URL}/api/activate/${activationLink}`;

    await this.transporter.sendMail({
      from: SMTP_USER,
      to,
      subject: "Активация аккаунта на " + BASE_URL,
      html: `
            <div>
                <h1>Для активации перейдите по ссылке</h1>
                <a href="${link}">${link}</a>
            </div>
                `,
    });
  };
}

export const mailService = new MailService();
