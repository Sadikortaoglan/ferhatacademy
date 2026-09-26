import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Ferhat Academy <noreply@ferhatacademy.com>";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? "info@ferhatacademy.com";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendPaymentReceivedToCustomer(opts: {
  to: string;
  name: string;
  orderReference: string;
  productName: string;
  amount: string;
  locale?: string;
}) {
  const resend = getResend();
  if (!resend) return;
  const isTr = (opts.locale ?? "tr") === "tr";
  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: isTr
      ? `Ödeme bildiriminiz alındı — ${opts.orderReference}`
      : `Payment received — ${opts.orderReference}`,
    html: isTr
      ? `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <h2 style="color:#e85d04">Ödeme Bildiriminiz Alındı</h2>
  <p>Merhaba ${opts.name},</p>
  <p>Havale bildiriminiz başarıyla alındı. Ödemeniz kontrol edildikten sonra erişiminiz aktif edilecektir.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;color:#666">Sipariş No</td><td style="padding:8px;font-weight:bold">${opts.orderReference}</td></tr>
    <tr><td style="padding:8px;color:#666">Ürün</td><td style="padding:8px">${opts.productName}</td></tr>
    <tr><td style="padding:8px;color:#666">Tutar</td><td style="padding:8px">${opts.amount}</td></tr>
  </table>
  <p>Onay süreci genellikle 1 iş günü içinde tamamlanır. Sorularınız için <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a> adresine yazabilirsiniz.</p>
  <p style="color:#888;font-size:12px">Ferhat Academy</p>
</div>`
      : `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <h2 style="color:#e85d04">Payment Notification Received</h2>
  <p>Hello ${opts.name},</p>
  <p>Your bank transfer notification has been received. Your access will be activated after the payment is verified.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;color:#666">Order</td><td style="padding:8px;font-weight:bold">${opts.orderReference}</td></tr>
    <tr><td style="padding:8px;color:#666">Product</td><td style="padding:8px">${opts.productName}</td></tr>
    <tr><td style="padding:8px;color:#666">Amount</td><td style="padding:8px">${opts.amount}</td></tr>
  </table>
  <p>Verification usually takes 1 business day. Contact <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a> with any questions.</p>
  <p style="color:#888;font-size:12px">Ferhat Academy</p>
</div>`,
  });
}

export async function sendPaymentNotificationToAdmin(opts: {
  customerName: string;
  customerEmail: string;
  orderReference: string;
  productName: string;
  amount: string;
}) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `💰 Yeni ödeme bildirimi — ${opts.orderReference}`,
    html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <h2 style="color:#e85d04">Yeni Ödeme Bildirimi</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;color:#666">Müşteri</td><td style="padding:8px">${opts.customerName} (${opts.customerEmail})</td></tr>
    <tr><td style="padding:8px;color:#666">Sipariş No</td><td style="padding:8px;font-weight:bold">${opts.orderReference}</td></tr>
    <tr><td style="padding:8px;color:#666">Ürün</td><td style="padding:8px">${opts.productName}</td></tr>
    <tr><td style="padding:8px;color:#666">Tutar</td><td style="padding:8px">${opts.amount}</td></tr>
  </table>
  <a href="${BASE_URL}/tr/admin/orders" style="display:inline-block;background:#e85d04;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:8px">Admin Paneli → Siparişler</a>
</div>`,
  });
}

export async function sendApplicationSubmittedToApplicant(opts: {
  to: string;
  name: string;
  productName: string;
  applicationId: string;
  locale?: string;
}) {
  const resend = getResend();
  if (!resend) return;
  const isTr = (opts.locale ?? "tr") === "tr";
  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: isTr
      ? `Başvurunuz Alındı — ${opts.productName}`
      : `Application Received — ${opts.productName}`,
    html: isTr
      ? `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <h2 style="color:#f97316">Başvurunuz Alındı 🎉</h2>
  <p>Merhaba ${opts.name},</p>
  <p><strong>${opts.productName}</strong> programı için başvurunuzu aldık. En kısa sürede değerlendirip size geri döneceğiz.</p>
  <a href="${BASE_URL}/tr/dashboard/applications" style="display:inline-block;background:#f97316;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:16px">Başvurularımı Görüntüle →</a>
  <p style="margin-top:24px;color:#888;font-size:12px">Ferhat Academy</p>
</div>`
      : `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <h2 style="color:#f97316">Application Received 🎉</h2>
  <p>Hello ${opts.name},</p>
  <p>We've received your application for <strong>${opts.productName}</strong>. We'll review it and get back to you soon.</p>
  <a href="${BASE_URL}/en/dashboard/applications" style="display:inline-block;background:#f97316;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:16px">View My Applications →</a>
  <p style="margin-top:24px;color:#888;font-size:12px">Ferhat Academy</p>
</div>`,
  });
}

export async function sendApplicationSubmittedToAdmin(opts: {
  applicantName: string;
  applicantEmail: string;
  productName: string;
  applicationId: string;
}) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `📋 Yeni Başvuru: ${opts.productName} — ${opts.applicantName}`,
    html: `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <h2 style="color:#0d1117">Yeni Başvuru Geldi</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;color:#666">Başvuran</td><td style="padding:8px;font-weight:bold">${opts.applicantName}</td></tr>
    <tr><td style="padding:8px;color:#666">E-posta</td><td style="padding:8px">${opts.applicantEmail}</td></tr>
    <tr><td style="padding:8px;color:#666">Program</td><td style="padding:8px">${opts.productName}</td></tr>
  </table>
  <a href="${BASE_URL}/tr/admin/applications/${opts.applicationId}" style="display:inline-block;background:#0d1117;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:8px">Başvuruyu İncele →</a>
</div>`,
  });
}

export async function sendPaymentApprovedToCustomer(opts: {
  to: string;
  name: string;
  orderReference: string;
  productName: string;
  locale?: string;
}) {
  const resend = getResend();
  if (!resend) return;
  const isTr = (opts.locale ?? "tr") === "tr";
  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: isTr
      ? `Ödemeniz onaylandı — ${opts.productName}`
      : `Payment approved — ${opts.productName}`,
    html: isTr
      ? `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <h2 style="color:#16a34a">✅ Ödemeniz Onaylandı!</h2>
  <p>Merhaba ${opts.name},</p>
  <p><strong>${opts.productName}</strong> için ödemeniz onaylandı ve erişiminiz aktif edildi.</p>
  <p>Sipariş No: <strong>${opts.orderReference}</strong></p>
  <a href="${BASE_URL}/tr/dashboard" style="display:inline-block;background:#e85d04;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:16px">Eğitimlere Git →</a>
  <p style="margin-top:24px;color:#888;font-size:12px">Ferhat Academy</p>
</div>`
      : `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
  <h2 style="color:#16a34a">✅ Payment Approved!</h2>
  <p>Hello ${opts.name},</p>
  <p>Your payment for <strong>${opts.productName}</strong> has been approved and your access is now active.</p>
  <p>Order: <strong>${opts.orderReference}</strong></p>
  <a href="${BASE_URL}/en/dashboard" style="display:inline-block;background:#e85d04;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:16px">Go to Dashboard →</a>
  <p style="margin-top:24px;color:#888;font-size:12px">Ferhat Academy</p>
</div>`,
  });
}
