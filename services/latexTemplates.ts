// services/latexTemplates.ts

export const LATEX_TEMPLATES: string[] = [
// TEMPLATE 1: Standard 5-Section Structure
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
[RESUMO COMPLETO DO ARTIGO, EM UM ÚNICO PARÁGRAFO, VAI AQUI]

\\noindent\\textbf{Palavras-chave:} [PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3].

\\section{1 INTRODUÇÃO}
[CONTEÚDO DA INTRODUÇÃO AQUI. APRESENTE O TEMA, O PROBLEMA DE PESQUISA, A JUSTIFICATIVA E OS OBJETIVOS DO TRABALHO. ESTA SEÇÃO DEVE SER EXTENSA PARA GARANTIR O NÚMERO DE PÁGINAS.]

\\section{2 REVISÃO DA LITERATURA}
[CONTEÚDO DA REVISÃO DA LITERATURA AQUI. DISCUTA OS TRABALHOS ANTERIORES RELEVANTES, IDENTIFIQUE LACUNAS E POSICIONE O SEU TRABALHO DENTRO DO CAMPO DE ESTUDO. ESTA SEÇÃO DEVE SER EXTENSA E BEM DETALHADA.]
\\subsection{2.1 FUNDAMENTOS TEÓRICOS}
[DETALHE OS CONCEITOS TEÓRICOS QUE EMBASAM A PESQUISA.]
\\subsection{2.2 TRABALHOS CORRELATOS}
[ANALISE CRITICAMENTE OUTROS ESTUDOS DIRETAMENTE RELACIONADOS AO SEU.]

\\section{3 METODOLOGIA}
[CONTEÚDO DA METODOLOGIA AQUI. DESCREVA EM DETALHES OS MÉTODOS, TÉCNICAS E PROCEDIMENTOS UTILIZADOS NA PESQUISA. A DESCRIÇÃO DEVE SER CLARA E PRECISA PARA PERMITIR A REPLICABILIDADE DO ESTUDO.]

\\section{4 RESULTADOS E DISCUSSÃO}
[APRESENTE E ANALISE OS RESULTADOS OBTIDOS. INTERPRETE OS DADOS, COMPARE-OS COM A LITERATURA E DISCUTA SUAS IMPLICAÇÕES. ESTA É UMA DAS SEÇÕES MAIS IMPORTANTES E DEVE SER BASTANTE EXTENSA.]
\\subsection{4.1 ANÁLISE PRELIMINAR}
[APRESENTE OS RESULTADOS INICIAIS OU DADOS BRUTOS.]
\\subsection{4.2 ANÁLISE APROFUNDADA}
[DISCUTA AS DESCOBERTAS MAIS SIGNIFICATIVAS E SUAS CONSEQUÊNCIAS TEÓRICAS E PRÁTICAS.]

\\section{5 CONCLUSÃO}
[CONTEÚDO DA CONCLUSÃO AQUI. RECAPITULE OS PONTOS PRINCIPAIS DO ARTIGO, REAFIRME A CONTRIBUIÇÃO DO TRABALHO E SUGIRA PESQUISAS FUTURAS.]

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

\\end{document}`,

// TEMPLATE 2: Structure with dedicated Theoretical Framework section
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
  pdfkeywords={[PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3], [PALAVRA-CHAVE 4]}
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
[RESUMO COMPLETO DO ARTIGO, EM UM ÚNICO PARÁGRAFO, VAI AQUI]

\\noindent\\textbf{Palavras-chave:} [PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3], [PALAVRA-CHAVE 4].

\\section{1 INTRODUÇÃO}
[CONTEÚDO DA INTRODUÇÃO AQUI. Apresente o contexto geral, a relevância do tema, a formulação do problema e os objetivos específicos da pesquisa. A estrutura do restante do artigo deve ser brevemente mencionada.]

\\section{2 FUNDAMENTAÇÃO TEÓRICA}
[CONTEÚDO DA FUNDAMENTAÇÃO TEÓRICA AQUI. Apresente em profundidade os conceitos, teorias e modelos que formam a base da sua pesquisa. Esta seção deve ser bem desenvolvida para fornecer o alicerce necessário para a metodologia e análise.]
\\subsection{2.1 CONCEITOS CHAVE}
[Defina e explique os principais conceitos utilizados no trabalho.]
\\subsection{2.2 MODELOS ANALÍTICOS}
[Descreva os modelos ou frameworks teóricos que serão aplicados ou discutidos.]

\\section{3 TRABALHOS RELACIONADOS}
[CONTEÚDO DOS TRABALHOS RELACIONADOS AQUI. Realize uma revisão crítica da literatura, comparando e contrastando diferentes abordagens e resultados de outros autores, e identificando a lacuna que seu trabalho pretende preencher.]

\\section{4 METODOLOGIA DE PESQUISA}
[CONTEÚDO DA METODOLOGIA AQUI. Detalhe o desenho da pesquisa, os instrumentos utilizados, os procedimentos de coleta e análise de dados. A clareza e o rigor metodológico são cruciais nesta seção.]

\\section{5 ANÁLISE E INTERPRETAÇÃO DOS DADOS}
[APRESENTE OS DADOS COLETADOS E A ANÁLISE REALIZADA. Utilize subseções para organizar os diferentes aspectos da análise. Discuta o significado dos resultados à luz da fundamentação teórica.]
\\subsection{5.1 RESULTADOS QUANTITATIVOS}
[Apresente análises estatísticas, gráficos ou tabelas, se aplicável.]
\\subsection{5.2 RESULTADOS QUALITATIVOS}
[Apresente análises de conteúdo, estudos de caso, ou outras abordagens qualitativas.]

\\section{6 CONCLUSÕES}
[SINTETIZE AS PRINCIPAIS DESCOBERTAS DO ESTUDO, RETOMANDO OS OBJETIVOS PROPOSTOS NA INTRODUÇÃO. DISCUTA AS LIMITAÇÕES DA PESQUISA E APONTE CAMINHOS PARA TRABALHOS FUTUROS.]

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

\\end{document}`,

// TEMPLATE 3: Separate Results and Discussion
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
  pdfkeywords={[PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2]}
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
[RESUMO COMPLETO DO ARTIGO, EM UM ÚNICO PARÁGRAFO, VAI AQUI]

\\noindent\\textbf{Palavras-chave:} [PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2].

\\section{1 INTRODUÇÃO}
[CONTEÚDO DA INTRODUÇÃO. Deve ser bem robusto, contextualizando o leitor sobre o tema e a importância da pesquisa.]

\\section{2 REVISÃO BIBLIOGRÁFICA}
[CONTEÚDO DA REVISÃO. Apresente uma análise aprofundada da literatura existente, mostrando o estado da arte e onde seu trabalho se encaixa.]
\\subsection{2.1 ESTADO DA ARTE}
[Descreva as pesquisas mais recentes e relevantes na área.]
\\subsection{2.2 LACUNAS E OPORTUNIDADES}
[Identifique claramente o que ainda não foi explorado e como seu trabalho contribui.]

\\section{3 MATERIAIS E MÉTODOS}
[CONTEÚDO DA METODOLOGIA. Detalhe os materiais, a amostra, os procedimentos e as ferramentas de análise de forma extremamente clara.]

\\section{4 RESULTADOS}
[APRESENTAÇÃO DOS RESULTADOS. Esta seção deve ser puramente descritiva, apresentando os dados encontrados sem interpretação. Use subseções para cada grupo de resultados.]
\\subsection{4.1 RESULTADO EXPERIMENTAL 1}
[Descreva o primeiro conjunto de resultados.]
\\subsection{4.2 RESULTADO EXPERIMENTAL 2}
[Descreva o segundo conjunto de resultados.]

\\section{5 DISCUSSÃO}
[DISCUSSÃO DOS RESULTADOS. Aqui você deve interpretar os resultados apresentados na seção anterior, compará-los com a literatura, discutir suas implicações e explicar suas descobertas.]

\\section{6 CONSIDERAÇÕES FINAIS}
[CONCLUSÃO DO TRABALHO. Retome a questão de pesquisa, sumarize as conclusões, aponte as limitações e sugira trabalhos futuros.]

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

\\end{document}`,

// TEMPLATE 4: More Subsections for Deeper Detail
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
  pdfkeywords={[PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3], [PALAVRA-CHAVE 4], [PALAVRA-CHAVE 5]}
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
[RESUMO COMPLETO DO ARTIGO, EM UM ÚNICO PARÁGRAFO, VAI AQUI]

\\noindent\\textbf{Palavras-chave:} [PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3], [PALAVRA-CHAVE 4], [PALAVRA-CHAVE 5].

\\section{1 INTRODUÇÃO}
[CONTEÚDO DA INTRODUÇÃO.]
\\subsection{1.1 CONTEXTUALIZAÇÃO}
[Apresente o contexto mais amplo da pesquisa.]
\\subsection{1.2 PROBLEMATIZAÇÃO E JUSTIFICATIVA}
[Exponha o problema de pesquisa e por que ele é importante.]
\\subsection{1.3 OBJETIVOS}
[Liste o objetivo geral e os objetivos específicos.]

\\section{2 REFERENCIAL TEÓRICO}
[CONTEÚDO DO REFERENCIAL TEÓRICO. Deve ser uma seção densa e longa.]
\\subsection{2.1 TEORIA PRINCIPAL}
[Aprofunde a teoria central que guia o estudo.]
\\subsection{2.2 TEORIAS SECUNDÁRIAS}
[Discuta outras teorias que complementam a análise.]
\\subsection{2.3 ESTUDOS EMPÍRICOS RELEVANTES}
[Apresente e critique estudos de caso ou pesquisas empíricas anteriores.]

\\section{3 PROCEDIMENTOS METODOLÓGICOS}
[CONTEÚDO DA METODOLOGIA.]
\\subsection{3.1 ABORDAGEM DA PESQUISA}
[Qualitativa, quantitativa ou mista?]
\\subsection{3.2 UNIVERSO E AMOSTRA}
[Descreva a população e a amostra estudada.]
\\subsection{3.3 COLETA E ANÁLISE DE DADOS}
[Detalhe as técnicas e ferramentas utilizadas.]

\\section{4 ANÁLISE E DISCUSSÃO DOS RESULTADOS}
[CONTEÚDO DOS RESULTADOS E DISCUSSÃO.]
\\subsection{4.1 DESCRIÇÃO DOS DADOS}
[Apresente uma visão geral dos dados coletados.]
\\subsection{4.2 INTERPRETAÇÃO DOS ACHADOS}
[Interprete os resultados à luz da teoria.]
\\subsection{4.3 IMPLICAÇÕES DOS RESULTADOS}
[Discuta as consequências práticas e teóricas das suas descobertas.]

\\section{5 CONCLUSÃO}
[SÍNTESE FINAL DO TRABALHO. Retome os principais pontos, reafirme a contribuição, indique limitações e sugestões para o futuro.]

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

\\end{document}`,

// TEMPLATE 5: Case Study Structure
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
[RESUMO COMPLETO DO ARTIGO, EM UM ÚNICO PARÁGRAFO, VAI AQUI]

\\noindent\\textbf{Palavras-chave:} [PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3].

\\section{1 INTRODUÇÃO}
[CONTEÚDO DA INTRODUÇÃO. Contextualize o estudo de caso, sua relevância e as questões de pesquisa que ele busca responder.]

\\section{2 REFERENCIAL TEÓRICO E CONCEITUAL}
[BASE TEÓRICA para a análise do estudo de caso. Apresente os conceitos que serão usados para interpretar o caso.]

\\section{3 METODOLOGIA: O ESTUDO DE CASO}
[METODOLOGIA. Descreva por que o estudo de caso foi escolhido, como o caso foi selecionado, e como os dados foram coletados e analisados.]

\\section{4 APRESENTAÇÃO DO CASO}
[DESCRIÇÃO DO CASO. Apresente o caso em detalhes, fornecendo todo o contexto necessário para a análise subsequente. Esta seção deve ser rica em detalhes descritivos.]
\\subsection{4.1 CONTEXTO HISTÓRICO E ORGANIZACIONAL}
[Descreva o ambiente e a história do caso estudado.]
\\subsection{4.2 O FENÔMENO OBSERVADO}
[Detalhe o evento, processo ou situação que é o foco do estudo.]

\\section{5 ANÁLISE E DISCUSSÃO DO CASO}
[ANÁLISE DO CASO. Aplique o referencial teórico para analisar o caso apresentado. Interprete os eventos e discuta as implicações.]

\\section{6 CONCLUSÕES E RECOMENDAÇÕES}
[CONCLUSÃO. Sumarize as lições aprendidas com o estudo de caso, discuta a generalização dos achados e forneça recomendações práticas ou teóricas.]

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

\\end{document}`,

// TEMPLATE 6: 7-Section structure for more granularity
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
  pdfkeywords={[PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3], [PALAVRA-CHAVE 4]}
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
[RESUMO COMPLETO DO ARTIGO, EM UM ÚNICO PARÁGRAFO, VAI AQUI]

\\noindent\\textbf{Palavras-chave:} [PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3], [PALAVRA-CHAVE 4].

\\section{1 APRESENTAÇÃO INICIAL}
[INTRODUÇÃO. Apresente o tema de forma ampla e cativante para o leitor.]

\\section{2 CONTEXTO DA PESQUISA}
[REVISÃO DA LITERATURA. Detalhe o contexto científico e os trabalhos anteriores que levaram à sua pesquisa.]

\\section{3 DELINEAMENTO METODOLÓGICO}
[METODOLOGIA. Explique a abordagem e o design da pesquisa de forma clara e justificada.]

\\section{4 COLETA E PREPARAÇÃO DOS DADOS}
[PROCEDIMENTOS. Descreva como os dados foram coletados, organizados e preparados para a análise.]

\\section{5 ANÁLISE DOS DADOS}
[RESULTADOS. Apresente a análise dos dados de forma objetiva, usando subseções para organizar as diferentes etapas da análise.]
\\subsection{5.1 ANÁLISE DESCRITIVA}
[Estatísticas descritivas ou descrição inicial dos dados.]
\\subsection{5.2 ANÁLISE INFERENCIAL}
[Testes de hipótese, modelagem ou outras análises mais profundas.]

\\section{6 DISCUSSÃO E IMPLICAÇÕES}
[DISCUSSÃO. Conecte seus achados com a literatura e discuta as implicações teóricas e práticas do seu estudo.]

\\section{7 CONSIDERAÇÕES FINAIS E TRABALHOS FUTUROS}
[CONCLUSÃO. Finalize o artigo com uma síntese forte, reconhecendo limitações e apontando para o futuro.]

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

\\end{document}`,

// TEMPLATE 7: Simple and Direct Structure
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
\\title={[TÍTULO DO ARTIGO AQUI]}

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
[RESUMO COMPLETO DO ARTIGO, EM UM ÚNICO PARÁGRAFO, VAI AQUI]

\\noindent\\textbf{Palavras-chave:} [PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3].

\\section{1 INTRODUÇÃO}
[CONTEÚDO DA INTRODUÇÃO. Apresentação do tema, problema, justificativa e objetivos.]

\\section{2 FUNDAMENTAÇÃO}
[CONTEÚDO DO REFERENCIAL TEÓRICO. Uma seção robusta combinando revisão de literatura e conceitos teóricos.]
\\subsection{2.1 PRINCIPAIS AUTORES E TEORIAS}
[Discuta os autores e teorias seminais na área.]
\\subsection{2.2 ESTUDOS RECENTES}
[Analise as contribuições mais atuais para o tema.]

\\section{3 MÉTODO}
[CONTEÚDO DA METODOLOGIA. Descrição clara e concisa do caminho percorrido na pesquisa.]

\\section{4 ANÁLISE E DISCUSSÃO}
[CONTEÚDO DE RESULTADOS E DISCUSSÃO. Apresente os resultados e imediatamente os discuta em relação à teoria. Esta seção deve ser a mais longa do artigo.]

\\section{5 CONCLUSÃO}
[CONTEÚDO DA CONCLUSÃO. Síntese final, limitações e sugestões para pesquisas futuras.]

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

\\end{document}`,

// TEMPLATE 8: Review Article Structure
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
  pdfkeywords={[PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3], [PALAVRA-CHAVE 4]}
}
\\title={[TÍTULO DO ARTIGO AQUI]}

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
[RESUMO COMPLETO DO ARTIGO, EM UM ÚNICO PARÁGRAFO, VAI AQUI]

\\noindent\\textbf{Palavras-chave:} [PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3], [PALAVRA-CHAVE 4].

\\section{1 INTRODUÇÃO}
[Introduza o tema da revisão, sua importância e os critérios de seleção da literatura.]

\\section{2 EVOLUÇÃO HISTÓRICA DO CAMPO}
[Apresente uma perspectiva histórica sobre o desenvolvimento do tema de pesquisa.]

\\section{3 PRINCIPAIS CORRENTES TEÓRICAS}
[Discuta e compare as principais escolas de pensamento ou abordagens teóricas sobre o tema.]
\\subsection{3.1 ABORDAGEM A}
[Detalhe a primeira corrente teórica.]
\\subsection{3.2 ABORDAGEM B}
[Detalhe a segunda corrente teórica.]

\\section{4 ANÁLISE CRÍTICA DA LITERATURA RECENTE}
[Analise os estudos mais recentes (últimos 5-10 anos), identificando tendências, consensos e controvérsias.]

\\section{5 DEBATES ATUAIS E QUESTÕES EM ABERTO}
[Destaque os principais debates e as perguntas de pesquisa que ainda não foram respondidas.]

\\section{6 AGENDA DE PESQUISA FUTURA}
[Proponha direções para futuras investigações, sugerindo novos problemas, métodos ou abordagens.]

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

\\end{document}`,

// TEMPLATE 9: Problem-Solution Structure
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
[RESUMO COMPLETO DO ARTIGO, EM UM ÚNICO PARÁGRAFO, VAI AQUI]

\\noindent\\textbf{Palavras-chave:} [PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3].

\\section{1 DESCRIÇÃO DO PROBLEMA}
[INTRODUÇÃO. Apresente em detalhes o problema que será abordado, sua relevância e as dificuldades associadas a ele.]

\\section{2 ANÁLISE DE SOLUÇÕES EXISTENTES}
[REVISÃO DA LITERATURA. Discuta as tentativas anteriores de resolver este problema, destacando suas forças e fraquezas.]

\\section{3 A PROPOSTA DE SOLUÇÃO}
[METODOLOGIA. Apresente sua nova solução, modelo ou algoritmo em detalhes. Esta seção deve ser o coração do artigo.]
\\subsection{3.1 ARQUITETURA DA SOLUÇÃO}
[Descreva os componentes da sua proposta.]
\\subsection{3.2 FUNDAMENTAÇÃO DA PROPOSTA}
[Explique por que sua proposta é inovadora e teoricamente sólida.]

\\section{4 VALIDAÇÃO DA PROPOSTA}
[RESULTADOS. Apresente os resultados da aplicação da sua solução. Isso pode incluir experimentos, simulações, provas, etc.]
\\subsection{4.1 CENÁRIO DE TESTE}
[Descreva como a solução foi testada.]
\\subsection{4.2 ANÁLISE COMPARATIVA}
[Compare o desempenho da sua solução com as existentes.]

\\section{5 DISCUSSÃO E LIMITAÇÕES}
[DISCUSSÃO. Discuta o que os resultados significam e quais são as limitações da sua proposta.]

\\section{6 CONCLUSÃO}
[CONCLUSÃO. Sumarize a contribuição do trabalho e aponte direções futuras.]

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

\\end{document}`,

// TEMPLATE 10: Theoretical/Conceptual Paper Structure
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
  pdfkeywords={[PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3], [PALAVRA-CHAVE 4]}
}
\\title={[TÍTULO DO ARTIGO AQUI]}

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
[RESUMO COMPLETO DO ARTIGO, EM UM ÚNICO PARÁGRAFO, VAI AQUI]

\\noindent\\textbf{Palavras-chave:} [PALAVRA-CHAVE 1], [PALAVRA-CHAVE 2], [PALAVRA-CHAVE 3], [PALAVRA-CHAVE 4].

\\section{1 PROPOSIÇÃO INTRODUTÓRIA}
[INTRODUÇÃO. Apresente o conceito ou a teoria que será desenvolvida no artigo.]

\\section{2 CONTEXTO FILOSÓFICO E CIENTÍFICO}
[REVISÃO. Discuta as ideias e teorias que levaram à sua proposição.]

\\section{3 DESENVOLVIMENTO DO NOVO CONCEITO}
[DESENVOLVIMENTO. Elabore a sua nova teoria ou conceito em detalhes. Esta é a seção principal e deve ser densa e bem argumentada.]
\\subsection{3.1 AXIOMAS E PRINCÍPIOS}
[Liste os fundamentos da sua teoria.]
\\subsection{3.2 COROLÁRIOS E DEDUÇÕES}
[Desenvolva as consequências lógicas da sua teoria.]
\\subsection{3.3 COMPARAÇÃO COM MODELOS EXISTENTES}
[Mostre como seu conceito se diferencia e avança em relação às teorias atuais.]

\\section{4 IMPLICAÇÕES E APLICAÇÕES POTENCIAIS}
[DISCUSSÃO. Explore as possíveis consequências da sua teoria para o campo de estudo e outras áreas.]

\\section{5 CONCLUSÃO E PERSPECTIVAS FUTURAS}
[CONCLUSÃO. Recapitule a importância do novo conceito e sugira como ele pode ser testado ou desenvolvido no futuro.]

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
