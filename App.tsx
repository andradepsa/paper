
import React, { useState, useEffect, useRef } from 'react';
import { generateInitialPaper, analyzePaper, improvePaper, generatePaperTitle, fixLatexPaper, reformatPaperWithStyleGuide, expandPaperContent, ensureAbntFormatting } from './services/geminiService';
import type { Language, IterationAnalysis, PaperSource, AnalysisResult, StyleGuide } from './types';
import { LANGUAGES, AVAILABLE_MODELS, ANALYSIS_TOPICS, MATH_TOPICS, FIX_OPTIONS, STYLE_GUIDES } from './constants';
import { addSuccessfulCompilation, addFailedCompilation } from './services/compilationExamples';

import LanguageSelector from './components/LanguageSelector';
import ModelSelector from './components/ModelSelector';
import PageSelector from './components/PageSelector';
import ActionButton from './components/ActionButton';
import ProgressBar from './components/ProgressBar';
import ResultsDisplay from './components/ResultsDisplay';
import SourceDisplay from './components/SourceDisplay';
import LatexCompiler from './components/LatexCompiler';
import ApiKeyModal from './components/ApiKeyModal';
import StyleGuideSelector from './components/StyleGuideSelector';
// Fix: Import ZenodoUploader component and its Ref type to resolve the "Cannot find name 'ZenodoUploader'" error.
import ZenodoUploader, { type ZenodoUploaderRef } from './components/ZenodoUploader';
// FIX: Add missing imports for Header and Section components.
import Header from './components/Header';
import Section from './components/Section';

// This is needed for the pdf.js script loaded in index.html
declare const pdfjsLib: any;

type Author = {
    name: string;
    affiliation: string;
    orcid: string;
};

type ArticleLogEntry = {
    id: string;
    status: 'published' | 'unpublished' | 'compilation-failed';
    title: string;
    date: string;
    // For published
    doi?: string;
    link?: string;
    // For unpublished or compilation-failed
    latexCode?: string;
    // For unpublished
    pdfBase64?: string;
};


// Main App Component
const App: React.FC = () => {
    console.log('App component rendering...'); // Diagnostic log
    // Overall workflow step
    const [step, setStep] = useState(1);
    const [isApiModalOpen, setIsApiModalOpen] = useState(false);

    // == STEP 1: GENERATION STATE ==
    const [language, setLanguage] = useState<Language>('pt');
    const [generationModel, setGenerationModel] = useState('gemini-2.5-pro');
    const [analysisModel, setAnalysisModel] = useState('gemini-2.5-flash');
    const [pageCount, setPageCount] = useState(12);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationStatus, setGenerationStatus] = useState('');
    const [generatedTitle, setGeneratedTitle] = useState('');
    const [analysisResults, setAnalysisResults] = useState<IterationAnalysis[]>([]);
    const [paperSources, setPaperSources] = useState<PaperSource[]>([]);
    const [finalLatexCode, setFinalLatexCode] = useState('');
    const [isGenerationComplete, setIsGenerationComplete] = useState(false);
    const isGenerationCancelled = useRef(false);
    const [numberOfArticles, setNumberOfArticles] = useState(1);
    const [articlesLog, setArticlesLog] = useState<ArticleLogEntry[]>(() => {
        try {
            const stored = localStorage.getItem('published_articles_log');
            const parsed = stored ? JSON.parse(stored) : [];
            // Migration logic for old format to new ArticleLogEntry format
            return parsed.map((item: any) => {
                if (!item.status) { // Old format detected
                    return {
                        id: item.doi + Math.random(), // Use DOI + random for a pseudo-ID
                        status: 'published',
                        title: item.title,
                        date: item.date,
                        doi: item.doi,
                        link: item.link,
                    };
                }
                return item; // Already new format
            });
        } catch {
            return [];
        }
    });

    // == STEP 2: COMPILE STATE ==
    const [latexCode, setLatexCode] = useState(`% O código LaTeX gerado aparecerá aqui.`);
    const [compilationStatus, setCompilationStatus] = useState<React.ReactNode>(null);
    const [isCompiling, setIsCompiling] = useState(false);
    const [compileMethod, setCompileMethod] = useState<'texlive' | 'overleaf'>('texlive');
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
    const [compiledPdfFile, setCompiledPdfFile] = useState<File | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<StyleGuide>('abnt');
    const [isReformatting, setIsReformatting] = useState(false);
    const [editingArticleId, setEditingArticleId] = useState<string | null>(null);


    // == STEP 3: UPLOAD STATE ==
    const [extractedMetadata, setExtractedMetadata] = useState({
        title: '',
        abstract: '',
        authors: [] as Author[],
        keywords: ''
    });
    const [useSandbox, setUseSandbox] = useState(false);
    // Initialize Zenodo token from localStorage
    const [zenodoToken, setZenodoToken] = useState(() => localStorage.getItem('zenodo_api_key') || '');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<React.ReactNode>(null);
    const [keywordsInput, setKeywordsInput] = useState('');
    const [republishingId, setRepublishingId] = useState<string | null>(null);
    
    // == SCHEDULER STATE ==
    const [isSchedulerActive, setIsSchedulerActive] = useState(() => {
        return localStorage.getItem('schedulerActive') === 'true';
    });
    const schedulerTimeoutRef = useRef<number | null>(null);
    const uploaderRef = useRef<ZenodoUploaderRef>(null);

    // == STEP 4: PUBLISHED ARTICLES STATE ==
    const [filter, setFilter] = useState({ day: '', month: '', year: '' });
    
    // Effect for pdf.js worker
    useEffect(() => {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }, []);
    
    // Update zenodoToken in localStorage whenever it changes
    useEffect(() => {
        if (zenodoToken) {
            localStorage.setItem('zenodo_api_key', zenodoToken);
        } else {
            localStorage.removeItem('zenodo_api_key');
        }
    }, [zenodoToken]);

    // Effect to save articles log to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('published_articles_log', JSON.stringify(articlesLog));
        } catch (error) {
            console.error("Failed to save articles log to localStorage", error);
        }
    }, [articlesLog]);

    useEffect(() => {
        // If we navigate away from the editing/publishing flow back to the start,
        // clear any article ID we were tracking to avoid accidental updates.
        if (step === 1) {
            setEditingArticleId(null);
        }
    }, [step]);


    // Effect for the daily scheduler
    useEffect(() => {
        const scheduleNextRun = () => {
            if (schedulerTimeoutRef.current) {
                clearTimeout(schedulerTimeoutRef.current);
            }

            const now = new Date();
            const nextRun = new Date(now);
            nextRun.setHours(3, 0, 0, 0); // Set to 3:00:00 AM

            if (now >= nextRun) {
                // If it's already past 3 AM today, schedule for 3 AM tomorrow
                nextRun.setDate(nextRun.getDate() + 1);
            }

            const timeoutMs = nextRun.getTime() - now.getTime();
            
            console.log(`Scheduling next automated run for ${nextRun.toLocaleString()}`);

            schedulerTimeoutRef.current = window.setTimeout(() => {
                console.log(`[${new Date().toLocaleString()}] Triggering scheduled daily run...`);
                handleFullAutomation(7); // Run with 7 articles
                // After running, schedule the next one for the following day
                scheduleNextRun();
            }, timeoutMs);
        };

        if (isSchedulerActive) {
            scheduleNextRun();
        } else {
            if (schedulerTimeoutRef.current) {
                clearTimeout(schedulerTimeoutRef.current);
                console.log("Daily scheduler deactivated and cleared.");
            }
        }

        // Cleanup on component unmount
        return () => {
            if (schedulerTimeoutRef.current) {
                clearTimeout(schedulerTimeoutRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSchedulerActive]); // This effect depends only on the active status

    // FIX: Add the missing extractMetadata function to parse LaTeX content.
    const extractMetadata = (latex: string): { title: string, abstract: string, authors: Author[], keywords: string } => {
        const getMatch = (regex: RegExp) => (latex.match(regex) || [])[1] || '';
    
        const title = getMatch(/pdftitle=\{([^}]+)\}/);
        const abstract = getMatch(/pdfsubject=\{([^}]+)\}/);
        const keywords = getMatch(/pdfkeywords=\{([^}]+)\}/);
        const authorBlock = getMatch(/pdfauthor=\{([^}]+)\}/);
        
        const authors: Author[] = [];
        if (authorBlock) {
             const orcidMatch = latex.match(/ORCID:\\s*\\url\{https?:\/\/orcid\.org\/([^}]+)\}/);
             authors.push({
                 name: authorBlock,
                 affiliation: '', // This info is not in the hypersetup block
                 orcid: orcidMatch ? orcidMatch[1] : ''
             });
        }
    
        return {
            title: title.trim(),
            abstract: abstract.trim(),
            authors: authors,
            keywords: keywords.trim().split(/,\\s*|\\s*,\\s*/).join(', ')
        };
    };

    const getScoreClass = (score: number) => {
        if (score >= 8.5) return 'bg-green-500';
        if (score >= 7.0) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // New function for robust compilation with retries and auto-fixing
    const robustCompile = async (
        codeToCompile: string,
        onStatusUpdate: (message: string) => void
    ): Promise<{ pdfFile: File; pdfUrl: string; finalCode: string; }> => {
        try {
            const MAX_COMPILE_ATTEMPTS = 3;
            let lastError: Error | null = null;
            let lastLog: string | undefined = undefined;

            // --- Part 1: Initial Compilation Attempts ---
            for (let attempt = 1; attempt <= MAX_COMPILE_ATTEMPTS; attempt++) {
                try {
                    onStatusUpdate(`⏳ Compilando (Tentativa ${attempt}/${MAX_COMPILE_ATTEMPTS})...`);
                    const response = await fetch('/compile-latex', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ latex: codeToCompile }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        lastLog = errorData.log; // Capture the log file
                        throw new Error(errorData.error || `Falha na compilação (tentativa ${attempt}).`);
                    }
                    
                    const base64Pdf = await response.text();
                    const pdfUrl = `data:application/pdf;base64,${base64Pdf}`;
                    const blob = await (await fetch(pdfUrl)).blob();
                    const file = new File([blob], "paper.pdf", { type: "application/pdf" });
                    
                    addSuccessfulCompilation(codeToCompile);
                    return { pdfFile: file, pdfUrl, finalCode: codeToCompile };

                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    console.warn(`Compilation attempt ${attempt} failed:`, lastError.message);
                    if (attempt < MAX_COMPILE_ATTEMPTS) {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }
                }
            }
            
            // --- Part 2: Automatic Fix and Final Attempt ---
            if (lastError) {
                onStatusUpdate(`⚠️ Compilação falhou. Tentando corrigir o código com IA...`);
                
                let fixedCode = '';
                try {
                    fixedCode = await fixLatexPaper(
                        codeToCompile, 
                        FIX_OPTIONS, // Use all available fix options
                        analysisModel, // Use the faster model for fixing
                        lastLog // Pass the captured log to the AI
                    );
                } catch (fixError) {
                    const fixErrorMessage = fixError instanceof Error ? fixError.message : String(fixError);
                    throw new Error(`A compilação falhou e a tentativa de correção automática também falhou. Erro original: ${lastError.message}. Erro da correção: ${fixErrorMessage}`);
                }

                onStatusUpdate(`✅ Código corrigido. Tentando compilação final...`);
                try {
                    const response = await fetch('/compile-latex', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ latex: fixedCode }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'A compilação final falhou mesmo após a correção automática.');
                    }

                    const base64Pdf = await response.text();
                    const pdfUrl = `data:application/pdf;base64,${base64Pdf}`;
                    const blob = await (await fetch(pdfUrl)).blob();
                    const file = new File([blob], "paper.pdf", { type: "application/pdf" });

                    addSuccessfulCompilation(fixedCode);
                    return { pdfFile: file, pdfUrl, finalCode: fixedCode };
                    
                } catch (finalCompileError) {
                    const finalErrorMessage = finalCompileError instanceof Error ? finalCompileError.message : String(finalCompileError);
                    throw new Error(`A compilação falhou após a correção automática. Erro final: ${finalErrorMessage}`);
                }
            }
            throw new Error("Falha na compilação após todas as tentativas.");
        } catch(error) {
            addFailedCompilation(codeToCompile);
            throw error; // Re-throw the error to be handled by the calling function
        }
    };
    
    // File utility helpers
    const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });

    const base64ToFile = (base64: string, filename: string, mimeType: string = 'application/pdf'): File => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        return new File([blob], filename, { type: mimeType });
    };

    // Refactored upload logic
    const uploadArticleToZenodo = async (
        compiledFile: File, 
        articleLatexCode: string, 
        statusUpdater: (message: string) => void
    ) => {
        const storedToken = localStorage.getItem('zenodo_api_key') || zenodoToken;
        if (!storedToken) {
            throw new Error("Token Zenodo não encontrado. Configure-o nas definições.");
        }
        
        statusUpdater("Publicando no Zenodo...");
        const metadataForUpload = extractMetadata(articleLatexCode);

        const MAX_UPLOAD_RETRIES = 10;
        for (let attempt = 1; attempt <= MAX_UPLOAD_RETRIES; attempt++) {
            try {
                const baseUrl = useSandbox ? 'https://sandbox.zenodo.org/api' : 'https://zenodo.org/api';
                
                statusUpdater(`Etapa 1: Criando novo depósito... (Tentativa ${attempt})`);
                const createResponse = await fetch(`${baseUrl}/deposit/depositions`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${storedToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                if (!createResponse.ok) {
                     const errorData = await createResponse.json();
                     throw new Error(`Erro ${createResponse.status}: Falha ao criar depósito. ${JSON.stringify(errorData.errors)}`);
                }
                const deposit = await createResponse.json();
                statusUpdater(`Depósito criado com sucesso. ID: ${deposit.id}`);

                statusUpdater(`Etapa 2: Enviando arquivo "paper.pdf"...`);
                const formData = new FormData();
                formData.append('file', compiledFile, 'paper.pdf');
                const uploadResponse = await fetch(`${baseUrl}/deposit/depositions/${deposit.id}/files`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${storedToken}` },
                    body: formData
                });
                if (!uploadResponse.ok) throw new Error('Falha no upload do PDF');
                statusUpdater(`Upload do arquivo concluído.`);

                const keywordsArray = metadataForUpload.keywords.split(',').map(k => k.trim()).filter(k => k);
                const metadataPayload = {
                    metadata: {
                        title: metadataForUpload.title,
                        upload_type: 'publication',
                        publication_type: 'article',
                        description: metadataForUpload.abstract,
                        creators: metadataForUpload.authors.filter(a => a.name).map(a => ({
                            name: a.name,
                            orcid: a.orcid || undefined
                        })),
                        keywords: keywordsArray.length > 0 ? keywordsArray : undefined
                    }
                };
                 statusUpdater(`Etapa 3: Adicionando metadados...`);
                const metadataResponse = await fetch(`${baseUrl}/deposit/depositions/${deposit.id}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${storedToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(metadataPayload)
                });
                 if (!metadataResponse.ok) {
                    const errorData = await metadataResponse.json();
                    throw new Error(`Falha ao atualizar metadados: ${metadataResponse.status} - ${JSON.stringify(errorData)}`);
                }
                statusUpdater(`Metadados adicionados com sucesso.`);

                statusUpdater(`Etapa 4: Publicando o depósito...`);
                const publishResponse = await fetch(`${baseUrl}/deposit/depositions/${deposit.id}/actions/publish`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${storedToken}` }
                });
                 if (!publishResponse.ok) {
                    const errorData = await publishResponse.json();
                    throw new Error(`Falha ao publicar: ${publishResponse.status} - ${JSON.stringify(errorData)}`);
                }
                const published = await publishResponse.json();
                statusUpdater(`Publicação bem-sucedida!`);

                const zenodoLink = useSandbox ? `https://sandbox.zenodo.org/records/${deposit.id}` : `https://zenodo.org/records/${deposit.id}`;
                return { 
                    doi: published.doi, 
                    link: zenodoLink, 
                    title: metadataForUpload.title
                }; // SUCCESS!

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : `Tentativa ${attempt} falhou.`;
                if (attempt === MAX_UPLOAD_RETRIES) {
                    throw new Error(`Falha ao enviar para o Zenodo após ${MAX_UPLOAD_RETRIES} tentativas. Erro final: ${errorMessage}`);
                }
                const delayTime = 15000 + (5000 * (attempt - 1));
                statusUpdater(`❌ ${errorMessage} Aguardando ${delayTime / 1000}s para tentar novamente...`);
                await new Promise(resolve => setTimeout(resolve, delayTime));
            }
        }
        throw new Error("Não foi possível publicar no Zenodo após todas as tentativas.");
    };

    const handleFullAutomation = async (articlesToGenerate?: number) => {
        const articlesToProcess = articlesToGenerate ?? numberOfArticles;

        const storedToken = localStorage.getItem('zenodo_api_key');
        if (!storedToken) {
            alert('❌ Token Zenodo não encontrado! Por favor, configure-o nas definições (ícone de engrenagem) antes de iniciar o processo automático.');
            return;
        }
        setZenodoToken(storedToken);
    
        isGenerationCancelled.current = false;
        setIsGenerating(true);
        setUploadStatus(null);
        setStep(1);
        setEditingArticleId(null); // Ensure we're not in edit mode
    
        for (let i = 1; i <= articlesToProcess; i++) {
            let currentPhase = 'setup';
            setIsGenerationComplete(false);
            setGenerationProgress(0);
            setAnalysisResults([]);
            setPaperSources([]);
            setGeneratedTitle('');
            setFinalLatexCode('');
            let finalPaperCode = '';
    
            try {
                const TOTAL_ITERATIONS = 12;
                let currentPaper = '';
                
                // 1. Generate Title
                currentPhase = 'geração de título';
                setGenerationStatus(`Artigo ${i}/${articlesToProcess}: Gerando um título inovador...`);
                setGenerationProgress(5);
                const randomTopic = MATH_TOPICS[Math.floor(Math.random() * MATH_TOPICS.length)];
                const temporaryTitle = await generatePaperTitle(randomTopic, language, analysisModel);
                setGeneratedTitle(temporaryTitle);
    
                // 2. Generate Initial Paper
                currentPhase = 'geração inicial do artigo';
                setGenerationStatus(`Artigo ${i}/${articlesToProcess}: Gerando a primeira versão...`);
                setGenerationProgress(15);
                const { paper: initialPaper, sources } = await generateInitialPaper(temporaryTitle, language, pageCount, generationModel);
                currentPaper = initialPaper;
                setPaperSources(sources);
    
                // 3. Iterative Analysis and Improvement
                for (let iter = 1; iter <= TOTAL_ITERATIONS; iter++) {
                    if (isGenerationCancelled.current) break;
                    currentPhase = `análise e melhoria (iteração ${iter})`;
                    const progress = 15 + (iter / TOTAL_ITERATIONS) * 75;
                    setGenerationProgress(progress);
                    setGenerationStatus(`Artigo ${i}/${articlesToProcess}: Iniciando iteração de análise ${iter}/${TOTAL_ITERATIONS}...`);
    
                    const analysisResult: AnalysisResult = await analyzePaper(currentPaper, pageCount, analysisModel);
                    
                    const iterationData: IterationAnalysis = {
                        iteration: iter,
                        results: analysisResult.analysis.map(res => ({
                            topic: ANALYSIS_TOPICS.find(t => t.name === res.topicName) || { num: -1, name: 'Unknown', desc: '' },
                            score: res.score,
                            scoreClass: getScoreClass(res.score),
                            improvement: res.improvement
                        }))
                    };
                    setAnalysisResults(prev => [...prev, iterationData]);
    
                    const pageCountAnalysis = analysisResult.analysis.find(res => res.topicName === 'PAGE COUNT COMPLIANCE');
                    const otherAnalyses = analysisResult.analysis.filter(res => res.topicName !== 'PAGE COUNT COMPLIANCE');
                    const isPageCountTheOnlyRed = pageCountAnalysis && pageCountAnalysis.score < 7.0 && otherAnalyses.every(res => res.score >= 7.0);
                    const hasAnyRedScores = analysisResult.analysis.some(res => res.score < 7.0);

                    if (isPageCountTheOnlyRed) {
                        setGenerationStatus(`Artigo ${i}/${articlesToProcess}: Qualidade alta, mas artigo está curto. Iniciando modo de expansão...`);
                        setGenerationProgress(90);
                        const expandedPaper = await expandPaperContent(currentPaper, pageCount, language, generationModel);
                        currentPaper = expandedPaper;
                        setGenerationStatus(`✅ Artigo ${i} expandido com sucesso para atender ao requisito de páginas.`);
                        break; 
                    } else if (!hasAnyRedScores) {
                        setGenerationStatus(`✅ Análise do Artigo ${i} concluída! Alta qualidade atingida.`);
                        break;
                    } else if (iter < TOTAL_ITERATIONS) {
                        setGenerationStatus(`Artigo ${i}/${articlesToProcess}: Refinando com base no feedback ${iter}...`);
                        const improvedPaper = await improvePaper(currentPaper, analysisResult, language, generationModel);
                        currentPaper = improvedPaper;
                    }
                }
    
                if (isGenerationCancelled.current) {
                    setIsGenerating(false);
                    return;
                }
                
                // NEW STEP: Final ABNT Formatting
                currentPhase = 'formatação ABNT final';
                setGenerationStatus(`Artigo ${i}/${articlesToProcess}: Verificando formatação final ABNT...`);
                setGenerationProgress(93); 
                const formattedPaper = await ensureAbntFormatting(currentPaper, analysisModel);
                currentPaper = formattedPaper;
                // END NEW STEP

                finalPaperCode = currentPaper;
                setFinalLatexCode(finalPaperCode);
                
                // === COMPILE LATEX ===
                currentPhase = 'compilação';
                setGenerationProgress(95);
                let compiledFile: File;
                let finalFixedCode: string;

                try {
                    const compilationUpdater = (message: string) => setGenerationStatus(`Artigo ${i}/${articlesToProcess}: ${message}`);
                    const result = await robustCompile(finalPaperCode, compilationUpdater);
                    compiledFile = result.pdfFile;
                    finalFixedCode = result.finalCode;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Falha na compilação por motivo desconhecido.';
                    setGenerationStatus(`Artigo ${i}/${articlesToProcess}: ❌ Falha na compilação: ${errorMessage}. Salvando para tentativa posterior.`);
                    console.error(`Compilation failed for paper ${i}:`, error);

                    const metadataForTitle = extractMetadata(finalPaperCode);

                    const newLogEntry: ArticleLogEntry = {
                        id: new Date().toISOString() + Math.random(),
                        status: 'compilation-failed',
                        title: metadataForTitle.title || generatedTitle || "Untitled Article",
                        date: new Date().toISOString(),
                        latexCode: finalPaperCode,
                    };
                    setArticlesLog(prev => [...prev, newLogEntry]);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }
                
                // === UPLOAD TO ZENODO ===
                currentPhase = 'publicação';
                try {
                    const statusUpdaterForUpload = (message: string) => setGenerationStatus(`Artigo ${i}/${articlesToProcess}: ${message}`);
                    const publishedData = await uploadArticleToZenodo(compiledFile, finalFixedCode, statusUpdaterForUpload);

                    const newLogEntry: ArticleLogEntry = {
                        id: new Date().toISOString() + Math.random(),
                        status: 'published',
                        title: publishedData.title,
                        date: new Date().toISOString(),
                        doi: publishedData.doi,
                        link: publishedData.link
                    };
                    setArticlesLog(prev => [...prev, newLogEntry]);
                } catch (uploadError) {
                    const errorMessage = uploadError instanceof Error ? uploadError.message : "Falha ao publicar no Zenodo.";
                    setGenerationStatus(`Artigo ${i}/${articlesToProcess}: ❌ Falha no upload: ${errorMessage}. Salvando para tentativa posterior.`);
                    console.error(`Upload failed for paper ${i}:`, uploadError);
                    
                    const pdfBase64 = await fileToBase64(compiledFile);
                    const metadataForTitle = extractMetadata(finalFixedCode);

                    const newLogEntry: ArticleLogEntry = {
                        id: new Date().toISOString() + Math.random(),
                        status: 'unpublished',
                        title: metadataForTitle.title,
                        date: new Date().toISOString(),
                        latexCode: finalFixedCode,
                        pdfBase64: pdfBase64
                    };
                    setArticlesLog(prev => [...prev, newLogEntry]);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
    
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : `Ocorreu um erro desconhecido no artigo ${i}.`;
                const finalMessage = `❌ Erro inesperado no Artigo ${i} durante a fase de '${currentPhase}': ${errorMessage}. A automação foi interrompida.`;
                
                if (errorMessage.toLowerCase().includes('quota')) {
                    setGenerationStatus(`⚠️ Limite de cota da API atingido durante a fase de '${currentPhase}'. A automação foi pausada.`);
                } else {
                    setGenerationStatus(finalMessage);
                }
                console.error(`Automation stopped at phase '${currentPhase}' for article ${i}:`, error);
                setIsGenerating(false);
                return;
            }
        }
    
        setIsGenerating(false);
        setGenerationProgress(100);
        setGenerationStatus(`✅ Processo concluído! Verifique a aba 'Artigos Publicados' para os resultados.`);
        setStep(4);
    };

    const handleRepublish = async (articleToRepublish: ArticleLogEntry) => {
        if (!articleToRepublish.pdfBase64 || !articleToRepublish.latexCode) {
            alert("Dados do artigo ausentes. Não é possível republicar.");
            return;
        }

        const storedToken = localStorage.getItem('zenodo_api_key');
        if (!storedToken) {
            alert('❌ Token Zenodo não encontrado! Por favor, configure-o nas definições (ícone de engrenagem) antes de tentar publicar.');
            return;
        }
        setZenodoToken(storedToken);

        setRepublishingId(articleToRepublish.id);
        try {
            const pdfFile = base64ToFile(articleToRepublish.pdfBase64, 'paper.pdf');
            
            const statusUpdater = (message: string) => {
                setUploadStatus(<div className="status-message status-info">{message}</div>);
            };

            const publishedData = await uploadArticleToZenodo(pdfFile, articleToRepublish.latexCode, statusUpdater);

            setArticlesLog(prevLog => prevLog.map(entry => {
                if (entry.id === articleToRepublish.id) {
                    return {
                        id: entry.id,
                        status: 'published',
                        title: publishedData.title, // Update title in case it was extracted differently
                        date: new Date().toISOString(),
                        doi: publishedData.doi,
                        link: publishedData.link,
                    };
                }
                return entry;
            }));
            setUploadStatus(<div className="status-message status-success">✅ Artigo '{publishedData.title}' publicado com sucesso!</div>);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            console.error("Republish failed:", error);
            alert(`Falha ao publicar o artigo: ${errorMessage}`);
            setUploadStatus(<div className="status-message status-error">❌ Falha ao republicar: {errorMessage}</div>);
        } finally {
            setRepublishingId(null);
        }
    };

    const handleDeleteArticle = (idToDelete: string) => {
        if (window.confirm('Tem certeza que deseja excluir este artigo do log? Esta ação não pode ser desfeita.')) {
            setArticlesLog(prevLog => prevLog.filter(article => article.id !== idToDelete));
        }
    };
    
    const handleRecompile = (articleToRecompile: ArticleLogEntry) => {
        if (!articleToRecompile.latexCode) {
            alert("O código LaTeX para este artigo não foi encontrado. Não é possível recompilar.");
            return;
        }
        setEditingArticleId(articleToRecompile.id);
        setLatexCode(articleToRecompile.latexCode);
        setCompilationStatus(null);
        setPdfPreviewUrl('');
        setCompiledPdfFile(null);
        setStep(2);
    };

    const handleReturnToStart = () => {
        setStep(1);
        setIsGenerationComplete(false);
        setGenerationProgress(0);
        setAnalysisResults([]);
        setPaperSources([]);
        setGeneratedTitle('');
        setFinalLatexCode('');
        setLatexCode(`% O código LaTeX gerado aparecerá aqui.`);
        setPdfPreviewUrl('');
        setCompiledPdfFile(null);
        setUploadStatus(null);
        setCompilationStatus(null);
        setExtractedMetadata({ title: '', abstract: '', authors: [], keywords: '' });
    };

    const handleCancelGeneration = () => {
        isGenerationCancelled.current = true;
        setIsGenerating(false);
        setGenerationStatus('🛑 Geração cancelada pelo usuário.');
    };
    
    const handleCompile = async (code: string) => {
        setIsCompiling(true);
        setCompilationStatus(<div className="status-message status-info">⏳ Iniciando compilação...</div>);
        setPdfPreviewUrl('');
        setCompiledPdfFile(null);
    
        try {
            const result = await robustCompile(code, (message) => {
                setCompilationStatus(<div className="status-message status-info">{message}</div>);
            });
            
            setPdfPreviewUrl(result.pdfUrl);
            setCompiledPdfFile(result.pdfFile);
            setLatexCode(result.finalCode); // Update the code in the editor if it was auto-fixed
            setCompilationStatus(<div className="status-message status-success">✅ Compilação bem-sucedida!</div>);

             if (editingArticleId) {
                const pdfBase64 = await fileToBase64(result.pdfFile);
                setArticlesLog(prevLog => prevLog.map(entry => {
                    if (entry.id === editingArticleId) {
                        return {
                            ...entry,
                            status: 'unpublished',
                            latexCode: result.finalCode,
                            pdfBase64: pdfBase64,
                        };
                    }
                    return entry;
                }));
                setEditingArticleId(null); // Clear after successful recompile
            }


        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            setCompilationStatus(<div className="status-message status-error">❌ Falha na compilação: {errorMessage}</div>);
        } finally {
            setIsCompiling(false);
        }
    };

    const handleReformat = async () => {
        if (!latexCode) return;
        setIsReformatting(true);
        setCompilationStatus(<div className="status-message status-info">⏳ Reformatando para {selectedStyle.toUpperCase()}...</div>);
        try {
            const reformattedCode = await reformatPaperWithStyleGuide(latexCode, selectedStyle, analysisModel);
            setLatexCode(reformattedCode);
            // FIX: The component function was incomplete. Added the rest of the function, the JSX return, and the export statement.
            setCompilationStatus(<div className="status-message status-success">✅ Código reformatado com sucesso! Agora você pode compilar.</div>);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            setCompilationStatus(<div className="status-message status-error">❌ Falha na reformatação: {errorMessage}</div>);
        } finally {
            setIsReformatting(false);
        }
    };
    
    const getStatusStyle = () => {
        if (generationStatus.startsWith('❌') || generationStatus.startsWith('⚠️')) {
            return 'text-red-600';
        }
        if (generationStatus.startsWith('✅') || generationStatus.startsWith('🛑')) {
            return 'text-green-600';
        }
        return 'text-indigo-700 animate-pulse';
    };


    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans bg-gray-100 min-h-screen">
            <Header />
            <ApiKeyModal 
                isOpen={isApiModalOpen} 
                onClose={() => setIsApiModalOpen(false)}
                onSave={({ zenodo }) => {
                    setZenodoToken(zenodo);
                    if (zenodo) {
                        localStorage.setItem('zenodo_api_key', zenodo);
                    } else {
                        localStorage.removeItem('zenodo_api_key');
                    }
                    setIsApiModalOpen(false);
                }} 
            />

            <main className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8 mt-6">
                <nav className="flex justify-center mb-8 border-b pb-4">
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button onClick={() => setStep(1)} className={`px-5 py-2 text-sm font-medium border ${step === 1 ? 'bg-indigo-600 text-white z-10' : 'bg-white text-gray-800 hover:bg-gray-50'} rounded-l-lg border-gray-300`}>1. Generate</button>
                        <button onClick={() => setStep(2)} disabled={!isGenerationComplete && !editingArticleId} className={`px-5 py-2 text-sm font-medium border-t border-b ${step === 2 ? 'bg-indigo-600 text-white z-10' : 'bg-white text-gray-800 hover:bg-gray-50'} border-gray-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed`}>2. Compile</button>
                        <button onClick={() => setStep(3)} disabled={!compiledPdfFile} className={`px-5 py-2 text-sm font-medium border ${step === 3 ? 'bg-indigo-600 text-white z-10' : 'bg-white text-gray-800 hover:bg-gray-50'} border-gray-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed`}>3. Publish</button>
                        <button onClick={() => setStep(4)} className={`px-5 py-2 text-sm font-medium border ${step === 4 ? 'bg-indigo-600 text-white z-10' : 'bg-white text-gray-800 hover:bg-gray-50'} rounded-r-lg border-gray-300`}>4. Log</button>
                    </div>
                     <button onClick={() => setIsApiModalOpen(true)} className="ml-4 p-2.5 rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-100" aria-label="Settings">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.96.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106A1.532 1.532 0 0111.49 3.17zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                    </button>
                </nav>

                {step === 1 && (
                    <Section title="Generate New Scientific Paper(s)" stepNumber={1}>
                        <div className="space-y-8">
                             <LanguageSelector languages={LANGUAGES} selectedLanguage={language} onSelect={setLanguage} />
                            <ModelSelector label="Generation Model (for paper creation)" models={AVAILABLE_MODELS} selectedModel={generationModel} onSelect={setGenerationModel} />
                            <ModelSelector label="Analysis Model (for analysis and fixes)" models={AVAILABLE_MODELS} selectedModel={analysisModel} onSelect={setAnalysisModel} />
                            <PageSelector options={[12, 30, 60, 100]} selectedPageCount={pageCount} onSelect={setPageCount} />
                            <div className="text-center">
                                <label htmlFor="num-articles" className="block text-lg font-semibold text-gray-700 mb-2">Number of Articles to Generate:</label>
                                <input id="num-articles" type="number" min="1" max="100" value={numberOfArticles} onChange={e => setNumberOfArticles(parseInt(e.target.value, 10) || 1)} className="p-2 border rounded-md shadow-sm w-28 text-center text-lg"/>
                            </div>
                            <div className="text-center pt-4">
                                <ActionButton onClick={() => handleFullAutomation()} disabled={isGenerating} isLoading={isGenerating} text={`Generate ${numberOfArticles} Article(s)`} loadingText="Generating..."/>
                                {isGenerating && <button onClick={handleCancelGeneration} className="mt-4 text-sm text-red-600 hover:underline">Cancel Generation</button>}
                            </div>
                            {(isGenerating || generationStatus) && (
                                <div className="mt-6 space-y-4">
                                    {generationStatus && (
                                        <p className={`text-center font-semibold ${getStatusStyle()}`}>
                                            {generationStatus}
                                        </p>
                                    )}
                                    {isGenerating && <ProgressBar progress={generationProgress} isVisible={isGenerating} />}
                                </div>
                            )}
                            {analysisResults.length > 0 && <ResultsDisplay analysisResults={analysisResults} totalIterations={12} />}
                            {paperSources.length > 0 && <SourceDisplay sources={paperSources} />}
                        </div>
                    </Section>
                )}
                
                {step === 2 && (isGenerationComplete || editingArticleId) && (
                    <Section title="Compile & Refine LaTeX" stepNumber={2}>
                        <LatexCompiler code={latexCode} onCodeChange={setLatexCode} />
                        <div className="flex items-center justify-center gap-4 p-4 mt-6 bg-gray-100 rounded-lg border">
                            <span className="font-semibold">Style Guide:</span>
                            <StyleGuideSelector guides={STYLE_GUIDES} selectedGuide={selectedStyle} onSelect={setSelectedStyle} />
                            <ActionButton onClick={handleReformat} disabled={isReformatting || isCompiling} isLoading={isReformatting} text="Reformat" loadingText="Reformatting..."/>
                        </div>
                         <div className="text-center mt-6">
                            <ActionButton onClick={() => handleCompile(latexCode)} disabled={isCompiling || !latexCode} isLoading={isCompiling} text="Compile LaTeX" loadingText="Compiling..."/>
                        </div>
                        {compilationStatus && <div className="text-center my-4">{compilationStatus}</div>}
                        {pdfPreviewUrl && <iframe src={pdfPreviewUrl} width="100%" height="800px" title="PDF Preview" className="border rounded-md shadow-md mt-6"></iframe>}
                    </Section>
                )}
                
                {step === 3 && compiledPdfFile && (
                    <Section title="Publish to Zenodo" stepNumber={3}>
                         <ZenodoUploader ref={uploaderRef} title={extractedMetadata.title} abstractText={extractedMetadata.abstract} keywords={extractedMetadata.keywords} authors={extractedMetadata.authors} compiledPdfFile={compiledPdfFile} zenodoToken={zenodoToken} onFileSelect={() => {}} onPublishStart={() => setIsUploading(true)} onPublishSuccess={(result) => setUploadStatus(<div className="status-message status-success">✅ Published! DOI: <a href={result.zenodoLink} target="_blank" rel="noopener noreferrer">{result.doi}</a></div>)} onPublishError={(message) => setUploadStatus(<div className="status-message status-error">❌ Error: {message}</div>)} extractedMetadata={extractedMetadata} />
                         <div className="text-center mt-6">
                            <ActionButton onClick={() => uploaderRef.current?.submit()} disabled={isUploading || !compiledPdfFile} isLoading={isUploading} text="Publish to Zenodo" loadingText="Publishing..." />
                        </div>
                        {uploadStatus && <div className="text-center my-4">{uploadStatus}</div>}
                    </Section>
                )}
                
                {step === 4 && (
                    <Section title="Articles Log" stepNumber={4}>
                         <div className="space-y-4">
                             <div className="flex items-center space-x-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <input type="checkbox" id="scheduler" checked={isSchedulerActive} onChange={e => { setIsSchedulerActive(e.target.checked); localStorage.setItem('schedulerActive', e.target.checked.toString()); }} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                <label htmlFor="scheduler" className="font-medium text-blue-800">Enable Daily Automated Run (7 articles at 3 AM)</label>
                            </div>
                            {articlesLog.length === 0 ? (<p className="text-center text-gray-500 py-8">No articles in the log.</p>) : (
                                <ul className="space-y-3">
                                    {articlesLog.slice().reverse().map(article => (
                                        <li key={article.id} className="p-4 bg-white border rounded-lg shadow-sm">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-grow">
                                                    <h4 className="font-bold text-gray-900">{article.title}</h4>
                                                    <p className="text-sm text-gray-500">Date: {new Date(article.date).toLocaleString()}</p>
                                                    {article.status === 'published' && <p className="text-sm font-medium text-green-600">Status: Published | DOI: <a href={article.link} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800">{article.doi}</a></p>}
                                                    {article.status === 'unpublished' && <p className="text-sm font-medium text-yellow-600">Status: Compiled, Not Published</p>}
                                                    {article.status === 'compilation-failed' && <p className="text-sm font-medium text-red-600">Status: Compilation Failed</p>}
                                                </div>
                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                     {article.status === 'unpublished' && <button onClick={() => handleRepublish(article)} disabled={republishingId === article.id} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 disabled:bg-gray-400">{republishingId === article.id ? 'Publishing...' : 'Publish'}</button>}
                                                     {article.status === 'compilation-failed' && <button onClick={() => handleRecompile(article)} className="text-xs bg-orange-500 text-white px-3 py-1 rounded-md hover:bg-orange-600">Recompile</button>}
                                                    <button onClick={() => handleDeleteArticle(article.id)} className="text-xs bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Delete</button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </Section>
                )}
            </main>
        </div>
    );
};

export default App;
