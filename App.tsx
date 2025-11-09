
import React, { useState, useEffect, useRef } from 'react';
import { generateInitialPaper, analyzePaper, improvePaper, generatePaperTitle, fixLatexPaper, reformatPaperWithStyleGuide } from './services/geminiService';
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
// Fix: Import the 'Section' component to resolve 'Cannot find name' errors.
import Section from './components/Section';
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

const TOTAL_ITERATIONS = 12;

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
        const metadata = {
            title: '',
            abstract: '',
            authors: [] as Author[],
            keywords: ''
        };
    
        // 1. Robustly extract the content of the \hypersetup block
        const hypersetupMatch = latex.match(/\\hypersetup\{([\s\S]*?)\}/);
        if (hypersetupMatch) {
            const setupContent = hypersetupMatch[1];
    
            // Helper to parse a key-value pair from the hypersetup content
            const parseKey = (key: string): string => {
                // This regex handles values that are in braces {} or just comma/newline separated
                const regex = new RegExp(`${key}=\\{([^}]+)\\}|${key}=([^,}]+)`, 'm');
                const match = setupContent.match(regex);
                if (match) {
                    // Return the first captured group that is not undefined
                    return (match[1] || match[2] || '').trim();
                }
                return '';
            };
    
            metadata.title = parseKey('pdftitle');
            metadata.abstract = parseKey('pdfsubject');
            metadata.keywords = parseKey('pdfkeywords');
            
            const authorString = parseKey('pdfauthor');
            if (authorString) {
                // The ORCID is not in the pdfauthor field, so we find it separately
                const orcidMatch = latex.match(/\\url\{https?:\/\/orcid\.org\/([^}]+)\}/);
                metadata.authors.push({
                    name: authorString,
                    affiliation: '', // Not present in template
                    orcid: orcidMatch ? orcidMatch[1] : ''
                });
            }
        }
    
        // Fallback for title if hypersetup fails (less reliable)
        if (!metadata.title) {
            const titleMatch = latex.match(/\\title\{([^}]+)\}/);
            if (titleMatch) metadata.title = titleMatch[1];
        }

        // Fallback for author if hypersetup fails (less reliable)
        if (metadata.authors.length === 0) {
            const authorBlockMatch = latex.match(/\\begin\{flushright\}([\s\S]*?)\\end\{flushright\}/);
            if (authorBlockMatch) {
                const nameMatch = authorBlockMatch[1].match(/^\s*(.*?)\s*\\\\/);
                const orcidMatch = authorBlockMatch[1].match(/\\url\{https?:\/\/orcid\.org\/([^}]+)\}/);
                 if (nameMatch && nameMatch[1]) {
                     metadata.authors.push({
                         name: nameMatch[1].trim(),
                         affiliation: '',
                         orcid: orcidMatch ? orcidMatch[1] : ''
                     });
                 }
            }
        }

        return metadata;
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
        // FIX: Replaced call to non-existent 'extractMetadata' with the newly defined function.
        const metadataForUpload = extractMetadata(articleLatexCode);
        const keywordsForUpload = articleLatexCode.match(/\\keywords\{([^}]+)\}/)?.[1] || '';

        const MAX_UPLOAD_RETRIES = 10;
        for (let attempt = 1; attempt <= MAX_UPLOAD_RETRIES; attempt++) {
            try {
                const baseUrl = useSandbox ? 'https://sandbox.zenodo.org/api' : 'https://zenodo.org/api';
                
                const createResponse = await fetch(`${baseUrl}/deposit/depositions`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${storedToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                if (!createResponse.ok) throw new Error(`Erro ${createResponse.status}: Falha ao criar depósito.`);
                const deposit = await createResponse.json();
                const depositId = deposit.id;
                
                statusUpdater(`Depósito ${depositId} criado. Fazendo upload do arquivo...`);
                
                const fileResponse = await fetch(deposit.links.bucket + '/' + compiledFile.name, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${storedToken}`, 'Content-Type': 'application/octet-stream' },
                    body: compiledFile
                });
                if (!fileResponse.ok) throw new Error(`Erro ${fileResponse.status}: Falha ao fazer upload do arquivo.`);
                
                statusUpdater("Arquivo enviado. Atualizando metadados...");
                
                const metadataPayload = {
                    metadata: {
                        title: metadataForUpload.title,
                        upload_type: 'publication',
                        publication_type: 'article',
                        description: metadataForUpload.abstract,
                        creators: metadataForUpload.authors.filter(a => a.name).map(author => ({
                            name: author.name,
                            orcid: author.orcid
                        })),
                        keywords: keywordsForUpload.split(',').map(k => k.trim()).filter(Boolean)
                    }
                };
                
                const metadataResponse = await fetch(`${baseUrl}/deposit/depositions/${depositId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${storedToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(metadataPayload)
                });
                if (!metadataResponse.ok) throw new Error(`Erro ${metadataResponse.status}: Falha ao atualizar metadados.`);
                
                statusUpdater("Metadados atualizados. Publicando...");
                
                const publishResponse = await fetch(`${baseUrl}/deposit/depositions/${depositId}/actions/publish`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${storedToken}` }
                });
                if (!publishResponse.ok) throw new Error(`Erro ${publishResponse.status}: Falha ao publicar.`);
                
                const finalResult = await publishResponse.json();
                statusUpdater(`🎉 Publicado com sucesso! DOI: ${finalResult.doi}`);
                
                return { doi: finalResult.doi, link: finalResult.links.html };

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                statusUpdater(`⚠️ Tentativa ${attempt} falhou: ${errorMessage}`);
                if (attempt < MAX_UPLOAD_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
                } else {
                    throw error; // Re-throw after last attempt
                }
            }
        }
        throw new Error("Falha no upload para o Zenodo após todas as tentativas.");
    };
    
    // Central automation logic
    const handleFullAutomation = async (numArticles: number = 1, isScheduledRun: boolean = true) => {
        let completedCount = 0;
        const totalStartTime = Date.now();
        
        for (let i = 1; i <= numArticles; i++) {
            const articleStartTime = Date.now();
            console.log(`[Automation] Iniciando a geração do artigo ${i}/${numArticles}...`);
            setGenerationStatus(`[${new Date().toLocaleTimeString()}] Iniciando a geração do artigo ${i}/${numArticles}...`);

            try {
                // == Step 1: Generate Paper ==
                const randomTopic = MATH_TOPICS[Math.floor(Math.random() * MATH_TOPICS.length)];
                setGenerationStatus(`[${new Date().toLocaleTimeString()}] Artigo ${i}: Gerando título a partir do tópico "${randomTopic}"...`);
                const title = await generatePaperTitle(randomTopic, language, analysisModel); // Use fast model
                
                setGenerationStatus(`[${new Date().toLocaleTimeString()}] Artigo ${i}: Gerando conteúdo do artigo (pode levar alguns minutos)...`);
                let { paper: currentPaper, sources } = await generateInitialPaper(title, language, pageCount, generationModel);
                
                let currentAnalysisResults: IterationAnalysis[] = [];

                for (let iter = 1; iter <= TOTAL_ITERATIONS; iter++) {
                    setGenerationStatus(`[${new Date().toLocaleTimeString()}] Artigo ${i}: Analisando (Iteração ${iter}/${TOTAL_ITERATIONS})...`);
                    const analysisResult = await analyzePaper(currentPaper, pageCount, analysisModel);

                    const iterationData: IterationAnalysis = {
                        iteration: iter,
                        results: ANALYSIS_TOPICS.map(topic => {
                            const found = analysisResult.analysis.find(a => a.topicName === topic.name);
                            return {
                                topic,
                                score: found?.score ?? 0,
                                scoreClass: getScoreClass(found?.score ?? 0),
                                improvement: found?.improvement ?? 'No analysis found.'
                            };
                        })
                    };
                    currentAnalysisResults.push(iterationData);

                    const hasRedScores = iterationData.results.some(r => r.score < 7.0);
                    if (!hasRedScores) {
                        setGenerationStatus(`[${new Date().toLocaleTimeString()}] Artigo ${i}: Qualidade alta atingida. Concluindo a análise.`);
                        break; // Early exit
                    }
                    
                    setGenerationStatus(`[${new Date().toLocaleTimeString()}] Artigo ${i}: Melhorando o artigo (Iteração ${iter})...`);
                    currentPaper = await improvePaper(currentPaper, analysisResult, language, generationModel);
                }

                // == Step 2: Compile Paper ==
                setGenerationStatus(`[${new Date().toLocaleTimeString()}] Artigo ${i}: Compilando o LaTeX para PDF...`);
                const { pdfFile, finalCode } = await robustCompile(currentPaper, (status) => setGenerationStatus(`[${new Date().toLocaleTimeString()}] Artigo ${i}: ${status}`));
                
                // == Step 3: Publish ==
                setGenerationStatus(`[${new Date().toLocaleTimeString()}] Artigo ${i}: Publicando no Zenodo...`);
                const { doi, link } = await uploadArticleToZenodo(pdfFile, finalCode, (status) => setGenerationStatus(`[${new Date().toLocaleTimeString()}] Artigo ${i}: ${status}`));
                
                // == Step 4: Log Success ==
                const newLogEntry: ArticleLogEntry = {
                    id: doi,
                    status: 'published',
                    title: title,
                    date: new Date().toISOString(),
                    doi: doi,
                    link: link,
                };
                setArticlesLog(prev => [newLogEntry, ...prev]);
                completedCount++;
                const articleTime = (Date.now() - articleStartTime) / 1000 / 60;
                console.log(`[Automation] Artigo ${i} publicado com sucesso em ${articleTime.toFixed(2)} minutos. DOI: ${doi}`);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`[Automation] Falha ao processar o artigo ${i}:`, errorMessage);
                setGenerationStatus(`[${new Date().toLocaleTimeString()}] Erro no artigo ${i}: ${errorMessage}. Passando para o próximo.`);
                // Log the failure
                const failedEntry: ArticleLogEntry = {
                    id: `failed-${new Date().toISOString()}`,
                    status: 'compilation-failed', // Or a more generic 'automation-failed'
                    title: `Failed Article ${i}`,
                    date: new Date().toISOString(),
                    // Optionally save the last known LaTeX code for debugging
                };
                setArticlesLog(prev => [failedEntry, ...prev]);

                // Wait a bit before starting the next one to avoid cascading failures
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }
        
        const totalTime = (Date.now() - totalStartTime) / 1000 / 60;
        setGenerationStatus(`[${new Date().toLocaleTimeString()}] Automação concluída. ${completedCount}/${numArticles} artigos publicados em ${totalTime.toFixed(2)} minutos.`);
        console.log(`[Automation] Concluído. ${completedCount}/${numArticles} artigos publicados.`);
    };
    
    const handleSchedulerToggle = () => {
        const newStatus = !isSchedulerActive;
        setIsSchedulerActive(newStatus);
        localStorage.setItem('schedulerActive', String(newStatus));
    };

    const handleCancel = () => {
        isGenerationCancelled.current = true;
        setIsGenerating(false);
        setGenerationStatus('Geração cancelada pelo usuário.');
    };
    
    // FIX: Add missing generatePaper function for Step 1 button.
    const generatePaper = async () => {
        if (!process.env.API_KEY && !localStorage.getItem('gemini_api_key')) {
             setIsApiModalOpen(true);
             return;
        }

        setIsGenerating(true);
        setIsGenerationComplete(false);
        setGenerationProgress(0);
        setGenerationStatus('Iniciando o processo de geração...');
        setAnalysisResults([]);
        setPaperSources([]);
        setFinalLatexCode('');
        isGenerationCancelled.current = false;

        try {
            // Step 1: Generate Title
            setGenerationStatus('Gerando um título de alto impacto...');
            const randomTopic = MATH_TOPICS[Math.floor(Math.random() * MATH_TOPICS.length)];
            const title = await generatePaperTitle(randomTopic, language, analysisModel);
            setGeneratedTitle(title);
            setGenerationProgress(5);
            if (isGenerationCancelled.current) return;

            // Step 2: Generate Initial Paper
            setGenerationStatus('Gerando a primeira versão do artigo (pode levar alguns minutos)...');
            const { paper: initialPaper, sources } = await generateInitialPaper(title, language, pageCount, generationModel);
            setPaperSources(sources);
            let currentPaper = initialPaper;
            setFinalLatexCode(currentPaper);
            setGenerationProgress(20);
            if (isGenerationCancelled.current) return;
            
            // Step 3: Iterative Analysis and Improvement
            const progressPerIteration = 80 / TOTAL_ITERATIONS;
            let finalAnalysisResults: IterationAnalysis[] = [];

            for (let i = 1; i <= TOTAL_ITERATIONS; i++) {
                if (isGenerationCancelled.current) break;
                
                // Analyze
                setGenerationStatus(`Analisando o artigo (Iteração ${i}/${TOTAL_ITERATIONS})...`);
                const analysisResult = await analyzePaper(currentPaper, pageCount, analysisModel);
                
                const iterationData: IterationAnalysis = {
                    iteration: i,
                    results: ANALYSIS_TOPICS.map(topic => {
                        const found = analysisResult.analysis.find(a => a.topicName === topic.name);
                        return {
                            topic,
                            score: found?.score ?? 0,
                            scoreClass: getScoreClass(found?.score ?? 0),
                            improvement: found?.improvement ?? 'No analysis found.'
                        };
                    })
                };
                finalAnalysisResults.push(iterationData);
                setAnalysisResults([...finalAnalysisResults]);

                // Check for early completion
                const hasRedScores = iterationData.results.some(r => r.score < 7.0);
                if (!hasRedScores) {
                    setGenerationStatus('✅ Análise concluída! O artigo atingiu um alto padrão de qualidade.');
                    setGenerationProgress(100);
                    break; 
                }

                // Improve
                if (i < TOTAL_ITERATIONS) { // Don't improve on the last iteration
                    setGenerationStatus(`Refinando o artigo com base na análise (Iteração ${i})...`);
                    currentPaper = await improvePaper(currentPaper, analysisResult, language, generationModel);
                    setFinalLatexCode(currentPaper);
                }
                
                setGenerationProgress(prev => Math.min(100, prev + progressPerIteration));
            }
            
            if (!isGenerationCancelled.current) {
                setGenerationStatus(generationStatus.startsWith('✅') ? generationStatus : 'Geração e análise concluídas.');
                setGenerationProgress(100);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            setGenerationStatus(`❌ Erro: ${errorMessage}`);
        } finally {
            setIsGenerating(false);
            if (!isGenerationCancelled.current) {
                setIsGenerationComplete(true);
                // Automatically add the generated article to the log as "unpublished"
                const newLogEntry: ArticleLogEntry = {
                    id: `unpublished-${new Date().toISOString()}`,
                    status: 'unpublished',
                    title: generatedTitle,
                    date: new Date().toISOString(),
                    latexCode: finalLatexCode,
                };
                setArticlesLog(prev => [newLogEntry, ...prev]);
            }
        }
    };
    
    const handleCompileClick = async () => {
        setIsCompiling(true);
        setCompilationStatus(null);
        setPdfPreviewUrl('');
        setCompiledPdfFile(null);

        try {
            setCompilationStatus(<span>⏳ Extraindo metadados e preparando para compilação...</span>);
            const metadata = extractMetadata(latexCode);
            setExtractedMetadata(metadata);
            
            const { pdfFile, pdfUrl, finalCode } = await robustCompile(latexCode, (status) => {
                setCompilationStatus(<span>{status}</span>);
            });
            
            setPdfPreviewUrl(pdfUrl);
            setCompiledPdfFile(pdfFile);
            setLatexCode(finalCode); // Update code if it was fixed
            setCompilationStatus(<span className="text-green-600 font-bold">✅ Compilação bem-sucedida!</span>);

            // If we were editing an unpublished article, update its log entry
            if (editingArticleId) {
                const pdfBase64 = await fileToBase64(pdfFile);
                setArticlesLog(prev => prev.map(entry => 
                    entry.id === editingArticleId 
                        ? { ...entry, latexCode: finalCode, pdfBase64: pdfBase64, title: metadata.title } 
                        : entry
                ));
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido na compilação.";
            setCompilationStatus(<span className="text-red-600 font-bold">❌ Falha na Compilação: {errorMessage}</span>);
            // If editing, mark it as failed
            if (editingArticleId) {
                setArticlesLog(prev => prev.map(entry => 
                    entry.id === editingArticleId 
                        ? { ...entry, status: 'compilation-failed', latexCode: latexCode } 
                        : entry
                ));
            }
        } finally {
            setIsCompiling(false);
        }
    };
    
    const handleReformatClick = async () => {
        setIsReformatting(true);
        setCompilationStatus(<span>⏳ Reformatando as referências para {selectedStyle.toUpperCase()}...</span>);
        try {
            const reformattedCode = await reformatPaperWithStyleGuide(latexCode, selectedStyle, analysisModel);
            setLatexCode(reformattedCode);
            setCompilationStatus(<span className="text-green-600 font-bold">✅ Referências reformatadas!</span>);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            setCompilationStatus(<span className="text-red-600 font-bold">❌ Falha ao reformatar: {errorMessage}</span>);
        } finally {
            setIsReformatting(false);
        }
    };
    
    // FIX: Add missing handlePublish function.
    const handlePublish = async () => {
        if (!compiledPdfFile || !uploaderRef.current) {
            setUploadStatus(<span className="text-red-500">Erro: Nenhum arquivo PDF compilado para publicar.</span>);
            return;
        }

        setIsUploading(true);
        setUploadStatus(null);
        
        try {
            await uploaderRef.current.submit(); // Trigger the uploader component's submission logic
        } catch (error) {
            // Errors are handled inside the uploader component via callbacks
        }
    };
    
    const sendToOverleaf = () => {
        const overleafUrl = 'https://www.overleaf.com/docs';
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = overleafUrl;
        form.target = '_blank'; // Open in a new tab

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'snip';
        input.value = latexCode;
        form.appendChild(input);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };
    
    const filteredArticles = articlesLog.filter(article => {
        if (!filter.day && !filter.month && !filter.year) return true;
        const articleDate = new Date(article.date);
        const dayMatch = filter.day ? articleDate.getDate() === parseInt(filter.day) : true;
        const monthMatch = filter.month ? (articleDate.getMonth() + 1) === parseInt(filter.month) : true;
        const yearMatch = filter.year ? articleDate.getFullYear() === parseInt(filter.year) : true;
        return dayMatch && monthMatch && yearMatch;
    });
    
    const handleEditArticle = (article: ArticleLogEntry) => {
        if (article.latexCode) {
            setLatexCode(article.latexCode);
            setEditingArticleId(article.id);
            setStep(2); // Navigate to the compiler/editor view
            
            // Clear compilation state for the new article
            setCompilationStatus(null);
            setPdfPreviewUrl('');
            setCompiledPdfFile(null);
            setExtractedMetadata({ title: '', abstract: '', authors: [], keywords: '' });
        }
    };
    
    // FIX: Add missing handleSaveApiKeys function.
    const handleSaveApiKeys = (keys: { gemini: string; zenodo: string; xai: string; }) => {
        if(keys.gemini) localStorage.setItem('gemini_api_key', keys.gemini);
        if(keys.zenodo) localStorage.setItem('zenodo_api_key', keys.zenodo);
        if(keys.xai) localStorage.setItem('xai_api_key', keys.xai);
        setIsApiModalOpen(false);
    };

    return (
        <div className="container mx-auto p-4">
            <header className="text-center mb-10">
                 <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 pb-2">
                    🎓 Gerador de Artigos Científicos
                </h1>
                <p className="text-gray-600 max-w-3xl mx-auto">
                    Uma ferramenta de IA que gera, analisa e refina artigos científicos completos em LaTeX, prontos para compilação e publicação.
                </p>
                <div className="mt-4 flex justify-center gap-4">
                     <button onClick={() => setIsApiModalOpen(true)} className="text-gray-500 hover:text-indigo-600 transition-colors" aria-label="Settings">
                        <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                    </button>
                 </div>
            </header>
            
            <ApiKeyModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} onSave={handleSaveApiKeys} />

             <div className="flex justify-center mb-8 border-b-2 pb-4">
                {[1, 2, 3, 4].map(s => (
                    <button key={s} onClick={() => setStep(s)} className={`px-4 py-2 text-lg font-semibold rounded-t-lg ${step === s ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>
                        {s === 1 && '1. Gerar'}
                        {s === 2 && '2. Compilar & Editar'}
                        {s === 3 && '3. Publicar'}
                        {s === 4 && '4. Histórico'}
                    </button>
                ))}
            </div>

            {/* Step 1: Generation */}
            <div className={`${step !== 1 ? 'hidden' : ''}`}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                     <div>
                        <Section title="Configuração" stepNumber={1}>
                             <LanguageSelector languages={LANGUAGES} selectedLanguage={language} onSelect={setLanguage} />
                             <ModelSelector
                                models={AVAILABLE_MODELS}
                                selectedModel={generationModel}
                                onSelect={setGenerationModel}
                                label="Modelo de Geração (Mais Poderoso)"
                             />
                             <ModelSelector
                                models={AVAILABLE_MODELS}
                                selectedModel={analysisModel}
                                onSelect={setAnalysisModel}
                                label="Modelo de Análise (Mais Rápido)"
                             />
                             <PageSelector options={[12, 30, 60, 100]} selectedPageCount={pageCount} onSelect={setPageCount} />
                        </Section>

                        <Section title="Ações" stepNumber={2}>
                             <div className="text-center">
                                 <ActionButton
                                     onClick={generatePaper}
                                     disabled={isGenerating}
                                     isLoading={isGenerating}
                                     text="Gerar Artigo Completo"
                                     loadingText="Gerando..."
                                     completed={isGenerationComplete}
                                 />
                                 {isGenerating && (
                                     <button onClick={handleCancel} className="mt-4 text-sm text-red-600 hover:underline">
                                         Cancelar Geração
                                     </button>
                                 )}
                             </div>
                        </Section>
                        {finalLatexCode && isGenerationComplete && (
                            <div className="mt-4">
                                <SourceDisplay sources={paperSources} />
                            </div>
                        )}
                     </div>

                     <div>
                        <Section title="Resultados da Análise" stepNumber={3}>
                             <p className="text-gray-600 mb-4 pl-1">
                                O artigo é analisado e refinado iterativamente. Acompanhe o progresso e as sugestões de melhoria aqui.
                            </p>
                            <ProgressBar progress={generationProgress} isVisible={isGenerating || isGenerationComplete} />
                            {generationStatus && <p className="text-center font-semibold my-2">{generationStatus}</p>}
                            
                            <ResultsDisplay analysisResults={analysisResults} totalIterations={TOTAL_ITERATIONS} />
                        </Section>
                     </div>
                 </div>
            </div>

            {/* Step 2: Compilation & Editing */}
            <div className={`${step !== 2 ? 'hidden' : ''}`}>
                 <Section title="Compilar & Editar LaTeX" stepNumber={1}>
                    <LatexCompiler code={latexCode} onCodeChange={setLatexCode} />
                    <div className="mt-6 flex flex-wrap justify-center items-center gap-4">
                         <StyleGuideSelector guides={STYLE_GUIDES} selectedGuide={selectedStyle} onSelect={setSelectedStyle} />
                         <ActionButton
                            onClick={handleReformatClick}
                            disabled={isReformatting || !latexCode}
                            isLoading={isReformatting}
                            text="Reformatar Referências"
                            loadingText="Formatando..."
                         />
                    </div>
                    <div className="mt-6 text-center">
                        <ActionButton
                            onClick={handleCompileClick}
                            disabled={isCompiling}
                            isLoading={isCompiling}
                            text="Compilar para PDF"
                            loadingText="Compilando..."
                        />
                         <button onClick={sendToOverleaf} className="mt-4 text-sm text-blue-600 hover:underline">
                            Enviar para Overleaf
                        </button>
                    </div>
                     {compilationStatus && <div className="mt-4 text-center p-3 rounded-md bg-gray-100">{compilationStatus}</div>}
                 </Section>
                 {pdfPreviewUrl && (
                     <Section title="Pré-visualização do PDF" stepNumber={2}>
                         <iframe src={pdfPreviewUrl} className="w-full h-[600px] border rounded-lg" title="PDF Preview"></iframe>
                     </Section>
                 )}
            </div>
            
            {/* Step 3: Publish */}
            <div className={`${step !== 3 ? 'hidden' : ''}`}>
                 <Section title="Publicar no Zenodo" stepNumber={1}>
                     <ZenodoUploader
                        ref={uploaderRef}
                        title={extractedMetadata.title}
                        abstractText={extractedMetadata.abstract}
                        authors={extractedMetadata.authors as ZenodoUploaderRef['props']['authors']}
                        keywords={extractedMetadata.keywords}
                        compiledPdfFile={compiledPdfFile}
                        zenodoToken={zenodoToken}
                        onFileSelect={() => {}} // Managed in App state
                        onPublishStart={() => {
                            setIsUploading(true);
                            setUploadStatus(<span>Iniciando publicação...</span>);
                        }}
                        onPublishSuccess={(result) => {
                            setIsUploading(false);
                            setUploadStatus(<span className="text-green-600">Publicado com sucesso! DOI: {result.doi}</span>);
                            const newLogEntry: ArticleLogEntry = {
                                id: result.doi,
                                status: 'published',
                                title: extractedMetadata.title,
                                date: new Date().toISOString(),
                                doi: result.doi,
                                link: result.zenodoLink,
                            };
                            setArticlesLog(prev => [newLogEntry, ...prev.filter(entry => entry.id !== republishingId)]);
                            setRepublishingId(null);
                        }}
                        onPublishError={(message) => {
                             setIsUploading(false);
                             setUploadStatus(<span className="text-red-600">Falha na publicação: {message}</span>);
                        }}
                        extractedMetadata={extractedMetadata}
                     />
                     <div className="mt-6 text-center">
                         <ActionButton
                            onClick={handlePublish}
                            disabled={isUploading || !compiledPdfFile}
                            isLoading={isUploading}
                            text="Publicar Artigo"
                            loadingText="Publicando..."
                         />
                     </div>
                     {uploadStatus && <div className="mt-4 text-center p-3 rounded-md bg-gray-100">{uploadStatus}</div>}
                 </Section>
            </div>
            
            {/* Step 4: History */}
            <div className={`${step !== 4 ? 'hidden' : ''}`}>
                 <Section title="Histórico de Artigos" stepNumber={1}>
                    <div className="my-6 p-4 border rounded-lg bg-indigo-50">
                        <h3 className="text-lg font-semibold">Automação Diária</h3>
                        <p className="text-sm text-gray-600">Gera e publica automaticamente 7 artigos às 3:00 da manhã.</p>
                        <button onClick={handleSchedulerToggle} className={`mt-2 px-4 py-2 rounded ${isSchedulerActive ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                            {isSchedulerActive ? 'Desativar Agendador' : 'Ativar Agendador'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {filteredArticles.map(article => (
                            <div key={article.id} className="p-4 border rounded-lg flex justify-between items-center bg-white shadow-sm">
                                <div>
                                    <h4 className="font-bold text-gray-800">{article.title}</h4>
                                    <p className="text-sm text-gray-500">Data: {new Date(article.date).toLocaleString()}</p>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${article.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{article.status}</span>
                                    {article.doi && <a href={article.link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline ml-2 text-sm">DOI: {article.doi}</a>}
                                </div>
                                <div className="flex gap-2">
                                    { (article.status === 'unpublished' || article.status === 'compilation-failed') && article.latexCode && (
                                        <button onClick={() => handleEditArticle(article)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                                            Editar & Compilar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                 </Section>
            </div>
        </div>
    );
};

export default App;
