import { calculer_devis } from '../calculer-devis';

describe('Golden Set — Jeux de test de référence NeoTravel', () => {
  test('Cas 1 — 40 pax, 100km aller simple, septembre DD_NORMAL', () => {
    const input = {
      nb_passagers: 40,
      date_depart: '2026-09-15',
      date_demande: '2026-07-01',
      distance_km: 100,
      aller_retour: false,
      options: [] as Array<'guide'|'chauffeur_nuit'|'peages'>,
    };
    const result = calculer_devis(input);
    console.log('CAS1', JSON.stringify(result));
    expect(result.manual_required).toBe(false);
    expect(result.prix_ht).toBeGreaterThan(0);
  });

  test('Cas 2 — 30 pax, 150km aller-retour, juin très haute saison + guide', () => {
    const input = {
      nb_passagers: 30,
      date_depart: '2026-06-20',
      date_demande: '2026-04-01',
      distance_km: 150,
      aller_retour: true,
      options: ['guide'] as Array<'guide'|'chauffeur_nuit'|'peages'>,
    };
    const result = calculer_devis(input);
    console.log('CAS2', JSON.stringify(result));
    expect(result.manual_required).toBe(false);
    expect(result.prix_ht).toBeGreaterThan(0);
  });

  test('Cas 3 — 86 pax → HITL escalade', () => {
    const input = {
      nb_passagers: 86,
      date_depart: '2026-09-15',
      date_demande: '2026-07-01',
      distance_km: 100,
      aller_retour: false,
      options: [] as Array<'guide'|'chauffeur_nuit'|'peages'>,
    };
    const result = calculer_devis(input);
    console.log('CAS3', JSON.stringify(result));
    expect(result.manual_required).toBe(true);
    expect(result.prix_ht).toBe(0);
  });

  test('Cas 4 — 70 pax urgent (DD_URGENT), 250km, juillet haute saison, toutes options', () => {
    const input = {
      nb_passagers: 70,
      date_depart: '2026-07-15',
      date_demande: '2026-07-14',
      distance_km: 250,
      aller_retour: false,
      options: ['guide', 'chauffeur_nuit', 'peages'] as Array<'guide'|'chauffeur_nuit'|'peages'>,
      peages_flat_rate: 35,
    };
    const result = calculer_devis(input);
    console.log('CAS4', JSON.stringify(result));
    expect(result.manual_required).toBe(false);
    expect(result.prix_ht).toBeGreaterThan(0);
  });

  test('Cas 5 — 15 pax, 300km aller-retour, janvier basse saison, réservation >3 mois', () => {
    const input = {
      nb_passagers: 15,
      date_depart: '2027-01-20',
      date_demande: '2026-10-01',
      distance_km: 300,
      aller_retour: true,
      options: [] as Array<'guide'|'chauffeur_nuit'|'peages'>,
    };
    const result = calculer_devis(input);
    console.log('CAS5', JSON.stringify(result));
    expect(result.manual_required).toBe(false);
    expect(result.prix_ht).toBeGreaterThan(0);
  });
});
