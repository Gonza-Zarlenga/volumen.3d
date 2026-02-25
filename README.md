# VOLUMEN | ORIGEN 3D

Laboratorio de diseño y producción 3D enfocado en la síntesis entre forma y función industrial.

## Descripción

Sistemas de iluminación y objetos decorativos. Ingeniería aplicada a la estética de la fabricación aditiva. Este proyecto incluye una integración completa con Mercado Pago para el procesamiento de pagos.

## Stack Tecnológico

- **Frontend:** HTML, CSS (Tailwind), React, Vite.
- **Backend:** Node.js, Express (para integración de pagos).
- **Pagos:** Mercado Pago SDK v2 (Checkout Pro).

## Instalación y Configuración Local

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repositorio>
    cd zp
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz basado en `.env.example` y agrega tu `MP_ACCESS_TOKEN`.
    ```env
    PORT=3001
    MP_ACCESS_TOKEN=tu_access_token_aqui
    ```

4.  **Configurar la llave pública:**
    En `index.html`, reemplaza la Public Key de Mercado Pago por la tuya.

5.  **Correr el proyecto:**
    - En una terminal: `npm run dev` (Frontend).
    - En otra terminal: `npm run server` (Backend de pagos).

## Licencia

Todos los derechos reservados - VOLUMEN / ORIGEN 3D.
