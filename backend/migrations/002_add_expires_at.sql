SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'food_listings'
    AND COLUMN_NAME = 'expires_at'
);

SET @add_col_sql = IF(
  @col_exists = 0,
  'ALTER TABLE food_listings ADD COLUMN expires_at DATETIME NULL',
  'SELECT 1'
);

PREPARE add_col_stmt FROM @add_col_sql;
EXECUTE add_col_stmt;
DEALLOCATE PREPARE add_col_stmt;

UPDATE food_listings
SET expires_at = DATE_ADD(created_at, INTERVAL 1 DAY)
WHERE expires_at IS NULL;

ALTER TABLE food_listings
MODIFY COLUMN expires_at DATETIME NOT NULL;
