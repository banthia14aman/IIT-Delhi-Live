-- Security advisor: pin search_path on the one helper that lacked it.
alter function public.seat_limit(public.events) set search_path = public;
