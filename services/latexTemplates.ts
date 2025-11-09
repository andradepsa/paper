// services/latexTemplates.ts

export const SINGLE_LATEX_TEMPLATE: string =
`\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[brazilian]{babel}
\\usepackage[a4paper, left=3cm, right=2cm, top=3cm, bottom=2cm]{geometry}
\\usepackage{amsmath, amssymb}
\\usepackage{setspace}
\\usepackage{url}
\\usepackage{hyperref}
\\usepackage{ragged2e}

\\hypersetup{
  pdftitle={[TÍTULO DO ARTIGO AQUI]},
  pdfauthor={SÉRGIO DE ANDRADE, PAULO},
  pdfsubject={[RESUMO COMPLETO DO ARTIGO AQUI]},
  pdfkeywords={[PALAVRAS-CHAVE AQUI]}
}

\\title{\\textbf{\\MakeUppercase{[TÍTULO DO ARTIGO AQUI]}}}
\\author{
  SÉRGIO DE ANDRADE, PAULO \\\\
  \\small ORCID: \\url{https://orcid.org/0009-0004-2555-3178}
}
\\date{}

\\begin{document}
\\onehalfspacing

\\maketitle

\\begin{abstract}
[RESUMO COMPLETO DO ARTIGO AQUI]

\\vspace{1em}
\\noindent\\textbf{Palavras-chave:} [PALAVRAS-CHAVE AQUI].
\\end{abstract}

\\section{INTRODUÇÃO}
[CONTEÚDO DA INTRODUÇÃO AQUI]

\\section{REFERENCIAL TEÓRICO}
[CONTEÚDO DO REFERENCIAL TEÓRICO AQUI]

\\section{PROCEDIMENTOS METODOLÓGICOS}
[CONTEÚDO DA METODOLOGIA AQUI]

\\section{ANÁLISE E DISCUSSÃO DOS RESULTADOS}
[CONTEÚDO DOS RESULTADOS E DISCUSSÃO AQUI]

\\section{CONCLUSÃO}
[CONTEÚDO DA CONCLUSÃO AQUI]

\\section*{REFERÊNCIAS}
{\\justify [LISTA DE REFERÊNCIAS BIBLIOGRÁFICAS AQUI]\n}

\\end{document}`;