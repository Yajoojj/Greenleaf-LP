/** Destinos e contatos centralizados (mesma ideia do `site.ts` do k9-lp). */
export const site = {
  appUrl: 'https://greenleaf-mobile.vercel.app/inicio',
  repos: {
    app: 'https://github.com/Yajoojj/Greenleaf-Mobile',
    ia: 'https://github.com/Yajoojj/Axios_Cassava_IA',
    site: 'https://github.com/Yajoojj/Greenleaf-LP',
  },
  /** Pitch do projeto no YouTube ("Grean Leaf PITCH-2026-1"), o mesmo vídeo do site anterior. */
  pitchVideoId: 'Pe9BEsQLYvY',
  /**
   * E-mails institucionais publicados no artigo do projeto.
   * O formulário de contato abre o cliente de e-mail com estes destinatários.
   */
  contactEmails: [
    'yago.rios@aluno.cps.sp.gov.br',
    'carlos.takeshita@aluno.cps.sp.gov.br',
  ],
  institutionUrl: 'https://fatecregistro.cps.sp.gov.br',
} as const;
