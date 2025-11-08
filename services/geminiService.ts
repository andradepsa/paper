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

    const templatesString = LATEX_TEMPLATES.map((template, index) => `--- TEMPLATE ${index + 1} ---\n${template}\n--- END TEMPLATE ${index + 1} ---`).join('\n\n');

    const systemInstruction = `You are a world-class AI assistant specialized in generating high-quality scientific articles by populating pre-defined LaTeX templates.

    **Your Task:**
    1.  **Select a Template:** You are provided with 10 high-quality, pre-approved LaTeX templates that are guaranteed to be compliant with ABNT standards for scientific articles (A4 format). You MUST choose ONE of these templates to serve as the structure for the paper.
    2.  **Generate Content:** Based on the user-provided title, generate a complete, comprehensive, and high-quality scientific paper. This includes a detailed abstract (resumo), keywords (palavras-chave), an introduction, multiple sections with subsections for the main body, a conclusion, and a bibliography. You must use the Google Search tool to find relevant academic sources to create a credible bibliography with **exactly ${referenceCount} entries**.
    3.  **Populate the Template:** You MUST replace all placeholder text within the selected template (e.g., \`[CONTEÚDO DA INTRODUÇÃO AQUI]\`, \`[ITEM DA BIBLIOGRAFIA 1]\`, \`[TÍTULO DO ARTIGO AQUI]\`) with the content you have generated. Ensure the final document is coherent and flows naturally.
    4.  **Meet Page Count:** The generated content must be substantial enough to ensure the final rendered PDF is **at least ${pageCount} pages** long.
    5.  **Strict Output Format:** The ENTIRE output MUST be ONLY the completed LaTeX code. Do not add any explanation, markdown formatting (like \`\`\`latex\`), or any text before \`\\documentclass\` or after \`\\end{document}\`.

    **Provided LaTeX Templates:**
    ${templatesString}
    `;

    const userPrompt = `Generate a scientific paper in ${languageName} with the title: "${title}". Use one of the provided templates, fill it completely with high-quality content, and ensure the final paper is at least ${pageCount} pages long.`;

    const response = await callModel(model, systemInstruction, userPrompt, { googleSearch: true });
    
    let paper = response.text.trim().replace(/^```latex\s*|```\s*$/g, '');
    
    // Ensure the paper ends with \end{document}
    if (!paper.includes('\\end{document}')) {
        paper += '\n\\end{document}';
    }
    
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
    1.  Analyze the paper based on the following 28 quality criteria.
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

    **Example Output:**
    \`\`\`json
    {
      "analysis": [
        {
          "topicName": "TOPIC FOCUS",
          "score": 8.5,
          "improvement": "The discussion section slightly deviates into an unrelated sub-topic that should be removed to maintain focus."
        },
        {
          "topicName": "PAGE COUNT COMPLIANCE",
          "score": 4.0,
          "improvement": "The paper is approximately 10 pages long but needs to be expanded to meet the minimum requirement of 12 pages."
        }
      ]
    }
    \`\`\`
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
    const improvementPoints = analysis.analysis
        .filter(item => item.score < 8.5)
        .map(item => `- **${item.topicName} (Score: ${item.score})**: ${item.improvement}`)
        .join('\n');

    const examples = getCompilationExamplesForPrompt();
    const examplesPrompt = formatExamplesForPrompt(examples);
    
    const titleMatch = paperContent.match(/\\title\{([^}]+)\}/);
    const originalTitle = titleMatch ? titleMatch[1] : 'the original title';

    const systemInstruction = `You are a world-class AI assistant specialized in editing and improving scientific papers written in LaTeX. Your task is to refine the provided LaTeX paper based on specific improvement suggestions, while strictly maintaining the ABNT formatting standard.

    **Critical Preservation Rules:**
    1.  **Do Not Change Preamble/Metadata:** The entire block from \`\\documentclass\` to \`\\title{...}\` MUST be preserved exactly as in the original. This includes the \`\\hypersetup\` block and the title command, which must be \`\\title{${originalTitle}}\`.
    2.  **Do Not Use \\maketitle:** The manual title block inside \`\\begin{document}\` must be preserved. Do NOT use the \`\\maketitle\` command.
    3.  **Preserve Structure:** The overall ABNT LaTeX structure must be maintained: uppercase section titles, unnumbered abstract and references sections, etc.

    **Instructions for Improvement:**
    -   Critically analyze the provided "Current Paper Content" against the "Improvement Points".
    -   Apply the necessary changes directly to the LaTeX source code to address each improvement point.
    -   The entire output MUST be a single, valid, and complete LaTeX document. Do not include any explanatory text, markdown formatting, or code fences (like \`\`\`latex) before \`\\documentclass\` or after \`\\end{document}\`.
    -   The language of the entire paper must remain in **${languageName}**.
    -   **CRITICAL: The reference section MUST remain unnumbered (\`\\section*{REFERÊNCIAS}\`) and formatted according to ABNT NBR 6023. Do NOT use \`\\begin{thebibliography}\`, \`\\end{thebibliography}\`, \`\\bibitem\`, or \`\\cite{}\` commands.**
    -   **Do NOT add or remove \`\\newpage\` commands. Let the LaTeX engine handle page breaks automatically.**
    -   **Crucially, do NOT include any images, figures, or complex tables.**
    -   Focus on improving aspects directly related to the provided feedback.
    ${examplesPrompt}
    `;

    const userPrompt = `Current Paper Content:\n\n${paperContent}\n\nImprovement Points:\n\n${improvementPoints}\n\nBased on the above improvement points, provide the complete, improved LaTeX source code for the paper, ensuring all ABNT formatting and metadata are preserved.`;

    const response = await callModel(model, systemInstruction, userPrompt);
    let paper = response.text.trim().replace(/^```latex\s*|```\s*$/g, '');

    // Ensure the paper ends with \end{document}
    if (!paper.includes('\\end{document}')) {
        paper += '\n\\end{document}';
    }

    return paper;
}

export async function fixLatexPaper(paperContent: string, fixesToApply: { key: string; label: string; description: string }[], model: string): Promise<string> {
    const fixInstructions = fixesToApply.map(fix => `**${fix.label}**: ${fix.description}`).join('\n- ');

    const examples = getCompilationExamplesForPrompt();
    const examplesPrompt = formatExamplesForPrompt(examples);
    
    const titleMatch = paperContent.match(/\\title\{([^}]+)\}/);
    const originalTitle = titleMatch ? titleMatch[1] : 'the original title';

    const systemInstruction = `You are an expert LaTeX editor AI. Your task is to fix common compilation issues in a given LaTeX document, while strictly preserving its ABNT formatting.

    **Critical Preservation Rules:**
    1.  **Do Not Change Preamble/Metadata:** The entire block from \`\\documentclass\` to \`\\title{...}\` MUST be preserved exactly as in the original. This includes the \`\\hypersetup\` block and the title command, which must be \`\\title{${originalTitle}}\`.
    2.  **Do Not Use \\maketitle:** The manual title block inside \`\\begin{document}\` must be preserved. Do NOT use the \`\\maketitle\` command.
    3.  **Preserve Structure:** The overall ABNT LaTeX structure must be maintained.

    **Instructions for Fixing:**
    -   You will receive the full LaTeX source code of a paper.
    -   You MUST apply the following specific fixes to the document:
        -   ${fixInstructions}
    -   The entire output MUST be a single, valid, and complete LaTeX document. Do not include any explanatory text, markdown formatting, or code fences.
    -   **CRITICAL: The reference section MUST remain unnumbered (\`\\section*{REFERÊNCIAS}\`) and formatted according to ABNT NBR 6023. Do NOT use \`\\begin{thebibliography}\`, \`\\end{thebibliography}\`, \`\\bibitem\`, or \`\\cite{}\` commands.**
    -   **Do NOT add or remove \`\\newpage\` commands.**
    -   **Do NOT include any images, figures, or complex tables.**
    -   Return only the corrected LaTeX source code.
    ${examplesPrompt}
    `;

    const userPrompt = `Current LaTeX Paper:\n\n${paperContent}\n\nApply the specified fixes and provide the complete, corrected LaTeX source code, ensuring all ABNT formatting and metadata are preserved.`;

    const response = await callModel(model, systemInstruction, userPrompt);
    let paper = response.text.trim().replace(/^```latex\s*|```\s*$/g, '');
    
    // Ensure the paper ends with \end{document}
    if (!paper.includes('\\end{document}')) {
        paper += '\n\\end{document}';
    }

    return paper;
}

export async function reformatPaperWithStyleGuide(paperContent: string, styleGuide: StyleGuide, model: string): Promise<string> {
    const styleGuideInfo = STYLE_GUIDES.find(g => g.key === styleGuide);
    if (!styleGuideInfo) {
        throw new Error(`Unknown style guide: ${styleGuide}`);
    }

    const systemInstruction = `You are an expert academic editor specializing in citation and reference formatting. Your task is to reformat the bibliography of a scientific paper according to a specific style guide.

    **CRITICAL INSTRUCTIONS:**
    1.  You will receive the full LaTeX source code of a paper.
    2.  Your task is to reformat **ONLY** the content within the \`\\section*{REFERÊNCIAS}\` section.
    3.  You **MUST NOT** change any other part of the document. The preamble, abstract, body text, conclusion, etc., must remain absolutely identical to the original.
    4.  The new reference list must strictly adhere to the **${styleGuideInfo.name} (${styleGuideInfo.description})** formatting rules.
    5.  The number of references in the output must be the same as in the input.
    6.  The final output must be the **COMPLETE, FULL** LaTeX document, with only the reference section's content modified. Do not provide only the reference section or include any explanatory text or markdown formatting.
    `;

    const userPrompt = `Please reformat the references in the following LaTeX document to conform to the ${styleGuideInfo.name} style guide. Return the full, unchanged document with only the reference list updated.

    **LaTeX Document:**
    \`\`\`latex
    ${paperContent}
    \`\`\`
    `;

    const response = await callModel(model, systemInstruction, userPrompt);
    let paper = response.text.trim().replace(/^```latex\s*|```\s*$/g, '');

    // Ensure the paper ends with \end{document}
    if (!paper.includes('\\end{document}')) {
        paper += '\n\\end{document}';
    }

    return paper;
}