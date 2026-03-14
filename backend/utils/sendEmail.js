import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Determine the transporter to use
    let transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        // Use standard SMTP configuration if provided in .env
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Fallback or Test Mode: Ethereal Email (Auto-generates dummy creds)
        console.log("No SMTP settings configured in .env. Falling back to Ethereal Mail for testing...");
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }

    const message = {
        from: `${process.env.FROM_NAME || 'CoreInventory Admin'} <${process.env.FROM_EMAIL || 'noreply@coreinventory.local'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    const info = await transporter.sendMail(message);

    console.log("Message sent: %s", info.messageId);

    // If using Ethereal, log the preview URL in the console so it's clickable
    if (!process.env.SMTP_HOST) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
};

export default sendEmail;
