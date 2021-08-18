--1--
update reservations
set status='seated'
where (reservations.reservation_id in (
	select distinct tables.reservation_id
	from tables
	where tables.reservation_id is not null));

--2--
---must run after 1---
update reservations
set status='booked'
where reservations.status IS NULL;

--3--
update tables
set reservation_id = NULL
where (tables.reservation_id in (
	select reservations.reservation_id
	from reservations
	where not(reservations.status = 'seated')));

--select distinct tables.reservation_id
--from tables
--where tables.reservation_id is not null;