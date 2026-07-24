# sarvatra.ai
<div align="center">

<img src="./img/sarvatra-logo.png" alt="Sarvatra AI" width="120" />

# Sarvatra AI

**A premium, single-page AI chat interface — fast, minimal, and self-hostable.**

[![Version](https://img.shields.io/badge/version-1.0.0-black?style=for-the-badge&labelColor=000000)](#-changelog)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge&labelColor=000000)](./LICENSE)
[![Made with JavaScript](https://img.shields.io/badge/javascript-vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black&labelColor=000000)](#-tech-stack)
[![Deploy](https://img.shields.io/badge/deploy-vercel-black?style=for-the-badge&logo=vercel&logoColor=white&labelColor=000000)](#-deployment)
[![Model Provider](https://img.shields.io/badge/inference-groq-orange?style=for-the-badge&labelColor=000000)](#-tech-stack)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge&labelColor=000000)](#-contributing)

</div>

---

## 📖 Overview

**Sarvatra AI** is a single-page, dependency-light chat application that pairs a polished front end (`index.html`) with a lightweight serverless proxy (`api/chat.js`) to talk to LLMs hosted on **Groq**. It's built to be dropped straight onto **Vercel** with zero backend infrastructure of your own — the API key never touches the browser.

## ✨ Features

| | |
|---|---|
| 🎨 **Premium UI** | Clean, monochrome design system built with CSS custom properties (design tokens) — no framework, no build step |
| ⚡ **Streaming responses** | Server-sent events piped straight from Groq to the client for real-time token streaming |
| 🖼️ **Vision support** | Automatic detection of vision-capable models, with graceful image stripping on unsupported models |
| 🔐 **Auth-ready** | Firebase Auth + Supabase integration hooks for sign-in / sign-up flows |
| ✍️ **Rich rendering** | Markdown via `marked`, syntax highlighting via `highlight.js`, math via `KaTeX` |
| 💾 **Local persistence** | Chats, settings, and prompts cached via `localStorage` / `IndexedDB` |
| 📱 **Responsive** | Mobile-first layout with a collapsible sidebar and overlay navigation |
| 🧩 **Modular UI** | Settings, Help/FAQ, Prompt Library, Files, and Explore modals included out of the box |
| 💳 **Pricing screen** | Built-in upgrade / pricing page scaffold |
| 🍪 **Compliance** | Cookie consent banner and a dedicated Legal & Policies page |

## 🗂️ Project Structure

```
sarvatra.ai-main/
├── index.html          # Full front-end application (markup + styles + logic)
├── legal.html           # Legal & Policies page
├── api/
│   ├── chat.js           # Vercel serverless function — proxies requests to Groq
│   └── sample.txt         # Sample/reference payload
├── img/
│   ├── sarvatra-logo.png
│   └── ...                # Additional brand assets
├── LICENSE              # MIT License
└── README.md
```

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML / CSS / JS (no build tooling required)
- **Rendering:** [marked](https://github.com/markedjs/marked) · [highlight.js](https://highlightjs.org/) · [KaTeX](https://katex.org/)
- **Auth / Storage:** [Firebase Auth](https://firebase.google.com/docs/auth) · [Supabase](https://supabase.com/)
- **Backend:** Vercel Serverless Function (`api/chat.js`)
- **Inference:** [Groq](https://groq.com/) — OpenAI-compatible Chat Completions API (default model: `llama-3.3-70b-versatile`)

## 🚀 Getting Started

### Prerequisites

- A [Groq API key](https://console.groq.com/keys)
- [Vercel CLI](https://vercel.com/docs/cli) (for local dev / deployment) or any static host + serverless runtime

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/sarvatra.ai.git
cd sarvatra.ai
```

### 2. Configure environment variables

Create a `.env` (or set it in your Vercel project settings):

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Run locally

```bash
vercel dev
```

The app will be available at `http://localhost:3000`.

## 📡 API Reference

`POST /api/chat`

| Field | Type | Required | Description |
|---|---|---|---|
| `messages` | `array` | ✅ | Chat history in `{ role, text/content, attachment? }` shape |
| `model` | `string` | ❌ | Groq model ID. Defaults to `llama-3.3-70b-versatile` |
| `maxTokens` | `number` | ❌ | Clamped between `1` and `8192`. Defaults to `2048` |
| `stream` | `boolean` | ❌ | Enables server-sent-event streaming |

Vision input is automatically supported for `meta-llama/llama-4-scout-17b-16e-instruct` and `meta-llama/llama-4-maverick-17b-128e-instruct`; images are safely stripped for all other models.

## 🌐 Deployment

Deploy in one click with Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Or via CLI:

```bash
vercel --prod
```

Remember to set `GROQ_API_KEY` as an environment variable in your Vercel project settings.

## 🗺️ Roadmap

- [ ] Multi-provider inference support (OpenAI / Anthropic / local models)
- [ ] Persistent server-side chat history
- [ ] Plugin/tool-calling support
- [ ] Theming presets

## 📜 Changelog

### [1.0.0] — 2026
- 🎉 Initial public release
- Chat UI with streaming, markdown, code highlighting, and math rendering
- Groq-backed serverless chat proxy with vision-model detection
- Firebase/Supabase auth scaffolding, settings, prompt library, and files modals
- Legal & Policies page, cookie consent banner

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open a pull request or file an issue.

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.

---

<div align="center">

Made by **Piyush Rajesh Deshkar**

</div>
