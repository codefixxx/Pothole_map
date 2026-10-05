import { NextRequest, NextResponse } from 'next/server';
import { transporter } from '@/src/lib/nodemailer';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, type, subject, message } = body;

        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { success: false, error: 'Name, email, subject, and message are required.' },
                { status: 400 }
            );
        }

        const categoryLabel = type === 'complaint' 
            ? 'Report Complaint / Issue' 
            : type === 'feedback' 
            ? 'Feedback / Suggestion' 
            : type === 'partnership' 
            ? 'Municipal Partnership' 
            : 'General Inquiry';

        const destinationEmail = process.env.CONTACT_EMAIL || process.env.NODEMAILER_USER || 'support@potholemap.org';

        const emailSubject = `[PotholeMap ${type?.toUpperCase() || 'SUPPORT'}] ${subject}`;
        const emailHtml = `
            <div style="background:#f4f6f8;padding:30px 0;font-family:Arial,sans-serif;">
                <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;border-b:2px solid #facc15;padding-bottom:12px;">
                        <h2 style="margin:0;color:#1f2937;font-size:20px;">PotholeMap Civic Support Portal</h2>
                    </div>

                    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px;border:1px solid #f3f4f6;">
                        <p style="margin:4px 0;font-size:14px;color:#374151;"><strong>From:</strong> ${name} (&lt;<a href="mailto:${email}">${email}</a>&gt;)</p>
                        <p style="margin:4px 0;font-size:14px;color:#374151;"><strong>Category:</strong> ${categoryLabel}</p>
                        <p style="margin:4px 0;font-size:14px;color:#374151;"><strong>Subject:</strong> ${subject}</p>
                        <p style="margin:4px 0;font-size:12px;color:#9ca3af;"><strong>Received:</strong> ${new Date().toLocaleString()}</p>
                    </div>

                    <div style="margin-bottom:24px;">
                        <h3 style="font-size:14px;color:#4b5563;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Message Details:</h3>
                        <div style="font-size:15px;color:#111827;line-height:1.6;white-space:pre-wrap;background:#ffffff;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">${message}</div>
                    </div>

                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

                    <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">
                        This message was sent via the PotholeMap Help & Support Portal. Reply directly to this email to respond to ${name}.
                    </p>
                </div>
            </div>
        `;

        const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.NODEMAILER_USER || 'PotholeMap <onboarding@resend.dev>';
        if (process.env.RESEND_API_KEY || (process.env.NODEMAILER_USER && process.env.NODEMAILER_APP_PASSWORD)) {
            await transporter.sendMail({
                from: `"${name} via PotholeMap" <${fromEmail.includes('<') ? fromEmail.split('<')[1].replace('>', '') : fromEmail}>`,
                replyTo: email,
                to: destinationEmail,
                subject: emailSubject,
                html: emailHtml,
            });
        } else {
            console.log('[Contact API] Mock email sent to:', destinationEmail, {
                name,
                email,
                type,
                subject,
                message,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Your message has been sent successfully. Our team will review it and get back to you soon!',
        });
    } catch (error: any) {
        console.error('[Contact API Error]:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process support request. Please try again later.' },
            { status: 500 }
        );
    }
}
