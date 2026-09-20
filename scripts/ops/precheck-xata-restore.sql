SELECT current_database(), current_user;

DO $$
DECLARE
  item record;
  n bigint;
BEGIN
  FOR item IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname IN ('public', 'drizzle', 'neon_auth')
      AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE format('SELECT count(*) FROM %I.%I', item.schemaname, item.tablename) INTO n;
    IF n > 0 THEN
      RAISE EXCEPTION 'Target has rows in %.%: %', item.schemaname, item.tablename, n;
    END IF;
  END LOOP;
END $$;
