import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Duración del periodo de prueba en días
const TRIAL_DAYS = 30;

export async function POST(req: Request) {
  try {
    const { machine_id } = await req.json();

    if (!machine_id) {
      return NextResponse.json({ error: 'Machine ID es requerido' }, { status: 400 });
    }

    // Buscar si el equipo ya está registrado
    const { data: trialData, error: searchError } = await supabaseAdmin
      .from('hardware_trials')
      .select('*')
      .eq('machine_id', machine_id)
      .single();

    if (searchError && searchError.code !== 'PGRST116') { // PGRST116 es "No rows found"
      throw searchError;
    }

    const now = new Date();

    if (!trialData) {
      // Primera vez que se abre el sistema en esta máquina
      const { data: newTrial, error: insertError } = await supabaseAdmin
        .from('hardware_trials')
        .insert({
          machine_id,
          first_launch_date: now.toISOString(),
          last_ping_date: now.toISOString(),
          is_blocked: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return NextResponse.json({
        valid: true,
        days_left: TRIAL_DAYS,
        message: 'Trial iniciado exitosamente',
      });
    }

    // Si ya existe, calculamos los días transcurridos
    if (trialData.is_blocked) {
      return NextResponse.json({ valid: false, error: 'Equipo bloqueado permanentemente.' }, { status: 403 });
    }

    const firstLaunch = new Date(trialData.first_launch_date);
    const diffTime = Math.abs(now.getTime() - firstLaunch.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, TRIAL_DAYS - diffDays);

    // Actualizamos el último ping para auditoría
    await supabaseAdmin
      .from('hardware_trials')
      .update({ last_ping_date: now.toISOString() })
      .eq('machine_id', machine_id);

    if (daysLeft <= 0) {
      return NextResponse.json({
        valid: false,
        days_left: 0,
        error: 'El periodo de prueba de 30 días ha expirado.',
      }, { status: 403 });
    }

    return NextResponse.json({
      valid: true,
      days_left: daysLeft,
      message: 'Trial activo',
    });
  } catch (error: any) {
    console.error('Error verificando trial:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
