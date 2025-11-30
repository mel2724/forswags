-- Make school_id nullable in alumni table for CSV imports without school data
ALTER TABLE alumni ALTER COLUMN school_id DROP NOT NULL;