export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const PAYPAL_API_BASE = (process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com').trim();
const PAYPAL_CLIENT_ID = (process.env.PAYPAL_CLIENT_ID || '').trim();
const PAYPAL_CLIENT_SECRET = (process.env.PAYPAL_CLIENT_SECRET || '').trim();

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

// Helper para generar una licencia aleatoria
function generateLicenseKey(modulePrefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${modulePrefix.toUpperCase()}-${randomPart}`;
}

async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('Faltan credenciales de PayPal');
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
    throw new Error('Error getting PayPal access token');
  }
  const data = await response.json();
  return data.access_token;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token'); // PayPal Order ID
    const targetModule = url.searchParams.get('targetModule');

    if (!token || !targetModule) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/promo?error=missing_token`);
    }

    const accessToken = await getPayPalAccessToken();

    // 1. Capture the payment
    const captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store'
    });

    const captureData = await captureResponse.json();

    if (captureData.status === 'COMPLETED') {
      // 2. Extraer el email del pagador desde la respuesta de PayPal
      const payerEmail = captureData.payer?.email_address || 'comprador@paypal.com';

      // 3. Generar la licencia
      let modulesToGenerate = targetModule === 'all' 
        ? ['restaurante', 'farmacia', 'panaderia', 'heladeria', 'almacen']
        : [targetModule];

      const generatedLicenses = [];

      for (const mod of modulesToGenerate) {
        const key = generateLicenseKey(mod.substring(0, 4));
        
        // Guardar en Supabase
        const { error } = await supabaseAdmin
          .from('licenses')
          .insert({
            license_key: key,
            module: mod,
            buyer_email: payerEmail,
            stripe_session_id: token, // Usamos el token de PayPal en este campo para rastreo
          });

        if (error) {
          console.error(`Error insertando licencia para ${mod}:`, error);
        } else {
          generatedLicenses.push({ module: mod, key });
        }
      }

      // 4. Enviar correo con Resend
      if (generatedLicenses.length > 0) {
        try {
          await resend.emails.send({
            from: 'CraftPOS <licencias@craftpos.dev>',
            to: payerEmail,
            subject: '¡Tus Licencias de CraftPOS están listas (PayPal)!',
            html: `
              <h1>¡Gracias por tu compra en CraftPOS mediante PayPal!</h1>
              <p>Aquí están tus claves de licencia exclusivas:</p>
              <ul>
                ${generatedLicenses.map(l => `<li><strong>${l.module.toUpperCase()}:</strong> <code>${l.key}</code></li>`).join('')}
              </ul>
              <p>Instrucciones de Activación:</p>
              <ol>
                <li>Abre CraftPOS en tu computador.</li>
                <li>Ve a Configuración > Seguridad > Activar Licencia.</li>
                <li>Pega tu código (Recuerda que se vinculará para siempre a ese computador).</li>
              </ol>
            `,
          });
        } catch (emailError) {
          console.error('Error enviando correo con Resend:', emailError);
        }
      }

      // Redirigir al cliente a la página de gracias con el session_id
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/gracias?session_id=${token}`);
    } else {
      console.error('PayPal capture error:', captureData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/promo?error=capture_failed`);
    }
  } catch (error) {
    console.error('Error in PayPal capture:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/promo?error=internal_error`);
  }
}
