# ConversionBox — AI Site Search Audit Engine

A single-page web application that analyzes any eCommerce website's search & discovery gaps using Claude AI, then generates a professionally formatted Word document report — in under 60 seconds.

![ConversionBox Audit Engine](https://img.shields.io/badge/Powered%20by-Claude%20AI-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## What It Does

1. **Enter any eCommerce URL** (Shopify, Magento, BigCommerce, WooCommerce, custom)
2. **AI crawls and analyzes** the site's search architecture, filtering, merchandising, autocomplete, zero-results handling, personalization, and AI assistant presence
3. **Generates a branded Word report** with:
   - 10-area health scorecard (color-coded red/orange/green)
   - 8 deep-dive sections with specific findings, failing query examples, missing filters
   - ConversionBox gap-to-feature mapping table
   - Projected business impact grid
   - Recommended next steps

---

## Project Structure

```
search-audit-app/
├── index.html      ← Main HTML page (single page app)
├── style.css       ← All styles
├── audit.js        ← Core logic: UI, API calls, orchestration
├── docbuilder.js   ← Word document generation (docx.js)
└── README.md       ← This file
```

---

## How to Get Your Anthropic API Key

You need an Anthropic API key to power the AI analysis. Here's how to get one:

### Step 1 — Create an Anthropic Account
1. Go to **[console.anthropic.com](https://console.anthropic.com)**
2. Click **Sign Up** and create a free account
3. Verify your email address

### Step 2 — Add Billing (Required for API Access)
1. Go to **Settings → Billing**
2. Add a credit card (you are only charged for what you use)
3. New accounts get **$5 free credit** to start
4. Each audit costs approximately **$0.03–0.08** (Claude Sonnet pricing)

### Step 3 — Generate an API Key
1. Go to **Settings → API Keys**
   - Direct link: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Click **Create Key**
3. Give it a name like `search-audit-app`
4. Copy the key — it starts with `sk-ant-api03-...`
5. **Save it somewhere safe** — you can't view it again after closing the dialog

### Step 4 — Paste Key into the App
- Open the app, paste your key into the **Anthropic API Key** field
- Your key is used only in your browser — it is never stored anywhere or sent to any server other than Anthropic's API directly

---

## Deploying to GitHub Pages (Free Hosting)

### Option A — GitHub Web Interface (Easiest)

1. **Create a GitHub account** at [github.com](https://github.com) if you don't have one

2. **Create a new repository**
   - Click the **+** button → **New repository**
   - Name it: `search-audit-app` (or anything you like)
   - Set to **Public**
   - Click **Create repository**

3. **Upload the files**
   - Click **uploading an existing file** or **Add file → Upload files**
   - Drag and drop all 4 files:
     - `index.html`
     - `style.css`
     - `audit.js`
     - `docbuilder.js`
   - Click **Commit changes**

4. **Enable GitHub Pages**
   - Go to **Settings** (tab at the top of the repository)
   - Scroll down to **Pages** in the left sidebar
   - Under **Source**, select **Deploy from a branch**
   - Under **Branch**, select **main** and folder **/ (root)**
   - Click **Save**

5. **Your app is live!**
   - Wait 1–2 minutes
   - Visit: `https://YOUR-USERNAME.github.io/search-audit-app/`

---

### Option B — GitHub CLI / Git Commands

```bash
# Clone your new empty repo
git clone https://github.com/YOUR-USERNAME/search-audit-app.git
cd search-audit-app

# Copy the 4 app files into this folder, then:
git add .
git commit -m "Initial commit — ConversionBox Search Audit Engine"
git push origin main

# Then enable Pages in GitHub Settings as described above
```

---

## Running Locally (No Server Needed)

Because this is a pure HTML/CSS/JS app with no build step, you can run it locally two ways:

### Option 1 — Just open the file
```bash
# Simply double-click index.html
# Or on Mac:
open index.html

# Or on Linux:
xdg-open index.html
```

> ⚠️ **Note:** The CORS proxy for site fetching may not work when opened as `file://`. For full functionality, use a local server (Option 2) or deploy to GitHub Pages.

### Option 2 — Local server (recommended)
```bash
# Python 3
python3 -m http.server 8080

# Then open: http://localhost:8080
```

```bash
# Node.js (if you have npx)
npx serve .

# Then open the URL it shows
```

---

## API Cost Estimate

| Audit Type | Approximate Claude API Cost |
|------------|----------------------------|
| Standard (8 sections) | ~$0.03–0.05 per audit |
| Deep (+ competitive) | ~$0.05–0.08 per audit |
| Full (+ proposal) | ~$0.07–0.10 per audit |

Costs are based on Claude Sonnet pricing (~$3/million input tokens, ~$15/million output tokens). Running 100 audits/month costs approximately $3–8.

---

## Customization

### Change the branding
Edit the logo/company name in `index.html` — search for `ConversionBox` and replace with your brand name.

### Change the AI model
In `audit.js`, find this line and change the model:
```javascript
model: 'claude-sonnet-4-20250514',
```
Available models:
- `claude-sonnet-4-20250514` — Best quality (recommended)
- `claude-haiku-4-5-20251001` — Faster & cheaper (~5× lower cost)

### Adjust the audit sections
Edit the JSON prompt in `audit.js` inside the `buildPrompt()` function to add/remove sections or change what the AI analyzes.

### Change Word document styling
All document colors, fonts, and layout are in `docbuilder.js`. The color palette is at the top of `buildWordDoc()` in the `C` object.

---

## Technical Notes

- **No backend required** — everything runs in the browser
- **No data stored** — API keys and results exist only in your browser session
- **CORS proxy** — Uses `api.allorigins.win` to fetch site HTML for analysis. Some sites block this; the app gracefully falls back to URL-only analysis
- **docx.js** — Word document generation happens entirely client-side via the docx.js UMD library loaded from cdnjs
- **Anthropic API header** — The `anthropic-dangerous-direct-browser-access: true` header is required for direct browser-to-API calls (Anthropic's standard approach for client-side apps)

---

## Security Notes

⚠️ **Your API key is entered each session and never persisted.** It is sent directly from your browser to `api.anthropic.com` — not through any intermediate server.

If deploying for a team, consider:
- Adding a simple password/PIN gate in `index.html`
- Building a lightweight proxy server that holds the API key server-side (Node.js/Python/Cloudflare Worker)
- Using environment variables if deploying to Netlify, Vercel, or similar platforms

---

## License

MIT — free to use, modify, and distribute.

---

## Support

- **ConversionBox website:** [www.conversionbox.ai](https://www.conversionbox.ai)
- **Email:** hello@conversionbox.ai
- **Anthropic docs:** [docs.anthropic.com](https://docs.anthropic.com)
- **Anthropic console:** [console.anthropic.com](https://console.anthropic.com)
