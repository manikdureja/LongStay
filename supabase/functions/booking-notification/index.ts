import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { booking, hostEmail, renterEmail } = await req.json()

  const sendEmail = async (to: string, subject: string, html: string) => {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'LongStay <noreply@longstay.app>', to, subject, html }),
    })
  }

  // Email to host
  await sendEmail(
    hostEmail,
    `New booking request for ${booking.property_title}`,
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #f59e0b; margin: 0; font-size: 20px;">🏠 New Booking Request</h1>
      </div>
      <div style="background: #fff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
        <p style="color: #64748b;">You have a new booking request for:</p>
        <h2 style="color: #0f172a;">${booking.property_title}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Renter</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${booking.renter_name}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Lease</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${booking.lease_months} months</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Start date</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${booking.start_date}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Total amount</td><td style="padding: 8px 0; font-weight: 700; color: #f59e0b; text-align: right;">$${booking.total_amount?.toLocaleString()}</td></tr>
        </table>
        ${booking.message ? `<div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 16px;"><p style="color: #64748b; margin: 0 0 4px; font-size: 12px;">Message from renter:</p><p style="color: #0f172a; margin: 0;">${booking.message}</p></div>` : ''}
        <a href="https://longstay.vercel.app/host/dashboard" style="display: inline-block; margin-top: 20px; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View booking request →</a>
      </div>
    </div>
    `
  )

  // Email to renter
  await sendEmail(
    renterEmail,
    `Booking request sent for ${booking.property_title}`,
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #f59e0b; margin: 0; font-size: 20px;">✅ Booking Request Sent</h1>
      </div>
      <div style="background: #fff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
        <p style="color: #64748b;">Your booking request has been sent to the host. You'll hear back soon!</p>
        <h2 style="color: #0f172a;">${booking.property_title}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Lease duration</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${booking.lease_months} months</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Start date</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${booking.start_date}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Total amount</td><td style="padding: 8px 0; font-weight: 700; color: #f59e0b; text-align: right;">$${booking.total_amount?.toLocaleString()}</td></tr>
        </table>
        <a href="https://longstay.vercel.app/bookings" style="display: inline-block; margin-top: 20px; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View my bookings →</a>
      </div>
    </div>
    `
  )

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
