import { Resend } from 'resend';

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return Response.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Dolce Atelier <onboarding@resend.dev>',
      to: process.env.RESEND_TO_EMAIL ? [process.env.RESEND_TO_EMAIL] : ['dolceatelier@gmail.com'],
      subject: `Contact Form: ${subject}`,
      reply_to: email,
      html: `
        <h1>New Contact Message</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}