-- Create pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for fuzzy search on product name and model
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_model_trgm ON products USING GIN (model gin_trgm_ops);

-- Set similarity threshold for pg_trgm searches
-- This affects the % and %>% operators
SET pg_trgm.similarity_threshold = 0.3;
