# matttarter.com

Personal portfolio site with an AI-powered chat that answers recruiter and hiring manager questions about my background, experience, and skills.

## How it works

- A structured context document (`bio.txt`) serves as the AI's knowledge base
- A PHP backend proxies requests to the [Anthropic Claude API](https://www.anthropic.com), keeping the API key and system prompt server-side
- The frontend is vanilla HTML/CSS/JS — no frameworks, no build step

## Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** PHP (shared hosting, no server required)
- **AI:** Claude API (Anthropic) via `claude-haiku-4-5`

## Setup

1. Clone the repo
2. Copy the example files and fill them in:
   ```bash
   cp chat.example.php chat.php
   cp bio.example.txt bio.txt
   ```
3. Add your Anthropic API key to `chat.php`
4. Write your background into `bio.txt`
5. Upload to any host that supports PHP

## Live site

[matttarter.com](https://matttarter.com)
