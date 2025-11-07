# Advanced Scientific Paper Generator - Manual de Uso

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 1. Introdução

O "Advanced Scientific Paper Generator" é uma aplicação poderosa, alimentada por IA, projetada para simplificar drasticamente o processo de criação de artigos científicos. Começando com um tópico matemático amplo, a ferramenta gera um título de artigo inovador e, em seguida, elabora um documento LaTeX completo com base nesse título. O que realmente diferencia esta ferramenta é o seu sistema de análise multi-iteração, que avalia rigorosamente o artigo gerado em 28 métricas de qualidade distintas. Com base nessas análises, a IA refina iterativamente o artigo, garantindo um alto padrão de qualidade acadêmica e consistência. Para completar, inclui uma ferramenta "Fixer" dedicada para resolver problemas comuns de compilação LaTeX.

Esta ferramenta é ideal para pesquisadores, estudantes e acadêmicos que procuram um assistente inteligente para iniciar seu processo de escrita, refinar rascunhos ou explorar novas direções de pesquisa com insights gerados por IA.

**Autor:** SÉRGIO DE ANDRADE, PAULO
Graduado do Curso de matemática, Faculdade de Guarulhos (FG), Guarulhos, São Paulo.
Email: andradepsa@gmail.com.
ID Lattes: 7286865766488458.
ORCID: https://orcid.org/0009-0004-2555-3178

**DOI (Zenodo):** 10.5281/zenodo.17425500

## 2. Principais Funcionalidades

*   **Geração de Títulos por IA:** Gera um título de artigo de pesquisa novo e de alto impacto a partir de um tópico matemático amplo.
*   **Geração Completa de Artigos em LaTeX:** Produz um artigo científico completo, incluindo resumo, introdução, metodologia, resultados, discussão, conclusão e uma bibliografia formatada, tudo em LaTeX válido.
*   **Análise Iterativa de Qualidade:** Realiza até 12 iterações de análise, avaliando o artigo em 28 métricas de qualidade (ex: Foco no Tópico, Clareza da Escrita, Rigor Metodológico, Precisão Técnica LaTeX).
*   **Melhoria Inteligente do Artigo:** Com base na análise, a IA refina iterativamente o código-fonte LaTeX para abordar as fraquezas identificadas.
*   **Conclusão Antecipada da Análise:** O processo de análise é interrompido precocemente se o artigo atingir um alto padrão de qualidade (sem pontuações "vermelhas"), economizando tempo e recursos computacionais.
*   **Suporte a Múltiplos Idiomas:** Gere artigos e receba feedback em Português, Inglês, Espanhol ou Francês.
*   **Seleção Flexível de Modelos:** Escolha entre modelos de IA "rápidos" (Gemini 2.5 Flash) e "poderosos" (Gemini 2.5 Pro) para diferentes tarefas, otimizando velocidade e qualidade.
*   **Comprimento Ajustável do Artigo:** Especifique o número de páginas desejado para o artigo gerado.
*   **Pesquisa Google como Base (Grounding):** Integra a Pesquisa Google para encontrar fontes acadêmicas relevantes e atualizadas para a geração da bibliografia.
*   **Modal "Fixer" LaTeX:** Uma ferramenta dedicada para diagnosticar e corrigir automaticamente problemas comuns de compilação LaTeX, como escape de caracteres, incompatibilidades de citação e validação do preâmbulo.
*   **Otimização de Custos:** A utilização estratégica de modelos e a parada antecipada minimizam o consumo de tokens da API e os custos operacionais.

## 3. Como Usar o Aplicativo

O aplicativo irá guiá-lo através de um processo claro e intuitivo de três etapas para gerar e refinar seu artigo científico diretamente na interface do Google AI Studio.

### 3.1 Etapa 1: Configuração

Esta seção permite que você configure os parâmetros básicos para o seu artigo e os modelos de IA.

#### 3.1.1 Selecionar Idioma

*   **Objetivo:** Escolher o idioma em que seu artigo será gerado e em que a IA se comunicará.
*   **Como Usar:** Na seção "Step 1: Configuration", você verá botões com bandeiras e nomes de idiomas (ex: "🇬🇧 English", "🇧🇷 Português"). Clique no botão correspondente ao idioma desejado. A interface será atualizada, e todo o conteúdo gerado será nesse idioma.

#### 3.1.2 Escolher Modelos de IA

*   **Objetivo:** Configurar quais modelos de IA a aplicação utilizará para as diferentes fases do processo. Recomendamos seguir as sugestões padrões para o melhor equilíbrio entre velocidade e qualidade.
*   **Como Usar:** Abaixo da seleção de idioma, você encontrará duas categorias:
    *   **Fast Model (for analysis):** Este modelo é mais rápido e eficiente para tarefas de alta frequência, como a análise da qualidade do artigo e a geração inicial do título. `gemini-2.5-flash` é geralmente o padrão e recomendado.
    *   **Powerful Model (for generation):** Este modelo é mais robusto e ideal para tarefas complexas que exigem raciocínio avançado, como a geração do conteúdo inicial do artigo e as melhorias iterativas. `gemini-2.5-pro` é geralmente o padrão e recomendado.
    *   Para cada categoria, clique no botão do modelo que deseja selecionar. Uma breve descrição de cada modelo é fornecida para ajudar na sua escolha.

#### 3.1.3 Definir Comprimento do Artigo

*   **Objetivo:** Determinar o número aproximado de páginas que você deseja para o documento LaTeX final.
*   **Como Usar:** Na parte inferior da seção "Step 1: Configuration", você verá botões com opções de contagem de páginas (ex: "12 Pages", "30 Pages"). Clique na opção desejada. A IA ajustará a profundidade e a extensão do conteúdo para tentar atender a este requisito.

### 3.2 Etapa 2: Gerar Paper

Esta é a etapa crucial onde o processo de geração e análise iterativa do artigo é iniciado.

*   **Objetivo:** Iniciar todo o fluxo de trabalho: geração do título, escrita do artigo e subsequente análise e melhoria iterativa.
*   **Como Usar:** Na seção "Step 2: Gerar Paper", clique no botão **"Gerar paper"**.
*   **Fluxo do Processo (O que esperar):**
    1.  **"Gerando Título..." (Generating Title...):** O aplicativo primeiro irá gerar um título novo e impactante com base em um tópico matemático aleatoriamente selecionado. Você verá este título ser exibido na seção "Results" uma vez que estiver pronto.
    2.  **"Gerando Paper..." (Generating Paper...):** Em seguida, a IA escreverá o artigo científico completo em formato LaTeX, utilizando o título gerado e consultando fontes externas através da Pesquisa Google para embasar o conteúdo e a bibliografia.
    3.  **"Analisando..." (Analyzing...):** O principal processo iterativo começa. A IA analisará o artigo em relação às 28 métricas, fornecerá feedback detalhado e, em seguida, tentará melhorar o artigo. Este ciclo se repetirá por várias iterações (até 12).
*   **Barra de Progresso:** Uma barra de progresso aparecerá na seção "Results", mostrando o andamento geral da geração e análise.
*   **Conclusão Antecipada da Análise:** Se o artigo atingir um alto padrão de qualidade (sem pontuações "vermelhas") antes que todas as iterações sejam concluídas, uma mensagem **"✅ Análise concluída!"** aparecerá, e o processo será interrompido antecipadamente, economizando seu tempo.

### 3.3 Etapa 3: Analisar Resultados

Uma vez que o processo esteja completo (ou tenha sido interrompido precocemente), você poderá revisar os resultados detalhadamente.

#### 3.3.1 Código-Source LaTeX Gerado

*   **Objetivo:** Exibir o código-fonte LaTeX final do seu artigo científico.
*   **Localização:** Este código aparecerá em uma grande área de texto rolável no lado esquerdo da seção "Results".
*   **Importante:** Este é o arquivo que você pode copiar e usar em qualquer editor LaTeX (como Overleaf, TeXmaker, ou compiladores online como LaTeX-online.cc) para gerar seu PDF.

#### 3.3.2 Copiar o Artigo

*   **Objetivo:** Transferir facilmente o código LaTeX para a sua área de transferência para uso em um editor LaTeX externo.
*   **Como Usar:** Clique no botão **"Copy Latex"** (com um ícone de cópia) localizado no canto superior direito da área de texto do código LaTeX. Uma mensagem **"✅ Copied!"** aparecerá brevemente para confirmar o sucesso.

#### 3.3.3 Ferramenta "Fixer" LaTeX

*   **Objetivo:** Corrigir problemas técnicos comuns de compilação no código LaTeX gerado. Esta ferramenta é particularmente útil se você encontrar erros ao tentar compilar o artigo externamente.
*   **Como Usar:**
    1.  Clique no botão **"Fixer"** (ícone de chave inglesa) localizado acima da área de texto do código LaTeX, no lado direito.
    2.  Uma janela modal ("LaTeX Compilation Fixer") será aberta, listando várias opções de correção (ex: "Fix Character Escaping," "Fix Citation Mismatches").
    3.  Marque as caixas ao lado das correções que deseja aplicar.
    4.  Clique em **"Apply Fixes"**. A IA processará o artigo e tentará corrigir os problemas selecionados.
    5.  Uma mensagem **"Fixes applied successfully!"** confirmará as alterações. Você poderá então copiar o código LaTeX atualizado.

#### 3.3.4 Análise Iterativa

*   **Objetivo:** Fornecer um detalhamento minucioso do processo de revisão multi-iteração da IA, mostrando as pontuações e sugestões de melhoria para cada métrica de qualidade.
*   **Localização:** Este painel aparecerá no lado direito da seção "Results".
*   **Entendendo a Exibição:**
    *   **Iterações:** Cada bloco numerado (ex: "═══ ITERATION 1 of 12 ═══") representa uma rodada de análise e melhoria.
    *   **Topic Name (Nome do Tópico):** A métrica de qualidade específica avaliada (ex: "WRITING CLARITY", "METHODOLOGICAL RIGOR").
    *   **Score (Pontuação):** Uma pontuação numérica de 0.0 a 10.0, indicando a qualidade do artigo para aquela métrica.
        *   **Verde (8.5-10.0):** Alta qualidade, pouca ou nenhuma melhoria necessária.
        *   **Amarelo (7.0-8.4):** Qualidade boa, mas com espaço para algumas melhorias.
        *   **Vermelho (0.0-6.9):** Requer atenção significativa e melhorias substanciais.
    *   **Improvement (Sugestão de Melhoria):** Uma sugestão concisa de uma única frase da IA sobre como melhorar o artigo para aquele tópico específico.

#### 3.3.5 Fontes Utilizadas

*   **Objetivo:** Listar as fontes externas da web que a IA utilizou para embasar o conteúdo e gerar a bibliografia do artigo.
*   **Localização:** Abaixo da área de texto do código LaTeX.
*   **Como Usar:** Clique nos links fornecidos para visualizar as páginas de origem originais em seu navegador. Isso permite verificar a proveniência das informações.

## 4. Como Fazer o Upload e Usar no Google AI Studio

Este guia detalha como carregar este projeto para o ambiente de desenvolvimento de aplicativos do Google AI Studio, onde você pode executá-lo diretamente no navegador sem a necessidade de configurações locais complexas.

### 4.1 Pré-requisitos

*   Uma conta Google.
*   Acesso ao [Google AI Studio](https://aistudio.google.com/).
*   Os arquivos completos do projeto "Advanced Scientific Paper Generator" em seu computador local.

### 4.2 Etapas para o Upload

1.  **Acesse o Google AI Studio:**
    *   Abra seu navegador e vá para [https://aistudio.google.com/](https://aistudio.google.com/).
    *   Faça login com sua conta Google, se ainda não o fez.

2.  **Navegue até a Seção "Meus Aplicativos" (ou similar):**
    *   No painel lateral esquerdo do Google AI Studio, procure por uma opção como "Meus Aplicativos", "Projetos" ou "Aplicativos". Clique nela. Esta seção é onde você pode gerenciar seus projetos de aplicativos web.

3.  **Crie um Novo Aplicativo:**
    *   Dentro da seção de aplicativos, procure por um botão como "+ Novo Aplicativo", "Criar Projeto" ou um ícone de adição. Clique nele para iniciar a criação de um novo aplicativo.

4.  **Carregue os Arquivos do Projeto:**
    *   O Google AI Studio solicitará que você carregue os arquivos do seu projeto.
    *   **Opção 1 (Recomendada): Arrastar e Soltar.** Localize a pasta raiz do projeto "Advanced Scientific Paper Generator" em seu computador. Arraste e solte *toda a pasta* diretamente na área designada no Google AI Studio. O sistema fará o upload de todos os arquivos e subpastas automaticamente.
    *   **Opção 2: Selecionar Pasta.** Alternativamente, você pode clicar na opção para "Selecionar Pasta" (ou "Procurar Arquivos") e navegar até a pasta raiz do projeto em seu sistema de arquivos, selecionando-a para upload.
    *   Aguarde até que o upload seja concluído. Você verá uma representação da estrutura do seu projeto no Google AI Studio.

5.  **Configure a Chave da API Gemini:**
    *   **Importante:** Para que o aplicativo funcione, ele precisa acessar sua Chave da API Gemini. O Google AI Studio gerencia isso de forma segura, *sem que você precise alterar o código do aplicativo*.
    *   Após o upload, o Google AI Studio geralmente o levará para a tela de configurações ou detalhes do seu novo aplicativo.
    *   Procure por uma seção relacionada a "Variáveis de Ambiente" ou "Chave da API".
    *   Lá, você verá uma opção para **"Selecionar Chave da API"** ou **"Gerenciar Chaves da API"**. Clique nela.
    *   Selecione uma chave da API Gemini existente ou crie uma nova se necessário. Esta chave será injetada automaticamente no ambiente de execução do seu aplicativo, permitindo que ele se comunique com os modelos Gemini.
    *   Certifique-se de que a API key selecionada tenha permissões para os modelos `gemini-2.5-flash` e `gemini-2.5-pro`.
    *   Um link para a documentação de faturamento pode ser encontrado em: [ai.google.dev/gemini-api/docs/billing](https://ai.google.dev/gemini-api/docs/billing).

6.  **Execute o Aplicativo:**
    *   Com os arquivos carregados e a chave da API configurada, procure por um botão como "Executar Aplicativo", "Preview" ou um ícone de "Play" na interface do Google AI Studio.
    *   Clique neste botão para iniciar o seu "Advanced Scientific Paper Generator". O aplicativo será carregado em uma nova aba ou painel dentro do ambiente do Google AI Studio, pronto para uso, exatamente como descrito na seção "3. Como Usar o Aplicativo".

Agora você pode usar o aplicativo diretamente no ambiente do Google AI Studio!

## 5. Insights Técnicos

### Modelos de IA
A aplicação aproveita o poder dos modelos Gemini do Google:
*   `gemini-2.5-flash`: Utilizado para tarefas mais rápidas e menos intensivas em recursos, como a geração inicial do título e a análise iterativa.
*   `gemini-2.5-pro`: Empregado para tarefas mais complexas e que exigem maior capacidade de raciocínio, como a geração inicial do artigo e as melhorias iterativas detalhadas.

### Grounding (Fundamentação)
A aplicação utiliza a Pesquisa Google como ferramenta de *grounding* para garantir que o conteúdo gerado seja factualmente relevante e atualizado. Quando o artigo inicial é gerado, a IA consulta a Pesquisa Google por fontes acadêmicas relacionadas ao título do artigo e as utiliza para popular a bibliografia.

### Otimização de Custos e Tokens
Para minimizar os custos da API e melhorar a eficiência, o sistema emprega várias estratégias inteligentes:
*   **Seleção Inteligente de Modelos:** Modelos mais rápidos e econômicos (`gemini-2.5-flash`) são utilizados para tarefas frequentes (análise, geração de títulos), enquanto modelos mais poderosos e dispendiosos (`gemini-2.5-pro`) são reservados para etapas críticas de geração e melhoria complexa.
*   **Conclusão Antecipada da Análise:** O loop de análise iterativa é projetado para parar assim que o artigo atinge um nível satisfatório de qualidade (zero pontuações "vermelhas"). Isso evita chamadas desnecessárias à API e reduz significativamente o consumo de tokens.

A tabela abaixo ilustra o impacto dessas otimizações, comparando o custo por iteração e o custo total do ciclo em um cenário de conclusão antecipada.

| Etapa do Processo | Modelo Utilizado | Custo Estimado (Antes) | Custo Estimado (Agora) | Otimização Aplicada |
| :-------------------------- | :------------------------ | :----------------------------- | :------------------------------------- | :-------------------------------------------------------------------------------- |
| Geração de Título | `gemini-2.5-flash` | ~1.500 tokens | **~500 tokens** | Uso de modelo 'flash' em vez de 'pro' para tarefa simples. |
| Geração Inicial do Paper | `gemini-2.5-pro` | ~150.000 tokens | ~150.000 tokens | Modelo 'pro' mantido para máxima qualidade na geração principal. |
| Análise (por iteração) | `gemini-2.5-flash` | ~130.000 tokens | **~45.000 tokens** | Uso de modelo 'flash' e schema JSON para resposta estruturada. |
| Melhoria (por iteração) | `gemini-2.5-pro` | ~140.000 tokens | ~140.000 tokens | Modelo 'pro' mantido para refinamento cirúrgico de alta qualidade. |
| **Ciclo Iterativo Total (Ex: 3 iterações)** | **Misto** | ~2.080.000 tokens (12 iterações) | **~415.000 tokens** | **Conclusão antecipada** ao atingir a qualidade (sem notas vermelhas). |

## 6. Solução de Problemas

*   **"An error occurred: You exceeded your current quota..." (Você excedeu sua cota atual...):** Isso indica que você atingiu um limite de taxa com a API. A aplicação possui lógica de repetição integrada, mas se o problema persistir, aguarde um minuto antes de tentar novamente.
*   **"Failed to parse analysis JSON..." (Falha ao analisar o JSON de análise...):** Este é um erro raro que indica que a resposta da IA para a análise não estava no formato JSON esperado. Tente executar o processo novamente.
*   **Erros de compilação LaTeX (após copiar para um compilador externo):** Use a ferramenta "Fixer" interna (Etapa 3.3.3) para resolver problemas comuns. Se os problemas persistirem, revise cuidadosamente o código-fonte LaTeX em busca de erros de sintaxe.