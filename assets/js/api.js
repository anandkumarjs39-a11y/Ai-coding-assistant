/**
 * AI Coding Assistant - REST API Client
 * Centralized API handler for Flask backend with error handling and Viva Demo fallback
 */

const API = {
  /**
   * Primary HTTP request dispatcher
   */
  async request(endpoint, options = {}) {
    const isMock = CONFIG.MOCK_MODE_ENABLED;
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    
    // Auth headers
    const token = localStorage.getItem('aca_auth_token');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    // If Mock mode is explicitly forced or active, route to simulated engine
    if (isMock) {
      return this.handleMockRequest(endpoint, options);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle common HTTP error statuses
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized: Clear token and redirect if on a protected page
          localStorage.removeItem('aca_auth_token');
          if (!window.location.pathname.includes('login.html') && 
              !window.location.pathname.includes('register.html') &&
              !window.location.pathname.includes('index.html')) {
            window.location.href = 'login.html?expired=1';
          }
          throw new Error('Session expired or unauthorized. Please log in.');
        }

        let errorMessage = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          errorMessage = errData.message || errData.error || errorMessage;
        } catch (e) {
          // Non-JSON response
        }

        switch (response.status) {
          case 400:
            throw new Error(`Invalid request: ${errorMessage}`);
          case 403:
            throw new Error(`Access forbidden: ${errorMessage}`);
          case 404:
            throw new Error(`Resource not found: ${errorMessage}`);
          case 429:
            throw new Error('Rate limit exceeded. Please wait a few seconds before trying again.');
          case 500:
            throw new Error(`Backend internal server error: ${errorMessage}`);
          default:
            throw new Error(errorMessage);
        }
      }

      return await response.json();
    } catch (networkError) {
      console.warn(`[API] Flask connection failed on ${url}:`, networkError.message);
      
      // Auto-fallback: If backend is not running, prompt user or use mock fallback for viva presentation
      if (networkError.message.includes('Failed to fetch') || networkError.message.includes('NetworkError')) {
        console.info('[API] Backend server unreachable. Falling back to built-in Viva Presentation Mock Engine.');
        if (window.UI) {
          window.UI.showToast('Flask backend offline. Utilizing Viva Demo Mock Engine.', 'info');
        }
        return this.handleMockRequest(endpoint, options);
      }
      throw networkError;
    }
  },

  /* ========================================================================
     Authentication Endpoints
     ======================================================================== */
  async register(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  },

  async getCurrentUser() {
    return this.request('/auth/me', {
      method: 'GET'
    });
  },

  /* ========================================================================
     AI Task Endpoints
     ======================================================================== */
  async generateCode(payload) {
    return this.request('/ai/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async explainCode(payload) {
    return this.request('/ai/explain', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async debugCode(payload) {
    return this.request('/ai/debug', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async improveCode(payload) {
    return this.request('/ai/improve', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /* ========================================================================
     Conversation History Endpoints
     ======================================================================== */
  async getConversations() {
    return this.request('/conversations', {
      method: 'GET'
    });
  },

  async saveConversation(data) {
    return this.request('/conversations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getConversationById(id) {
    return this.request(`/conversations/${id}`, {
      method: 'GET'
    });
  },

  async deleteConversation(id) {
    return this.request(`/conversations/${id}`, {
      method: 'DELETE'
    });
  },

  /* ========================================================================
     Dashboard & Settings Endpoints
     ======================================================================== */
  async getDashboardStats() {
    return this.request('/dashboard/stats', {
      method: 'GET'
    });
  },

  async getSettings() {
    return this.request('/settings', {
      method: 'GET'
    });
  },

  async updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  /* ========================================================================
     Viva Presentation Mock Engine
     Provides realistic responses conforming strictly to the Flask REST contract
     ======================================================================== */
  async handleMockRequest(endpoint, options) {
    // Artificial latency for realism
    await new Promise(res => setTimeout(res, 600));

    // Endpoint: POST /auth/login
    if (endpoint === '/auth/login') {
      const body = JSON.parse(options.body || '{}');
      if (!body.email || !body.password) {
        throw new Error('Email and password are required.');
      }
      return {
        success: true,
        token: 'mock_jwt_token_' + Date.now(),
        user: {
          id: 'usr_001',
          name: body.email.split('@')[0].replace('.', ' '),
          email: body.email,
          role: 'Student / CS Senior',
          semester: '8th Semester',
          college: 'School of Computer Science & Engineering'
        }
      };
    }

    // Endpoint: POST /auth/register
    if (endpoint === '/auth/register') {
      const body = JSON.parse(options.body || '{}');
      return {
        success: true,
        message: 'Registration successful! You may now log in.',
        user: {
          id: 'usr_new',
          name: body.name || 'New Developer',
          email: body.email,
          role: 'Student'
        }
      };
    }

    // Endpoint: GET /auth/me
    if (endpoint === '/auth/me') {
      return {
        success: true,
        user: {
          id: 'usr_001',
          name: 'Alex Chen',
          email: 'alex.chen@university.edu',
          role: 'Final Year Student (B.Tech CSE)',
          project: 'AI Coding Assistant'
        }
      };
    }

    // Endpoint: POST /auth/logout
    if (endpoint === '/auth/logout') {
      return { success: true, message: 'Successfully logged out.' };
    }

    // Endpoint: GET /dashboard/stats
    if (endpoint === '/dashboard/stats') {
      const history = JSON.parse(localStorage.getItem('aca_saved_conversations') || '[]');
      return {
        success: true,
        total_requests: 48 + history.length,
        saved_conversations: history.length,
        supported_languages_count: 6,
        avg_response_time: '1.2s',
        top_tasks: [
          { task: 'Code Generation', count: 24 },
          { task: 'Code Explainer', count: 14 },
          { task: 'Debugging', count: 7 },
          { task: 'Optimization', count: 3 }
        ]
      };
    }

    // Endpoint: GET /conversations
    if (endpoint === '/conversations') {
      let saved = JSON.parse(localStorage.getItem('aca_saved_conversations') || 'null');
      if (!saved) {
        // Seed with professional starter history
        saved = [
          {
            id: 'conv_101',
            title: 'Binary Search Tree Implementation with In-Order Traversal',
            task: 'generate',
            language: 'python',
            instruction: 'Implement a complete Binary Search Tree in Python with insert and in-order traversal.',
            code: 'class Node:\n    def __init__(self, key):\n        self.left = None\n        self.right = None\n        self.val = key\n\ndef insert(root, key):\n    if root is None:\n        return Node(key)\n    if key < root.val:\n        root.left = insert(root.left, key)\n    else:\n        root.right = insert(root.right, key)\n    return root',
            created_at: new Date(Date.now() - 3600000 * 5).toISOString()
          },
          {
            id: 'conv_102',
            title: 'Debugging TypeError: unsupported operand in matrix multiplication',
            task: 'debug',
            language: 'python',
            instruction: 'Fix dimension mismatch during 2D matrix multiplication.',
            code: 'def multiply(A, B):\n    # fixed loop bounds\n    return [[sum(a*b for a,b in zip(X_row, Y_col)) for Y_col in zip(*B)] for X_row in A]',
            created_at: new Date(Date.now() - 3600000 * 24).toISOString()
          },
          {
            id: 'conv_103',
            title: 'Explaining QuickSort with Time Complexity Trade-offs',
            task: 'explain',
            language: 'java',
            instruction: 'Explain partition logic and worst-case scenario.',
            code: 'int partition(int arr[], int low, int high) {\n    int pivot = arr[high];\n    int i = (low - 1);\n    for (int j = low; j < high; j++) {\n        if (arr[j] <= pivot) {\n            i++;\n            int temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;\n        }\n    }\n    int temp = arr[i + 1]; arr[i + 1] = arr[high]; arr[high] = temp;\n    return i + 1;\n}',
            created_at: new Date(Date.now() - 3600000 * 48).toISOString()
          }
        ];
        localStorage.setItem('aca_saved_conversations', JSON.stringify(saved));
      }
      return { success: true, conversations: saved };
    }

    // Endpoint: POST /conversations
    if (endpoint === '/conversations') {
      const data = JSON.parse(options.body || '{}');
      const saved = JSON.parse(localStorage.getItem('aca_saved_conversations') || '[]');
      const newEntry = {
        id: 'conv_' + Date.now(),
        title: data.title || (data.instruction ? data.instruction.slice(0, 45) + '...' : 'Untitled Task'),
        task: data.task || 'generate',
        language: data.language || 'python',
        instruction: data.instruction || '',
        code: data.code || '',
        response: data.response || null,
        created_at: new Date().toISOString()
      };
      saved.unshift(newEntry);
      localStorage.setItem('aca_saved_conversations', JSON.stringify(saved));
      return { success: true, conversation: newEntry };
    }

    // Endpoint: GET /conversations/:id
    if (endpoint.startsWith('/conversations/') && options.method === 'GET') {
      const id = endpoint.split('/')[2];
      const saved = JSON.parse(localStorage.getItem('aca_saved_conversations') || '[]');
      const found = saved.find(c => c.id === id);
      if (found) return { success: true, conversation: found };
      throw new Error('Conversation not found');
    }

    // Endpoint: DELETE /conversations/:id
    if (endpoint.startsWith('/conversations/') && options.method === 'DELETE') {
      const id = endpoint.split('/')[2];
      let saved = JSON.parse(localStorage.getItem('aca_saved_conversations') || '[]');
      saved = saved.filter(c => c.id !== id);
      localStorage.setItem('aca_saved_conversations', JSON.stringify(saved));
      return { success: true, message: 'Conversation deleted.' };
    }

    // AI Endpoints
    const body = JSON.parse(options.body || '{}');
    const lang = body.language || 'python';
    const code = body.code || '';
    const instruction = body.instruction || '';

    if (endpoint === '/ai/generate') {
      return this.mockGenerate(instruction, lang, body.complexity);
    }
    if (endpoint === '/ai/explain') {
      return this.mockExplain(code, lang);
    }
    if (endpoint === '/ai/debug') {
      return this.mockDebug(code, lang, body.error_message);
    }
    if (endpoint === '/ai/improve') {
      return this.mockImprove(code, lang);
    }

    // Settings
    if (endpoint === '/settings') {
      return {
        success: true,
        settings: {
          api_base_url: CONFIG.API_BASE_URL,
          theme: localStorage.getItem('aca_theme') || 'dark',
          mock_mode: CONFIG.MOCK_MODE_ENABLED
        }
      };
    }

    return { success: true, message: 'OK' };
  },

  /* Realistic Mock Generators matching Flask JSON schema */
  mockGenerate(instruction, lang, complexity = 'Intermediate') {
    const langTemplates = {
      python: {
        code: `"""\nGenerated by AI Coding Assistant\nTask: ${instruction || 'Solution'}\n"""\n\nfrom typing import List, Optional\n\ndef execute_solution(data: List[int]) -> Optional[int]:\n    """\n    Processes input dataset and applies optimal algorithmic transformation.\n    Time Complexity: O(n log n)\n    Space Complexity: O(1) auxiliary\n    """\n    if not data:\n        return None\n        \n    sorted_data = sorted(data)\n    # Compute target metric\n    result = sum(sorted_data) // len(sorted_data)\n    return result\n\nif __name__ == "__main__":\n    test_input = [12, 45, 2, 89, 34, 17]\n    print(f"Result: {execute_solution(test_input)}")\n`,
        sample_input: "[12, 45, 2, 89, 34, 17]",
        sample_output: "33"
      },
      javascript: {
        code: `/**\n * Generated by AI Coding Assistant\n * Task: ${instruction || 'Solution'}\n */\n\nexport function executeSolution(items = []) {\n  if (!Array.isArray(items) || items.length === 0) {\n    return null;\n  }\n  \n  // Transform items with defensive boundary checks\n  return items\n    .filter(val => typeof val === 'number')\n    .reduce((acc, curr) => acc + curr, 0) / items.length;\n}\n\n// Example usage\nconst sample = [10, 20, 30, 40, 50];\nconsole.log('Calculated average:', executeSolution(sample));\n`,
        sample_input: "[10, 20, 30, 40, 50]",
        sample_output: "30"
      },
      java: {
        code: `/**\n * Generated by AI Coding Assistant\n * Task: ${instruction || 'Solution'}\n */\nimport java.util.Arrays;\n\npublic class Solution {\n    public static double executeSolution(int[] values) {\n        if (values == null || values.length == 0) {\n            return 0.0;\n        }\n        long sum = 0;\n        for (int v : values) {\n            sum += v;\n        }\n        return (double) sum / values.length;\n    }\n\n    public static void main(String[] args) {\n        int[] numbers = {15, 25, 35, 45};\n        System.out.println("Result: " + executeSolution(numbers));\n    }\n}\n`,
        sample_input: "{15, 25, 35, 45}",
        sample_output: "Result: 30.0"
      },
      cpp: {
        code: `// Generated by AI Coding Assistant\n#include <iostream>\n#include <vector>\n#include <numeric>\n\ndouble executeSolution(const std::vector<int>& data) {\n    if (data.empty()) return 0.0;\n    long long sum = std::accumulate(data.begin(), data.end(), 0LL);\n    return static_cast<double>(sum) / data.size();\n}\n\nint main() {\n    std::vector<int> sample = {4, 8, 15, 16, 23, 42};\n    std::cout << "Mean: " << executeSolution(sample) << std::endl;\n    return 0;\n}\n`,
        sample_input: "{4, 8, 15, 16, 23, 42}",
        sample_output: "Mean: 18"
      },
      sql: {
        code: `-- Generated by AI Coding Assistant\n-- Query matching: ${instruction || 'Solution'}\n\nSELECT \n    category_id,\n    COUNT(item_id) AS total_items,\n    ROUND(AVG(price), 2) AS average_price,\n    MAX(created_at) AS latest_entry\nFROM catalog_items\nWHERE status = 'ACTIVE'\nGROUP BY category_id\nHAVING COUNT(item_id) >= 3\nORDER BY average_price DESC;\n`,
        sample_input: "Table: catalog_items (columns: category_id, item_id, price, status, created_at)",
        sample_output: "Result set grouped by category_id with aggregation filters"
      },
      c: {
        code: `// Generated by AI Coding Assistant\n#include <stdio.h>\n\ndouble calculateAverage(const int arr[], int size) {\n    if (size <= 0) return 0.0;\n    long sum = 0;\n    for (int i = 0; i < size; i++) {\n        sum += arr[i];\n    }\n    return (double)sum / size;\n}\n\nint main() {\n    int test[] = {5, 10, 15, 20};\n    printf("Average: %.2f\\n", calculateAverage(test, 4));\n    return 0;\n}\n`,
        sample_input: "Array: {5, 10, 15, 20}, size: 4",
        sample_output: "Average: 12.50"
      }
    };

    const template = langTemplates[lang] || langTemplates.python;
    return {
      success: true,
      task: 'generate',
      language: lang,
      complexity: complexity,
      generated_code: template.code,
      explanation: `### Overview\nThis solution implements **${instruction || 'the requested program'}** in **${lang.toUpperCase()}** following standard production idioms.\n\n### Key Highlights\n1. **Edge Case Handling**: Defensive boundary checks prevent exceptions on empty or invalid inputs.\n2. **Clean Structure**: Modular function design promotes testability and maintainability.\n3. **Complexity Guarantees**: Optimized to minimize computational overhead and memory allocations.`,
      sample_input: template.sample_input,
      sample_output: template.sample_output
    };
  },

  mockExplain(code, lang) {
    return {
      success: true,
      task: 'explain',
      language: lang,
      summary: `The provided ${lang.toUpperCase()} code defines a structured algorithmic routine with iterative data traversal, parameter boundary validation, and result calculation.`,
      steps: [
        `**Initialization**: Allocates local pointers, buffers, or accumulators to maintain internal execution state.`,
        `**Data Traversal**: Iterates across elements using a standard control loop or recursive dispatch.`,
        `**In-place Transformation**: Executes conditional branches or arithmetic logic based on evaluation criteria.`,
        `**Return Value**: Yields the final computed result or mutates target structures.`
      ],
      functions_and_variables: [
        { name: 'Input Parameter', purpose: 'Receives the incoming data stream or collection to process.' },
        { name: 'Internal State/Index', purpose: 'Maintains positional cursor throughout the iteration cycle.' },
        { name: 'Return Output', purpose: 'Delivers the sanitized final calculation to caller scope.' }
      ],
      algorithm_logic: `Uses a linear or divide-and-conquer strategy depending on input distribution. Guarantees deterministic behavior without side effects.`,
      time_complexity: 'O(n) where n represents the size of the input elements.',
      space_complexity: 'O(1) auxiliary space as memory is allocated in-place without duplicate buffers.'
    };
  },

  mockDebug(code, lang, errorMessage) {
    return {
      success: true,
      task: 'debug',
      language: lang,
      error_detected: true,
      problem_summary: errorMessage ? `Runtime/Syntax Exception detected: "${errorMessage}"` : 'Potential logic boundary flaw and missing input sanitization detected in source routine.',
      likely_cause: `The routine does not guard against zero-length collections or off-by-one index boundaries during loop execution. This often causes out-of-range or null reference exceptions.`,
      suggested_fix: `1. Add an initial guard clause at the head of the function.\n2. Ensure boundary checks use strictly valid index constraints.\n3. Return a sentinel value or raise a custom handled exception when arguments violate preconditions.`,
      corrected_code: code ? code.replace(/(\w+)\s*\[(\w+)\]/g, '/* verified bounds */ $1[$2]') : `// Corrected version with boundary checking\nif (input == null) return -1;\n// Safe execution continues`,
      fix_explanation: `Adding defensive validation resolves unpredictable runtime behavior and conforms to robust programming standards evaluated during college project vivas.`
    };
  },

  mockImprove(code, lang) {
    return {
      success: true,
      task: 'improve',
      language: lang,
      readability_notes: `Variables have been renamed to self-documenting terminology, and explanatory docstrings/comments have been introduced.`,
      performance_notes: `Replaced redundant allocations with streamlined standard library operations, reducing loop overhead.`,
      best_practices: [
        `Enforced strict type annotations / const correctness.`,
        `Extracted nested conditional branches into single-responsibility helpers.`,
        `Replaced magic numbers with named constants.`
      ],
      improved_code: code ? `// Refactored for clean code & maintainability\n` + code : `// Improved production structure\n`,
      summary_of_changes: `Modernized coding conventions, added input validation guard clauses, and minimized algorithmic overhead.`
    };
  }
};

window.API = API;
