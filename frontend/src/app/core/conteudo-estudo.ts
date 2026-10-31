export interface FonteEstudo {
  titulo: string;
  organizacao: string;
  url: string;
}

export interface BlocoLicao {
  tipo: 'paragrafo' | 'subtitulo' | 'lista' | 'destaque';
  texto: string;
  itens?: string[];
}

export interface LicaoEstudo {
  slug: string;
  titulo: string;
  duracaoMinutos: number;
  resumo: string;
  blocos: BlocoLicao[];
  fontes: FonteEstudo[];
}

export interface CursoEstudo {
  slug: string;
  titulo: string;
  descricao: string;
  tema: string;
  licoes: LicaoEstudo[];
}

const fontesPesquisa: FonteEstudo[] = [
  {
    titulo: 'Organizing Instruction and Study to Improve Student Learning',
    organizacao: 'What Works Clearinghouse · Institute of Education Sciences',
    url: 'https://ies.ed.gov/ncee/wwc/PracticeGuide/1',
  },
  {
    titulo: 'Systematic review of distributed practice and retrieval practice',
    organizacao: 'Advances in Health Sciences Education · acesso aberto',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11078833/',
  },
];

export const CURSOS_ESTUDO: CursoEstudo[] = [
  {
    slug: 'como-estudar',
    titulo: 'Estude com método',
    tema: 'Aprender a aprender',
    descricao:
      'Um começo prático para transformar tempo de estudo em prática organizada, revisão e entendimento.',
    licoes: [
      {
        slug: 'revisao-espacada',
        titulo: 'Distribua o estudo ao longo do tempo',
        duracaoMinutos: 5,
        resumo: 'Planeje reencontros com o conteúdo em dias diferentes, em vez de concentrar tudo de uma vez.',
        blocos: [
          { tipo: 'paragrafo', texto: 'Quando você encontra uma ideia mais de uma vez, depois de um intervalo, precisa reconstruir parte do que aprendeu. Esse esforço ajuda a perceber o que continua claro e o que já precisa de revisão.' },
          { tipo: 'subtitulo', texto: 'Como colocar em prática' },
          { tipo: 'lista', texto: '', itens: ['Escolha um tópico pequeno para estudar hoje.', 'Marque uma revisão curta para outro dia, antes de esquecer completamente o assunto.', 'Nas revisões seguintes, tente explicar ou resolver algo antes de reler as anotações.', 'Ajuste os intervalos ao prazo e à dificuldade; não existe um calendário único que sirva para todo conteúdo.'] },
          { tipo: 'destaque', texto: 'Comece com uma próxima revisão marcada no seu plano. Uma agenda simples que você consegue manter vale mais do que um cronograma perfeito que abandona.' },
        ],
        fontes: fontesPesquisa,
      },
      {
        slug: 'pratica-de-lembrar',
        titulo: 'Tente lembrar antes de reler',
        duracaoMinutos: 6,
        resumo: 'Use perguntas e explicações feitas de memória para descobrir o que você realmente consegue recuperar.',
        blocos: [
          { tipo: 'paragrafo', texto: 'Reler pode dar a sensação de familiaridade sem mostrar se você consegue usar a ideia sem olhar. Feche o material por alguns minutos e tente escrever, falar ou resolver o que lembra. Depois compare com a fonte e corrija as lacunas.' },
          { tipo: 'subtitulo', texto: 'Uma sessão de recuperação' },
          { tipo: 'lista', texto: '', itens: ['Antes de estudar, anote o que já sabe sobre o tópico.', 'Ao terminar uma parte, crie duas ou três perguntas que exijam uma resposta própria.', 'Responda sem consultar o material e marque os pontos incertos.', 'Confira a fonte e volte aos pontos que ficaram incompletos.'] },
          { tipo: 'destaque', texto: 'Errar durante uma prática de baixo risco é uma informação útil: mostra qual parte merece outra explicação ou revisão.' },
        ],
        fontes: fontesPesquisa,
      },
      {
        slug: 'exemplos-e-exercicios',
        titulo: 'Alterne exemplos e exercícios',
        duracaoMinutos: 6,
        resumo: 'Observe uma solução trabalhada e depois tente resolver um problema semelhante por conta própria.',
        blocos: [
          { tipo: 'paragrafo', texto: 'Em assuntos que exigem resolver problemas, um exemplo completo ajuda a enxergar as etapas. Mas acompanhar a solução não confirma que você conseguiria produzi-la. Intercale a leitura de exemplos com tentativas próprias e compare o raciocínio, não apenas a resposta final.' },
          { tipo: 'subtitulo', texto: 'Do exemplo à tentativa' },
          { tipo: 'lista', texto: '', itens: ['Escolha um exemplo e identifique por que cada etapa foi feita.', 'Cubra a solução e tente refazer os passos.', 'Resolva uma questão parecida sem consultar o exemplo.', 'Explique em palavras o que mudou entre os dois problemas.'] },
          { tipo: 'paragrafo', texto: 'Quando um processo for difícil de visualizar, combine uma explicação verbal com um desenho, tabela ou diagrama. Use representações diferentes para esclarecer a mesma ideia, em vez de acrescentar elementos só para decorar.' },
        ],
        fontes: fontesPesquisa,
      },
    ],
  },
];
