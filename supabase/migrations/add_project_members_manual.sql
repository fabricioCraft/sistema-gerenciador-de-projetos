-- Migration: Add project_members table for team collaboration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "project_members" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "email" text NOT NULL,
    "role" text DEFAULT 'member',
    "status" text DEFAULT 'pending',
    "invited_at" timestamp with time zone DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_project_members_project_id" ON "project_members"("project_id");
CREATE INDEX IF NOT EXISTS "idx_project_members_email" ON "project_members"("email");

-- Enable RLS (Row Level Security)
ALTER TABLE "project_members" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see members of projects they own or are members of
CREATE POLICY "Users can view project members" ON "project_members"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects WHERE projects.id = project_members.project_id 
            AND projects.user_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

-- Policy: Project owners can insert new members
CREATE POLICY "Project owners can invite members" ON "project_members"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects WHERE projects.id = project_members.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- Policy: Project owners can delete members
CREATE POLICY "Project owners can remove members" ON "project_members"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects WHERE projects.id = project_members.project_id 
            AND projects.user_id = auth.uid()
        )
    );
