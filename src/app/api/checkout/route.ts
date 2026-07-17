import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-06-24.dahlia' as any,
});

// Definimos los precios (pueden venir de la BD, pero los hardcodeamos por simplicidad)
const PRICES: Record<string, number> = {
  restaurante: 1200, // $12.00
  farmacia: 1500,    // $15.00
  panaderia: 1200,   // $12.00
  heladeria: 1800,    // $18.00
  almacen: 2000,     // $20.00
  all: 4900,         // $49.00 (Promo todos los módulos)
};

const NAMES: Record<string, string> = {
  restaurante: 'Licencia Módulo Restaurante',
  farmacia: 'Licencia Módulo Farmacia',
  panaderia: 'Licencia Módulo Panadería',
  heladeria: 'Licencia Módulo Heladería',
  almacen: 'Licencia Módulo Almacén/Negocio General',
  all: 'Paquete Completo CraftPOS (5 Módulos)',
};

export async function POST(req: Request) {
  try {
    const { targetModule, email } = await req.json();

    if (!targetModule || !PRICES[targetModule]) {
      return NextResponse.json({ error: 'Módulo inválido' }, { status: 400 });
    }

    // Crear la sesión de Checkout de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: NAMES[targetModule],
            },
            unit_amount: PRICES[targetModule],
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email, // Opcional, si lo pedimos antes
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/promo?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/promo?canceled=true`,
      metadata: {
        targetModule, // Pasamos el módulo en los metadatos para leerlo en el webhook
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creando sesión Stripe:', error);
    let errorMessage = error.message;
    if (errorMessage.includes('Invalid API Key provided') || errorMessage.includes('tu_llave_secreta_aqui')) {
      errorMessage = 'Falta configurar tu STRIPE_SECRET_KEY en el archivo .env.local. Coloca tu llave de prueba de Stripe para habilitar los pagos.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
