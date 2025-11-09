// services/latexTemplates.ts

export const LATEX_TEMPLATES: string[] = [
// The single, universal template for all paper generations.
// This template is based on a standard IMRaD structure with separate Results and Discussion sections,
// which is a gold standard for scientific papers.
`\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{times}
\\usepackage[brazilian]{babel}
\\usepackage[a4paper, left=3cm, right=2cm, top=3cm, bottom=2cm]{geometry}
\\usepackage{amsmath, amssymb, setspace, url, verbatim}
\\usepackage{hyperref}

\\hypersetup{
  pdftitle={[TÍTULO DO ARTIGO AQUI]},
  pdfauthor={SÉRGIO DE ANDRADE, PAULO},
  pdfsubject={[RESUMO COMPLETO DO ARTIGO, EM UM ÚNICO PARÁGRAFO, VAI AQUI]},
  pdfkeywords={[PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3]}
}
\\title{[TÍTULO DO ARTIGO AQUI]}

\\begin{document}
\\onehalfspacing

\\begin{center}
  \\textbf{\\MakeUppercase{[TÍTULO DO ARTIGO AQUI]}}
\\end{center}
\\vspace{1.5cm}
\\begin{flushright}
  SÉRGIO DE ANDRADE, PAULO \\\\
  \\small ORCID: \\url{https://orcid.org/0009-0004-2555-3178}
\\end{flushright}
\\vspace{1.5cm}

\\begin{center}\\textbf{RESUMO}\\end{center}
[RESUMO COMPLETO DO ARTIGO, EM UM ÚNICO PARÁGRAFO, VAI AQUI. O resumo deve apresentar de forma concisa o objetivo, a metodologia, os principais resultados e as conclusões do estudo.]

\\noindent\\textbf{Palavras-chave:} [PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3].

\\section{1 INTRODUÇÃO}
[CONTEÚDO DA INTRODUÇÃO. Esta seção deve ser bem robusta, contextualizando o leitor sobre o tema, apresentando o problema de pesquisa, a relevância e justificativa do estudo, e os objetivos a serem alcançados. Finalize apresentando a estrutura do artigo.]

\\section{2 REVISÃO BIBLIOGRÁFICA}
[CONTEÚDO DA REVISÃO. Apresente uma análise aprofundada e crítica da literatura existente sobre o tema. Discuta os principais conceitos, teorias e trabalhos anteriores, identificando o estado da arte e a lacuna de pesquisa que este trabalho se propõe a preencher. Esta seção deve ser extensa para fornecer uma base sólida para a pesquisa.]
\\subsection{2.1 ESTADO DA ARTE}
[Descreva as pesquisas mais recentes e relevantes na área, destacando os avanços e as direções atuais.]
\\subsection{2.2 LACUNAS E OPORTUNIDADES}
[Identifique claramente o que ainda não foi explorado na literatura e como seu trabalho contribui para preencher essa lacuna.]

\\section{3 MATERIAIS E MÉTODOS}
[CONTEÚDO DA METODOLOGIA. Detalhe os materiais, a abordagem da pesquisa (quantitativa, qualitativa, mista), os procedimentos de coleta de dados e as ferramentas de análise de forma clara e rigorosa, permitindo que outros pesquisadores possam replicar o estudo.]

\\section{4 RESULTADOS}
[APRESENTAÇÃO DOS RESULTADOS. Esta seção deve ser puramente descritiva, apresentando os dados encontrados de forma clara e organizada, sem interpretação. Utilize subseções para cada grupo de resultados, e se possível, tabelas ou figuras (descritas textualmente).]
\\subsection{4.1 RESULTADO EXPERIMENTAL 1}
[Descreva o primeiro conjunto de resultados obtidos.]
\\subsection{4.2 RESULTADO EXPERIMENTAL 2}
[Descreva o segundo conjunto de resultados obtidos.]

\\section{5 DISCUSSÃO}
[DISCUSSÃO DOS RESULTADOS. Nesta seção, você deve interpretar os resultados apresentados na seção anterior. Compare seus achados com a literatura, discuta as implicações teóricas e práticas, e explique o significado de suas descobertas. Esta é a seção onde a sua análise crítica se aprofunda.]

\\section{6 CONSIDERAÇÕES FINAIS}
[CONCLUSÃO DO TRABALHO. Retome a questão de pesquisa e os objetivos. Sumarize as principais conclusões do estudo, reforce a contribuição original do trabalho, aponte as limitações da pesquisa e sugira direções para trabalhos futuros.]

\\section*{REFERÊNCIAS}
[ITEM DA BIBLIOGRAFIA 1]
[ITEM DA BIBLIOGRAFIA 2]
[ITEM DA BIBLIOGRAFIA 3]
[ITEM DA BIBLIOGRAFIA 4]
[ITEM DA BIBLIOGRAFIA 5]
[ITEM DA BIBLIOGRAFIA 6]
[ITEM DA BIBLIOGRAFIA 7]
[ITEM DA BIBLIOGRAFIA 8]
[ITEM DA BIBLIOGRAFIA 9]
[ITEM DA BIBLIOGRAFIA 10]
[ITEM DA BIBLIOGRAFIA 11]
[ITEM DA BIBLIOGRAFIA 12]
[ITEM DA BIBLIOGRAFIA 13]
[ITEM DA BIBLIOGRAFIA 14]
[ITEM DA BIBLIOGRAFIA 15]
[ITEM DA BIBLIOGRAFIA 16]
[ITEM DA BIBLIOGRAFIA 17]
[ITEM DA BIBLIOGRAFIA 18]
[ITEM DA BIBLIOGRAFIA 19]
[ITEM DA BIBLIOGRAFIA 20]

\\end{document}`
];
