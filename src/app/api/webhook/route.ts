import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-06-24.dahlia' as any,
});

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Helper para generar una licencia aleatoria
function generateLicenseKey(modulePrefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${modulePrefix.toUpperCase()}-${randomPart}`;
}

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    if (!endpointSecret) throw new Error('No webhook secret configured');
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Manejar el evento de compra exitosa
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const targetModule = session.metadata?.targetModule;
    const customerEmail = session.customer_details?.email || 'unknown@email.com';

    if (targetModule) {
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
            buyer_email: customerEmail,
            stripe_session_id: session.id,
          });

        if (error) {
          console.error(`Error insertando licencia para ${mod}:`, error);
        } else {
          generatedLicenses.push({ module: mod, key });
        }
      }

      // Enviar correo con Resend
      if (generatedLicenses.length > 0) {
        try {
          await resend.emails.send({
            from: 'CraftPOS <licencias@craftpos.dev>', // Debe ser un dominio verificado en Resend
            to: customerEmail,
            subject: '¡Tus Licencias de CraftPOS están listas!',
            html: `
              <h1>¡Gracias por tu compra en CraftPOS!</h1>
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
          console.log(`Correo enviado exitosamente a ${customerEmail}`);
        } catch (emailError) {
          console.error('Error enviando correo con Resend:', emailError);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
