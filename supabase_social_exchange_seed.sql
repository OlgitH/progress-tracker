-- Seed data from the Social Exchange System spreadsheet (47 responses, 50 exchanges).
-- Members are created without emails or user ids. They link up on first Slack sign-in (see
-- scripts/link-slack-members.mjs, which fills in emails + Slack ids from the workspace).
-- The spreadsheet's "value to you", social value and comments came from the person who received
-- the help, so they are stored as the Exchangee's (value_to_exchangee / exchangee_comments). Groups/organisations are not members, so the
-- exchanger or exchangee is null where the spreadsheet named a group.
-- Safe to re-run: members are matched by name and exchanges by seed_ref.

insert into public.members (full_name)
select v.full_name
from (values
  ('Felix Colbert'),
  ('Nigel Fryatt'),
  ('Clare Francis'),
  ('Alicja Borkowska'),
  ('Caroline Anstey'),
  ('Conrad Moriarty Cole'),
  ('Andreea Gray'),
  ('Rachel Pownall'),
  ('Kerri Baillie-Lane'),
  ('Mark Lodge'),
  ('Helen Farmer'),
  ('Ximena Alarcon'),
  ('Amy Jones'),
  ('Michelle Forrest Beckett'),
  ('Naomi Smyth'),
  ('Dave Webb'),
  ('Jessica Hudson'),
  ('Duncan Kerr'),
  ('Becca Gill'),
  ('Dom Shearne'),
  ('Paul West'),
  ('Alison Bowen'),
  ('David Fowler'),
  ('James Lavelle'),
  ('Nick James'),
  ('Jenny Ford'),
  ('Kate Arthurs'),
  ('James Tookey'),
  ('Zoe Damoulakis'),
  ('Alyson Webb'),
  ('Charlotte Brown'),
  ('Silvia Carderelli-Gronau'),
  ('Stacey Pottinger'),
  ('Amy Stone'),
  ('Simon Taylor'),
  ('Nik Rawlings'),
  ('George Shipley'),
  ('Oliver Berman'),
  ('Robbie Harrison'),
  ('Zhi Xu'),
  ('Dominic Bradbury'),
  ('Bashart Malik')
) as v(full_name)
where not exists (select 1 from public.members m where lower(m.full_name) = lower(v.full_name));

insert into public.social_exchanges
  (seed_ref, exchanger_id, exchangee_id, hours, exchanged_on, description,
   value_to_exchangee, social_value, exchangee_comments, exchanger_responded_at)
select v.seed_ref, g.id, e.id, v.hours, v.exchanged_on::date, v.description,
       v.value_to_exchangee, v.social_value, v.exchangee_comments, now()
from (values
  ('form-row-1-1-1', 'Felix Colbert', 'Nigel Fryatt', 8, '2025-08-29', 'Production, creative concept and creative technology ideation and scoping for a commission in December.', 10, null, 'This commission actually fell through due to reasons outside of my companies and the commissioning company''s control. This left my business is a very vulnerable statement from a cashflow perspective, so being able to convert the time into social tokens is incredibly valuable for me at a time of great difficulty for business finance.'), -- form row 1
  ('form-row-2-1-1', 'Clare Francis', 'Nigel Fryatt', 8, '2025-08-29', 'Production co-ordination for the development stages of a commission in December', 10, null, 'See response to exchange with Felix Colbert - as this exchange had exactly the same impact (same project)'), -- form row 2
  ('form-row-3-1-1', 'Alicja Borkowska', 'Caroline Anstey', 1, '2025-11-17', 'Media Comms Student Test and Play', 8, 6, 'Hard to put a value to this.... it was good to have ideas within the group conversation. and that is where the value sits (quote from student group)'), -- form row 3
  ('form-row-3-1-2', 'Alicja Borkowska', 'Conrad Moriarty Cole', 1, '2025-11-17', 'Media Comms Student Test and Play', 8, 6, 'Hard to put a value to this.... it was good to have ideas within the group conversation. and that is where the value sits (quote from student group)'), -- form row 3
  ('form-row-4-1-1', 'Andreea Gray', 'Rachel Pownall', 16, '2025-12-14', 'Resident Fund - Andreea purchased, created and hung items to spruce up The Studio including making cushion covers, hanging picture frames etc', 8, 8, 'This is ongoing, she is liaising with other residents like Brian Gibson and helping them hang their artwork on the walls.'), -- form row 4
  ('form-row-5-1-1', 'Nigel Fryatt', 'Kerri Baillie-Lane', 2, '2026-04-09', 'Residents gave their time to present how the studio has supported and developed their practice, sharing their experiences and offering insight to prospective residents.', 10, 10, null), -- form row 5
  ('form-row-6-1-1', 'Mark Lodge', 'Kerri Baillie-Lane', 2, '2026-04-09', 'Residents gave their time to present how the studio has supported and developed their practice, sharing their experiences and offering insight to prospective residents.', 10, 10, null), -- form row 6
  ('form-row-7-1-1', 'Helen Farmer', 'Kerri Baillie-Lane', 2, '2026-03-26', 'Residents gave their time to present how the studio has supported and developed their practice, sharing their experiences and offering insight to prospective residents.', 10, 10, null), -- form row 7
  ('form-row-8-1-1', 'Helen Farmer', 'Kerri Baillie-Lane', 1, '2026-04-21', 'Resident gave their time to attend the Resident Budget Meeting - Helen presented her proposal to the other residents and a vote was held.', 8, 8, null), -- form row 8
  ('form-row-9-1-1', 'Ximena Alarcon', 'Kerri Baillie-Lane', 1, '2026-04-21', 'Resident gave their time to attend the Resident Budget Meeting and voted on the proposal outlined by Helen Farmer.', 10, 10, null), -- form row 9
  ('form-row-10-1-1', 'Amy Jones', 'Kerri Baillie-Lane', 1, '2026-04-21', 'Resident gave their time to attend the Resident Budget Meeting and voted on the proposal outlined by Helen Farmer.', 10, 10, null), -- form row 10
  ('form-row-11-1-1', 'Michelle Forrest Beckett', 'Kerri Baillie-Lane', 1, '2026-04-21', 'Resident gave their time to attend the Resident Budget Meeting and voted on the proposal outlined by Helen Farmer.', 10, 10, null), -- form row 11
  ('form-row-12-1-1', 'Naomi Smyth', 'Kerri Baillie-Lane', 1, '2026-04-21', 'Resident gave their time to attend the Resident Budget Meeting and voted on the proposal outlined by Helen Farmer.', 10, 10, null), -- form row 12
  ('form-row-13-1-1', 'Dave Webb', 'Kerri Baillie-Lane', 1, '2026-04-21', 'Resident gave their time to attend the Resident Budget Meeting and voted on the proposal outlined by Helen Farmer.', 10, 10, null), -- form row 13
  ('form-row-14-1-1', 'Jessica Hudson', 'Kerri Baillie-Lane', 1, '2026-04-21', 'Resident gave their time to attend the Resident Budget Meeting and voted on the proposal outlined by Helen Farmer.', 10, 10, null), -- form row 14
  ('form-row-15-1-1', 'Duncan Kerr', 'Caroline Anstey', 2, '2025-12-03', 'Strategic Development Advice', 8, 9, 'Not tech focussed but valuable to the development and growth of network to the studio'), -- form row 15
  ('form-row-16-1-1', 'Becca Gill', null, 2, '2026-03-02', 'Mentoring on projects', 8, 7, 'Good to meet the residents and have thier time'), -- form row 16
  ('form-row-17-1-1', 'Dom Shearne', null, 2, '2026-02-02', 'Mentoring for end of year projects', 9, 8, 'Great advice'), -- form row 17
  ('form-row-18-1-1', 'Paul West', null, 2, '2026-02-02', 'Mentoring on end of year projects', 8, 5, 'Not sure I understand social value'), -- form row 18
  ('form-row-19-1-1', 'Alison Bowen', null, 2, '2026-02-02', 'Advice on peend of year project', 8, 6, 'Good critique of my work and helpful tips to make it better'), -- form row 19
  ('form-row-20-1-1', 'David Fowler', null, 2, '2026-02-02', 'End of year project', 6, 6, 'Great to have business expert in the field I''m looking to go into'), -- form row 20
  ('form-row-21-1-1', 'James Lavelle', null, 2, '2026-02-02', 'End of year crit', 8, 9, 'So interesting to hear about James'' work and his travels'), -- form row 21
  ('form-row-22-1-1', 'Nick James', null, 20, '2026-02-09', 'crit of my work', 8, 9, 'interesting work and made me think more about my user of my app'), -- form row 22
  ('form-row-23-1-1', 'Jenny Ford', null, 2, '2026-02-09', 'Advice on project', 9, 7, 'Great to meet Residents'), -- form row 23
  ('form-row-24-1-1', 'Kate Arthurs', null, 2, '2026-03-09', 'Crit of my project', 8, 7, 'Lots of useful advice'), -- form row 24
  ('form-row-25-1-1', null, 'Rachel Pownall', 1.5, '2026-01-27', 'Hosted an Immersive Creators Cluster Lunch to showcase their short film ''Digital Scholar''', 10, 10, '23 people booked for this Cluster Lunch, which is higher than normal, it attracted a wider audience than normal Cluster Lunches'), -- form row 25
  ('form-row-26-1-1', 'James Tookey', null, 2, '2026-02-09', 'End of project review and crit', 8, 8, 'would have liked more time with each resident'), -- form row 26
  ('form-row-27-1-1', 'Zoe Damoulakis', null, 2, '2026-02-09', 'Student project presentation', 7, 8, 'good to meet the residents'), -- form row 27
  ('form-row-28-1-1', 'Alyson Webb', null, 2, '2026-02-16', 'crit of project work', 9, 7, 'great expertise in musuems and where I want my project to be promoted.'), -- form row 28
  ('form-row-29-1-1', 'Dave Webb', 'Rachel Pownall', 1, '2026-02-24', 'Design & Prototype Cluster Lunch - Dave did a joint presentation with Brian Gibson talking about an app he had created for Brian''s Making More With Less exhibition, plus some work he had done with Jack Stott', 10, 10, '12 people booked to attend this event'), -- form row 29
  ('form-row-30-1-1', 'Alicja Borkowska', null, 2, '2026-02-09', 'she has such great work!', 8, 8, 'Would like more 1:1 time with residents'), -- form row 30
  ('form-row-31-1-1', 'Charlotte Brown', null, 2, '2026-02-16', 'crit of end of project work', 8, 8, 'really helpful feedback'), -- form row 31
  ('form-row-32-1-1', 'Silvia Carderelli-Gronau', 'Rachel Pownall', 2, '2026-04-23', 'Embodied Practice for Creative Wellbeing Workshop', 10, 10, '8 people booked for this event'), -- form row 32
  ('form-row-33-1-1', 'Kate Arthurs', 'Stacey Pottinger', 5, '2026-03-27', 'Advice re: social impact evaluation framework for arts, culture and heritage - WEMCA region.', 10, 10, null), -- form row 33
  ('form-row-34-1-1', 'Nick James', 'Amy Stone', 8, '2026-02-05', 'Training and seeing the Matterport in Live Scan', 9, 10, null), -- form row 34
  ('form-row-34-2-1', 'Jenny Ford', 'Amy Stone', 8, '2026-02-05', 'Training and seeing the Matterport in Live Scan', 9, 10, null), -- form row 34
  ('form-row-35-1-1', 'Simon Taylor', 'Rachel Pownall', 1, '2026-04-28', 'Presented at Cluster Lunch', 10, 10, null), -- form row 35
  ('form-row-36-1-1', 'Nik Rawlings', 'Amy Stone', 1, '2026-04-20', 'Helping me setup the Zylia with Reaper and the creation of an immersive audio template', 9, 9, null), -- form row 36
  ('form-row-37-1-1', 'George Shipley', 'Oliver Berman', 0.5, '2026-05-07', 'Sales consultancy', 10, 10, 'I came out of it with a clear direction of how to approach sales.'), -- form row 37
  ('form-row-38-1-1', 'Oliver Berman', 'Stacey Pottinger', 1, '2026-06-04', 'Olly helped me get my website transferred onto it''s proper domain after 3 years of being just on an unsearchable Google Site! he also gave me advice on SEO and how to restructure the site.', 10, 10, 'Although it might only seem like a small thing I haven''t manage to work this out for the past three years so it was extremely helpful for me!!'), -- form row 38
  ('form-row-39-1-1', 'Oliver Berman', 'Kerri Baillie-Lane', 1, '2026-06-04', 'Olly offered feedback on the Social Exchange System and offered to help produce some data visualisations about the SES.', 10, 8, null), -- form row 39
  ('form-row-39-1-2', 'Oliver Berman', 'Caroline Anstey', 1, '2026-06-04', 'Olly offered feedback on the Social Exchange System and offered to help produce some data visualisations about the SES.', 10, 8, null), -- form row 39
  ('form-row-40-1-1', 'Robbie Harrison', 'Caroline Anstey', 0.5, '2026-06-10', 'intro to using podcasting equipment - podcasting programme (Reaper)', 10, 8, 'Good to encourage more of these types of exchanges with the fixed desk residents - Robbie is willing to do more'), -- form row 40
  ('form-row-41-1-1', 'Mark Lodge', 'Kerri Baillie-Lane', 40, '2025-04-01', 'Mark set up a poscasting suit in The Studio for the Residents to use', 10, 10, null), -- form row 41
  ('form-row-42-1-1', 'Mark Lodge', 'Kerri Baillie-Lane', 6, '2025-04-01', 'Mark trained 5/6 residents on how to use the podcasting equipment he set up.', 10, 10, null), -- form row 42
  ('form-row-43-1-1', 'Zhi Xu', 'Rachel Pownall', 2, '2026-07-09', 'Co-presented research at a Cluster Lunch', 7, 7, null), -- form row 43
  ('form-row-44-1-1', 'Dominic Bradbury', 'Rachel Pownall', 3, '2026-05-26', 'Hosted an interactive Cluster Lunch about the work of Kerve', 9, 9, null), -- form row 44
  ('form-row-45-1-1', 'Helen Farmer', 'Rachel Pownall', 5, '2026-07-29', 'Organised and co-hosted a Frank Conversations event - Caring for Futures', 8, 8, null), -- form row 45
  ('form-row-46-1-1', 'Bashart Malik', 'Rachel Pownall', 5, '2026-07-09', 'Organiser and co-host of Frank Conversations Event - Caring for Futures', 8, 8, null), -- form row 46
  ('form-row-47-1-1', 'Jenny Ford', 'Rachel Pownall', 6, '2026-07-21', 'Developed and ran a Seeing The System Workshop', 8, 8, null) -- form row 47
) as v(seed_ref, exchanger, exchangee, hours, exchanged_on, description, value_to_exchangee, social_value, exchangee_comments)
left join public.members g on lower(g.full_name) = lower(v.exchanger)
left join public.members e on lower(e.full_name) = lower(v.exchangee)
on conflict (seed_ref) do nothing;
