export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

// Helper para generar una licencia aleatoria
function generateLicenseKey(modulePrefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${modulePrefix.toUpperCase()}-${randomPart}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const transactionId = url.searchParams.get('id'); // Wompi Transaction ID
    const targetModule = url.searchParams.get('moduleType');

    if (!transactionId || !targetModule) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/promo?error=missing_wompi_data`);
    }

    // Determinar entorno de Wompi según la llave pública
    const pubKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '';
    const isProd = pubKey.startsWith('pub_prod_');
    const wompiApiBase = isProd ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1';

    // 1. Verificar estado de la transacción en Wompi
    const txResponse = await fetch(`${wompiApiBase}/transactions/${transactionId}`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!txResponse.ok) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/promo?error=wompi_api_error`);
    }

    const txData = await txResponse.json();
    const status = txData.data?.status;

    if (status === 'APPROVED') {
      // 2. Extraer el email del cliente
      const payerEmail = txData.data?.customer_email || 'cliente@craftpos.com';

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
            stripe_session_id: transactionId, // Usamos el id de wompi para el rastreo
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
            subject: '¡Tus Licencias de CraftPOS están listas!',
            html: `
              <h1>¡Gracias por tu compra en CraftPOS!</h1>
              <p>El pago con Wompi fue aprobado exitosamente. Aquí están tus claves de licencia:</p>
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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/gracias?session_id=${transactionId}`);
    } else {
      console.warn('Wompi transaction not approved:', status);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/promo?error=payment_not_approved`);
    }
  } catch (error) {
    console.error('Error in Wompi capture:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/promo?error=internal_error`);
  }
}
