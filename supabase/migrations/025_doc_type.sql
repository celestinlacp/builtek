-- Migration 025: Add doc_type column to documents
-- doc_type stores the TIPO_DOC segment (e.g. PLA, MEM, ESP) of the MIC code

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS doc_type VARCHAR(10) DEFAULT NULL;

-- Backfill doc_type from doc_key for existing docs that have a full MIC code
UPDATE documents
SET doc_type = split_part(doc_key, '-', 3)
WHERE doc_key IS NOT NULL
  AND array_length(string_to_array(doc_key, '-'), 1) >= 5
  AND split_part(doc_key, '-', 3) <> '';
