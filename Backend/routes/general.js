const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

// Contact form submission
router.post('/contact', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, message } = req.body;

        // Configure nodemailer with your email service
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: `Library Contact Form - Message from ${name}`,
            text: `
Name: ${name}
Email: ${email}
Message: ${message}
            `,
            html: `
<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Message:</strong></p>
<p>${message}</p>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error in contact form:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
});

// Get library information
router.get('/about', async (req, res) => {
    try {
        // You can store this in a database if it needs to be dynamic
        const libraryInfo = {
            name: 'University Library System',
            description: 'Our library system provides students and faculty with access to a vast collection of books and resources.',
            features: [
                'Online book borrowing system',
                'New book request system',
                'Digital catalog',
                'Student and admin portals'
            ],
            contact: {
                email: process.env.CONTACT_EMAIL,
                phone: process.env.CONTACT_PHONE,
                address: process.env.LIBRARY_ADDRESS
            },
            hours: {
                weekdays: '8:00 AM - 8:00 PM',
                weekends: '10:00 AM - 6:00 PM',
                holidays: 'Closed on major holidays'
            }
        };

        res.json(libraryInfo);
    } catch (error) {
        console.error('Error fetching library info:', error);
        res.status(500).json({ message: 'Error fetching library information' });
    }
});

module.exports = router; 