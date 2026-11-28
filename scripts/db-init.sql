-- Postgres trong Docker chạy file này một lần khi volume còn trống (giống bảng của npm run db:setup)
CREATE TABLE IF NOT EXISTS wedding_data (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
