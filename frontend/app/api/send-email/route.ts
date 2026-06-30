/**
 * API Route: /api/send-email
 *
 * Sends contact form emails using Brevo SMTP API.
 */

async function sendViaBrevo(params: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL || 'Dolce Atelier <noreply@dolceatelier.com>';

  // Extract email and name from "Name <email>" format
  const fromMatch = fromEmail.match(/<(.+)>/);
  const senderEmail = fromMatch ? fromMatch[1] : fromEmail;
  const fromName = fromEmail.replace(/<.>/, '').trim() || 'Dolce Atelier';

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey || '',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: senderEmail },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.html,
      ...(params.replyTo && {
        replyTo: { email: params.replyTo },
      }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[BREVO] Error sending email:', error);
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return Response.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const success = await sendViaBrevo({
      to: process.env.BREVO_TO_EMAIL || 'dolceatelier@gmail.com',
      subject: `Contact Form: ${subject}`,
      html: `
        <h1>New Contact Message</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
      replyTo: email,
    });

    if (!success) {
      return Response.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
