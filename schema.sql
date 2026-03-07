-- Stella Martis Supabase Schema Setup
-- Copy and paste this script into your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql) and click "Run".

-- 1. Create the campaign_requests table
CREATE TABLE IF NOT EXISTS public.campaign_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    organization TEXT NOT NULL,
    email TEXT NOT NULL,
    hardware TEXT NOT NULL,
    conditions TEXT,
    timeline TEXT,
    deliverables TEXT,
    spiti_team TEXT,
    status TEXT DEFAULT 'Pending'::text NOT NULL,
    report_url TEXT
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.campaign_requests ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow public users to insert new campaign requests (unauthenticated submissions)
CREATE POLICY "Allow public inserts" 
ON public.campaign_requests 
FOR INSERT 
WITH CHECK (true);

-- 4. Create a policy to restrict all other actions (Select, Update, Delete) to authenticated users (admin dashboard)
CREATE POLICY "Allow authenticated full access" 
ON public.campaign_requests 
FOR ALL 
TO authenticated 
USING (true);
