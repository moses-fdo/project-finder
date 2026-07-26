import { resend } from "./resend";

const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

export async function sendIdVerificationResultEmail(params: {
  email: string;
  name: string;
  status: "APPROVED" | "REJECTED";
  adminNote?: string | null;
}) {
  if (!resend) {
    console.log(`[Email Fallback] ID Verification ${params.status} email for ${params.email}`);
    return;
  }

  try {
    const isApproved = params.status === "APPROVED";
    const subject = isApproved
      ? "Colabro — Your Student ID Verification has been Approved! 🎉"
      : "Colabro — Student ID Verification Status Update";

    const contentHtml = isApproved
      ? `
        <h3 style="margin-top: 0; color: #09090b;">Congratulations, ${params.name}! 🎉</h3>
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          Your Student ID verification request has been reviewed and <strong>approved</strong> by our admin team.
        </p>
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          Your email address (<code>${params.email}</code>) has been whitelisted for full access to the Colabro platform. You can now sign in and start collaborating on projects!
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
            Sign In to Colabro
          </a>
        </div>
      `
      : `
        <h3 style="margin-top: 0; color: #09090b;">Hello ${params.name},</h3>
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          Thank you for submitting your Student ID card for verification. Our admin team was unable to approve your request at this time.
        </p>
        ${
          params.adminNote
            ? `<div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 14px; border-radius: 6px; margin: 20px 0; color: #991b1b; font-size: 13px;">
                <strong>Reason provided by admin:</strong><br/> ${params.adminNote}
               </div>`
            : ""
        }
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          You can re-upload a clear, legible photo of your Student ID card anytime on the login page to request a fast re-review.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login" style="display: inline-block; background-color: #18181b; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
            Re-upload Student ID
          </a>
        </div>
      `;

    await resend.emails.send({
      from: `Colabro <${fromEmail}>`,
      to: params.email,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 10px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; border-radius: 8px; text-align: center; color: white; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Colabro</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Project Collaboration Hub for Students</p>
          </div>
          <div style="padding: 0 8px;">
            ${contentHtml}
          </div>
          <div style="border-t: 1px solid #f4f4f5; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="font-size: 11px; color: #a1a1aa; margin: 0;">
              This is an automated message from Colabro. Please do not reply directly to this email.
            </p>
          </div>
        </div>
      `,
    });
    console.log(`[Resend] Successfully sent ID verification email to ${params.email}`);
  } catch (err: any) {
    console.error(`[Resend Error] Failed to send email to ${params.email}:`, err?.message || err);
  }
}

export async function sendApplicationStatusEmail(params: {
  email: string;
  name: string;
  projectTitle: string;
  status: "ACCEPTED" | "REJECTED";
}) {
  if (!resend) {
    console.log(`[Email Fallback] Application status email for ${params.email}`);
    return;
  }

  try {
    const isAccepted = params.status === "ACCEPTED";
    const subject = isAccepted
      ? `Application Accepted: "${params.projectTitle}" 🎉`
      : `Update on your application for "${params.projectTitle}"`;

    const contentHtml = isAccepted
      ? `
        <h3 style="margin-top: 0; color: #09090b;">Great news, ${params.name}! 🎉</h3>
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          Your application to collaborate on <strong>"${params.projectTitle}"</strong> has been <span style="color: #16a34a; font-weight: bold;">accepted</span>!
        </p>
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          You can view your active applications and connect with the project owner directly on your dashboard.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard?tab=applications" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
            View My Applications
          </a>
        </div>
      `
      : `
        <h3 style="margin-top: 0; color: #09090b;">Hello ${params.name},</h3>
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          Thank you for applying to collaborate on <strong>"${params.projectTitle}"</strong>.
        </p>
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          The project owner has reviewed your application and decided not to proceed at this time. Don't worry — there are many other exciting open projects looking for collaborators on Colabro!
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/projects" style="display: inline-block; background-color: #18181b; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
            Explore Open Projects
          </a>
        </div>
      `;

    await resend.emails.send({
      from: `Colabro <${fromEmail}>`,
      to: params.email,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 10px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; border-radius: 8px; text-align: center; color: white; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Colabro</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Project Collaboration Hub</p>
          </div>
          <div style="padding: 0 8px;">
            ${contentHtml}
          </div>
        </div>
      `,
    });
  } catch (err: any) {
    console.error(`[Resend Error] Failed to send application status email:`, err?.message || err);
  }
}
