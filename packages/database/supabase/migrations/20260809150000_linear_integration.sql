insert into public.integrations (
  id,
  name,
  category,
  description,
  logo_key,
  featured,
  launch,
  kairos_actions
) values (
  'linear',
  'Linear',
  'productivity',
  'Connect Linear teams, projects, and issues.',
  'linear',
  true,
  true,
  '["list_issues","create_issue","update_issue"]'::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  logo_key = excluded.logo_key,
  featured = excluded.featured,
  launch = excluded.launch,
  kairos_actions = excluded.kairos_actions,
  updated_at = now();
