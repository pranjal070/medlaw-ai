# MedLaw AI – Intelligent Health & Legal Document Assistant

MedLaw AI is a modern web application that analyzes medical reports and legal contracts. It leverages Retrieval-Augmented Generation (RAG) for localized AI chats, performs structured medical test extraction and legal clause translation, calculates health indices, and visualizes document comparisons using interactive charts.

---

## Technical Stack

* **Backend:** FastAPI (Python 3.12+), SQLite (SQL database), SQLAlchemy (ORM), Passlib & PyJWT (Auth).
* **Frontend:** React 18 (Vite), Tailwind CSS v3, Recharts (visualizations), Lucide React (icons).
* **AI & RAG:** Google Gemini API (`gemini-1.5-flash`), `text-embedding-004` (embeddings), and Numpy for optimized vector similarity calculations.

---

## Project Structure

```
medlaw-ai/
├── backend/
│   ├── app/
│   │   ├── auth.py          # JWT, passwords and dependencies
│   │   ├── database.py      # SQLite connection & get_db helper
│   │   ├── gemini.py        # Gemini client (JSON outputs & RAG chat)
│   │   ├── models.py        # SQLAlchemy relational tables
│   │   ├── parser.py        # Local PDF & DOCX text extractors
│   │   ├── schemas.py       # Pydantic request/response validation
│   │   └── main.py          # FastAPI application server & routes
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout framework and ChatPanel
│   │   ├── context/         # AuthContext and APIContext
│   │   ├── pages/           # Dashboard, AuthPage, Medical/Legal Analyzers, Comparison
│   │   ├── App.jsx          # Route definitions
│   │   └── index.css        # Global CSS & Tailwind rules
│   ├── tailwind.config.js   # Tailwind rules
│   └── package.json         # React dependencies
└── README.md                # System documentation
```

---

## How to Run the Application

### 1. Start the Backend Server

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   ```bash
   # Windows PowerShell
   .\venv\Scripts\Activate.ps1
   ```
3. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend will be live at `http://localhost:8000`.

### 2. Start the Frontend Server

1. Open another terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The frontend will be live at `http://localhost:5173`. Open this URL in your web browser.

---

## Environment & Configuration

* **Gemini API Key:** You can configure the API Key by putting `GEMINI_API_KEY=your_key` in a backend `.env` file, or simply click **AI API Settings** in the dashboard UI and paste your key. If no key is configured, the application runs in **Mock/Demo Mode** using mock datasets to let you test features instantly.

