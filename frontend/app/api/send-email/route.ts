import { Resend } from 'resend';

/**
 * API Route: /api/send-email
 * 
 * Sends emails using Resend API.
 * 
 * IMPORTANT RESEND LIMITATION (Development Mode):
 * - Resend in development/test mode only allows sending emails TO the email address 
 *   that owns the Resend API key (the account holder's verified email).
 * - All emails sent via this endpoint will be delivered to RESEND_TO_EMAIL 
 *   (defaults to the account owner's email).
 * - The "reply_to" field is set to the form submitter's email, so replies 
 *   will go to the correct person.
 * 
 * WHY CAN'T WE SEND TO ARBITRARY ADDRESSES?
 * - Resend requires domain verification to send emails to arbitrary recipients.
 * - Without a verified domain (e.g., @dolceatelier.com), Resend restricts 
 *   deliveries to the account owner's email only.
 * - This is a Resend security measure to prevent spam abuse.
 * 
 * TO ENABLE FULL FUNCTIONALITY:
 * 1. Verify your domain in Resend (https://resend.com/domains)
 * 2. Update the "from" field to use your verified domain
 * 3. Then you can send to any email address (e.g., dolceatelier@gmail.com)
 */
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
