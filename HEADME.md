
# Project Blueprint: Scientific Publisher CLI

## 1. Project Overview

### 1.1. Objective
To create a comprehensive, menu-driven command-line interface (CLI) application for Windows CMD that fully automates the scientific paper generation, compilation, and publication workflow. The application will replicate and enhance the functionality of the "Advanced Scientific Paper Generator" web application, but will run entirely within a terminal environment with zero graphical user interface.

### 1.2. Core Technologies
-   **Runtime:** Node.js (LTS version)
-   **Language:** TypeScript
-   **AI Integration:** `@google/genai` SDK for interacting with Gemini models.
-   **CLI Interactivity:** `inquirer` (for user-friendly prompts and menus), `chalk` (for colored console output), `ora` (for spinners during long operations).
-   **Scheduling:** `node-cron` for robust daily automation.
-   **Packaging:** `pkg` to compile the Node.js project into a standalone Windows executable (`.exe`).

### 1.3. Key Features
-   **First-Run Setup:** Automatic environment check and setup, including API key configuration and LaTeX compiler installation.
-   **Interactive Menu:** A user-friendly, number-driven menu for all operations.
-   **Configurable Generation:** Users can set the language, number of articles, and page count for each run.
-   **Full Automation Workflow:** Complete, hands-off process from title generation to Zenodo publication.
-   **Intelligent LaTeX Handling:** Automatically detects existing LaTeX installations or provides an option to install a local version (TinyTeX).
-   **Secure Configuration:** API keys and user settings are stored locally in a `config.json` file.
-   **Daily Scheduler:** A persistent scheduler to run the generation process automatically at 7:00 AM daily.
-   **Detailed Logging:** Clear, real-time progress updates in the console, with final results saved to log files.

---

## 2. Proposed File Structure

```
scientific-publisher-cli/
├── dist/                     # Output directory for compiled JavaScript and executable
├── node_modules/
├── output/                   # Directory for generated .tex, .pdf, and log files
│   └── 2024-08-15/
│       ├── article-1/
│       │   ├── paper.pdf
│       │   └── paper.tex
│       └── results.log
├── src/
│   ├── cli/
│   │   ├── menus.ts          # Logic for displaying main and settings menus
│   │   └── prompts.ts        # Handlers for specific user inputs
│   ├── services/
│   │   ├── config.service.ts # Manages loading/saving of config.json
│   │   ├── gemini.service.ts # All interactions with the Gemini API
│   │   ├── latex.service.ts  # LaTeX compiler detection, installation, and execution
│   │   ├── scheduler.service.ts # Manages the node-cron daily automation job
│   │   └── zenodo.service.ts # Handles all interactions with the Zenodo API
│   ├── utils/
│   │   └── logger.ts         # Utility for styled console logging (using chalk)
│   ├── main.ts               # Main application entry point
│   ├── setup.ts              # First-run installation and configuration logic
│   └── workflow.ts           # Orchestrates the entire paper generation process
├── .gitignore
├── package.json
├── README.md                 # General project README
└── tsconfig.json
```

---

## 3. Core Logic & Module Implementation Details

### 3.1. `main.ts` (Application Entry Point)
-   **Responsibility:** Initialize the application, check for first-run conditions, and launch the main menu.
-   **Execution Flow:**
    1.  Check if `config.json` exists.
    2.  If not, it's the first run:
        -   Display a welcome message.
        -   Call `runSetup()` from `setup.ts`.
    3.  If `config.json` exists, load the configuration using `config.service.ts`.
    4.  Initialize the daily scheduler using `scheduler.service.ts` if it's active in the config.
    5.  Call `displayMainMenu()` from `src/cli/menus.ts` to start the user interaction loop.

### 3.2. `setup.ts` (First-Run Assistant)
-   **Responsibility:** Guide the user through the initial setup process.
-   **Function `runSetup()`:**
    1.  Call `promptForApiKeys(true)` from `config.service.ts` to force the entry of both Gemini and Zenodo keys.
    2.  Call `setupLatexCompiler()` from `latex.service.ts`. This function will:
        -   Check if `pdflatex` is in the system's PATH.
        -   If yes, confirm its usage.
        -   If no, prompt the user with `[Y/n]` to automatically download and install TinyTeX. Explain that this is a one-time process.
    3.  Create the initial `config.json` with default settings (e.g., language: 'pt', pageCount: 12, scheduler: false).
    4.  Display a "Setup Complete!" message.

### 3.3. `src/cli/menus.ts` & `prompts.ts` (User Interface)
-   **Technology:** Use the `inquirer` library.
-   **`menus.ts`:**
    -   `displayMainMenu()`: Presents the main choices:
        1.  Start New Generation Process
        2.  Settings
        3.  Exit
    -   `displaySettingsMenu()`: Presents settings options:
        1.  Change Language
        2.  Set Default Page Count
        3.  Toggle Daily Automation (50 Articles at 7 AM)
        4.  Update API Keys
        5.  Back to Main Menu
-   **`prompts.ts`:**
    -   Contains functions that use `inquirer` to ask for specific values.
    -   `promptForArticleCount()`: Asks "How many articles would you like to generate?".
    -   `promptForLanguage()`: Presents a list of languages with corresponding numbers.
    -   `promptForPageCount()`: Asks for the desired number of pages.

### 3.4. `src/workflow.ts` (Process Orchestrator)
-   **Responsibility:** Execute the end-to-end paper generation logic.
-   **Function `runFullAutomation(config)`:**
    1.  Accepts a configuration object (`{ articlesToGenerate, language, pageCount }`).
    2.  Create a timestamped output directory (e.g., `output/YYYY-MM-DD`).
    3.  Start a master `ora` spinner: `[1/${config.articlesToGenerate}] Starting process...`.
    4.  Loop from `i = 1` to `articlesToGenerate`:
        -   **Title:** Call `generatePaperTitle`. Log the title.
        -   **Initial Paper:** Call `generateInitialPaper`. Show spinner text "Generating initial draft...".
        -   **Analysis & Improvement:** Loop 12 times (or until quality threshold is met).
            -   Call `analyzePaper`.
            -   Update spinner text: `[${i}/${config.articlesToGenerate}] Iteration ${iter}/12...`.
            -   Call `improvePaper`.
        -   **File I/O:** Save the final LaTeX code to `output/YYYY-MM-DD/article-${i}/paper.tex`.
        -   **Compilation:**
            -   Update spinner: `Compiling PDF...`.
            -   Call `compileLatex` from `latex.service.ts`, passing the `.tex` file path.
            -   Handle compilation errors gracefully, log them, and continue to the next article.
        -   **Publication:**
            -   Update spinner: `Uploading to Zenodo...`.
            -   Call `uploadToZenodo` from `zenodo.service.ts`, passing the generated PDF path.
            -   Log the resulting DOI and link to the console and to `output/YYYY-MM-DD/results.log`.
    5.  Stop the master spinner with a success message.

### 3.5. Service Modules (`src/services/*.ts`)
-   **`config.service.ts`:** Adapt from the existing web app version. Use `fs.readFileSync` and `fs.writeFileSync` instead of `localStorage`.
-   **`gemini.service.ts`:** Adapt from the existing web app version. The core logic remains the same. Remove `localStorage` calls and get the API key from the loaded config object.
-   **`latex.service.ts`:**
    -   Adapt from the existing web app version. This module is already designed for a Node.js environment and is a perfect fit.
    -   Enhance the Windows check in `installTinyTeX`. If on Windows, first check for `choco`. If `choco` exists, suggest running `choco install miktex`. If not, fall back to the manual installation instruction.
-   **`zenodo.service.ts`:** Adapt from the existing web app version. This module uses `https` and `fs` and is suitable for Node.js.
-   **`scheduler.service.ts`:**
    -   Use `node-cron` to implement the daily job.
    -   `startScheduler(config)`:
        -   If `config.dailyAutomation` is true, schedule a cron job for `0 7 * * *` (7:00 AM every day).
        -   The job will call `workflow.runFullAutomation` with the hardcoded value of 50 articles and the user's saved settings.
    -   `stopScheduler()`: Stops the active cron job.
    -   The main application must remain running for the scheduler to work. Inform the user of this when they activate it.

---

## 4. Build and Distribution Instructions

-   **Development:**
    1.  Install dependencies: `npm install`
    2.  Compile TypeScript: `npm run build` (using `tsc`)
    3.  Run: `node dist/main.js`
-   **Packaging for Windows:**
    1.  Add a `build:exe` script to `package.json`.
    2.  The script will use the `pkg` library: `pkg . --targets node18-win-x64 --output scientific-publisher.exe`.
    3.  This command will compile the entire Node.js project, including assets, into a single, portable `.exe` file that can be run on any Windows machine without needing Node.js installed.
    4.  The final `README.md` should instruct the user to simply download and run `scientific-publisher.exe`.

---

## 5. Implementation Notes for the AI

-   **Error Handling:** Every step in the `workflow.ts` loop must be wrapped in a `try...catch` block. If an article fails at any stage (e.g., API quota error, compilation failure), log the error clearly and proceed to the next article in the queue.
-   **State Management:** The application state is simple and managed through the `config.json` file. There is no complex in-memory state.
-   **Dependencies in `package.json`:**
    -   `dependencies`: `@google/genai`, `inquirer`, `chalk`, `ora`, `node-cron`.
    -   `devDependencies`: `@types/node`, `@types/inquirer`, `@types/node-cron`, `typescript`, `pkg`.
-   **Reusability:** The logic within `gemini.service.ts`, `latex.service.ts`, and `zenodo.service.ts` from the original project is highly reusable. The primary task is to build the CLI wrapper and state management (`config.service.ts`) around this existing business logic.
