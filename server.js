/* ========================================
   FROMINVEST AG – Lead Generation Backend
   Production-Ready Node.js Server
   ======================================== */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '10kb' }));

// Serve static files (index.html, style.css, app.js, etc.)
app.use(express.static(path.join(__dirname)));

// ─── RATE LIMITER (Simple In-Memory) ──────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5;            // max 5 requests per minute per IP

function rateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record) {
        rateLimitMap.set(ip, { count: 1, firstRequest: now });
        return next();
    }

    if (now - record.firstRequest > RATE_LIMIT_WINDOW) {
        // Reset window
        rateLimitMap.set(ip, { count: 1, firstRequest: now });
        return next();
    }

    if (record.count >= RATE_LIMIT_MAX) {
        console.warn(`⚠️ Rate limit exceeded for IP: ${ip}`);
        return res.status(429).json({
            success: false,
            message: 'Zu viele Anfragen. Bitte versuchen Sie es in einer Minute erneut.'
        });
    }

    record.count++;
    return next();
}

// Clean up rate limit map every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (now - record.firstRequest > RATE_LIMIT_WINDOW * 2) {
            rateLimitMap.delete(ip);
        }
    }
}, 5 * 60 * 1000);

// ─── EMAIL VALIDATION ─────────────────────────────────────────────────────────
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && emailRegex.test(email) && email.length <= 254;
}

// ─── LEADS STORAGE ────────────────────────────────────────────────────────────
const LEADS_FILE = path.join(__dirname, 'leads.json');

function loadLeads() {
    try {
        if (fs.existsSync(LEADS_FILE)) {
            const data = fs.readFileSync(LEADS_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.warn('⚠️ Could not read leads.json, starting fresh.');
    }
    return [];
}

function saveLead(firstName, lastName, email, phone) {
    const leads = loadLeads();
    const newLead = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
    };
    leads.push(newLead);
    try {
        fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
        console.log(`💾 Lead saved: ${email} (${firstName} ${lastName})`);
    } catch (e) {
        console.error('❌ Could not write leads.json:', e.message);
    }
    return newLead;
}

// ─── NODEMAILER TRANSPORTER ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify SMTP connection on startup
transporter.verify()
    .then(() => console.log('✅ SMTP connection verified successfully'))
    .catch(err => console.warn('⚠️ SMTP verification failed (emails may not send):', err.message));

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────
function getAdminEmailHTML(firstName, lastName, email, phone, date) {
    return `
    <!DOCTYPE html>
    <html lang="de">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f5f7; padding: 40px 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 100%); padding: 32px 40px;">
                <h1 style="margin: 0; color: #ffffff; font-size: 22px;">🔔 Neue Lead-Anfrage</h1>
            </div>
            <div style="padding: 32px 40px;">
                <p style="font-size: 16px; color: #2d3748; margin-bottom: 24px;">
                    Eine neue Anfrage wurde über die Frominvest AG Website eingereicht.
                </p>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 12px 16px; background: #f8f9fb; border-radius: 8px 0 0 0; font-weight: 600; color: #4a5568; font-size: 14px; border-bottom: 1px solid #ebedf0;">Vorname</td>
                        <td style="padding: 12px 16px; background: #f8f9fb; border-radius: 0 8px 0 0; color: #1a3a5c; font-size: 14px; border-bottom: 1px solid #ebedf0;">${firstName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 16px; font-weight: 600; color: #4a5568; font-size: 14px; border-bottom: 1px solid #ebedf0;">Nachname</td>
                        <td style="padding: 12px 16px; color: #1a3a5c; font-size: 14px; border-bottom: 1px solid #ebedf0;">${lastName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 16px; background: #f8f9fb; font-weight: 600; color: #4a5568; font-size: 14px; border-bottom: 1px solid #ebedf0;">E-Mail</td>
                        <td style="padding: 12px 16px; background: #f8f9fb; color: #1a3a5c; font-weight: 700; font-size: 16px; border-bottom: 1px solid #ebedf0;">${email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 16px; font-weight: 600; color: #4a5568; font-size: 14px; border-bottom: 1px solid #ebedf0;">Telefon</td>
                        <td style="padding: 12px 16px; color: #1a3a5c; font-size: 14px; border-bottom: 1px solid #ebedf0;">${phone}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 16px; background: #f8f9fb; border-radius: 0 0 0 8px; font-weight: 600; color: #4a5568; font-size: 14px;">Datum</td>
                        <td style="padding: 12px 16px; background: #f8f9fb; border-radius: 0 0 8px 0; color: #2d3748; font-size: 14px;">${date}</td>
                    </tr>
                </table>
                <hr style="margin: 24px 0; border: none; border-top: 1px solid #ebedf0;">
                <p style="font-size: 13px; color: #8a94a3;">
                    Diese E-Mail wurde automatisch vom Frominvest AG Lead-System generiert.
                </p>
            </div>
        </div>
    </body>
    </html>`;
}

function getUserResponseHTML(lastName) {
    return `
    <div id="editbody1" style="font-size: 10pt; font-family: Verdana,Geneva,sans-serif;">
<div style="font-size: 10pt; font-family: Verdana,Geneva,sans-serif;">
<div style="font-size: 10pt; font-family: Verdana,Geneva,sans-serif;">
<div style="font-size: 10pt; font-family: Verdana,Geneva,sans-serif;">
<div style="font-size: 10pt; font-family: Verdana,Geneva,sans-serif;">
<div id="v1v1v1v1v1editbody1" style="font-size: 10pt; font-family: Verdana,Geneva,sans-serif;">
<div id="v1v1v1v1v1v1editbody1" style="font-size: 10pt; font-family: Verdana,Geneva,sans-serif;">
<div id="v1v1v1v1v1v1v1editbody1" style="font-size: 10pt; font-family: Verdana,Geneva,sans-serif;">
<p>&nbsp;</p>
<div style="display: none; max-height: 0; overflow: hidden;">Frominvest AG &mdash; Professionelle Verm&ouml;gensverwaltung und attraktive Festgeld-L&ouml;sungen aus der Schweiz.</div>
<table style="background-color: #f4f5f7;" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="padding: 32px 16px;" align="center">
<table class="v1v1v1v1v1v1v1v1container" style="max-width: 600px; width: 100%;" width="600" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="padding: 0 0 32px 0;" align="center">
<table cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="background-color: #0f172a; border-radius: 12px; padding: 6px 12px;"><span style="color: #ffffff; font-size: 14px; font-weight: bold; font-family: 'Inter', Arial, sans-serif; letter-spacing: 0.5px;">FI</span></td>
<td style="padding-left: 12px;"><span style="color: #0f172a; font-size: 20px; font-weight: bold; font-family: 'Inter', Arial, sans-serif; letter-spacing: -0.5px;">Frominvest AG</span></td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px 16px 0 0; padding: 48px 40px 40px 40px; text-align: center;">
<h1 style="color: white; font-size: 32px; font-weight: bold; line-height: 40px; margin: 0 0 8px 0; font-family: 'Inter', Arial, sans-serif;">Festgeld-Anlagen</h1>
<h2 style="color: #c9a84c; font-size: 28px; font-weight: bold; line-height: 36px; margin: 0 0 20px 0; font-family: 'Inter', Arial, sans-serif;">mit Schweizer Qualit&auml;t</h2>
<p style="color: white; font-size: 16px; line-height: 26px; margin: 0 0 32px 0; font-family: 'Inter', Arial, sans-serif;">Frominvest AG bietet Ihnen professionelle Verm&ouml;gensverwaltung und attraktive Festgeld-L&ouml;sungen. Sicherheit, Transparenz und erstklassige Renditen &ndash; aus K&uuml;snacht.</p>
<table cellspacing="0" cellpadding="0" align="center">
<tbody>
<tr>
<td style="background-color: #c9a84c; border-radius: 8px;"><a style="display: inline-block; padding: 14px 32px; color: #0f172a; font-size: 14px; font-weight: 600; text-decoration: none; font-family: 'Inter', Arial, sans-serif; letter-spacing: 0.3px;" href="https://frominvest-ag.com/" target="_blank" rel="noopener noreferrer"> Jetzt Webseite besuchen &rarr; </a></td>
</tr>
</tbody>
</table>
</td>
</tr>
                <tr>
                    <td style="background-color: #ffffff; padding: 40px;">
<p><strong>Sehr geehrte(r) Frau/Herr ${lastName},</strong></p>
<p>w&auml;hrend herk&ouml;mmliche Sparprodukte oft kaum die Inflation ausgleichen, er&ouml;ffnen wir Ihnen heute einen Zugang, der &uuml;blicherweise ausschlie&szlig;lich Gro&szlig;investoren und Institutionen vorbehalten ist: <strong>Das Kollektiv-Festgeld.</strong></p>
<p><strong>Die Kraft der Gemeinschaft &ndash; Ihr Zinsvorteil</strong> Das Prinzip ist so einfach wie effektiv: Wir b&uuml;ndeln das Kapital ausgew&auml;hlter Mandanten zu einem leistungsstarken Anlagepool. Durch dieses hohe Gesamtvolumen verhandeln wir mit Top-Banken Zinss&auml;tze, die weit &uuml;ber den Konditionen f&uuml;r Einzelanleger liegen. Sie profitieren direkt von dieser Hebelwirkung.</p>
<p><strong>Ihre Sicherheit: Kompromisslos und bew&auml;hrt</strong> Trotz der &uuml;berdurchschnittlichen Rendite genie&szlig;en Sie <strong>alle Sicherheiten eines klassischen Festgelds</strong>. Ihr Kapital unterliegt dem vollen Schutz der <strong>EU-Einlagensicherung</strong>. Es gibt keinerlei versteckte Risiken oder Nachteile &ndash; lediglich eine feste Bindung f&uuml;r die Laufzeit.</p>
<p><strong>Maximale Rentabilit&auml;t durch Kostenfreiheit</strong> Wir haben dieses Modell so optimiert, dass Ihr Gewinn maximiert wird. Dank bestehender <strong>Doppelbesteuerungsabkommen (DBA)</strong> vermeiden wir jegliche Quellensteuer im Ausland.</p>
<ul>
<li>
<p><strong>Keine</strong> Kontoer&ouml;ffnungs- oder Kontof&uuml;hrungsgeb&uuml;hren.</p>
</li>
<li>
<p><strong>Keine</strong> Maklerprovisionen oder versteckten Kosten</p>
</li>
<li>
<p><strong>Reiner Ertrag:</strong> Lediglich die gesetzliche Kapitalertragsteuer auf die Zinsen f&auml;llt an.</p>
</li>
</ul>
<p><strong>Ihr Weg zur Premium-Anlage</strong> Im Anhang finden Sie die exklusive <strong>Rendite-Tabelle</strong>, die Ihnen schwarz auf wei&szlig; zeigt, wie viel mehr Ihr Kapital bei uns erwirtschaftet, sowie das Informationsblatt zur <br /><strong>EU-Einlagensicherung</strong>.</p>
<p><strong>So sichern Sie sich Ihren Platz im Kollektiv:</strong> Um an der aktuellen Platzierung teilzunehmen, senden Sie uns bitte den beigef&uuml;gten <strong>Anlageantrag</strong> ausgef&uuml;llt zusammen mit einer <strong>Kopie Ihres g&uuml;ltigen Ausweises oder Reisepasses</strong> zur&uuml;ck.</p>
<p>Nutzen Sie diese Gelegenheit, Ihr Verm&ouml;gen mit der Sicherheit einer Bankanlage, aber der Rendite eines Gro&szlig;investors wachsen zu lassen.</p>
<p>F&uuml;r ein pers&ouml;nliches Gespr&auml;ch zu den Details stehen wir Ihnen jederzeit gerne zur Verf&uuml;gung.</p>
<p>Mit freundlichen Gr&uuml;&szlig;en</p>
<p><strong>i. A. Sarah Weber</strong> <br />Kundenbetreuung &amp; Backoffice</p>
</td>
</tr>
<tr>
<td style="background-color: #0f172a; border-radius: 0 0 16px 16px; padding: 32px 40px;">
<table width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="padding-bottom: 20px;" align="center">
<table cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="background-color: rgba(255,255,255,0.15); border-radius: 8px; padding: 5px 10px;"><span style="color: #ffffff; font-size: 12px; font-weight: bold; font-family: 'Inter', Arial, sans-serif;">FI</span></td>
<td style="padding-left: 10px;"><span style="color: #ffffff; font-size: 16px; font-weight: bold; font-family: 'Inter', Arial, sans-serif;">Frominvest AG</span></td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td style="padding-bottom: 20px;" align="center">
<p style="color: rgba(255,255,255,0.6); font-size: 13px; line-height: 22px; margin: 0; font-family: 'Inter', Arial, sans-serif;">Kohlrainstrasse 10 &middot; 8700 K&uuml;snacht ZH &middot; Schweiz<br />Tel: +41 44 523 6389 <br />E-Mail: info@frominvest-ag.com</p>
</td>
</tr>
<tr>
<td style="padding-bottom: 20px;" align="center">
<div style="height: 1px; background-color: rgba(255,255,255,0.1); max-width: 200px; margin: 0 auto;">&nbsp;</div>
</td>
</tr>
<tr>
<td style="padding-bottom: 16px;" align="center">
<table class="v1v1v1v1v1v1v1v1footer-links" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td class="v1v1v1v1v1v1v1v1footer-link" style="padding: 0 12px;"><a style="color: #c9a84c; font-size: 13px; font-weight: 500; text-decoration: none; font-family: 'Inter', Arial, sans-serif;" href="https://frominvest-ag.com/" target="_blank" rel="noopener noreferrer"> Webseite </a></td>
<td class="v1v1v1v1v1v1v1v1footer-link" style="padding: 0 12px;"><a style="color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 500; text-decoration: none; font-family: 'Inter', Arial, sans-serif;" href="https://frominvest-ag.com/datenschutz" target="_blank" rel="noopener noreferrer">Datenschutz</a></td>
<td class="v1v1v1v1v1v1v1v1footer-link" style="padding: 0 12px;"><a style="color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 500; text-decoration: none; font-family: 'Inter', Arial, sans-serif;" href="https://frominvest-ag.com/impressum" target="_blank" rel="noopener noreferrer">Impressum</a></td>
</tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td align="center">
<p style="color: rgba(255,255,255,0.35); font-size: 11px; line-height: 18px; margin: 0; font-family: 'Inter', Arial, sans-serif;">&copy; 2026 Frominvest AG. Alle Rechte vorbehalten.<br />Handelsregister-Nr.: CH-020.3.037.471-4 &middot; UID: CHE-455.713.175</p>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>`;
}

// ─── API ENDPOINT: POST /api/lead ─────────────────────────────────────────────
app.post('/api/lead', rateLimit, async (req, res) => {
    const { firstName, lastName, email, phone } = req.body;

    // 1. Validate fields
    if (!firstName || !lastName || !email || !isValidEmail(email) || !phone) {
        return res.status(400).json({
            success: false,
            message: 'Bitte füllen Sie alle Felder korrekt aus.'
        });
    }

    // 2. Save lead to storage
    const lead = saveLead(firstName, lastName, email, phone);
    const currentDate = new Date().toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // 3. Send emails
    const emailPromises = [];

    // Admin notification email
    emailPromises.push(
        transporter.sendMail({
            from: `"Frominvest AG" <${process.env.SMTP_USER}>`,
            to: process.env.ADMIN_EMAIL || 'info@frominvest-ag.com',
            subject: `Neue Lead Anfrage: ${firstName} ${lastName}`,
            html: getAdminEmailHTML(firstName, lastName, email, phone, currentDate)
        }).catch(err => {
            console.error('❌ Admin email failed:', err.message);
        })
    );

    // User auto-response email (Commented out as per your last change, but kept template ready)
    /*
    emailPromises.push(
        transporter.sendMail({
            from: `"Frominvest AG" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Ihre Anfrage bei Frominvest AG',
            html: getUserResponseHTML(lastName)
        }).catch(err => {
            console.error('❌ User response email failed:', err.message);
        })
    );
    */

    // Wait for both emails (but don't fail the response if they error)
    await Promise.allSettled(emailPromises);

    console.log(`✅ Lead processed: ${email} at ${currentDate}`);

    // 4. Respond to frontend
    return res.status(200).json({
        success: true,
        message: 'Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet.'
    });
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        leads: loadLeads().length,
        timestamp: new Date().toISOString()
    });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 Frominvest AG Server running on http://localhost:${PORT}`);
    console.log(`📧 SMTP: ${process.env.SMTP_USER || '⚠️ NOT CONFIGURED (set SMTP_USER in .env)'}`);
    console.log(`📬 Admin: ${process.env.ADMIN_EMAIL || 'info@frominvest-ag.com'}`);
    console.log(`📁 Leads file: ${LEADS_FILE}\n`);
});
