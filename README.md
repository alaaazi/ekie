# Ekie Copilot

**Ekie Copilot** is an intelligent legal assistant designed to analyze employment contracts and manage client cases. It leverages Google's Gemini AI to provide deep insights, identify risks, and draft professional responses.

## 🚀 Tech Stack

This project is a modern Full Stack application built with:

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Python + Flask
- **AI**: Google Gemini (gemini-2.5-flash)

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **npm** (usually comes with Node.js)

## 📦 Installation

1.  **Clone the repository** (if you haven't already).

2.  **Frontend Setup**:
    ```bash
    cd app
    npm install
    ```

3.  **Backend Setup**:
    ```bash
    cd app/server
    pip install -r requirements.txt
    ```

4.  **Configuration**:
    - Create a `.env.local` file in the `app` directory (if it doesn't exist).
    - Add your Google Gemini API key:
      ```env
      GEMINI_API_KEY=your_api_key_here
      ```

## 🏃‍♂️ How to Run

You need to run both the backend and frontend terminals simultaneously.

### 1. Start the Backend (API)
Open a terminal and run:
```bash
cd app/server
python app.py
```
*The server will start on `http://localhost:5000`*

### 2. Start the Frontend (UI)
Open a **new** terminal and run:
```bash
cd app
npm run dev
```
*The app will be accessible at `http://localhost:3000`*

## ✨ Features

- **Contract Analysis**: Upload a PDF or image of a contract to get a detailed legal analysis.
- **Risk Assessment**: Identifies potential risks with severity levels (Low, Medium, High).
- **Smart Chat**: Ask specific questions about the uploaded document.
- **Case Management**: Track client requests and their status (New, In Progress, Done).
- **Dual View**: Switch between "Client" view (to submit requests) and "Lawyer" view (to manage cases).
