import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { products as serverProducts, bestSellers, lampTypes } from './products.js';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Configuración de CORS robusta
app.use(cors({
    origin: '*', // Permitir todo por ahora para asegurar funcionamiento en Render
    methods: ['GET', 'POST'],
    credentials: true
}));
console.log("CORS habilitado.");
app.use(express.json());

// Servir archivos estáticos
// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public'))); // Primero public para las imágenes
app.use(express.static(path.join(__dirname, '../'))); // Luego la raíz para index.html

// NUEVO: Ruta para obtener productos y mas vendidos
app.get('/api/products', (req, res) => {
    res.json({ products: serverProducts, bestSellers, lampTypes });
});

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
async function sendOrderEmail(customer, items, total, method, orderId, approvalLink = null) {
    const itemsHtml = items.map(item => `
        <li style="margin-bottom: 10px;">
            <strong>${item.title}</strong> x${item.quantity}<br>
            Color: ${item.color || 'N/A'}<br>
            Precio Unitario: $${item.unit_price.toLocaleString()}
        </li>
    `).join('');

    let approvalHtml = '';
    if (approvalLink) {
        approvalHtml = `
            <div style="text-align: center; margin: 30px 0; background-color: #f8f8f8; padding: 20px; border-radius: 8px;">
                <h3 style="margin-top:0; color:#333;">Acción Requerida</h3>
                <p style="margin-bottom:20px;">Cuando el pedido esté pagado y en producción, aprúebalo para avisarle al cliente.</p>
                <a href="${approvalLink}" style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block; font-size:16px;">APROBAR PEDIDO Y AVISAR AL CLIENTE</a>
                <p style="font-size: 11px; color: #666; margin-top: 15px;">Esta acción enviará automáticamente el correo de "Pago Exitoso" a ${customer.email}.</p>
            </div>
            <hr>
        `;
    }

    const mailOptions = {
        from: `"VOLUMEN Orders" <${process.env.SMTP_USER}>`,
        to: process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER,
        subject: `Nuevo Pedido: ${method} - ${customer.name} (#${orderId})`,
        html: `
            <div style="font-family: sans-serif; color: #333; max-width:600px; margin:0 auto;">
                <h2>Nuevo Pedido Recibido</h2>
                <p><strong>Método de Pago:</strong> ${method}</p>
                <p><strong>Orden ID:</strong> #${orderId}</p>
                <hr>
                ${approvalHtml}
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
        console.error('Error enviando email interno:', error);
        throw error;
    }
}

// NUEVO: Email al cliente: Pago Pendiente
async function sendCustomerPendingEmail(customer, items, total, method, orderId) {
    const itemsHtml = items.map(item => `
        <li style="margin-bottom: 10px;">
            <strong>${item.title}</strong> x${item.quantity}<br>
            Color: ${item.color || 'N/A'}<br>
            Precio Unitario: $${item.unit_price.toLocaleString()}
        </li>
    `).join('');

    let manualInstructions = '';
    if (method === 'Transferencia Bancaria') {
        manualInstructions = `
            <div style="background-color: #f8f8f8; padding: 15px; margin: 20px 0; border-left: 4px solid #e2892a;">
                <h4 style="margin-top: 0; color: #e2892a; text-transform: uppercase;">Importante</h4>
                <p style="margin-bottom: 0;">Recuerda enviar el comprobante de transferencia al alias <strong>VOLUMEN.ORIGEN.3D</strong> respondiendo a este correo o mediante WhatsApp para que podamos confirmar tu pedido.</p>
            </div>
        `;
    }

    const mailOptions = {
        from: `"VOLUMEN" <${process.env.SMTP_USER}>`,
        to: customer.email,
        subject: `Tu pedido en VOLUMEN está en proceso (#${orderId})`,
        html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
                <h2 style="text-transform: uppercase; font-weight: 900; letter-spacing: -1px; margin-top: 0;">VOLUMEN <span style="font-weight: 300; opacity: 0.5;">/ ORIGEN 3D</span></h2>
                <h3 style="margin-top: 30px;">Hola ${customer.name},</h3>
                <p>Hemos recibido tu pedido <strong>#${orderId}</strong> con éxito y está en proceso de verificación de pago mediante <strong>${method}</strong>.</p>
                
                ${manualInstructions}

                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <h3 style="text-transform: uppercase; font-size: 14px;">Resumen del Pedido:</h3>
                <ul style="padding-left: 20px;">${itemsHtml}</ul>
                <p><strong>Total: ${total}</strong></p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <p style="font-size: 12px; color: #666; text-align: center; margin-bottom: 0;">Gracias por elegir el diseño local.<br>VOLUMEN | ORIGEN 3D</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email de PENDIENTE enviado al cliente: ${customer.email}`);
    } catch (error) {
        console.error('Error enviando email al cliente (Pendiente):', error);
        throw error;
    }
}

// NUEVO: Email al cliente: Pago Confirmado Exitoso
async function sendCustomerSuccessEmail(customer, items, total, orderId) {
    const itemsHtml = items.map(item => `
        <li style="margin-bottom: 10px;">
            <strong>${item.title}</strong> x${item.quantity}<br>
            Color: ${item.color || 'N/A'}<br>
            Precio Unitario: $${item.unit_price.toLocaleString()}
        </li>
    `).join('');

    const mailOptions = {
        from: `"VOLUMEN" <${process.env.SMTP_USER}>`,
        to: customer.email,
        subject: `¡Pago Confirmado! Tu pedido de VOLUMEN está en marcha (#${orderId})`,
        html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
                <h2 style="text-transform: uppercase; font-weight: 900; letter-spacing: -1px; margin-top: 0;">VOLUMEN <span style="font-weight: 300; opacity: 0.5;">/ ORIGEN 3D</span></h2>
                <h3 style="margin-top: 30px;">¡Hola ${customer.name}!</h3>
                <p>Te confirmamos que hemos recibido tu pago correspondiente al pedido <strong>#${orderId}</strong> correctamente.</p>
                
                <div style="background-color: #000; color: #fff; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; text-transform: uppercase; font-size: 11px; font-weight: bold; letter-spacing: 2px;">Estado: Producción Iniciada</p>
                    <p style="margin-top: 5px; margin-bottom: 0; font-size: 13px;">Tus piezas acaban de entrar al laboratorio de impresión 3D. Te avisaremos cuando el envío esté listo.</p>
                </div>

                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <h3 style="text-transform: uppercase; font-size: 14px;">Resumen del Pedido:</h3>
                <ul style="padding-left: 20px;">${itemsHtml}</ul>
                <p><strong>Total Abonado: ${total}</strong></p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <p style="font-size: 12px; color: #666; text-align: center; margin-bottom: 0;">Gracias por apoyar el diseño local.<br>VOLUMEN | ORIGEN 3D</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email de ÉXITO enviado al cliente: ${customer.email}`);
    } catch (error) {
        console.error('Error enviando email al cliente (Éxito):', error);
        throw error;
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
            // NUEVO: Bypass estructural para el costo de envío
            if (item.id === 'SHIPPING-01') {
                return {
                    id: item.id,
                    title: item.name,
                    quantity: 1,
                    unit_price: Number(item.price),
                    currency_id: 'ARS',
                    description: 'Costo de envío estándar',
                    color: 'N/A'
                };
            }

            const productId = item.id || item.cartId.split('-')[0];
            const realProduct = serverProducts[productId];

            if (!realProduct) {
                throw new Error(`Producto no encontrado: ${productId}`);
            }

            // Calcular precio unitario base + extra de la lámpara si aplica
            let finalPrice = Number(realProduct.price);
            if (item.lamp && item.lamp !== 'N/A') {
                const lampTypeInfo = lampTypes.find(l => l.name === item.lamp);
                if (lampTypeInfo) {
                    finalPrice += Number(lampTypeInfo.price);
                }
            }

            return {
                id: productId,
                title: `${realProduct.name} ${item.lamp && item.lamp !== 'N/A' ? `(+ ${item.lamp})` : ''}`,
                quantity: Number(item.qty),
                unit_price: Number(finalPrice),
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
            auto_return: "approved",
            // NUEVO: URL donde Mercado Pago enviará las notificaciones de pago (Webhook)
            notification_url: `${baseUrl}/webhook`,
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

        // Devolvemos tanto el ID como el init_point (URL de cobro)
        res.json({
            id: result.id,
            init_point: result.init_point
        });
    } catch (error) {
        // Logging detallado del error de Mercado Pago
        console.error('--- ERROR DETALLADO AL CREAR PREFERENCIA ---');
        console.error(error.message);
        if (error.cause) console.error('CAUSA:', error.cause);
        if (error.response) console.error('MP RESPONSE:', error.response);
        console.error('--------------------------------------------');

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
            // NUEVO: Bypass para el costo de envío
            if (item.id === 'SHIPPING-01') {
                return {
                    id: item.id,
                    title: item.name,
                    quantity: 1,
                    unit_price: Number(item.price),
                    color: 'N/A'
                };
            }

            const productId = item.id;
            const realProduct = serverProducts[productId];
            return {
                title: realProduct ? realProduct.name : item.name,
                quantity: item.qty,
                unit_price: realProduct ? realProduct.price : item.price,
                color: item.color
            };
        });

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        const baseUrl = `${protocol}://${host}`;
        const approvalLink = `${baseUrl}/api/approve_order/${orderId}`;

        // Guardar temporalmente en pending_orders.json
        try {
            const pendingFile = await fs.readFile(path.join(__dirname, 'pending_orders.json'), 'utf-8').catch(() => '{}');
            const pendingOrders = JSON.parse(pendingFile);
            pendingOrders[orderId] = { customer, items: validatedItems, total };
            await fs.writeFile(path.join(__dirname, 'pending_orders.json'), JSON.stringify(pendingOrders, null, 2));
        } catch (e) {
            console.error('Error guardando orden pendiente:', e);
        }

        // Email interno (con botón de aprobar)
        await sendOrderEmail(customer, validatedItems, total, 'Transferencia Bancaria', orderId, approvalLink);
        // NUEVO: Enviar mail pendiente al cliente
        await sendCustomerPendingEmail(customer, validatedItems, total, 'Transferencia Bancaria', orderId);

        res.json({ status: 'ok', orderId: orderId });
    } catch (error) {
        console.error('--- ERROR EN TRANSFERENCIA BANCARIA ---');
        console.error(error);
        console.error('---------------------------------------');
        res.status(500).json({ error: 'Error al procesar el pedido o enviar correos' });
    }
});

// Webhook de Mercado Pago
app.post('/webhook', async (req, res) => {
    const { query } = req;
    const topic = query.topic || query.type;

    try {
        if (topic === 'payment') {
            const paymentId = query.id || req.body.data.id;

            // Consultar detalles del pago desde MP
            const paymentAPI = new Payment(client);
            const paymentDetails = await paymentAPI.get({ id: paymentId });

            if (paymentDetails.status === 'approved') {
                const metadata = paymentDetails.metadata;
                if (metadata && metadata.customer && metadata.items) {
                    const total = paymentDetails.transaction_amount;
                    const orderId = `VL-${paymentId.toString().slice(-4)}`;

                    const protocol = req.headers['x-forwarded-proto'] || 'http';
                    const host = req.headers.host;
                    const baseUrl = `${protocol}://${host}`;
                    const approvalLink = `${baseUrl}/api/approve_order/${orderId}`;

                    // Guardar en pending_orders.json
                    try {
                        const pendingFile = await fs.readFile(path.join(__dirname, 'pending_orders.json'), 'utf-8').catch(() => '{}');
                        const pendingOrders = JSON.parse(pendingFile);
                        pendingOrders[orderId] = { customer: metadata.customer, items: metadata.items, total: `$${total}` };
                        await fs.writeFile(path.join(__dirname, 'pending_orders.json'), JSON.stringify(pendingOrders, null, 2));
                    } catch (e) {
                        console.error('Error guardando orden pendiente MP:', e);
                    }

                    // Aviso interno para ti CON BOTÓN DE APROBACIÓN MANAUL
                    // NOTA: Eliminamos la confirmación automática al cliente de aquí.
                    await sendOrderEmail(metadata.customer, metadata.items, `$${total}`, 'Mercado Pago (Aprobado)', orderId, approvalLink);
                }
            }

            console.log(`Webhook recibido y procesado para pago ${paymentId} (Estado: ${paymentDetails.status})`);
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('--- ERROR EN WEBHOOK ---');
        console.error('Query original:', req.query);
        console.error('Body original:', req.body);
        console.error('Detalle del error:', error);
        console.error('------------------------');
        res.sendStatus(500);
    }
});

// NUEVO: Ruta para aprobar pedido manualmente desde el email
app.get('/api/approve_order/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const pendingFile = await fs.readFile(path.join(__dirname, 'pending_orders.json'), 'utf-8').catch(() => '{}');
        const pendingOrders = JSON.parse(pendingFile);

        if (!pendingOrders[orderId]) {
            return res.status(404).send(`
                <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #dc3545;">Error</h1>
                    <p>El pedido <strong>#${orderId}</strong> no fue encontrado o ya ha sido aprobado anteriormente.</p>
                </div>
            `);
        }

        const data = pendingOrders[orderId];

        // Enviar email de éxito al cliente
        await sendCustomerSuccessEmail(data.customer, data.items, data.total, orderId);

        // Borrar de pedidos pendientes
        delete pendingOrders[orderId];
        await fs.writeFile(path.join(__dirname, 'pending_orders.json'), JSON.stringify(pendingOrders, null, 2));

        res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f8f9fa; min-height: 100vh;">
                <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                    <h1 style="color: #28a745; margin-top: 0;">¡Pedido Aprobado!</h1>
                    <p style="font-size: 18px;">El pedido <strong>#${orderId}</strong> ha sido confirmado.</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666;">El cliente <strong>${data.customer.email}</strong> acaba de recibir el correo automático confirmando que el pedido pasó a producción y que pronto será enviado.</p>
                    <a href="/" style="color: #007bff; text-decoration: none; font-weight: bold; margin-top: 20px; display: inline-block;">Volver a la tienda</a>
                </div>
            </div>
        `);
    } catch (error) {
        console.error('Error aprobando pedido:', error);
        res.status(500).send('Error interno del servidor intentando aprobar el pedido.');
    }
});

// NUEVO: Ruta "Catch-all" para manejar el index.html
// Opción con Expresión Regular pura (muy robusta)
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});


app.listen(port, () => {
    console.log(`Server running at port: ${port}`);
});