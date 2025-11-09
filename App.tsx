

import React, { useState, useEffect, useRef } from 'react';
import { generateInitialPaper, analyzePaper, improvePaper, generatePaperTitle, fixLatexPaper, reformatPaperWithStyleGuide, expandPaperContent } from './services/geminiService';
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
             const orcidMatch = latex.match(/ORCID:\s*\\url\{https?:\/\/orcid\.org\/([^}]+)\}/);
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
            keywords: keywords.trim().split(/,\s*|\s*,\s*/).join(', ')
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
            setCompilationStatus(<div className="status-message status-success">✅ Reformatado com sucesso!</div>);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            setCompilationStatus(<div className="status-message status-error">❌ Falha ao reformatar: {errorMessage}</div>);
        } finally {
            setIsReformatting(false);
        }
    };

    const handleDownloadPdf = () => {
        if (pdfPreviewUrl && compiledPdfFile) {
            const link = document.createElement('a');
            link.href = pdfPreviewUrl;
            link.download = compiledPdfFile.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

     const handleToggleScheduler = () => {
        setIsSchedulerActive(prev => {
            const newState = !prev;
            localStorage.setItem('schedulerActive', String(newState));
            return newState;
        });
    };
    
    // This function will be triggered when the user presses the 'Extract Metadata & Proceed to Compile' button
    const handleExtractMetadataAndProceed = () => {
        const metadata = extractMetadata(latexCode);
        setExtractedMetadata(metadata);
        setKeywordsInput(metadata.keywords); // Pre-fill keywords for upload form
        handleCompile(latexCode); // Directly call compile
    };
    
    const handlePublish = () => {
        if (uploaderRef.current) {
            uploaderRef.current.submit();
        }
    };
    
    // Save keys to localStorage and update state
    const handleSaveKeys = (keys: { gemini: string, zenodo: string, xai: string }) => {
        localStorage.setItem('gemini_api_key', keys.gemini);
        localStorage.setItem('zenodo_api_key', keys.zenodo);
        setZenodoToken(keys.zenodo); // Update state immediately
        localStorage.setItem('xai_api_key', keys.xai);
        setIsApiModalOpen(false);
        alert('API Keys saved successfully!');
    };

    const handlePublishSuccess = (result: { doi: string; zenodoLink: string; }) => {
        setUploadStatus(<div className="status-message status-success">✅ Publicado com sucesso! DOI: {result.doi}</div>);
        const newLogEntry: ArticleLogEntry = {
            id: new Date().toISOString() + Math.random(),
            status: 'published',
            title: extractedMetadata.title,
            date: new Date().toISOString(),
            doi: result.doi,
            link: result.zenodoLink,
        };
        setArticlesLog(prev => [...prev, newLogEntry]);
    };

    const handlePublishError = (message: string) => {
        setUploadStatus(<div className="status-message status-error">❌ Erro na publicação: {message}</div>);
    };


    const filteredArticles = articlesLog.filter(article => {
        const articleDate = new Date(article.date);
        const dayMatch = filter.day ? articleDate.getDate() === parseInt(filter.day) : true;
        const monthMatch = filter.month ? articleDate.getMonth() + 1 === parseInt(filter.month) : true;
        const yearMatch = filter.year ? articleDate.getFullYear() === parseInt(filter.year) : true;
        return dayMatch && monthMatch && yearMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8 font-sans bg-gray-50 min-h-screen">
             <header className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
                    Scientific Paper Factory
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                    Automated generation, analysis, and publication of scientific articles using Gemini AI.
                </p>
                 <div className="absolute top-4 right-4">
                    <button onClick={() => setIsApiModalOpen(true)} className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors" aria-label="Settings">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                </div>
            </header>

            <ApiKeyModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} onSave={handleSaveKeys} />

            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200">
                <nav className="flex justify-center mb-8">
                    <div className="flex space-x-2 bg-gray-100 p-2 rounded-full">
                        <button onClick={() => setStep(1)} className={`px-6 py-2 rounded-full font-semibold transition-colors ${step === 1 ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>1. Geração</button>
                        <button onClick={() => setStep(2)} disabled={!finalLatexCode && !editingArticleId} className={`px-6 py-2 rounded-full font-semibold transition-colors ${step === 2 ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}>2. Compilar & Editar</button>
                        <button onClick={() => setStep(3)} disabled={!compiledPdfFile} className={`px-6 py-2 rounded-full font-semibold transition-colors ${step === 3 ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}>3. Publicar</button>
                        <button onClick={() => setStep(4)} className={`px-6 py-2 rounded-full font-semibold transition-colors ${step === 4 ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>4. Histórico</button>
                    </div>
                </nav>
            
                {/* Step 1: Generation */}
                {step === 1 && (
                     <section id="generation">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Panel: Controls */}
                            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                                 <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Configurações de Geração</h2>
                                
                                <LanguageSelector languages={LANGUAGES} selectedLanguage={language} onSelect={setLanguage} />
                                
                                <div className="text-center my-4"><label className="block text-lg font-semibold text-gray-700 mb-2">Páginas Desejadas</label><div className="flex justify-center"><PageSelector options={[12, 30, 60, 100]} selectedPageCount={pageCount} onSelect={setPageCount} /></div></div>
                               
                                <ModelSelector models={AVAILABLE_MODELS} selectedModel={generationModel} onSelect={setGenerationModel} label="Modelo de Geração" />
                                <ModelSelector models={AVAILABLE_MODELS.filter(m => m.name.includes('gemini'))} selectedModel={analysisModel} onSelect={setAnalysisModel} label="Modelo de Análise e Correção" />

                                <div className="mt-6 text-center">
                                    <label htmlFor="article-count" className="block text-lg font-semibold text-gray-700 mb-2">Nº de Artigos para Gerar</label>
                                    <input
                                        type="number"
                                        id="article-count"
                                        value={numberOfArticles}
                                        onChange={(e) => setNumberOfArticles(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-32 p-2 text-center border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                
                                 <div className="mt-8 text-center space-y-4">
                                     <ActionButton
                                        onClick={() => handleFullAutomation()}
                                        disabled={isGenerating}
                                        isLoading={isGenerating}
                                        text="Iniciar Automação Completa"
                                        loadingText="Processando..."
                                    />
                                     {isGenerating && (
                                        <button onClick={handleCancelGeneration} className="text-sm text-red-600 hover:underline">
                                            Cancelar Geração
                                        </button>
                                     )}
                                </div>

                                <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
                                    <h3 className="font-bold text-blue-800">Agendador Diário de Automação</h3>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Gera automaticamente 7 artigos todos os dias às 3:00 da manhã.
                                    </p>
                                     <div className="mt-3 flex items-center justify-center">
                                        <button onClick={handleToggleScheduler} className={`px-4 py-2 rounded-full font-semibold text-white transition-colors ${isSchedulerActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                                            {isSchedulerActive ? 'Desativar Agendador' : 'Ativar Agendador'}
                                        </button>
                                    </div>
                                </div>

                            </div>

                            {/* Right Panel: Results */}
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Progresso da Geração</h2>
                                 <div className="text-center font-semibold text-gray-700 h-12 flex items-center justify-center">
                                    {generationStatus}
                                </div>
                                <ProgressBar progress={generationProgress} isVisible={isGenerating || isGenerationComplete} />
                                
                                {generatedTitle && !isGenerating && (
                                     <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-md">
                                        <h3 className="font-bold text-green-800">Título Gerado:</h3>
                                        <p className="text-green-700 mt-1">{generatedTitle}</p>
                                    </div>
                                )}

                                <div className="mt-4">
                                     <ResultsDisplay analysisResults={analysisResults} totalIterations={12} />
                                </div>
                                
                                <div className="mt-4">
                                    <SourceDisplay sources={paperSources} />
                                </div>

                                {isGenerationComplete && (
                                     <div className="mt-6 text-center">
                                        <button onClick={() => setStep(2)} className="text-lg font-bold py-3 px-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 shadow-lg transition-transform">
                                            Prosseguir para Compilação
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}
                
                {/* Step 2: Compile */}
                {step === 2 && (
                    <section id="compile">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Left Panel: Editor & Controls */}
                             <div>
                                <LatexCompiler code={latexCode} onCodeChange={setLatexCode} />
                                <div className="mt-4 p-4 bg-gray-100 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                                     <StyleGuideSelector guides={STYLE_GUIDES} selectedGuide={selectedStyle} onSelect={setSelectedStyle} />
                                    <ActionButton
                                        onClick={handleReformat}
                                        disabled={isReformatting || !latexCode.trim()}
                                        isLoading={isReformatting}
                                        text="Reformatar Referências"
                                        loadingText="Reformatando..."
                                    />
                                </div>
                                <div className="mt-6 text-center">
                                     <ActionButton
                                        onClick={() => handleCompile(latexCode)}
                                        disabled={isCompiling}
                                        isLoading={isCompiling}
                                        text="Compilar Código LaTeX"
                                        loadingText="Compilando..."
                                    />
                                </div>
                            </div>
                             {/* Right Panel: Preview & Status */}
                            <div>
                                 <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Pré-visualização da Compilação</h2>
                                <div className="text-center my-4 h-10 flex items-center justify-center">{compilationStatus}</div>

                                {pdfPreviewUrl ? (
                                    <div className="p-2 border border-gray-300 rounded-lg shadow-inner bg-gray-100">
                                        <iframe src={pdfPreviewUrl} title="PDF Preview" className="w-full h-96 border-none" />
                                         <div className="mt-4 flex justify-center gap-4">
                                            <button onClick={handleDownloadPdf} className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-full hover:bg-gray-800 transition-colors">
                                                Download PDF
                                            </button>
                                            <form action="https://www.overleaf.com/docs" method="post" target="_blank">
                                                <input type="hidden" name="main.tex" value={latexCode} />
                                                <button type="submit" className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors">
                                                  Enviar para Overleaf
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-96 bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg">
                                        A pré-visualização do PDF aparecerá aqui após a compilação bem-sucedida.
                                    </div>
                                )}

                                 {compiledPdfFile && (
                                     <div className="mt-6 text-center">
                                        <button onClick={() => {
                                            const metadata = extractMetadata(latexCode);
                                            setExtractedMetadata(metadata);
                                            setKeywordsInput(metadata.keywords);
                                            setStep(3);
                                        }} className="text-lg font-bold py-3 px-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 shadow-lg transition-transform">
                                            Prosseguir para Publicação
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}
                
                {/* Step 3: Upload */}
                 {step === 3 && (
                     <section id="upload">
                         <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Publicar no Zenodo</h2>
                        <ZenodoUploader
                            ref={uploaderRef}
                            title={extractedMetadata.title}
                            abstractText={extractedMetadata.abstract}
                            keywords={keywordsInput}
                            authors={extractedMetadata.authors}
                            compiledPdfFile={compiledPdfFile}
                            zenodoToken={zenodoToken}
                            onFileSelect={() => {}}
                            onPublishStart={() => { setIsUploading(true); setUploadStatus(null); }}
                            onPublishSuccess={handlePublishSuccess}
                            onPublishError={handlePublishError}
                            extractedMetadata={extractedMetadata}
                        />
                         <div className="mt-6 text-center">
                             {uploadStatus}
                         </div>
                         <div className="mt-8 text-center">
                            <ActionButton
                                onClick={handlePublish}
                                disabled={isUploading || !compiledPdfFile}
                                isLoading={isUploading}
                                text="Publicar Artigo"
                                loadingText="Publicando..."
                            />
                        </div>
                     </section>
                )}

                {/* Step 4: Published Articles */}
                {step === 4 && (
                     <section id="published-articles">
                        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Histórico de Artigos</h2>

                         {/* Filtering Controls */}
                        <div className="flex flex-wrap justify-center items-center gap-4 p-4 mb-6 bg-gray-100 rounded-lg">
                            <input type="text" placeholder="Dia (ex: 5)" value={filter.day} onChange={(e) => setFilter(f => ({ ...f, day: e.target.value }))} className="p-2 border rounded-md w-24" />
                            <input type="text" placeholder="Mês (ex: 7)" value={filter.month} onChange={(e) => setFilter(f => ({ ...f, month: e.target.value }))} className="p-2 border rounded-md w-24" />
                            <input type="text" placeholder="Ano (ex: 2024)" value={filter.year} onChange={(e) => setFilter(f => ({ ...f, year: e.target.value }))} className="p-2 border rounded-md w-32" />
                            <button onClick={() => setFilter({ day: '', month: '', year: '' })} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Limpar Filtros</button>
                        </div>
                         <p className="text-center text-gray-600 mb-4">Mostrando {filteredArticles.length} de {articlesLog.length} artigos no total.</p>
                        
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                             {filteredArticles.map(article => (
                                <div key={article.id} className="p-4 border rounded-lg shadow-sm transition-all hover:shadow-md flex justify-between items-start gap-4"
                                    style={{
                                        borderLeft: `5px solid ${
                                            article.status === 'published' ? '#10B981' :
                                            article.status === 'unpublished' ? '#F59E0B' : '#EF4444'
                                        }`
                                    }}
                                >
                                    <div className="flex-grow">
                                        <p className="font-bold text-lg text-gray-800">{article.title || "Artigo sem Título"}</p>
                                        <p className="text-sm text-gray-500">{new Date(article.date).toLocaleString()}</p>
                                        {article.status === 'published' && (
                                            <div className="mt-2 text-sm">
                                                <span className="font-semibold">DOI:</span> <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{article.doi}</a>
                                            </div>
                                        )}
                                        {article.status === 'unpublished' && <button onClick={() => handleRecompile(article)} className="text-sm text-yellow-700 mt-1 font-semibold hover:underline">Continuar Edição e Publicação</button>}
                                        {article.status === 'compilation-failed' && <p className="text-sm text-red-600 mt-1 font-semibold">Falha na Compilação</p>}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                                         {article.status === 'unpublished' && (
                                            <button 
                                                onClick={() => handleRepublish(article)}
                                                disabled={republishingId === article.id}
                                                className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
                                            >
                                                {republishingId === article.id ? 'Publicando...' : 'Publicar Agora'}
                                            </button>
                                        )}
                                         {article.status === 'compilation-failed' && (
                                            <button onClick={() => handleRecompile(article)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">
                                                Tentar Recompilar
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteArticle(article.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}
                             {filteredArticles.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum artigo encontrado com os filtros aplicados.</p>}
                        </div>
                     </section>
                )}
                
                 {step > 1 && (
                     <div className="mt-8 text-center border-t pt-6">
                        <button onClick={handleReturnToStart} className="text-indigo-600 hover:underline font-semibold">
                            &larr; Voltar ao Início (Nova Geração)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// FIX: Add the missing default export for the App component.
export default App;