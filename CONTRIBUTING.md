# 🤝 Contributing to HealthConnect

Thank you for considering contributing to HealthConnect! This document provides guidelines for contributing to this project.

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** (local or Atlas)
- **Git** installed
- A code editor (VS Code recommended)

## 🚀 Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/healthconnect.git
   cd healthconnect
   ```
3. **Install dependencies** for both frontend and backend:
   ```bash
   cd healthconnect-backend && npm install
   cd ../healthconnect && npm install
   ```
4. **Set up environment variables**:
   - Copy `.env.example` to `.env` in both `healthconnect-backend/` and `healthconnect/`
   - Fill in your own API keys and MongoDB URI

5. **Start development**:
   ```bash
   # Terminal 1 — Backend
   cd healthconnect-backend && npm start

   # Terminal 2 — Frontend
   cd healthconnect && npm start
   ```

## 📁 Project Structure

| Directory | Description |
|-----------|-------------|
| `healthconnect/` | React 18 frontend (CRA) |
| `healthconnect-backend/` | Express 5 backend API |
| `healthconnect-backend/models/` | Mongoose schemas (Appointment, Review, Payment) |

## 🧪 Code Guidelines

- Use **ES6+** syntax
- Follow existing code style and patterns
- Add comments for complex logic
- Test your changes locally before submitting

## 📝 Submitting Changes

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and test locally
3. Commit with a descriptive message: `git commit -m "Add: feature description"`
4. Push to your fork: `git push origin feature/your-feature`
5. Open a Pull Request with a clear description

## 🐛 Reporting Issues

- Use the GitHub Issues tab
- Describe the bug or feature request clearly
- Include steps to reproduce (for bugs)
- Attach screenshots if applicable

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.
