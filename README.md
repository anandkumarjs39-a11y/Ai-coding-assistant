# AI Coding Assistant - Final-Semester College Project

**AI Coding Assistant** is a developer workspace web application built for an academic final-semester capstone demonstration. It helps students, researchers, and software engineers generate production-ready code, explain intricate algorithms, detect and resolve programming bugs, and optimize code quality using AI.

---

## 1. Project Architecture

The application adopts a decoupled multi-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT TIER                           │
│  HTML5 + CSS3 + Vanilla ES6+ JS + Bootstrap 5 + Monaco IDE  │
│  • index.html (Project Overview & Examiner Presentation Hub)│
│  • workspace.html (Primary Split-Pane AI IDE)              │
│  • dashboard.html (Metrics & Activity Logs)                 │
│  • generator.html, explainer.html, debugger.html, improver  │
│  • history.html, settings.html, login.html, register.html   │
└──────────────────────────────▲──────────────────────────────┘
                               │
                REST API (JSON over HTTP/CORS)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                       BACKEND TIER                          │
│  Python Flask REST Service (backend/app.py)                 │
│  • POST /api/auth/login, register, logout                   │
│  • POST /api/ai/generate, explain, debug, improve           │
│  • GET/POST/DELETE /api/conversations                       │
│  • GET /api/dashboard/stats, settings                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Project Directory Structure

```
.
├── index.html                  # Project Presentation Hub & Architecture Overview
├── login.html                  # Developer Authentication Page
├── register.html               # User Registration Page
├── dashboard.html              # Academic Workspace Dashboard
├── workspace.html              # Flagship AI Coding Workspace (Monaco Editor Split IDE)
├── generator.html              # Dedicated Code Generator Page
├── explainer.html              # Dedicated Code Explainer Page
├── debugger.html               # Dedicated Debugging Assistant Page
├── improver.html               # Dedicated Code Improvement Page
├── history.html                # Conversation & Task History Archive
├── settings.html               # Profile & Flask API Configuration
├── assets/
│   ├── css/
│   │   ├── style.css           # Design tokens, dark/light themes, typography
│   │   └── components.css      # Sidebar, topbar, Monaco wrapper, cards, toasts
│   └── js/
│       ├── config.js           # API base URL, languages, task definitions
│       ├── api.js              # REST API client with error codes & Viva Demo Simulator
│       ├── auth.js             # Token management and route guards
│       ├── ui.js               # Theme toggler, toasts, copy/download, DOMPurify markdown
│       ├── workspace.js        # Monaco Editor initialization, task routing, outputs
│       ├── dashboard.js        # Dashboard statistics & recent session loader
│       ├── history.js          # Search, filter, inspect, and delete history
│       └── settings.js         # Profile updates & backend ping tester
├── backend/
│   ├── app.py                  # Complete Python Flask REST API server
│   └── requirements.txt        # Python backend dependencies
├── package.json
└── vite.config.ts
```

---

## 3. How to Run Locally

### Step A: Start the Frontend
In your project root directory:
```bash
npm install
npm run dev
```
The frontend will start at `http://localhost:3000`.

### Step B: Start the Python Flask Backend
In a separate terminal:
```bash
cd backend
python -m venv venv
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

pip install -r requirements.txt
python app.py
```
The Flask backend runs at `http://127.0.0.1:5000`.

### Step C: Connect Frontend to Backend
1. Open the frontend at `http://localhost:3000`.
2. In the top navigation bar, click the **Connection Status** pill (or go to **Settings**).
3. Verify that the URL is set to `http://localhost:5000/api`.
4. Click **Test Ping**. You should see a green confirmation: `"Connected! Flask server responded with HTTP 200."`
5. Turn off the **Viva Demo Simulator** toggle to send live requests directly to Flask!

*Note for Examiners*: If you are reviewing the frontend without starting Python, keep the **Viva Demo Simulator** enabled. The frontend will immediately respond with structured, schema-compliant responses matching the Flask REST contract.

---

## 4. Key Viva Examination Highlights
1. **No Frontend Frameworks (Pure Vanilla JS & Bootstrap 5)**: High-performance, lightweight, and maintainable.
2. **Microsoft Monaco Editor**: VS Code-grade code editing with syntax highlighting across 6 languages (Python, JavaScript, Java, C, C++, SQL).
3. **Robust REST Contract**: Full implementation of all required REST endpoints with proper HTTP status codes (200, 201, 400, 401, 403, 404, 429, 500).
4. **Security Best Practice**: Zero API keys or secrets stored on the client.
5. **Safe Markdown Rendering**: AI output is sanitized through DOMPurify before DOM insertion to prevent XSS attacks.
