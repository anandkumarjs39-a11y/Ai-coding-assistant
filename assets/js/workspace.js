/**
 * AI Coding Assistant - Workspace Controller
 * Primary feature module with Monaco Editor integration, multi-task dispatch,
 * code generation, explanations, debugging, and improvements.
 */

const Workspace = {
  editor: null,
  currentTask: 'generate',
  currentLanguage: 'python',
  lastResponse: null,

  // Curated example prompts for examiner demonstration
  samplePrompts: {
    generate: [
      { label: 'Fibonacci Generator', prompt: 'Write an optimized iterative function to generate the first N Fibonacci numbers with boundary checks.', lang: 'python' },
      { label: 'Debounce Utility', prompt: 'Create a reusable debounce utility function for search input with delay timer cleanup.', lang: 'javascript' },
      { label: 'Binary Search', prompt: 'Implement iterative binary search on a sorted integer array returning index or -1.', lang: 'java' },
      { label: 'Aggregate Sales Query', prompt: 'Write a SQL query to calculate average salary per department for departments having more than 5 employees.', lang: 'sql' }
    ],
    explain: [
      { label: 'QuickSort Partition', prompt: 'Explain how the two-pointer partition logic operates and its average vs worst-case complexity.', lang: 'java' },
      { label: 'React Hook Debounce', prompt: 'Explain state persistence across renders and cleanup in this debounce timer function.', lang: 'javascript' },
      { label: 'Memory Allocation', prompt: 'Explain pointer manipulation and buffer safety in this string reversal routine.', lang: 'c' }
    ],
    debug: [
      { label: 'Index Out of Range', prompt: 'Fix IndexError when accessing the final item in a dynamic slice.', lang: 'python', error: 'IndexError: list index out of range at line 14' },
      { label: 'Null Pointer Exception', prompt: 'Identify why method call crashes when target node has no left child.', lang: 'java', error: 'java.lang.NullPointerException at Tree.java:42' },
      { label: 'Floating Point Precision', prompt: 'Resolve precision mismatch when summing currency values.', lang: 'javascript', error: '0.1 + 0.2 !== 0.3 test failure' }
    ],
    improve: [
      { label: 'Refactor Nested Loops', prompt: 'Improve performance and eliminate O(n^2) nested loop lookup using a hash table / dictionary.', lang: 'python' },
      { label: 'Modernize ES6 Syntax', prompt: 'Convert callback-based AJAX request to async/await with error boundaries.', lang: 'javascript' },
      { label: 'SQL Index Optimization', prompt: 'Rewrite query to utilize covering indexes and remove redundant subqueries.', lang: 'sql' }
    ]
  },

  async init() {
    this.readUrlParams();
    this.initMonaco();
    this.bindEvents();
    this.updateTaskUI();
    this.renderSamplePrompts();

    // Listen for theme change from UI toggler
    window.addEventListener('aca-theme-changed', (e) => {
      if (this.editor && window.monaco) {
        const monacoTheme = e.detail.theme === 'dark' ? 'vs-dark' : 'vs';
        monaco.editor.setTheme(monacoTheme);
      }
    });
  },

  readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const taskParam = params.get('task');
    const langParam = params.get('lang');
    if (taskParam && CONFIG.TASKS[taskParam]) {
      this.currentTask = taskParam;
    }
    if (langParam && CONFIG.SUPPORTED_LANGUAGES.some(l => l.id === langParam)) {
      this.currentLanguage = langParam;
    }
  },

  initMonaco() {
    const container = document.getElementById('monaco-editor-container');
    if (!container) return;

    // Check if Monaco loader is available via CDN
    if (typeof require !== 'undefined') {
      require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
      require(['vs/editor/editor.main'], () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const monacoTheme = currentTheme === 'dark' ? 'vs-dark' : 'vs';

        const defaultLang = CONFIG.SUPPORTED_LANGUAGES.find(l => l.id === this.currentLanguage);
        const starterCode = this.currentTask === 'generate' ? '' : (defaultLang ? defaultLang.sample : '');

        this.editor = monaco.editor.create(container, {
          value: starterCode,
          language: defaultLang ? defaultLang.monaco : 'python',
          theme: monacoTheme,
          fontSize: 13.5,
          fontFamily: "'JetBrains Mono', Consolas, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          tabSize: 4,
          wordWrap: 'on'
        });

        // Editor change listener for status bar updates
        this.editor.onDidChangeModelContent(() => {
          this.updateEditorStats();
        });
        this.updateEditorStats();
      });
    } else {
      // Fallback fallback textarea if CDN script is offline
      container.innerHTML = `<textarea id="editor-fallback-input" class="form-control-custom font-mono h-100 w-100 p-3" style="background: #1e1e1e; color: #fff; border: none; resize: none;"></textarea>`;
    }
  },

  getEditorValue() {
    if (this.editor) return this.editor.getValue();
    const fallback = document.getElementById('editor-fallback-input');
    return fallback ? fallback.value : '';
  },

  setEditorValue(val) {
    if (this.editor) {
      this.editor.setValue(val);
    } else {
      const fallback = document.getElementById('editor-fallback-input');
      if (fallback) fallback.value = val;
    }
    this.updateEditorStats();
  },

  updateEditorLanguage(langId) {
    this.currentLanguage = langId;
    const langObj = CONFIG.SUPPORTED_LANGUAGES.find(l => l.id === langId);
    if (!langObj) return;

    if (this.editor && window.monaco) {
      const model = this.editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, langObj.monaco);
      }
    }

    // Update status bar label
    const langBadge = document.getElementById('editor-lang-indicator');
    if (langBadge) langBadge.textContent = langObj.name;

    // Synchronize select element if not changed from select
    const selectEl = document.getElementById('language-selector');
    if (selectEl && selectEl.value !== langId) {
      selectEl.value = langId;
    }
  },

  updateEditorStats() {
    const val = this.getEditorValue();
    const lines = val ? val.split('\n').length : 0;
    const chars = val ? val.length : 0;
    
    const linesEl = document.getElementById('editor-lines-count');
    const charsEl = document.getElementById('editor-chars-count');
    if (linesEl) linesEl.textContent = `${lines} lines`;
    if (charsEl) charsEl.textContent = `${chars} chars`;
  },

  bindEvents() {
    // Task selector change
    const taskSelect = document.getElementById('task-selector');
    if (taskSelect) {
      taskSelect.value = this.currentTask;
      taskSelect.addEventListener('change', (e) => {
        this.currentTask = e.target.value;
        this.updateTaskUI();
        this.renderSamplePrompts();
      });
    }

    // Language selector change
    const langSelect = document.getElementById('language-selector');
    if (langSelect) {
      langSelect.value = this.currentLanguage;
      langSelect.addEventListener('change', (e) => {
        this.updateEditorLanguage(e.target.value);
      });
    }

    // Clear editor button
    const btnClearEditor = document.getElementById('btn-clear-editor');
    if (btnClearEditor) {
      btnClearEditor.addEventListener('click', () => {
        this.setEditorValue('');
        if (window.UI) UI.showToast('Editor cleared', 'info');
      });
    }

    // Reset / Sample snippet button
    const btnResetSample = document.getElementById('btn-reset-sample');
    if (btnResetSample) {
      btnResetSample.addEventListener('click', () => {
        const langObj = CONFIG.SUPPORTED_LANGUAGES.find(l => l.id === this.currentLanguage);
        if (langObj && langObj.sample) {
          this.setEditorValue(langObj.sample);
          if (window.UI) UI.showToast(`Loaded ${langObj.name} starter snippet`, 'info');
        }
      });
    }

    // Clear instructions button
    const btnClearInstructions = document.getElementById('btn-clear-instructions');
    if (btnClearInstructions) {
      btnClearInstructions.addEventListener('click', () => {
        const instructionInput = document.getElementById('instruction-input');
        if (instructionInput) instructionInput.value = '';
      });
    }

    // Ask AI / Submit Button
    const btnSubmit = document.getElementById('btn-submit-task');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => this.handleTaskSubmission());
    }

    // Output Action: Copy Code
    const btnCopyCode = document.getElementById('btn-copy-code');
    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', () => {
        const codeOutput = document.getElementById('output-code-text');
        if (codeOutput && codeOutput.textContent) {
          UI.copyToClipboard(codeOutput.textContent, btnCopyCode);
        }
      });
    }

    // Output Action: Download Code
    const btnDownloadCode = document.getElementById('btn-download-code');
    if (btnDownloadCode) {
      btnDownloadCode.addEventListener('click', () => {
        const codeOutput = document.getElementById('output-code-text');
        if (codeOutput && codeOutput.textContent) {
          const langObj = CONFIG.SUPPORTED_LANGUAGES.find(l => l.id === this.currentLanguage) || { ext: '.txt' };
          const filename = `aca_${this.currentTask}_${Date.now()}${langObj.ext}`;
          UI.downloadFile(filename, codeOutput.textContent);
        }
      });
    }

    // Output Action: Regenerate
    const btnRegenerate = document.getElementById('btn-regenerate');
    if (btnRegenerate) {
      btnRegenerate.addEventListener('click', () => {
        this.handleTaskSubmission();
      });
    }

    // Output Action: New Conversation
    const btnNewConv = document.getElementById('btn-new-conversation');
    if (btnNewConv) {
      btnNewConv.addEventListener('click', () => {
        this.resetWorkspace();
      });
    }
  },

  updateTaskUI() {
    const taskInfo = CONFIG.TASKS[this.currentTask] || CONFIG.TASKS.generate;
    
    // Update task indicator badge or title
    const titleEl = document.getElementById('workspace-task-title');
    if (titleEl) titleEl.textContent = taskInfo.title;

    // Update instruction placeholder & requirement badge
    const instructionInput = document.getElementById('instruction-input');
    const instructionLabel = document.getElementById('instruction-label');
    const editorRequiredLabel = document.getElementById('editor-required-badge');
    const errorGroup = document.getElementById('error-message-group');

    if (errorGroup) {
      // Only show error input field on Debug task
      errorGroup.style.display = this.currentTask === 'debug' ? 'block' : 'none';
    }

    if (this.currentTask === 'generate') {
      if (instructionInput) instructionInput.placeholder = 'e.g. Write an algorithm to solve the 0/1 Knapsack problem with dynamic programming table memoization...';
      if (instructionLabel) instructionLabel.textContent = 'Natural Language Requirements / Instructions';
      if (editorRequiredLabel) editorRequiredLabel.textContent = '(Optional Reference Code)';
    } else if (this.currentTask === 'explain') {
      if (instructionInput) instructionInput.placeholder = 'e.g. Focus particularly on space complexity and recursive call stack depth...';
      if (instructionLabel) instructionLabel.textContent = 'Specific Explanation Focus (Optional)';
      if (editorRequiredLabel) editorRequiredLabel.textContent = '(Source Code Required)';
    } else if (this.currentTask === 'debug') {
      if (instructionInput) instructionInput.placeholder = 'e.g. The function throws an exception when the input array contains duplicate values...';
      if (instructionLabel) instructionLabel.textContent = 'Bug Description / Expected vs Actual Behavior';
      if (editorRequiredLabel) editorRequiredLabel.textContent = '(Buggy Code Required)';
    } else if (this.currentTask === 'improve') {
      if (instructionInput) instructionInput.placeholder = 'e.g. Optimize for low memory footprint and strict type safety...';
      if (instructionLabel) instructionLabel.textContent = 'Improvement Goals (Readability, Performance, Modern Idioms)';
      if (editorRequiredLabel) editorRequiredLabel.textContent = '(Existing Code Required)';
    }
  },

  renderSamplePrompts() {
    const container = document.getElementById('sample-prompts-container');
    if (!container) return;

    const samples = this.samplePrompts[this.currentTask] || [];
    container.innerHTML = samples.map((s, idx) => `
      <button type="button" class="btn-sample-chip" data-idx="${idx}">
        <i class="bi bi-chat-left-quote me-1"></i>${s.label}
      </button>
    `).join('');

    // Attach click events to load sample
    container.querySelectorAll('.btn-sample-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const sample = samples[idx];
        if (!sample) return;

        // Set instruction
        const instructionInput = document.getElementById('instruction-input');
        if (instructionInput) instructionInput.value = sample.prompt;

        // Set language
        if (sample.lang) {
          this.updateEditorLanguage(sample.lang);
        }

        // Set error message if debug
        if (sample.error) {
          const errInput = document.getElementById('debug-error-input');
          if (errInput) errInput.value = sample.error;
        }

        // If task requires code and editor is empty, set default sample for that language
        if (CONFIG.TASKS[this.currentTask].requiresCode && !this.getEditorValue().trim()) {
          const langObj = CONFIG.SUPPORTED_LANGUAGES.find(l => l.id === (sample.lang || this.currentLanguage));
          if (langObj) this.setEditorValue(langObj.sample);
        }

        UI.showToast(`Loaded sample: "${sample.label}"`, 'info');
      });
    });
  },

  async handleTaskSubmission() {
    const instructionInput = document.getElementById('instruction-input');
    const instruction = instructionInput ? instructionInput.value.trim() : '';
    const code = this.getEditorValue().trim();
    const taskConfig = CONFIG.TASKS[this.currentTask];

    // Validation
    if (taskConfig.requiresCode && !code) {
      UI.showToast(`Please enter source code in the editor for ${taskConfig.title}.`, 'error');
      return;
    }

    if (this.currentTask === 'generate' && !instruction && !code) {
      UI.showToast('Please provide natural language requirements or prompts to generate code.', 'error');
      return;
    }

    // Toggle Loading State
    this.setLoadingState(true);

    try {
      let response = null;
      const payload = {
        language: this.currentLanguage,
        instruction: instruction,
        code: code
      };

      if (this.currentTask === 'generate') {
        const complexitySelect = document.getElementById('complexity-selector');
        payload.complexity = complexitySelect ? complexitySelect.value : 'Intermediate';
        response = await API.generateCode(payload);
      } else if (this.currentTask === 'explain') {
        response = await API.explainCode(payload);
      } else if (this.currentTask === 'debug') {
        const errInput = document.getElementById('debug-error-input');
        payload.error_message = errInput ? errInput.value.trim() : '';
        response = await API.debugCode(payload);
      } else if (this.currentTask === 'improve') {
        response = await API.improveCode(payload);
      }

      this.lastResponse = response;
      this.renderOutput(response);

      // Auto-save to conversation history
      await API.saveConversation({
        task: this.currentTask,
        language: this.currentLanguage,
        instruction: instruction,
        code: code,
        response: response
      });

      UI.showToast('AI response generated successfully!', 'success');
    } catch (err) {
      console.error('[Workspace] Submission failed:', err);
      UI.showToast(err.message || 'Failed to process request. Please check backend connection.', 'error');
      this.renderErrorOutput(err.message);
    } finally {
      this.setLoadingState(false);
    }
  },

  setLoadingState(isLoading) {
    const btnSubmit = document.getElementById('btn-submit-task');
    const emptyState = document.getElementById('output-empty-state');
    const loadingState = document.getElementById('output-loading-state');
    const resultContainer = document.getElementById('output-result-container');

    if (btnSubmit) {
      btnSubmit.disabled = isLoading;
      btnSubmit.innerHTML = isLoading 
        ? '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Analyzing...'
        : '<i class="bi bi-stars me-1"></i> Ask AI';
    }

    if (isLoading) {
      if (emptyState) emptyState.style.display = 'none';
      if (resultContainer) resultContainer.style.display = 'none';
      if (loadingState) loadingState.style.display = 'flex';
    } else {
      if (loadingState) loadingState.style.display = 'none';
    }
  },

  renderOutput(res) {
    const emptyState = document.getElementById('output-empty-state');
    const resultContainer = document.getElementById('output-result-container');
    if (emptyState) emptyState.style.display = 'none';
    if (resultContainer) resultContainer.style.display = 'flex';

    // 1. Code Output
    const codeCard = document.getElementById('output-code-card');
    const codePre = document.getElementById('output-code-text');
    const langLabel = document.getElementById('output-lang-label');

    const codeContent = res.generated_code || res.corrected_code || res.improved_code || '';
    if (codeContent) {
      if (codeCard) codeCard.style.display = 'block';
      if (codePre) codePre.textContent = codeContent;
      if (langLabel) langLabel.textContent = (res.language || this.currentLanguage).toUpperCase();
    } else {
      if (codeCard) codeCard.style.display = 'none';
    }

    // 2. Explanation / Breakdown Output
    const explanationCard = document.getElementById('output-explanation-card');
    const explanationBody = document.getElementById('output-explanation-body');
    const explanationTitle = document.getElementById('output-explanation-title');

    let formattedExplanation = '';

    if (this.currentTask === 'generate') {
      if (explanationTitle) explanationTitle.innerHTML = '<i class="bi bi-info-circle text-primary me-2"></i>Implementation & Logic';
      formattedExplanation = res.explanation || 'Code generated according to requirements.';
      if (res.sample_input && res.sample_output) {
        formattedExplanation += `\n\n### Sample Test Case\n- **Input**: \`${res.sample_input}\`\n- **Output**: \`${res.sample_output}\``;
      }
    } else if (this.currentTask === 'explain') {
      if (explanationTitle) explanationTitle.innerHTML = '<i class="bi bi-journal-check text-info me-2"></i>Algorithmic Analysis & Complexity';
      let stepsMarkdown = (res.steps || []).map(s => `- ${s}`).join('\n');
      let varsMarkdown = (res.functions_and_variables || []).map(v => `- **\`${v.name}\`**: ${v.purpose}`).join('\n');
      formattedExplanation = `### Summary\n${res.summary || ''}\n\n### Execution Flow\n${stepsMarkdown}\n\n### Functions & Variables\n${varsMarkdown}\n\n### Complexity Analysis\n- **Time Complexity**: ${res.time_complexity || 'N/A'}\n- **Space Complexity**: ${res.space_complexity || 'N/A'}`;
    } else if (this.currentTask === 'debug') {
      if (explanationTitle) explanationTitle.innerHTML = '<i class="bi bi-shield-check text-warning me-2"></i>Root Cause & Correction Guide';
      formattedExplanation = `### Problem Summary\n${res.problem_summary || ''}\n\n### Likely Cause\n${res.likely_cause || ''}\n\n### Suggested Fix\n${res.suggested_fix || ''}\n\n### Technical Explanation\n${res.fix_explanation || ''}`;
    } else if (this.currentTask === 'improve') {
      if (explanationTitle) explanationTitle.innerHTML = '<i class="bi bi-lightning text-success me-2"></i>Refactoring & Best Practices';
      let practices = (res.best_practices || []).map(p => `- ${p}`).join('\n');
      formattedExplanation = `### Summary of Improvements\n${res.summary_of_changes || ''}\n\n### Readability & Maintainability\n${res.readability_notes || ''}\n\n### Performance & Efficiency\n${res.performance_notes || ''}\n\n### Applied Best Practices\n${practices}`;
    }

    if (explanationBody) {
      explanationBody.innerHTML = UI.formatMarkdown(formattedExplanation);
    }

    // Scroll output to top
    const scrollContainer = document.querySelector('.output-scroll-container');
    if (scrollContainer) scrollContainer.scrollTop = 0;
  },

  renderErrorOutput(errorMsg) {
    const emptyState = document.getElementById('output-empty-state');
    const resultContainer = document.getElementById('output-result-container');
    if (emptyState) emptyState.style.display = 'none';
    if (resultContainer) resultContainer.style.display = 'flex';

    const codeCard = document.getElementById('output-code-card');
    if (codeCard) codeCard.style.display = 'none';

    const explanationBody = document.getElementById('output-explanation-body');
    const explanationTitle = document.getElementById('output-explanation-title');
    if (explanationTitle) explanationTitle.innerHTML = '<i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>Request Error';
    if (explanationBody) {
      explanationBody.innerHTML = `
        <div class="alert alert-danger" role="alert" style="background-color: rgba(220, 38, 38, 0.1); border-color: rgba(220, 38, 38, 0.2); color: var(--color-danger);">
          <div class="fw-bold mb-1">Failed to generate response:</div>
          <div>${errorMsg}</div>
        </div>
        <p class="text-muted small mt-2">
          Tip for College Viva: Ensure the Flask backend is executing via <code>python app.py</code>, or click the connection pill in the top navigation to switch into the built-in Viva Presentation Mock Engine.
        </p>
      `;
    }
  },

  resetWorkspace() {
    const instructionInput = document.getElementById('instruction-input');
    if (instructionInput) instructionInput.value = '';
    const errInput = document.getElementById('debug-error-input');
    if (errInput) errInput.value = '';

    const langObj = CONFIG.SUPPORTED_LANGUAGES.find(l => l.id === this.currentLanguage);
    this.setEditorValue(this.currentTask === 'generate' ? '' : (langObj ? langObj.sample : ''));

    const emptyState = document.getElementById('output-empty-state');
    const resultContainer = document.getElementById('output-result-container');
    if (emptyState) emptyState.style.display = 'flex';
    if (resultContainer) resultContainer.style.display = 'none';

    UI.showToast('Workspace reset for new task', 'info');
  }
};

window.Workspace = Workspace;
