import nodemailer from "nodemailer";

const profiles = {
  support: {
    name: "Support | FitorLose",
    auth: {
      user: process.env.SUPPORT_EMAIL,
      pass: process.env.SUPPORT_PASSWORD,
    },
  },
  utkarsh: {
    name: "Utkarsh | FitorLose",
    auth: {
      user: process.env.UTKARSH_EMAIL,
      pass: process.env.UTKARSH_PASSWORD,
    },
  },
  contact: {
    name: "Contact | FitorLose",
    auth: {
      user: process.env.CONTACT_EMAIL,
      pass: process.env.CONTACT_PASSWORD,
    },
  },
  akshat: {
    name: "Akshat | FitorLose",
    auth: {
      user: process.env.AKSHAT_EMAIL,
      pass: process.env.AKSHAT_PASSWORD,
    },
  },
  admin: {
    name: "Admin | FitorLose",
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_PASSWORD,
    },
  },
};

export default function GetMailConfig(type) {
  const profile = profiles[type];
  return {
    name: profile.name,
    from: `${profile.name} <${profile.auth.user}>`,
    transport: nodemailer.createTransport({
      host: "smtp.zoho.in",
      port: 465,
      secure: true,
      auth: profile.auth,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
    }),
  };
}
