const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
      process.env.EMAIL_USER === 'email@gmail.com' ||
      process.env.EMAIL_PASS === 'app-password') {
    throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env file');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

router.post('/', async (req, res) => {
  try {
    const { name, email, company, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'Please fill in all required fields (name, email, subject, message)'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Please provide a valid email address'
      });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: 'reservehq911@gmail.com',
      subject: `ReserveHQ Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">ReserveHQ Contact Form</h1>
          </div>
          
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">New Contact Form Submission</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #374151; width: 120px;">Name:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1f2937;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Email:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1f2937;">${email}</td>
                </tr>
                ${company ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Company:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1f2937;">${company}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Subject:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1f2937;">${subject}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; color: #374151; vertical-align: top;">Message:</td>
                  <td style="padding: 10px 0; color: #1f2937; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</td>
                </tr>
              </table>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #e0f2fe; border-radius: 8px; border-left: 4px solid #0288d1;">
              <p style="margin: 0; color: #01579b; font-size: 14px;">
                <strong>Reply to:</strong> ${email}<br>
                <strong>Sent from:</strong> ReserveHQ Contact Form<br>
                <strong>Time:</strong> ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
          
          <div style="background: #1e293b; padding: 20px; text-align: center;">
            <p style="color: #94a3b8; margin: 0; font-size: 14px;">
              This email was sent from the ReserveHQ contact form.
            </p>
          </div>
        </div>
      `,
      text: `
ReserveHQ Contact Form Submission

Name: ${name}
Email: ${email}
${company ? `Company: ${company}` : ''}
Subject: ${subject}

Message:
${message}

---
Reply to: ${email}
Sent: ${new Date().toLocaleString()}
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Message sent successfully!'
    });

  } catch (error) {
    console.error('Error sending email:', error);

    if (error.message && error.message.includes('Email credentials not configured')) {
      res.status(500).json({
        error: 'Email service is not configured. Please contact the administrator.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } else {
      res.status(500).json({
        error: 'Failed to send message. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

module.exports = router;
