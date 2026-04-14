-- Seed minimo delle prefetture italiane (campione delle principali città).
-- Gli indirizzi PEC sono esempi ufficiali e vanno verificati in produzione
-- prima di inviare ricorsi reali.

insert into public.prefetture (provincia, nome, pec, indirizzo) values
  ('RM', 'Prefettura di Roma',    'protocollo.prefrm@pec.interno.it',  'Via IV Novembre 119/A, 00187 Roma'),
  ('MI', 'Prefettura di Milano',  'protocollo.prefmi@pec.interno.it',  'Corso Monforte 31, 20122 Milano'),
  ('NA', 'Prefettura di Napoli',  'protocollo.prefna@pec.interno.it',  'Piazza del Plebiscito 1, 80132 Napoli'),
  ('TO', 'Prefettura di Torino',  'protocollo.prefto@pec.interno.it',  'Piazza Castello 201, 10121 Torino'),
  ('PA', 'Prefettura di Palermo', 'protocollo.prefpa@pec.interno.it',  'Via Cavour 6, 90133 Palermo'),
  ('GE', 'Prefettura di Genova',  'protocollo.prefge@pec.interno.it',  'Largo Lanfranco 1, 16121 Genova'),
  ('BO', 'Prefettura di Bologna', 'protocollo.prefbo@pec.interno.it',  'Piazza Roosevelt 3, 40123 Bologna'),
  ('FI', 'Prefettura di Firenze', 'protocollo.preffi@pec.interno.it',  'Via Cavour 1, 50129 Firenze'),
  ('BA', 'Prefettura di Bari',    'protocollo.prefba@pec.interno.it',  'Piazza Libertà 1, 70121 Bari'),
  ('CT', 'Prefettura di Catania', 'protocollo.prefct@pec.interno.it',  'Piazza Giovanni Verga 4, 95129 Catania')
on conflict (provincia) do nothing;
