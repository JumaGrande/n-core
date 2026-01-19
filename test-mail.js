import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "127.0.0.1",
  port: 1025,
  secure: false,
});

await transporter.sendMail({
  from: "test@local.dev",
  to: "you@test.dev",
  subject: "MailHog test",
  text: "It works 🎉",
});

console.log("Email sent");
