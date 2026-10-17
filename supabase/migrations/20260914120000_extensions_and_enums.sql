-- Extensions
create extension if not exists "pgcrypto" with schema extensions;
-- Enums
create type public.user_role as enum ('athlete', 'admin');
create type public.experience_level as enum ('beginner', 'intermediate', 'advanced');
create type public.enrollment_status as enum ('active', 'completed', 'abandoned');
create type public.weight_unit as enum ('lb', 'kg');
