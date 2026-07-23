export const dynamic = 'force-static';
import { NextResponse } from 'next/server';

const PAYPAL_API_BASE = (process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com').trim();
const PAYPAL_CLIENT_ID = (process.env.PAYPAL_CLIENT_ID || '').trim();
const PAYPAL_CLIENT_SECRET = (process.env.PAYPAL_CLIENT_SECRET || '').trim();

// Definimos los precios (en centavos USD)
const PRICES: Record<string, number> = {
  restaurante: 7500, // $75.00
  farmacia: 7500,    // $75.00
  panaderia: 7500,   // $75.00
  heladeria: 7500,    // $75.00
  almacen: 7500,     // $75.00
  all: 13000,         // $130.00 (Promo todos los módulos)
};

const NAMES: Record<string, string> = {
  restaurante: 'Licencia Módulo Restaurante',
  farmacia: 'Licencia Módulo Farmacia',
  panaderia: 'Licencia Módulo Panadería',
  heladeria: 'Licencia Módulo Heladería',
  almacen: 'Licencia Módulo Almacén/Negocio General',
  all: 'Paquete Completo CraftPOS (5 Módulos)',
};

async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('Faltan credenciales de PayPal (PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET)');
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    cache: 'no-store'
  });
  
  if (!response.ok) {
    const err = await response.text();
    console.error('Error obteniendo token de PayPal:', err);
    throw new Error('Error de autenticación con PayPal');
  }
  
  const data = await response.json();
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const { targetModule, email } = await req.json();

    if (!targetModule || !PRICES[targetModule]) {
      return NextResponse.json({ error: 'Módulo inválido' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal-capture?targetModule=${targetModule}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/promo?canceled=true`;

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: targetModule,
          amount: {
            currency_code: 'USD',
            value: (PRICES[targetModule] / 100).toFixed(2),
          },
          description: NAMES[targetModule],
        },
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        brand_name: 'CraftPOS',
      },
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderPayload),
      cache: 'no-store'
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('PayPal create order error:', err);
      throw new Error('Error al crear la orden en PayPal');
    }

    const orderData = await response.json();
    
    // Find the approval URL
    const approveLink = orderData.links?.find((link: any) => link.rel === 'approve');
    
    if (!approveLink) {
      throw new Error('No se recibió enlace de aprobación de PayPal');
    }

    return NextResponse.json({ url: approveLink.href });
  } catch (error: any) {
    console.error('Error Checkout:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
