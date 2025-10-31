# AI README Generator

An intelligent README generator that analyzes any GitHub repository and creates a high-quality, comprehensive README.md file using the power of Google's Gemini AI.

[Key Features](#-key-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation--setup) • [Usage](#-usage) • [Contributing](#-contributing)

---

## 📄 Description

The AI README Generator is a web-based tool designed to streamline the process of creating documentation for software projects. By simply providing a public GitHub repository URL, the application leverages the Google Gemini large language model to analyze the codebase, understand its purpose, and automatically generate a well-structured and detailed `README.md` file.

The generated README includes essential sections such as a project description, key features, technology stack, installation instructions, and more. The tool also provides powerful post-generation features, including AI-powered in-place editing and the ability to export the final document in various formats.

## ✨ Key Features

Based on the code, here are the main functionalities of the application:

-   **🤖 AI-Powered Generation**: Utilizes the `gemini-2.5-pro` model to perform a deep analysis of a repository's code and generate a comprehensive README file.
-   **✍️ In-place AI Editing**: Select any portion of the generated text and use an AI prompt (e.g., "make this more concise" or "fix grammar") to rewrite it instantly, powered by `gemini-2.5-flash`.
-   **🧠 "Thinking Mode"**: An optional mode that allows the AI more processing budget for a more in-depth and thoughtful analysis of complex repositories.
-   **📋 Copy to Clipboard**: Easily copy the complete Markdown content with a single click.
-   **📤 Multiple Export Formats**: Download the generated README in various formats, including Markdown (`.md`), Plain Text (`.txt`), PDF (`.pdf`), and Microsoft Word (`.docx`).
-   **⚙️ Responsive UI**: A clean and intuitive user interface built with React and Tailwind CSS, providing a seamless experience on all devices.
-   **🔄 Loading & Error States**: Clear visual feedback for loading processes and user-friendly error messages.

## 🛠️ Tech Stack

This project is built with a modern web development stack:

-   **Frontend:** [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool:** [Vite](https://vitejs.dev/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (via CDN)
-   **AI Integration:** [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
-   **Export Libraries:**
    -   [jspdf](https://github.com/parallax/jsPDF) for PDF generation.
    -   [marked](https://marked.js.org/) for Markdown to HTML conversion.
    -   [html-to-docx](https://github.com/private-components/html-to-docx) for Word document generation.

## 🚀 Installation & Setup

To get a local copy up and running, follow these simple steps.

**Prerequisites:**
-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [npm](https://www.npmjs.com/)
-   A [Google Gemini API Key](https://ai.google.dev/)

**Steps:**

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/DVDHSN/AI-README-Generator.git
    ```

2.  **Navigate to the project directory:**
    ```sh
    cd AI-README-Generator
    ```

3.  **Install NPM packages:**
    ```sh
    npm install
    ```

4.  **Set up your environment variables:**
    -   Create a new file named `.env.local` in the root of the project.
    -   Add your Google Gemini API key to this file:
        ```env
        GEMINI_API_KEY=YOUR_GEMINI_API_KEY
        ```

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## 🖥️ Usage

Once the application is running, you can generate a README as follows:

1.  Open your web browser and navigate to `http://localhost:3000`.
2.  Paste the URL of a public GitHub repository into the input field.
3.  (Optional) Toggle the **"Enable Thinking Mode"** switch for a more detailed analysis of the repository.
4.  Click the **"Generate README"** button.
5.  Wait for the AI to process the repository and generate the content. The result will appear in the text area below.
6.  You can then:
    -   Manually edit the generated text directly in the text area.
    -   Select a portion of the text to activate the **AI Edit bar**. Type a command (e.g., "rephrase this") and click "Rewrite".
    -   Click the clipboard icon to copy the full Markdown content.
    -   Click the export icon to download the README in your desired format (`.md`, `.txt`, `.pdf`, `.docx`).

## 📁 File Structure

Here's a brief overview of the key directories and files in the project:

```
/
├── public/                 # Static assets
├── src/
│   ├── components/         # React UI components
│   │   └── icons/          # SVG icon components
│   ├── services/           # Service layer for API calls (geminiService.ts)
│   ├── types.ts            # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   └── index.tsx           # Application entry point
├── .env.local.example      # Example environment file
├── index.html              # Main HTML file
├── package.json            # Project dependencies and scripts
└── vite.config.ts          # Vite configuration
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

Please open an issue first to discuss any major changes you would like to make.

## 📜 License

This project is distributed under the MIT License. See the `LICENSE` file for more information.
