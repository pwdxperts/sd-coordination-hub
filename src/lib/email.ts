import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

async function getTransporter() {
  const configs = await prisma.systemConfig.findMany({
    where: { key: { in: ["smtp_host","smtp_port","smtp_user","smtp_pass","smtp_from"] } },
  });
  const cfg: Record<string,string> = {};
  for (const c of configs) cfg[c.key] = c.value || "";

  if (!cfg.smtp_host || !cfg.smtp_user) {
    // Fallback: log to console if SMTP not configured
    return null;
  }

  return nodemailer.createTransport({
    host: cfg.smtp_host,
    port: parseInt(cfg.smtp_port || "587"),
    secure: parseInt(cfg.smtp_port || "587") === 465,
    auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
  });
}

export async function sendEmail({
  to, subject, html,
}: { to: string; subject: string; html: string }) {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.log(`[EMAIL - not configured] To: ${to} | Subject: ${subject}`);
      return { success: false, reason: "SMTP not configured" };
    }
    const configs = await prisma.systemConfig.findMany({ where: { key: "smtp_from" } });
    const from = configs[0]?.value || "noreply@cogta.gov.za";
    await transporter.sendMail({ from: `"CoGTA SD Hub" <${from}>`, to, subject, html });
    return { success: true };
  } catch (err: any) {
    console.error("Email send failed:", err.message);
    return { success: false, reason: err.message };
  }
}

export function buildAssignmentEmail({
  recipientName, caseRef, caseTitle, step, assignerName, caseUrl,
}: { recipientName: string; caseRef: string; caseTitle: string; step: string; assignerName: string; caseUrl: string }) {
  const stepLabels: Record<string,string> = {
    new_submission:"Intake & Logging", under_verification:"Verification",
    classified:"Classification", assigned:"Assignment & Coordination",
    action_plan:"Action Plan Submission", intervention:"On-ground Intervention",
    monitoring:"Monitoring & Verification", escalated:"Escalation Handling",
    resolved:"Resolution",
  };
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:Arial,sans-serif;background:#f4f6f8;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0F2340;padding:24px 32px;">
      <p style="color:#23AAE2;font-size:12px;margin:0 0 4px;letter-spacing:1px;text-transform:uppercase;">National SD Coordination Hub</p>
      <h1 style="color:#fff;font-size:22px;margin:0;">Case Assigned to You</h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#374151;margin:0 0 16px;">Hi <strong>${recipientName}</strong>,</p>
      <p style="color:#374151;margin:0 0 16px;">A case has been assigned to you and requires your action.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #23AAE2;border-radius:8px;padding:16px;margin:0 0 20px;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Case Reference</p>
        <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0F2340;">${caseRef}</p>
        <p style="margin:0 0 8px;color:#374151;font-size:14px;"><strong>Title:</strong> ${caseTitle}</p>
        <p style="margin:0 0 8px;color:#374151;font-size:14px;"><strong>Required Action:</strong> ${stepLabels[step] || step}</p>
        <p style="margin:0;color:#374151;font-size:14px;"><strong>Assigned by:</strong> ${assignerName}</p>
      </div>
      <a href="${caseUrl}" style="display:inline-block;background:#23AAE2;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Open Case →</a>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
      <p style="color:#9ca3af;font-size:12px;margin:0;">You received this because you are registered on the CoGTA National Service Delivery Coordination Hub. Log in at <a href="https://sd-coordination-hub.vercel.app" style="color:#23AAE2;">sd-coordination-hub.vercel.app</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

export function buildStatusUpdateEmail({
  recipientName, caseRef, caseTitle, newStatus, updaterName, comment, caseUrl,
}: { recipientName: string; caseRef: string; caseTitle: string; newStatus: string; updaterName: string; comment?: string; caseUrl: string }) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f6f8;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0F2340;padding:24px 32px;">
      <p style="color:#23AAE2;font-size:12px;margin:0 0 4px;letter-spacing:1px;text-transform:uppercase;">National SD Coordination Hub</p>
      <h1 style="color:#fff;font-size:22px;margin:0;">Case Status Updated</h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#374151;margin:0 0 16px;">Hi <strong>${recipientName}</strong>,</p>
      <p style="color:#374151;margin:0 0 16px;">A case you are involved with has been updated.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #3FAE86;border-radius:8px;padding:16px;margin:0 0 20px;">
        <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F2340;">${caseRef} — ${caseTitle}</p>
        <p style="margin:0 0 8px;color:#374151;font-size:14px;"><strong>New Status:</strong> ${newStatus}</p>
        <p style="margin:0;color:#374151;font-size:14px;"><strong>Updated by:</strong> ${updaterName}</p>
        ${comment ? `<p style="margin:8px 0 0;color:#374151;font-size:14px;"><strong>Comment:</strong> ${comment}</p>` : ""}
      </div>
      <a href="${caseUrl}" style="display:inline-block;background:#3FAE86;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">View Case →</a>
    </div>
  </div>
</body>
</html>
  `;
}
