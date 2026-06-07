export const EffectTypes = {
  disease: {
    name_en: 'Disease',
    name_pt: 'Doença',
    img: '/icons/effects-disease.gif',
  },
  cureDisease: {
    name_en: 'Cure',
    name_pt: 'Cura',
    img: '/icons/effects-cure.gif',
  },
  heal: {
    name_en: 'Heal',
    name_pt: 'Cura',
    img: '/icons/effects-health.png',
  },
  stats: {
    name_en: 'Stats Change',
    name_pt: 'Alteração de Stats',
    img: '/icons/effects-shield.png',
  },
  other: {
    name_en: 'Other',
    name_pt: 'Outro',
    img: '/icons/effects-other.gif',
  },
  colorSpecies: {
    name_en: 'Color/Species Change',
    name_pt: 'Troca de Cor/Espécie',
    img: '/icons/effects-color.png',
  },
  petpetColor: {
    name_en: 'Petpet Color Change',
    name_pt: 'Troca de Cor de Petpet',
    img: '/icons/effects-petpet-color.png',
  },
} as const;

export type EffectTypeKey = keyof typeof EffectTypes;
