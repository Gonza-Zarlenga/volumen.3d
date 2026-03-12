import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function main() {
    try {
        await transporter.verify();
        console.log("SMTP Configurado Correctamente. Autenticación exitosa.");

        await transporter.sendMail({
            from: 'VOLUMEN Test <' + process.env.SMTP_USER + '>',
            to: process.env.SMTP_USER,
            subject: 'Test de Servidor NódemAiler',
            text: 'Si te llega esto, Nodemailer funciona perfecto.'
        });
        console.log("Correo de prueba mandado a " + process.env.SMTP_USER);
    } catch (e) {
        console.error("Error en SMTP:", e);
    }
}

main();
