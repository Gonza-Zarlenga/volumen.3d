import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// NUEVO: Servir archivos estáticos
// Esto busca el index.html en la carpeta raíz (un nivel arriba de /server)
app.use(express.static(path.join(__dirname, '../')));

// Configuración de Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

app.post('/create_preference', async (req, res) => {
    try {
        const { items } = req.body;

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        // Ajuste en baseUrl para que en Render apunte a la misma URL del servidor
        const baseUrl = `${protocol}://${host}`;

        const body = {
            items: items.map(item => ({
                id: item.id || item.cartId,
                title: item.name,
                quantity: Number(item.qty),
                unit_price: Number(item.price),
                currency_id: 'ARS',
            })),
            back_urls: {
                success: `${baseUrl}/?status=success`,
                failure: `${baseUrl}/?status=failure`,
                pending: `${baseUrl}/?status=pending`,
            },
            auto_return: 'approved',
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        res.json({
            id: result.id,
        });
    } catch (error) {
        console.error('Error creating preference detailed:', error);
        res.status(500).json({
            error: 'Error al crear la preferencia de pago',
            details: error.message || error
        });
    }
});

// NUEVO: Ruta "Catch-all" para manejar el index.html
// Esta es la línea que soluciona definitivamente el "Cannot GET /"
app.get('(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(port, () => {
    console.log(`Server running at port: ${port}`);
});