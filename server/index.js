import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import path from 'path';
import { fileURLToPath } from 'url';
import { products as serverProducts } from './products.js';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Configuración de CORS para permitir peticiones desde local y producción
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'https://volumen-3d.onrender.com'
    ],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../')));

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Función para enviar email de pedido
async function sendOrderEmail(customer, items, total, method) {
    const itemsHtml = items.map(item => `
        <li style="margin-bottom: 10px;">
            <strong>${item.title}</strong> x${item.quantity}<br>
            Color: ${item.color || 'N/A'}<br>
            Precio Unitario: $${item.unit_price.toLocaleString()}
        </li>
    `).join('');

    const mailOptions = {
        from: `"VOLUMEN Orders" <${process.env.SMTP_USER}>`,
        to: process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER,
        subject: `Nuevo Pedido: ${method} - ${customer.name}`,
        html: `
            <div style="font-family: sans-serif; color: #333;">
                <h2>Nuevo Pedido Recibido</h2>
                <p><strong>Método de Pago:</strong> ${method}</p>
                <hr>
                <h3>Datos del Cliente:</h3>
                <p>
                    Nombre: ${customer.name}<br>
                    Email: ${customer.email}<br>
                    Teléfono: ${customer.phone || 'No especificado'}<br>
                    Dirección: ${customer.address}, ${customer.city} (${customer.zip})
                </p>
                <hr>
                <h3>Productos:</h3>
                <ul>${itemsHtml}</ul>
                <p><strong>Total: ${total}</strong></p>
                <hr>
                <p style="font-size: 12px; color: #666;">Este es un mensaje automático del sistema de VOLUMEN.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email enviado con éxito para el pedido de ${customer.name}`);
    } catch (error) {
        console.error('Error enviando email:', error);
    }
}

// Configuración de Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

app.post('/create_preference', async (req, res) => {
    try {
        const { items, customer } = req.body;

        const validatedItems = items.map(item => {
            const productId = item.id || item.cartId.split('-')[0];
            const realProduct = serverProducts[productId];

            if (!realProduct) {
                throw new Error(`Producto no encontrado: ${productId}`);
            }

            return {
                id: productId,
                title: realProduct.name,
                quantity: Number(item.qty),
                unit_price: Number(realProduct.price),
                currency_id: 'ARS',
                // Pasamos el color para que MP lo guarde si es necesario o para recuperarlo en el webhook
                description: `Color: ${item.color || 'N/A'}`,
                color: item.color // Este campo no es estándar de MP pero lo usamos en metadata
            };
        });

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        const baseUrl = `${protocol}://${host}`;

        const body = {
            items: validatedItems.map(i => ({
                id: i.id,
                title: i.title,
                quantity: i.quantity,
                unit_price: i.unit_price,
                currency_id: i.currency_id,
                description: i.description
            })),
            back_urls: {
                success: `${baseUrl}?status=success`,
                failure: `${baseUrl}?status=failure`,
                pending: `${baseUrl}?status=pending`,
            },
            // Metadata crucial para el webhook
            metadata: {
                customer: customer,
                items: validatedItems.map(i => ({
                    title: i.title,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    color: i.color
                }))
            }
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        res.json({ id: result.id });
    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(400).json({
            error: 'Error al validar productos o crear preferencia',
            details: error.message || error
        });
    }
});

// Ruta para confirmar transferencia
app.post('/confirm_transfer', async (req, res) => {
    try {
        const { items, customer, total } = req.body;

        // Generar un ID de orden corto para referencia
        const orderId = `VL-${Math.floor(1000 + Math.random() * 9000)}`;

        // Validación básica de productos de nuevo por seguridad
        const validatedItems = items.map(item => {
            const productId = item.id;
            const realProduct = serverProducts[productId];
            return {
                title: realProduct ? realProduct.name : item.name,
                quantity: item.qty,
                unit_price: realProduct ? realProduct.price : item.price,
                color: item.color
            };
        });

        await sendOrderEmail(customer, validatedItems, total, 'Transferencia Bancaria');
        res.json({ status: 'ok', orderId: orderId });
    } catch (error) {
        console.error('Error en transferencia:', error);
        res.status(500).json({ error: 'Error al procesar el pedido' });
    }
});

// Webhook de Mercado Pago
app.post('/webhook', async (req, res) => {
    const { query } = req;
    const topic = query.topic || query.type;

    try {
        if (topic === 'payment') {
            const paymentId = query.id || req.body.data.id;

            // Aquí deberías consultar MP para obtener los detalles del pago usando el ID
            // fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } })
            // Por ahora asumimos que el pago fue exitoso si llega al webhook (en prod validar status === 'approved')

            // IMPORTANTE: Para obtener la metadata, necesitas buscar la preferencia o el pago.
            // Para fines de este MVP, lo dejaremos como estructura para cuando el usuario despliegue.

            console.log(`Webhook recibido para pago ${paymentId}`);
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
});

// NUEVO: Ruta "Catch-all" para manejar el index.html
// Opción con Expresión Regular pura (muy robusta)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(port, () => {
    console.log(`Server running at port: ${port}`);
});