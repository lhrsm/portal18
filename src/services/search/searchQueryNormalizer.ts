/**
 * Search Query Normalizer, Intent Detector & Synonym Expander
 */

export const searchQueryNormalizer = {
  /**
   * Normalizes query string: strips diacritics, lowercase, collapses whitespace, trims punctuation.
   */
  normalize(rawQuery: string): string {
    if (!rawQuery) return '';
    return rawQuery
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Strip diacritics / accents
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ') // Remove special punctuation
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
  },

  /**
   * Baseline synonym expansion map (fallback if database is offline).
   */
  baselineSynonyms: {
    massagem: ['massagista', 'massagens', 'massoterapia', 'terapia corporal'],
    massagista: ['massagem', 'massagens', 'massoterapeuta'],
    acompanhante: ['acompanhantes', 'atendimento', 'presencial'],
    prive: ['prive', 'local proprio', 'apartamento'],
    trans: ['travesti', 'transgenero', 'mulher trans'],
    homem: ['homens', 'masculino', 'garoto'],
    mulher: ['mulheres', 'feminino', 'garota'],
  } as Record<string, string[]>,

  /**
   * Expands query terms with active synonyms.
   */
  expandTerms(normalizedQuery: string, customSynonyms?: Record<string, string[]>): string[] {
    const tokens = normalizedQuery.split(' ').filter(Boolean);
    const expanded = new Set<string>();

    const dict = { ...this.baselineSynonyms, ...(customSynonyms || {}) };

    for (const token of tokens) {
      expanded.add(token);
      if (dict[token]) {
        for (const syn of dict[token]) {
          expanded.add(this.normalize(syn));
        }
      }
    }

    return Array.from(expanded);
  },

  /**
   * Detects coarse search intent without private profiling.
   */
  detectIntent(normalizedQuery: string) {
    const knownStates: Record<string, string> = {
      sp: 'SP',
      rj: 'RJ',
      ba: 'BA',
      mg: 'MG',
      pr: 'PR',
      rs: 'RS',
      sc: 'SC',
      df: 'DF',
      pe: 'PE',
      ce: 'CE',
      go: 'GO',
      es: 'ES',
    };

    const knownCities = [
      'salvador',
      'sao paulo',
      'rio de janeiro',
      'belo horizonte',
      'curitiba',
      'porto alegre',
      'florianopolis',
      'brasilia',
      'recife',
      'fortaleza',
      'goiania',
      'vitoria',
    ];

    const tokens = normalizedQuery.split(' ').filter(Boolean);
    let detectedState: string | undefined;
    let detectedCity: string | undefined;
    let detectedCategory: string | undefined;

    // Detect state
    for (const token of tokens) {
      if (knownStates[token]) {
        detectedState = knownStates[token];
        break;
      }
    }

    // Detect city
    for (const city of knownCities) {
      if (normalizedQuery.includes(city)) {
        detectedCity = city;
        break;
      }
    }

    // Detect category
    if (normalizedQuery.includes('massag')) {
      detectedCategory = 'massagem';
    } else if (normalizedQuery.includes('acompanh')) {
      detectedCategory = 'acompanhantes';
    }

    return {
      state: detectedState,
      city: detectedCity,
      category: detectedCategory,
    };
  },
};
