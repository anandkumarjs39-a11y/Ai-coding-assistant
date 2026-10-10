/**
 * AI Coding Assistant - Configuration
 * Academic Final-Semester Project
 */

const CONFIG = {
  // Configurable backend Flask REST API base URL
  // Default points to standard Flask server port or local proxy
  API_BASE_URL: localStorage.getItem('aca_api_base_url') || 'http://localhost:5000/api',

  // Mock Engine Mode: When enabled or backend is unreachable, the frontend operates
  // in viva presentation mode using structured, schema-compliant simulated data.
  // Can be toggled live in the Topbar or Settings page.
  MOCK_MODE_ENABLED: localStorage.getItem('aca_mock_mode') === null 
    ? true // Enabled by default for preview, can be toggled to false when Flask is running
    : localStorage.getItem('aca_mock_mode') === 'true',

  APP_NAME: 'AI Coding Assistant',
  PROJECT_STAGE: 'Final Semester Project Demonstration',

  SUPPORTED_LANGUAGES: [
    { id: 'python', name: 'Python', ext: '.py', monaco: 'python', sample: 'def calculate_fibonacci(n):\n    if n <= 0:\n        return []\n    sequence = [0, 1]\n    while len(sequence) < n:\n        sequence.append(sequence[-1] + sequence[-2])\n    return sequence[:n]\n' },
    { id: 'javascript', name: 'JavaScript', ext: '.js', monaco: 'javascript', sample: 'function debounce(fn, delay) {\n  let timer = null;\n  return function (...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}\n' },
    { id: 'java', name: 'Java', ext: '.java', monaco: 'java', sample: 'public class BinarySearch {\n    public static int search(int[] arr, int target) {\n        int left = 0, right = arr.length - 1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (arr[mid] == target) return mid;\n            if (arr[mid] < target) left = mid + 1;\n            else right = mid - 1;\n        }\n        return -1;\n    }\n}\n' },
    { id: 'c', name: 'C', ext: '.c', monaco: 'c', sample: '#include <stdio.h>\n\nvoid reverseString(char* str, int length) {\n    int start = 0, end = length - 1;\n    while (start < end) {\n        char temp = str[start];\n        str[start] = str[end];\n        str[end] = temp;\n        start++;\n        end--;\n    }\n}\n' },
    { id: 'cpp', name: 'C++', ext: '.cpp', monaco: 'cpp', sample: '#include <iostream>\n#include <vector>\n\ntemplate <typename T>\nclass SimpleStack {\nprivate:\n    std::vector<T> elements;\npublic:\n    void push(T const& elem) { elements.push_back(elem); }\n    void pop() { elements.pop_back(); }\n    T top() const { return elements.back(); }\n    bool empty() const { return elements.empty(); }\n};\n' },
    { id: 'sql', name: 'SQL', ext: '.sql', monaco: 'sql', sample: 'SELECT \n    departments.name AS department_name,\n    COUNT(employees.id) AS total_employees,\n    AVG(employees.salary) AS average_salary\nFROM employees\nJOIN departments ON employees.department_id = departments.id\nGROUP BY departments.name\nHAVING COUNT(employees.id) > 5\nORDER BY average_salary DESC;\n' }
  ],

  TASKS: {
    generate: {
      id: 'generate',
      title: 'Code Generator',
      description: 'Generate production-ready code from natural language prompts',
      icon: 'bi-magic',
      requiresCode: false
    },
    explain: {
      id: 'explain',
      title: 'Code Explainer',
      description: 'Deconstruct complex code with step-by-step algorithmic breakdown',
      icon: 'bi-journal-code',
      requiresCode: true
    },
    debug: {
      id: 'debug',
      title: 'Debugging Assistant',
      description: 'Isolate syntax & runtime errors, analyze causes, and suggest verified fixes',
      icon: 'bi-bug',
      requiresCode: true
    },
    improve: {
      id: 'improve',
      title: 'Code Improvement',
      description: 'Refactor code for readability, performance, and best practices',
      icon: 'bi-lightning-charge',
      requiresCode: true
    }
  }
};

window.CONFIG = CONFIG;
