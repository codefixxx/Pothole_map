-- Create PostGIS GIST Spatial Index on Pothole geography point (wrapped expression)
CREATE INDEX IF NOT EXISTS "pothole_spatial_gist_idx" 
ON "Pothole" 
USING GIST ((ST_SetSRID(ST_Point(longitude, latitude), 4326)::geography));

-- Create HNSW Vector Index on report_image embedding using cosine distance
CREATE INDEX IF NOT EXISTS "report_image_embedding_hnsw_idx" 
ON "report_image" 
USING hnsw (embedding vector_cosine_ops);
