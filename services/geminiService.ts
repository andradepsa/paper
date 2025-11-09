// FIX: Removed file marker comments from the top and bottom of the file which were causing TypeScript compilation errors.
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Language, AnalysisResult, PaperSource, StyleGuide } from '../types';
import { ANALYSIS_TOPICS, LANGUAGES, FIX_OPTIONS, STYLE_GUIDES } from '../constants';
import { getCompilationExamplesForPrompt } from './compilationExamples';
import { LATEX_TEMPLATES } from './latexTemplates';

// Removed the global 'ai' instance. It will now be created on-demand.

const BABEL_LANG_MAP: Record<Language, string> = {
    en: 'english',
    pt: 'brazilian',
    es: 'spanish',
    fr: 'french',
};

const MAX_RETRIES = 5;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Creates a new Gemini client instance, reading the API key from localStorage
// with a fallback to process.env for environments where it's set.
function getAiClient(): GoogleGenAI {
    const apiKey = localStorage.getItem('gemini_api_key') || (process.env.API_KEY as string);
    if (!apiKey) {
        throw new Error("Gemini API key not found. Please set it in the settings modal (gear icon).");
    }
    return new GoogleGenAI({ apiKey });
}

async function withRateLimitHandling<T>(apiCall: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await apiCall(); // Success!
        } catch (error) {
            console.warn(`API call failed on attempt ${attempt}.`, error);
            const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
            
            if (attempt === MAX_RETRIES) {
                 if (errorMessage.includes('429') || errorMessage.includes('quota')) {
                    throw new Error("You exceeded your current quota. Please wait a minute before trying again. For higher limits, check your plan and billing details.");
                 }
                 if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
                    throw new Error("The AI model is temporarily overloaded. Please try again in a few moments.");
                 }
                throw new Error("Failed to call the API after multiple attempts. Please check your connection and try again later.");
            }

            let backoffTime;
            
            if (errorMessage.includes('429') || errorMessage.includes('quota')) {
                console.log("Rate limit exceeded. Waiting for 61 seconds before retrying...");
                backoffTime = 61000 + Math.random() * 1000;
            } else {
                console.log("Transient error detected. Using exponential backoff...");
                backoffTime = Math.pow(2, attempt) * 1000 + Math.random() * 250;
            }
            
            console.log(`Waiting for ${backoffTime.toFixed(0)}ms before retrying...`);
            await delay(backoffTime);
        }
    }
    // This should be unreachable
    throw new Error("API call failed after all retry attempts.");
}

function formatExamplesForPrompt(examples: { successful: string[], failed: string[] }): string {
    let promptSection = '';

    if (examples.successful.length > 0) {
        promptSection += '\n\n**Compilation Guidance from Past Examples:**\nTo ensure the generated LaTeX is valid and compiles without errors, please learn from the following examples.\n';
        promptSection += '\n***Examples of LaTeX that COMPILED SUCCESSFULLY (DO THIS):***\n';
        examples.successful.forEach((code, index) => {
            promptSection += `--- SUCCESSFUL EXAMPLE ${index + 1} ---\n${code}\n--- END SUCCESSFUL EXAMPLE ${index + 1} ---\n`;
        });
    }

    if (examples.failed.length > 0) {
        if (promptSection === '') { // In case there are no successful examples
            promptSection += '\n\n**Compilation Guidance from Past Examples:**\nTo ensure the generated LaTeX is valid and compiles without errors, please learn from the following examples.\n';
        }
        promptSection += '\n***Examples of LaTeX that FAILED to compile (AVOID THIS):***\n';
        examples.failed.forEach((code, index) => {
            promptSection += `--- FAILED EXAMPLE ${index + 1} ---\n${code}\n--- END FAILED EXAMPLE ${index + 1} ---\n`;
        });
    }

    return promptSection;
}

/**
 * NEW: Verification and Restoration Function
 * Ensures the AI-generated LaTeX adheres to the required template structure.
 * It extracts the content from the AI's response and wraps it with the original, correct preamble.
 * This prevents the AI from modifying critical structural elements of the document.
 */
function verifyAndRestoreStructure(generatedPaper: string, originalTemplate: string): string {
    // 1. Define the immutable header (preamble) from the original template
    const preambleEndMarker = '\\begin{document}';
    const headerEndIndex = originalTemplate.indexOf(preambleEndMarker);
    if (headerEndIndex === -1) {
        console.warn("Could not find '\\begin{document}' in the original template. Returning generated paper as is.");
        return generatedPaper;
    }
    const correctPreamble = originalTemplate.substring(0, headerEndIndex);

    // 2. Extract the content generated by the AI
    const docStartMarker = '\\begin{document}';
    const docEndMarker = '\\end{document}';
    
    let aiContent = '';
    const aiStartIndex = generatedPaper.indexOf(docStartMarker);
    const aiEndIndex = generatedPaper.lastIndexOf(docEndMarker);

    if (aiStartIndex !== -1 && aiEndIndex !== -1 && aiStartIndex < aiEndIndex) {
        // Extract the content between \begin{document} and \end{document}
        aiContent = generatedPaper.substring(aiStartIndex + docStartMarker.length, aiEndIndex).trim();
    } else {
        // Fallback: If the markers are missing, maybe the AI only returned the body.
        // This is a heuristic guess to salvage the content.
        console.warn("AI output was missing '\\begin{document}' or '\\end{document}'. Assuming the entire output is content.");
        aiContent = generatedPaper.trim();
    }

    // 3. Reconstruct the paper with the correct structure
    const restoredPaper = `${correctPreamble.trim()}\n\n${docStartMarker}\n${aiContent}\n${docEndMarker}\n`;
    
    return restoredPaper;
}


// Central dispatcher for different AI models
async function callModel(
    model: string,
    systemInstruction: string,
    userPrompt: string,
    config: {
        jsonOutput?: boolean;
        responseSchema?: any;
        googleSearch?: boolean;
    } = {}
): Promise<GenerateContentResponse> {
    if (model.startsWith('gemini-')) {
        const ai = getAiClient();
        const apiCall = () => ai.models.generateContent({
            model: model,
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                ...(config.jsonOutput && { responseMimeType: "application/json" }),
                ...(config.responseSchema && { responseSchema: config.responseSchema }),
                ...(config.googleSearch && { tools: [{ googleSearch: {} }] }),
            },
        });
        return withRateLimitHandling(apiCall);
    } else if (model.startsWith('grok-')) {
        const apiKey = localStorage.getItem('xai_api_key');
        if (!apiKey) {
            throw new Error("x.ai API key not found. Please set it in the settings modal (gear icon).");
        }

        const messages = [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
        ];

        const apiCall = async () => {
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    stream: false,
                    temperature: 0,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`x.ai API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || '';
            
            // Reconstruct a Gemini-like response object for compatibility
            const reconstructedResponse = {
                candidates: [{
                    content: { parts: [{ text: text }], role: 'model' },
                    finishReason: 'STOP',
                    index: 0,
                    safetyRatings: [],
                    groundingMetadata: { groundingChunks: [] } // Grok does not support grounding
                }],
                functionCalls: [],
                get text() {
                    return this.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
                }
            };
            return reconstructedResponse as GenerateContentResponse;
        };

        return withRateLimitHandling(apiCall);
    } else {
        throw new Error(`Unsupported model: ${model}`);
    }
}


export async function generatePaperTitle(topic: string, language: Language, model: string): Promise<string> {
    const languageName = LANGUAGES.find(l => l.code === language)?.name || 'English';

    const systemInstruction = `You are an expert mathematician and academic researcher with deep knowledge across all fields of mathematics. Your task is to generate a single, compelling, and high-impact title for a scientific paper.`;
    
    const userPrompt = `Based on the broad mathematical topic of "${topic}", generate a single, novel, and specific title for a high-impact research paper. 
    
    **Requirements:**
    - The title must sound like a genuine, modern academic publication.
    - It must be concise and impactful.
    - It must be written in **${languageName}**.
    - Your entire response MUST be only the title itself. Do not include quotation marks, labels like "Title:", or any other explanatory text.`;

    const response = await callModel(model, systemInstruction, userPrompt);
    return response.text.trim().replace(/"/g, ''); // Clean up any accidental quotes
}


export async function generateInitialPaper(title: string, language: Language, pageCount: number, model: string): Promise<{ paper: string, sources: PaperSource[] }> {
    const languageName = LANGUAGES.find(l => l.code === language)?.name || 'English';

    let referenceCount = 20;
    if (pageCount === 30) referenceCount = 40;
    else if (pageCount === 60) referenceCount = 60;
    else if (pageCount === 100) referenceCount = 100;

    // Programmatically insert the title to guarantee it's correct.
    // FIX: Replaced `replaceAll` with the compatible `split().join()` method to support older TypeScript/JavaScript environments.
    const initialTemplate = LATEX_TEMPLATES[0].split('[TÍTULO DO ARTIGO AQUI]').join(title);

    const systemInstruction = `You are a world-class AI assistant specialized in generating high-quality scientific articles by populating a pre-defined LaTeX template. Your task is to follow a set of strict instructions to produce a complete, compilable, and substantial academic paper.

    **PRIMARY DIRECTIVES (NON-NEGOTIABLE):**
    1.  **PAGE COUNT IS CRITICAL:** Your absolute top priority is to generate enough high-quality, dense content to ensure the final rendered PDF is **AT LEAST ${pageCount} pages** long. This is the most important success criterion.
    2.  **STRICT TEMPLATE ADHERENCE:** You MUST use the provided LaTeX template as the rigid, unchangeable structure for the paper. You MUST NOT alter the template's structure, packages, or section commands. Your only job is to replace the placeholder text.
    3.  **PRESERVE AUTHOR BLOCK:** The block of code containing the author's name and ORCID (\`\\begin{flushright} SÉRGIO DE ANDRADE, PAULO ... \\end{flushright}\`) is sacred. You **MUST NOT** delete or modify this block under any circumstances.
    4.  **COMPLETE PLACEHOLDER REPLACEMENT:** You MUST find and replace EVERY remaining placeholder in the template (e.g., \`[CONTEÚDO DA INTRODUÇÃO AQUI]\`, \`[ITEM DA BIBLIOGRAFIA 1]\`) with the content you generate. No placeholders should remain in the final output.

    **Content Density and Structure Guidelines (Follow these to meet the page count):**
    -   **Target Word Count:** To achieve ${pageCount} pages in ABNT format (Times 12, 1.5 spacing), you must generate between **${pageCount * 350} and ${pageCount * 500} words** of main body content. Aim for the higher end of this range.
    -   **Paragraph Structure:** The paper should have a total of **at least ${pageCount * 3} substantial paragraphs**. This means each section must be thoroughly developed with multiple paragraphs, detailed explanations, and in-depth analysis.
    -   **Be Verbose and Detailed:** Be expansive in every section. Provide background, explain concepts thoroughly, and discuss implications in detail to meet the word and page count targets.

    **TASK WORKFLOW:**
    1.  **Use the Template:** Generate extensive content to populate the single LaTeX template provided below.
    2.  **Generate Extensive Content:** Based on the user-provided title, generate a complete, comprehensive, and high-quality scientific paper following the density guidelines above.
    3.  **Use Google Search for Bibliography:** You MUST use the Google Search tool to find relevant academic sources to create a credible bibliography with **exactly ${referenceCount} entries**.
    4.  **Populate the Template:** Integrate the generated content into the template, replacing all placeholders precisely.
    5.  **Strict Output Format:** The ENTIRE output MUST be ONLY the completed LaTeX code. Do not add any explanation, markdown formatting (like \`\`\`latex\`), or any text before \`\\documentclass\` or after \`\\end{document}\`.

    **COMPILATION AND QUALITY RULES (Follow Strictly):**
    -   **URL Handling:** ALWAYS wrap any URL in a \`\\url{...}\` command.
    -   **No Manual Line Breaks:** Do not use \`\\\\\` to break lines inside paragraphs.
    -   **Avoid Long Words:** If an extremely long, unbreakable word is necessary, insert hyphenation hints (\`\\-\`).

    **Provided LaTeX Template:**
    ${initialTemplate}
    `;

    const userPrompt = `Generate a scientific paper in ${languageName}. Use the provided template, fill it completely with high-quality, extensive content, and ensure the final paper is at least ${pageCount} pages long by following all density and structure guidelines. The title is already embedded in the template.`;

    const response = await callModel(model, systemInstruction, userPrompt, { googleSearch: true });
    
    let paper = response.text.trim().replace(/^```latex\s*|```\s*$/g, '');
    
    paper = verifyAndRestoreStructure(paper, initialTemplate);
    
    const sources: PaperSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter(chunk => chunk.web)
        .map(chunk => ({
            uri: chunk.web.uri,
            title: chunk.web.title,
        })) || [];

    return { paper, sources };
}

export async function analyzePaper(paperContent: string, pageCount: number, model: string): Promise<AnalysisResult> {
    const analysisTopicsList = ANALYSIS_TOPICS.map(t => `- ${t.name}: ${t.desc}`).join('\n');
    const systemInstruction = `You are an expert academic reviewer AI. Your task is to perform a rigorous, objective, and multi-faceted analysis of a provided scientific paper written in LaTeX.

    **Input:** You will receive the full LaTeX source code of a scientific paper.
    
    **Task:**
    1.  Analyze the paper based on the following criteria.
    2.  For each criterion, provide a numeric score from 0.0 to 10.0, where 10.0 is flawless.
    3.  For each criterion, provide a concise, single-sentence improvement suggestion. This suggestion must be a direct critique of the paper's current state and offer a clear path for enhancement. Do NOT write generic praise. Be critical and specific.
    4.  The "PAGE COUNT COMPLIANCE" topic must be evaluated based on the user's requested MINIMUM page count of ${pageCount}. A perfect score of 10.0 is achieved if the paper's estimated length is greater than or equal to ${pageCount} pages. If the paper is shorter than ${pageCount} pages, the score must be low, penalizing it severely. For example, if the paper is ${pageCount - 1} pages, the score should be 5.0 or less. If it is ${pageCount - 2} pages, the score should be 3.0 or less. If the paper is substantially longer than ${pageCount} pages (e.g., ${pageCount + 5}), it should still receive a high score like 9.5 or 10.0.

    **Analysis Criteria:**
    ${analysisTopicsList}

    **Output Format:**
    -   You MUST return your analysis as a single, valid JSON object.
    -   Do NOT include any text, explanations, or markdown formatting (like \`\`\`json) outside of the JSON object.
    -   The JSON object must have a single key "analysis" which is an array of objects.
    -   Each object in the array must have three keys:
        1.  "topicName": The name of the topic being analyzed (string).
        2.  "score": The numeric score from 0.0 to 10.0 (number).
        3.  "improvement": The single-sentence improvement suggestion (string).
    `;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            analysis: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        topicName: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        improvement: { type: Type.STRING },
                    },
                    required: ["topicName", "score", "improvement"],
                },
            },
        },
        required: ["analysis"],
    };

    const response = await callModel(model, systemInstruction, paperContent, {
        jsonOutput: true,
        responseSchema: responseSchema
    });
    
    try {
        const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        const result = JSON.parse(jsonText);
        return result as AnalysisResult;
    } catch (error) {
        console.error("Failed to parse analysis JSON:", response.text);
        throw new Error("The analysis returned an invalid format. Please try again.");
    }
}


export async function improvePaper(paperContent: string, analysis: AnalysisResult, language: Language, model: string): Promise<string> {
    const languageName = LANGUAGES.find(l => l.code === language)?.name || 'English';
    const pageCountMatch = analysis.analysis.find(a => a.topicName === 'PAGE COUNT COMPLIANCE')?.improvement.match(/\d+/);
    const pageCount = pageCountMatch ? pageCountMatch[0] : '12';
    
    const criticalPoints = analysis.analysis
        .filter(item => item.score < 7.0)
        .map(item => `- **${item.topicName} (Score: ${item.score})**: ${item.improvement}`);

    if (criticalPoints.length === 0) {
        return paperContent;
    }

    const improvementPrompt = 'CRITICAL IMPROVEMENTS (YOU MUST FIX THESE):\n' + criticalPoints.join('\n');

    const examples = getCompilationExamplesForPrompt();
    const examplesPrompt = formatExamplesForPrompt(examples);

    const isPageCountCritical = analysis.analysis.some(item => item.topicName === 'PAGE COUNT COMPLIANCE' && item.score < 7.0);

    let pageCountPriorityInstruction = '';
    if (isPageCountCritical) {
        pageCountPriorityInstruction = `
    **!!! URGENT & CRITICAL PRIORITY !!!**
    The most important issue to fix is 'PAGE COUNT COMPLIANCE'. The paper is severely short. Your primary and overriding task is to **SUBSTANTIALLY EXPAND** the paper's content to meet the target of at least ${pageCount} pages. To do this, you should add enough new text to reach a total word count of at least **${Number(pageCount) * 350} words**. Focus on adding detailed explanations, examples, or deeper analysis in the sections that need it most. This is not a minor edit; it is a major content generation task. All other fixes are secondary to this primary directive.
    `;
    }
    
    const systemInstruction = `You are a world-class AI assistant specialized in editing and improving scientific papers written in LaTeX. Your task is to refine the provided LaTeX paper based on specific, critical improvement suggestions.

    ${pageCountPriorityInstruction}

    **Critical Preservation Rules (NON-NEGOTIABLE):**
    1.  **DO NOT SHORTEN THE PAPER:** Your absolute top priority is to apply the suggested improvements *without reducing the overall length of the paper*. If a suggestion implies making the text more concise, you MUST compensate by expanding on other areas to ensure the total word/page count does not decrease. If the 'PAGE COUNT COMPLIANCE' score is low, you must actively and significantly expand the paper's content. This rule overrides all other suggestions if they conflict.
    2.  **PRESERVE STRUCTURE:** You are prohibited from altering the document's preamble (from \\documentclass to \\begin{document}) and its final command (\\end{document}). Your changes must only be within the document's body.
    3.  **PRESERVE AUTHOR BLOCK:** The block of code containing the author's name and ORCID (\`\\begin{flushright} SÉRGIO DE ANDRADE, PAULO ... \\end{flushright}\`) is sacred. You **MUST NOT** delete or modify this block under any circumstances.

    **Improvement Strategy (VERY IMPORTANT):**
    1.  **Focus Exclusively on Critical Fixes:** The user will provide a list of "CRITICAL IMPROVEMENTS". Your ONLY task is to address these specific issues thoroughly. Do not address any other perceived flaws.
    2.  **Holistic Improvement (Do No Harm):** When fixing a critical issue, you must do so in a way that **maintains or improves the quality of other aspects of the paper**. DO NOT sacrifice a high-scoring area to fix a low-scoring one.

    **Instructions for Improvement:**
    -   Apply the necessary changes directly to the LaTeX source code to address each critical point.
    -   The entire output MUST be a single, valid, and complete LaTeX document. Do not include any explanatory text or markdown formatting.
    -   The language of the entire paper must remain in **${languageName}**.
    
    **Proactive Overflow Prevention Rules (CRITICAL for compilation success):**
    -   **URL Handling:** ALWAYS wrap any URL or long file path in a \`\\url{...}\` command.
    -   **Long Words:** Avoid using extremely long, unbreakable words. Rephrase or insert manual hyphenation hints (\`\\-\`).
    -   **Spacing:** Do not use \`\\\\\` to break lines inside a paragraph.

    ${examplesPrompt}
    `;

    const userPrompt = `Current Paper Content:\n\n${paperContent}\n\nImprovement Points:\n\n${improvementPrompt}\n\nBased on the above critical improvement points, provide the complete, improved LaTeX source code for the paper.`;

    const response = await callModel(model, systemInstruction, userPrompt);
    let paper = response.text.trim().replace(/^```latex\s*|```\s*$/g, '');
    
    paper = verifyAndRestoreStructure(paper, paperContent); // Use original content as template reference

    return paper;
}

export async function fixLatexPaper(paperContent: string, fixesToApply: { key: string; label: string; description: string }[], model: string, compilationLog?: string): Promise<string> {
    const fixInstructions = fixesToApply.map(fix => `**${fix.label}**: ${fix.description}`).join('\n- ');

    const examples = getCompilationExamplesForPrompt();
    const examplesPrompt = formatExamplesForPrompt(examples);
    
    const hasPageMarginFix = fixesToApply.some(fix => fix.key === 'page_margin_overflow');
    const priorityInstruction = hasPageMarginFix 
        ? `**HIGHEST PRIORITY: Your primary task is to fix all text that overflows the page margins ("overfull \\hbox").** Analyze the compilation log for specific errors and proactively scan the document for long URLs (wrap in \\url{...}) and long words (rephrase or hyphenate).`
        : '';

    const systemInstruction = `You are an expert LaTeX editor AI. Your task is to fix common compilation issues in a given LaTeX document, while strictly preserving its structure.

    ${priorityInstruction}

    **Critical Preservation Rules (NON-NEGOTIABLE):**
    1.  **PRESERVE STRUCTURE:** You must not alter the document's preamble (from \\documentclass to \\begin{document}) or its final command (\\end{document}). Your changes must only be within the document's body.
    2.  **PRESERVE AUTHOR BLOCK:** The block of code containing the author's name and ORCID (\`\\begin{flushright} SÉRGIO DE ANDRADE, PAULO ... \\end{flushright}\`) is sacred. You **MUST NOT** delete or modify this block under any circumstances.

    **Instructions for Fixing:**
    -   You will receive the full LaTeX source code of a paper.
    -   You MUST apply the following specific fixes to the document:
        -   ${fixInstructions}
    -   The entire output MUST be a single, valid, and complete LaTeX document. Do not include any explanatory text or markdown formatting.
    ${examplesPrompt}
    `;
    
    const logPromptSection = compilationLog 
        ? `\n\n**CRITICAL: The previous compilation failed. Here is the compilation log. Analyze it carefully to find the root cause of the errors and fix them:**\n\n\`\`\`log\n${compilationLog}\n\`\`\`\n\n`
        : '';

    const userPrompt = `Current LaTeX Paper:\n\n${paperContent}\n\n${logPromptSection}Apply the specified fixes and provide the complete, corrected LaTeX source code.`;

    const response = await callModel(model, systemInstruction, userPrompt);
    let paper = response.text.trim().replace(/^```latex\s*|```\s*$/g, '');
    
    paper = verifyAndRestoreStructure(paper, paperContent);

    return paper;
}

export async function reformatPaperWithStyleGuide(paperContent: string, styleGuide: StyleGuide, model: string): Promise<string> {
    const styleGuideInfo = STYLE_GUIDES.find(g => g.key === styleGuide);
    if (!styleGuideInfo) {
        throw new Error(`Unknown style guide: ${styleGuide}`);
    }

    const systemInstruction = `You are an expert academic editor specializing in citation and reference formatting. Your task is to reformat the bibliography of a scientific paper according to a specific style guide.

    **CRITICAL INSTRUCTIONS (NON-NEGOTIABLE):**
    1.  You will receive the full LaTeX source code of a paper.
    2.  Your task is to reformat **ONLY** the content within the \`\\section*{REFERÊNCIAS}\` section.
    3.  You **MUST NOT** change any other part of the document. The preamble, title, author block, abstract, body text, conclusion, etc., must remain absolutely identical to the original.
    4.  The new reference list must strictly adhere to the **${styleGuideInfo.name} (${styleGuideInfo.description})** formatting rules.
    5.  The final output must be the **COMPLETE, FULL** LaTeX document, with only the reference section's content modified. Do not provide only the reference section or include any explanatory text or markdown formatting.
    `;

    const userPrompt = `Please reformat the references in the following LaTeX document to conform to the ${styleGuideInfo.name} style guide. Return the full, unchanged document with only the reference list updated.

    **LaTeX Document:**
    \`\`\`latex
    ${paperContent}
    \`\`\`
    `;

    const response = await callModel(model, systemInstruction, userPrompt);
    let paper = response.text.trim().replace(/^```latex\s*|```s*$/g, '');

    paper = verifyAndRestoreStructure(paper, paperContent);

    return paper;
}