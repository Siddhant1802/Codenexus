
# CodeNexus

> A web-based frontend interface for **CodeNexus** — a cloud-native, parallel code compilation and static code analysis platform.

## 🚀 Project Overview

CodeNexus is a scalable, secure, and language-agnostic code execution and analysis engine designed to handle multiple code submissions in parallel. This frontend enables users to:

- Write and submit code in multiple programming languages (Python, Java, C++, Go)
- Provide optional input (stdin)
- View live output from code execution
- Review static code analysis feedback powered by tools like Bandit, ESLint, Checkstyle, and more

This React app communicates with a backend powered by FastAPI and deployed on AWS.

## 🔧 Technologies Used

- **React.js** — Modern UI library for building interactive web apps
- **Tailwind CSS** — Utility-first CSS framework for fast styling
- **FastAPI (Backend)** — RESTful API service handling compilation and static analysis
- **Docker + AWS EC2** — Secure, containerized execution environment
- **Static Analysis Tools**: Bandit, ESLint, Checkstyle, Cppcheck, GoLint

## 📂 Project Structure

```
/public           → Static assets
/src
  App.tsx			→ Actual App
  main.tsx			→ Wrapper for Context Provider
  index.css         → Tailwind/global styles
```

## ⚙️ Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Siddhant1802/Codenexus.git
   cd codenexus
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run the Application**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 📦 API Endpoints (Sample)

- `POST /submit` → Submits code and stdin input
- `GET /results:id` → Fetches Code Execution Result
- `GET /analysis/:id` → Fetches Static Analysis Result

## 🧑‍💻 Contributors

- Dev Patel – Cloud Infrastructure
- Pratham Dedhiya – Frontend & UX Design
- Dhwanit Pandya – AWS & Static Analysis
- Siddhant Singh – Frontend & Integration

## 📜 License

This project is built as part of **ENGR-E516 Engineering Cloud Computing** (Spring 2025), Indiana University Bloomington.
