create extension if not exists pg_cron;
-- 00:05 IST daily: demo events and the demo fest move with the calendar so the site never looks stale.
select cron.schedule('roll-sample-dates', '35 18 * * *', 'select public.roll_sample_dates()');
