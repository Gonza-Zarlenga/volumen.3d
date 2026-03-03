import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargamos el .env desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyToken() {
    console.log('--- Verificando Token de Mercado Pago ---');
    const token = process.env.MP_ACCESS_TOKEN;

    if (!token) {
        console.error('❌ ERROR: No se encontró el token en el archivo .env');
        return;
    }
    console.log(`Largo del token detectado: ${token.length} caracteres`);

    try {
        // Fetch nativo compatible con Node 18+
        const response = await fetch('https://api.mercadopago.com/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ ¡Token Válido!');
            console.log('ID de Usuario:', data.id);
            console.log('Nombre de cuenta (Nickname):', data.nickname);
            console.log('Email de la cuenta:', data.email);
            console.log('País:', data.site_id);
            console.log('---');
            console.log('Validación exitosa. Los pagos llegarán a esta cuenta.');
        } else {
            console.error('❌ Token Inválido o Expirado.');
            console.log('Código de estado:', response.status);
            console.log('Cuerpo de la respuesta:', JSON.stringify(data, null, 2));
            console.log('\nPasos para arreglarlo:');
            console.log('1. Ve al panel de Mercado Pago Developers.');
            console.log('2. Copia el "Access Token" de producción (APP_USR-...).');
            console.log('3. Pégalo en tu archivo .env');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
}

verifyToken();
