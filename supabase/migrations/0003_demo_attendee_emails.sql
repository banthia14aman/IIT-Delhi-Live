-- Seeded attendees (profiles with no login) use @demo.iitd.ac.in, so a real student signing up with their
-- own @iitd.ac.in address can never collide with a made-up one. They still count as IITD (is_iitd).
alter table public.profiles disable trigger guard_profile;
update public.profiles p set email = replace(email, '@iitd.ac.in', '@demo.iitd.ac.in')
where email like '%@iitd.ac.in' and not exists (select 1 from auth.users u where u.id = p.id);
alter table public.profiles enable trigger guard_profile;
