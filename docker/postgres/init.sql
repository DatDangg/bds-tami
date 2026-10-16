-- Chạy một lần khi khởi tạo volume Postgres dev (docker-entrypoint-initdb.d).
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
