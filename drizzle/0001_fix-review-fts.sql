-- Custom SQL migration file, put your code below! --
DROP TABLE IF EXISTS reviews_fts;
--> statement-breakpoint
CREATE VIRTUAL TABLE reviews_fts USING fts5(
  body,
  content='reviews_content',
  content_rowid='docid',
  tokenize='unicode61',
);
--> statement-breakpoint
INSERT INTO reviews_fts(rowid, body)
SELECT docid, body FROM reviews_content;