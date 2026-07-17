-- Run this script in your Supabase SQL Editor to create the tables

-- 1. Table for tracking Hardware Trials (30 days)
CREATE TABLE public.hardware_trials (
    machine_id TEXT PRIMARY KEY,
    first_launch_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_ping_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_blocked BOOLEAN DEFAULT FALSE
);

-- 2. Table for Licenses
CREATE TABLE public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT UNIQUE NOT NULL,
    module TEXT NOT NULL, -- 'restaurante', 'farmacia', 'panaderia', 'fruteria', 'almacen'
    buyer_email TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE'
    machine_id TEXT REFERENCES public.hardware_trials(machine_id), -- Null until activated
    activated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_session_id TEXT -- To trace back the purchase
);

-- 3. Security
-- Enable RLS (Row Level Security) so no one can access the database directly from the frontend
ALTER TABLE public.hardware_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Note: We do NOT create any public access policies.
-- Our Next.js backend API will use the SUPABASE_SERVICE_ROLE_KEY to bypass RLS and securely manage data.
