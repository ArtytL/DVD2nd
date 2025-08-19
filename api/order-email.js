import nodemailer from "nodemailer";

const ALLOW_ORIGINS = [
  "https://artytl.github.io" // ✅ หน้าเว็บ GitHub Pages ของคุณ
];

function setCors(res, origin) {
  if (ALLOW_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  setCors(res, origin);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (!ALLOW_ORIGINS.includes(origin)) return res.status(403).json({ error: "origin not allowed" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // เผื่อบาง client ส่ง body เป็น string
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "invalid JSON" }); }
  }

  const email = (body?.email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "invalid email" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "ยืนยันคำสั่งซื้อ • DVD Shop",
      text: "ขอบคุณสำหรับการสั่งซื้อของคุณ",
      html: `<h2>ขอบคุณสำหรับการสั่งซื้อ 🎉</h2><p>เรารับคำสั่งซื้อของคุณแล้ว อีเมลนี้คือการยืนยัน</p>`,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

