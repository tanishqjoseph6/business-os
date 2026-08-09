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
  'actora',
  'Actora CRM',
  'crm',
  'Connect your Actora workspace CRM data and tasks.',
  'actora',
  true,
  true,
  '["list_contacts","create_contact","update_contact","list_companies","list_deals","list_tasks","create_task","delete_task"]'::jsonb
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
