-- Tiny Taps seed data
-- 5 tags, 4 topics, 21 subjects, 42 sounds (2 per subject: sound + voiceover)
-- Safe to re-run: INSERT OR IGNORE throughout

-- ── Tags ─────────────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO tags (id, name, category, sort_order) VALUES
  ('54e4fca1-b9a6-4933-8f2a-aa823bd7d027', '1-2',      'age',      1),
  ('ec490e71-5c57-4831-90c6-383188fd7f70', '2-3',      'age',      2),
  ('3f930009-fb54-499a-8c83-f0457c101bb5', 'Animals',  'category', 10),
  ('110efb41-d98b-40cb-bc7f-52910139a91e', 'Vehicles', 'category', 11),
  ('66c72a27-7c2d-4cda-8827-cadd6ea8e93d', 'Food',     'category', 12);

-- ── Topics ────────────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO topics (id, title, slug) VALUES
  ('bbd4ae1c-aaf1-4ffc-a60a-13cf580c9a2e', 'Farm Animals', 'farm-animals'),
  ('4c1710ba-6297-459d-85cd-4dc9475cfb5b', 'Wild Animals', 'wild-animals'),
  ('c9ee6772-53b1-4598-aebd-bbd3e7439e98', 'Vehicles',     'vehicles'),
  ('bad5ee12-1bfb-45fe-b7a8-90156bea5374', 'Fruits',       'fruits');

-- ── Topic Tags ────────────────────────────────────────────────────────────────

-- Farm Animals: 1-2, 2-3, Animals
INSERT OR IGNORE INTO topic_tags (topic_id, tag_id) VALUES
  ('bbd4ae1c-aaf1-4ffc-a60a-13cf580c9a2e', '54e4fca1-b9a6-4933-8f2a-aa823bd7d027'),
  ('bbd4ae1c-aaf1-4ffc-a60a-13cf580c9a2e', 'ec490e71-5c57-4831-90c6-383188fd7f70'),
  ('bbd4ae1c-aaf1-4ffc-a60a-13cf580c9a2e', '3f930009-fb54-499a-8c83-f0457c101bb5');

-- Wild Animals: 2-3, Animals
INSERT OR IGNORE INTO topic_tags (topic_id, tag_id) VALUES
  ('4c1710ba-6297-459d-85cd-4dc9475cfb5b', 'ec490e71-5c57-4831-90c6-383188fd7f70'),
  ('4c1710ba-6297-459d-85cd-4dc9475cfb5b', '3f930009-fb54-499a-8c83-f0457c101bb5');

-- Vehicles: 1-2, 2-3, Vehicles
INSERT OR IGNORE INTO topic_tags (topic_id, tag_id) VALUES
  ('c9ee6772-53b1-4598-aebd-bbd3e7439e98', '54e4fca1-b9a6-4933-8f2a-aa823bd7d027'),
  ('c9ee6772-53b1-4598-aebd-bbd3e7439e98', 'ec490e71-5c57-4831-90c6-383188fd7f70'),
  ('c9ee6772-53b1-4598-aebd-bbd3e7439e98', '110efb41-d98b-40cb-bc7f-52910139a91e');

-- Fruits: 1-2, Food
INSERT OR IGNORE INTO topic_tags (topic_id, tag_id) VALUES
  ('bad5ee12-1bfb-45fe-b7a8-90156bea5374', '54e4fca1-b9a6-4933-8f2a-aa823bd7d027'),
  ('bad5ee12-1bfb-45fe-b7a8-90156bea5374', '66c72a27-7c2d-4cda-8827-cadd6ea8e93d');

-- ── Subjects: Farm Animals ────────────────────────────────────────────────────

INSERT OR IGNORE INTO subjects (id, topic_id, title, sort_order) VALUES
  ('d1ac5818-c610-4da6-aec5-52218d2edf44', 'bbd4ae1c-aaf1-4ffc-a60a-13cf580c9a2e', 'Cow',   0),
  ('58a6a731-01ac-4e58-9ddf-fd853503ac08', 'bbd4ae1c-aaf1-4ffc-a60a-13cf580c9a2e', 'Pig',   1),
  ('c93f8711-337d-4b23-af5d-cb436cce794b', 'bbd4ae1c-aaf1-4ffc-a60a-13cf580c9a2e', 'Dog',   2),
  ('28d8a20d-3627-4126-83a7-b19eb7d626a2', 'bbd4ae1c-aaf1-4ffc-a60a-13cf580c9a2e', 'Cat',   3),
  ('5ab12c0c-49cd-4199-8f1e-2db1c5cd74ed', 'bbd4ae1c-aaf1-4ffc-a60a-13cf580c9a2e', 'Sheep', 4),
  ('93fe2e96-ae47-439d-8e9a-235aa333e105', 'bbd4ae1c-aaf1-4ffc-a60a-13cf580c9a2e', 'Horse', 5);

-- ── Subjects: Wild Animals ────────────────────────────────────────────────────

INSERT OR IGNORE INTO subjects (id, topic_id, title, sort_order) VALUES
  ('fd7e79d5-e481-47d0-805e-0cb240db23da', '4c1710ba-6297-459d-85cd-4dc9475cfb5b', 'Lion',     0),
  ('d49d46f8-961f-49bb-aba2-662635bcf4f4', '4c1710ba-6297-459d-85cd-4dc9475cfb5b', 'Elephant', 1),
  ('49853573-7682-44f0-95c0-fdaf7d279462', '4c1710ba-6297-459d-85cd-4dc9475cfb5b', 'Monkey',   2),
  ('284425c9-1e42-44c7-9cf0-8a501da13628', '4c1710ba-6297-459d-85cd-4dc9475cfb5b', 'Duck',     3),
  ('15a2bcee-87af-4048-b319-687bf465da7f', '4c1710ba-6297-459d-85cd-4dc9475cfb5b', 'Bear',     4);

-- ── Subjects: Vehicles ────────────────────────────────────────────────────────

INSERT OR IGNORE INTO subjects (id, topic_id, title, sort_order) VALUES
  ('26c2c6b7-9e67-449e-8a1e-189935c4829a', 'c9ee6772-53b1-4598-aebd-bbd3e7439e98', 'Car',      0),
  ('b425ae08-0a6a-4595-a6ac-7ef6d3ab80ff', 'c9ee6772-53b1-4598-aebd-bbd3e7439e98', 'Bus',      1),
  ('ac277544-e878-4c2b-94d1-ab743132b1c7', 'c9ee6772-53b1-4598-aebd-bbd3e7439e98', 'Train',    2),
  ('5cbd855b-f052-4d53-b278-695e1d157a77', 'c9ee6772-53b1-4598-aebd-bbd3e7439e98', 'Airplane', 3),
  ('238359bd-6a9a-408f-85a4-d6c930742dd7', 'c9ee6772-53b1-4598-aebd-bbd3e7439e98', 'Boat',     4);

-- ── Subjects: Fruits ─────────────────────────────────────────────────────────

INSERT OR IGNORE INTO subjects (id, topic_id, title, sort_order) VALUES
  ('5d4668f7-46cb-40ec-ad99-e7c986c962e9', 'bad5ee12-1bfb-45fe-b7a8-90156bea5374', 'Apple',      0),
  ('4373504e-7c1d-46e7-b273-ef88ed3a33c0', 'bad5ee12-1bfb-45fe-b7a8-90156bea5374', 'Banana',     1),
  ('ad259f64-e7c9-489f-bc38-003d6dec81b4', 'bad5ee12-1bfb-45fe-b7a8-90156bea5374', 'Orange',     2),
  ('5241c166-0ea6-4172-baa5-519e11d705b9', 'bad5ee12-1bfb-45fe-b7a8-90156bea5374', 'Strawberry', 3),
  ('9a4516f7-5527-4fa8-9cd6-3caf7028f6a4', 'bad5ee12-1bfb-45fe-b7a8-90156bea5374', 'Grapes',     4);

-- ── Sounds: Farm Animals ─────────────────────────────────────────────────────
-- Pattern: sound[0] = animal noise (delay 0ms), sound[1] = name voiceover (delay 800ms)

-- Cow
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('b829ce19-8273-47b2-91c1-f2ef06eaaf22', 'd1ac5818-c610-4da6-aec5-52218d2edf44', 0, 0,   'text', 'Moo!',       'en-US', 'en-US-AvaMultilingualNeural'),
  ('64bd40c7-132e-40aa-b04f-2d94e4e89178', 'd1ac5818-c610-4da6-aec5-52218d2edf44', 1, 800, 'text', 'Cow',        'en-US', 'en-US-AndrewMultilingualNeural');

-- Pig
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('bc11bf7d-db8c-4fd9-97a1-b34cda271b6d', '58a6a731-01ac-4e58-9ddf-fd853503ac08', 0, 0,   'text', 'Oink oink!', 'en-US', 'en-US-AvaMultilingualNeural'),
  ('6561a4eb-29f8-4844-b601-d7dc703437cc', '58a6a731-01ac-4e58-9ddf-fd853503ac08', 1, 800, 'text', 'Pig',        'en-US', 'en-US-AndrewMultilingualNeural');

-- Dog
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('5119babe-b43a-430d-8155-7dba81ec6ac6', 'c93f8711-337d-4b23-af5d-cb436cce794b', 0, 0,   'text', 'Woof woof!', 'en-US', 'en-US-AvaMultilingualNeural'),
  ('e1cc938d-7921-4c03-aeb0-e185f4e2565e', 'c93f8711-337d-4b23-af5d-cb436cce794b', 1, 800, 'text', 'Dog',        'en-US', 'en-US-AndrewMultilingualNeural');

-- Cat
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('e2fc9797-b454-4677-84cf-829641433009', '28d8a20d-3627-4126-83a7-b19eb7d626a2', 0, 0,   'text', 'Meow!',      'en-US', 'en-US-AvaMultilingualNeural'),
  ('350f3ae1-39a2-4aa6-b421-682f396c1228', '28d8a20d-3627-4126-83a7-b19eb7d626a2', 1, 800, 'text', 'Cat',        'en-US', 'en-US-AndrewMultilingualNeural');

-- Sheep
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('1146bc11-5381-480a-903a-95ae96df91eb', '5ab12c0c-49cd-4199-8f1e-2db1c5cd74ed', 0, 0,   'text', 'Baa baa!',   'en-US', 'en-US-AvaMultilingualNeural'),
  ('e4bc3c8e-4767-4314-ace8-a26450177c06', '5ab12c0c-49cd-4199-8f1e-2db1c5cd74ed', 1, 800, 'text', 'Sheep',      'en-US', 'en-US-AndrewMultilingualNeural');

-- Horse
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('31619ca1-2dce-4adc-8cc2-86a6be2d5478', '93fe2e96-ae47-439d-8e9a-235aa333e105', 0, 0,   'text', 'Neigh!',     'en-US', 'en-US-AvaMultilingualNeural'),
  ('d2c6d108-b2ea-4e9a-99a6-75f3a3b7cad6', '93fe2e96-ae47-439d-8e9a-235aa333e105', 1, 800, 'text', 'Horse',      'en-US', 'en-US-AndrewMultilingualNeural');

-- ── Sounds: Wild Animals ─────────────────────────────────────────────────────

-- Lion
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('db3c2151-86b2-492f-87b6-7e9a9a450c73', 'fd7e79d5-e481-47d0-805e-0cb240db23da', 0, 0,   'text', 'Roar!',         'en-US', 'en-US-AvaMultilingualNeural'),
  ('b3b357ba-2767-4ffc-8708-559a5e7b3345', 'fd7e79d5-e481-47d0-805e-0cb240db23da', 1, 800, 'text', 'Lion',          'en-US', 'en-US-AndrewMultilingualNeural');

-- Elephant
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('7a1b0f30-59bb-4cfc-9825-1ba476610e51', 'd49d46f8-961f-49bb-aba2-662635bcf4f4', 0, 0,   'text', 'Trumpet!',      'en-US', 'en-US-AvaMultilingualNeural'),
  ('78a0ab8d-82df-4425-8b28-dfa65460496e', 'd49d46f8-961f-49bb-aba2-662635bcf4f4', 1, 800, 'text', 'Elephant',      'en-US', 'en-US-AndrewMultilingualNeural');

-- Monkey
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('19a861a4-ee9b-4633-a304-6d4024aa4b4e', '49853573-7682-44f0-95c0-fdaf7d279462', 0, 0,   'text', 'Ooh ooh aah!',  'en-US', 'en-US-AvaMultilingualNeural'),
  ('6b8f57c7-7754-4fc9-8031-2234394357b4', '49853573-7682-44f0-95c0-fdaf7d279462', 1, 800, 'text', 'Monkey',        'en-US', 'en-US-AndrewMultilingualNeural');

-- Duck
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('2343d595-851a-41da-b069-183516b7e1e4', '284425c9-1e42-44c7-9cf0-8a501da13628', 0, 0,   'text', 'Quack quack!',  'en-US', 'en-US-AvaMultilingualNeural'),
  ('c2334286-a2c6-4389-9a0e-30edf69b899a', '284425c9-1e42-44c7-9cf0-8a501da13628', 1, 800, 'text', 'Duck',          'en-US', 'en-US-AndrewMultilingualNeural');

-- Bear
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('b5638f25-3011-4953-aa3d-8caebda1ea48', '15a2bcee-87af-4048-b319-687bf465da7f', 0, 0,   'text', 'Growl!',        'en-US', 'en-US-AvaMultilingualNeural'),
  ('cf0b5533-e03b-4acd-8acb-ca1370c28f1e', '15a2bcee-87af-4048-b319-687bf465da7f', 1, 800, 'text', 'Bear',          'en-US', 'en-US-AndrewMultilingualNeural');

-- ── Sounds: Vehicles ─────────────────────────────────────────────────────────

-- Car
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('b7281d05-ab62-43d3-a638-a370d2736258', '26c2c6b7-9e67-449e-8a1e-189935c4829a', 0, 0,   'text', 'Vroom vroom!', 'en-US', 'en-US-AvaMultilingualNeural'),
  ('839e29af-8575-4a22-953f-6f93f1e02d2f', '26c2c6b7-9e67-449e-8a1e-189935c4829a', 1, 800, 'text', 'Car',          'en-US', 'en-US-AndrewMultilingualNeural');

-- Bus
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('05612c61-c762-4756-95eb-d555ab59817f', 'b425ae08-0a6a-4595-a6ac-7ef6d3ab80ff', 0, 0,   'text', 'Beep beep!',   'en-US', 'en-US-AvaMultilingualNeural'),
  ('38202ad7-3d74-4e75-bbda-d2cbfb568e3b', 'b425ae08-0a6a-4595-a6ac-7ef6d3ab80ff', 1, 800, 'text', 'Bus',          'en-US', 'en-US-AndrewMultilingualNeural');

-- Train
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('7d1a9570-f3d0-4d12-8aec-4f52c6a3166d', 'ac277544-e878-4c2b-94d1-ab743132b1c7', 0, 0,   'text', 'Choo choo!',   'en-US', 'en-US-AvaMultilingualNeural'),
  ('fe666eb2-ade5-47cf-a8d2-819940c5fbd6', 'ac277544-e878-4c2b-94d1-ab743132b1c7', 1, 800, 'text', 'Train',        'en-US', 'en-US-AndrewMultilingualNeural');

-- Airplane
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('848e54da-cca3-4c31-9760-a6e55ba6e358', '5cbd855b-f052-4d53-b278-695e1d157a77', 0, 0,   'text', 'Whoosh!',      'en-US', 'en-US-AvaMultilingualNeural'),
  ('60822a5b-d447-43fe-bfd9-0d752376e8a7', '5cbd855b-f052-4d53-b278-695e1d157a77', 1, 800, 'text', 'Airplane',     'en-US', 'en-US-AndrewMultilingualNeural');

-- Boat
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('8f266830-e122-49e2-b3d0-78a00a374458', '238359bd-6a9a-408f-85a4-d6c930742dd7', 0, 0,   'text', 'Toot toot!',   'en-US', 'en-US-AvaMultilingualNeural'),
  ('f7cd25fe-1c2a-44b1-af2e-99c7493f5484', '238359bd-6a9a-408f-85a4-d6c930742dd7', 1, 800, 'text', 'Boat',         'en-US', 'en-US-AndrewMultilingualNeural');

-- ── Sounds: Fruits ───────────────────────────────────────────────────────────

-- Apple
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('9eedac0d-51ec-4f76-9c91-9b3a247ef2ad', '5d4668f7-46cb-40ec-ad99-e7c986c962e9', 0, 0,   'text', 'Crunch!',        'en-US', 'en-US-AvaMultilingualNeural'),
  ('55838aeb-821e-4c8a-a5d9-2b39d2288954', '5d4668f7-46cb-40ec-ad99-e7c986c962e9', 1, 800, 'text', 'Apple',          'en-US', 'en-US-AndrewMultilingualNeural');

-- Banana
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('db95ba7a-ca1e-4ace-a0bc-0a2f17013008', '4373504e-7c1d-46e7-b273-ef88ed3a33c0', 0, 0,   'text', 'Yummy banana!',  'en-US', 'en-US-AvaMultilingualNeural'),
  ('c35fbdaa-bf4c-4015-98f4-6c4bffb8b507', '4373504e-7c1d-46e7-b273-ef88ed3a33c0', 1, 800, 'text', 'Banana',         'en-US', 'en-US-AndrewMultilingualNeural');

-- Orange
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('6fecc34e-c3d9-4c7f-883f-ef4aecfe0a73', 'ad259f64-e7c9-489f-bc38-003d6dec81b4', 0, 0,   'text', 'So juicy!',      'en-US', 'en-US-AvaMultilingualNeural'),
  ('8600edea-0628-44e2-9b31-da98a49fac69', 'ad259f64-e7c9-489f-bc38-003d6dec81b4', 1, 800, 'text', 'Orange',         'en-US', 'en-US-AndrewMultilingualNeural');

-- Strawberry
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('4ef73a73-5acb-4f0e-bfa8-8ceaa6159c52', '5241c166-0ea6-4172-baa5-519e11d705b9', 0, 0,   'text', 'Sweet!',         'en-US', 'en-US-AvaMultilingualNeural'),
  ('b49310a3-8a52-4375-ad47-74571b88e79a', '5241c166-0ea6-4172-baa5-519e11d705b9', 1, 800, 'text', 'Strawberry',     'en-US', 'en-US-AndrewMultilingualNeural');

-- Grapes
INSERT OR IGNORE INTO sounds (id, subject_id, sort_order, delay_before_ms, type, text_content, language, voice) VALUES
  ('bb7ede19-d105-4e27-a0c6-18de2cfaeeda', '9a4516f7-5527-4fa8-9cd6-3caf7028f6a4', 0, 0,   'text', 'Pop!',           'en-US', 'en-US-AvaMultilingualNeural'),
  ('765f5a95-19ca-4247-b3af-0a4d414bf911', '9a4516f7-5527-4fa8-9cd6-3caf7028f6a4', 1, 800, 'text', 'Grapes',         'en-US', 'en-US-AndrewMultilingualNeural');