import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MercadoPagoConfig, Preference } from 'mercadopago';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Configuración de Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

app.post('/create_preference', async (req, res) => {
    try {
        const { items } = req.body;

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        const baseUrl = `${protocol}://${host.includes('localhost') ? 'localhost:5173' : host}`;

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
