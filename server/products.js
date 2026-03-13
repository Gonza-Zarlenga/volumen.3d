export const products = {
    'duna': {
        id: 'duna',
        name: 'Duna',
        price: 32000,
        category: 'Iluminación',
        desc: 'Esta lámpara destaca por su diseño geométrico y audaz, ideal para quienes buscan una pieza de acento con personalidad. Su estructura se basa en formas orgánicas apiladas que recuerdan a un estilo space-age moderno.',
        material: 'PETG + PLA',
        time: '12H 28M',
        dims: '21 x 13 cm',
        code: 'VOL 0.1',
        images: ['/products/DUNA_1.jpg', '/products/duna_7.jpg', '/products/DUNA_3.jpg', '/products/DUNA_4.jpg'],
        colors: ['Naranja', 'Verde Militar'],
        hasLamp: true
    },
    'nexsus': {
        id: 'nexsus',
        name: 'Nexsus',
        price: 30000,
        category: 'Iluminación',
        desc: 'Nexsus es la pieza perfecta para quienes buscan algo diferente pero sencillo.',
        material: 'PETG',
        time: '08H 38M',
        dims: '18,5 x 18 cm',
        code: 'VOL O.2',
        images: ['/products/nexsus_5.JPG', '/products/nexsus_3.jpg'],
        colors: ['Blanco'],
        hasLamp: true
    },
    'eilish': {
        id: 'eilish',
        name: 'Eilish',
        price: 60000,
        category: 'Iluminación',
        desc: 'Eilish es moderna, es diferente y tiene ese look tecnológico-orgánico que solo el diseño en 3D puede lograr',
        material: 'PETG + PLA',
        time: '07H 21M',
        dims: '27 x 20 cm',
        code: 'VOL 0.3',
        images: ['/products/eilish_4.jpg', '/products/Eilish_1.jpg'],
        colors: ['Blanco', 'Azul Mate'],
        hasLamp: true
    },
    'classic': {
        id: 'classic',
        name: 'Classic',
        price: 30000,
        category: 'Iluminación',
        desc: 'Textura orgánica generativa. Impermeable y resistente al impacto.',
        material: 'PETG + PLA',
        time: '05H 46M',
        dims: '24 x 18 cm',
        code: 'VOL 0.4',
        images: ['/products/Classic_3.jpg', '/products/Classic_1.jpg', '/products/Classic_2.jpg'],
        colors: ['Blanco Mate', "Beige"],
        hasLamp: true
    }
};

export const lampTypes = [
    { id: 'standard', name: 'LED Standard', price: 0 },
    { id: 'filamento', name: 'LED Filamento', price: 2940 },
    { id: 'rgb', name: 'LED RGB + Control', price: 16828 }
];

export const bestSellers = ['duna', 'nexsus', 'lava'];
