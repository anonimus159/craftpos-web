import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { license_key, machine_id } = await req.json();

    if (!license_key || !machine_id) {
      return NextResponse.json({ error: 'Licencia y Machine ID son requeridos' }, { status: 400 });
    }

    // Buscar la licencia en la DB
    const { data: license, error } = await supabaseAdmin
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .single();

    if (error || !license) {
      return NextResponse.json({ error: 'Licencia inválida o no existe.' }, { status: 404 });
    }

    if (license.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'La licencia está inactiva o revocada.' }, { status: 403 });
    }

    // Si la licencia nunca se ha usado (machine_id es null), la vinculamos a esta máquina
    if (!license.machine_id) {
      const { error: updateError } = await supabaseAdmin
        .from('licenses')
        .update({
          machine_id: machine_id,
          activated_at: new Date().toISOString(),
        })
        .eq('id', license.id);

      if (updateError) throw updateError;

      return NextResponse.json({
        valid: true,
        module: license.module,
        message: 'Licencia activada y vinculada a este equipo exitosamente.',
      });
    }

    // Si la licencia ya está vinculada, verificamos que sea la misma máquina
    if (license.machine_id !== machine_id) {
      return NextResponse.json({ 
        error: 'Esta licencia ya fue activada en otro computador. No puede ser reutilizada.' 
      }, { status: 403 });
    }

    // Si ya estaba activada en ESTA misma máquina, todo está bien (re-validación)
    return NextResponse.json({
      valid: true,
      module: license.module,
      message: 'Licencia validada exitosamente.',
    });

  } catch (error: any) {
    console.error('Error verificando licencia:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
