/**
 * audit.js
 * ConversionBox AI Site Search Audit Engine
 * Core logic: UI state, API calls, orchestration
 */

// ─── State ───────────────────────────────────────────────────────────────────
let auditDepth  = 1;
let auditData   = null;
let docBuffer   = null;
let currentDomain = '';
const WORKER_URL = 'https://anthropic-proxy.karthik-4d5.workers.dev';

// ─── UI helpers ──────────────────────────────────────────────────────────────
function setDepth(d) {
  auditDepth = d;
  [1, 2, 3].forEach(i =>
    document.getElementById('d' + i).classList.toggle('active', i === d)
  );
}


function log(msg, type = '') {
  const box  = document.getElementById('logBox');
  const line = document.createElement('div');
  line.className = 'log-line ' + type;
  line.textContent = '› ' + msg;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

function setProgress(pct, label) {
  document.getElementById('progressFill').style.width  = pct + '%';
  document.getElementById('progressPct').textContent   = pct + '%';
  document.getElementById('progressLabel').textContent = label;
}

function scoreClass(s) {
  if (s <= 3) return 'red';
  if (s <= 6) return 'amber';
  return 'green';
}

function showError(msg) {
  const box = document.getElementById('errorBox');
  box.style.display = 'block';
  box.innerHTML = '<strong>Error:</strong> ' + msg;
  log('Error: ' + msg, 'err');
}

function showResult(data) {
  const domain = currentDomain;
  const avg = (data.scores.reduce((a, s) => a + s.score, 0) / data.scores.length).toFixed(1);

  document.getElementById('resultBox').style.display = 'block';
  document.getElementById('resultTitle').textContent  = 'Audit Complete — ' + domain;
  document.getElementById('resultSub').textContent    =
    data.sections.length + ' sections · Platform: ' + data.platform +
    ' · Avg Score: ' + avg + '/10';

  const grid = document.getElementById('scoreGrid');
  grid.innerHTML = '';
  data.scores.slice(0, 6).forEach(s => {
    const cls = scoreClass(s.score);
    grid.innerHTML += `
      <div class="score-item">
        <div class="score-name">${s.area}</div>
        <div class="score-val ${cls}">${s.score}/10</div>
      </div>`;
  });

  document.getElementById('resultBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function triggerDownload() {
  if (!docBuffer) return;
  const filename = currentDomain.replace(/\./g, '_') + '_SearchAudit_ConversionBox.docx';
  // docBuffer is already a Blob from Packer.toBlob()
  const a = document.createElement('a');
  a.href = URL.createObjectURL(docBuffer);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// ─── Site fetch (CORS proxy) ──────────────────────────────────────────────────
async function fetchSiteContent(url) {
  try {
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res   = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
    const json  = await res.json();
    return (json.contents || '').substring(0, 6000);
  } catch {
    return '';
  }
}

// ─── Build AI prompt ──────────────────────────────────────────────────────────
function buildPrompt(url, domain, siteContent) {
  // ── Shared base schema (all depths) ─────────────────────────────────────────
  const baseSchema = `{
  "domain": "${domain}",
  "platform": "Magento|Shopify|BigCommerce|WooCommerce|Custom|Unknown",
  "industry": "specific industry vertical",
  "executiveSummary": "3-4 sentences. Specific to this domain, its product types, and customer base. Explain the search gap opportunity.",
  "scores": [
    {"area": "Search Relevancy",        "score": 1, "finding": "specific finding for this site"},
    {"area": "Semantic / NLP Search",   "score": 1, "finding": "specific finding"},
    {"area": "Filtering & Facets",      "score": 1, "finding": "specific finding"},
    {"area": "Merchandising Control",   "score": 1, "finding": "specific finding"},
    {"area": "Zero Results Handling",   "score": 1, "finding": "specific finding"},
    {"area": "Autocomplete / Typeahead","score": 1, "finding": "specific finding"},
    {"area": "Mobile Search UX",        "score": 1, "finding": "specific finding"},
    {"area": "Personalization",         "score": 1, "finding": "specific finding"},
    {"area": "AI Shopping Assistant",   "score": 0, "finding": "specific finding"},
    {"area": "Search Analytics & A/B",  "score": 1, "finding": "specific finding"}
  ],
  "sections": [
    {
      "title": "1. Search Relevancy",
      "score": 2,
      "currentState": "3-4 sentence detailed paragraph. Be specific to this domain's product catalog and likely search platform.",
      "criticalGaps": [
        "Gap specific to this site's catalog and shoppers",
        "Gap 2", "Gap 3", "Gap 4"
      ],
      "businessImpact": "Specific revenue impact. Include estimated numbers based on typical traffic for this vertical.",
      "cbSolution": "How ConversionBox AI Search fixes this for this specific site."
    },
    {
      "title": "2. Semantic & NLP Search",
      "score": 1,
      "currentState": "Specific to this site's shoppers and product vocabulary.",
      "failingQueries": [
        {"query": "natural language query a shopper would type", "problem": "why this fails on this specific site"},
        {"query": "query 2", "problem": "problem 2"},
        {"query": "query 3", "problem": "problem 3"},
        {"query": "query 4", "problem": "problem 4"},
        {"query": "query 5", "problem": "problem 5"}
      ],
      "businessImpact": "Specific to this vertical.",
      "cbSolution": "ConversionBox solution."
    },
    {
      "title": "3. Filtering & Facets",
      "score": 3,
      "currentState": "What basic filters exist and what's missing.",
      "missingFilters": [
        {"filter": "Filter name", "reason": "Why critical for this specific product catalog"},
        {"filter": "Filter 2", "reason": "reason"},
        {"filter": "Filter 3", "reason": "reason"},
        {"filter": "Filter 4", "reason": "reason"},
        {"filter": "Filter 5", "reason": "reason"}
      ],
      "filterUxIssues": ["UX issue 1", "UX issue 2", "UX issue 3"],
      "businessImpact": "Specific impact.",
      "cbSolution": "CB solution."
    },
    {
      "title": "4. Search Merchandising",
      "score": 2,
      "currentState": "Current merchandising state.",
      "missingCapabilities": ["Capability 1", "Capability 2", "Capability 3", "Capability 4", "Capability 5"],
      "seasonalOpportunity": "Specific seasonal opportunity for this vertical and domain.",
      "businessImpact": "Impact.",
      "cbSolution": "CB solution."
    },
    {
      "title": "5. Zero Results Handling",
      "score": 1,
      "currentState": "Current zero-results experience.",
      "shouldHappen": [
        "Smart recovery action tailored to this site",
        "Recovery 2",
        "Recovery 3"
      ],
      "whatHappens": [
        "Current failure 1",
        "Current failure 2",
        "Current failure 3"
      ],
      "revenuemath": "Monthly revenue loss estimate. Use realistic assumptions for this vertical's AOV and traffic.",
      "cbSolution": "CB solution."
    },
    {
      "title": "6. Autocomplete & Typeahead",
      "score": 3,
      "currentState": "Current autocomplete state.",
      "gaps": ["Gap 1", "Gap 2", "Gap 3", "Gap 4", "Gap 5"],
      "businessImpact": "Impact.",
      "cbSolution": "CB solution."
    },
    {
      "title": "7. AI Shopping Assistant",
      "score": 0,
      "currentState": "Current support/chat situation on this site.",
      "useCases": [
        {"persona": "Persona Name", "scenario": "Detailed conversational scenario specific to this site's products and shoppers"},
        {"persona": "Persona 2", "scenario": "Scenario 2"},
        {"persona": "Persona 3", "scenario": "Scenario 3"},
        {"persona": "Persona 4", "scenario": "Scenario 4"},
        {"persona": "Persona 5", "scenario": "Scenario 5"}
      ],
      "dataSources": [
        "Data source 1 relevant to this site",
        "Data source 2",
        "Data source 3",
        "Data source 4"
      ],
      "cbSolution": "CB solution."
    },
    {
      "title": "8. Personalization",
      "score": 1,
      "currentState": "Current personalization state.",
      "segments": [
        "Segment 1 specific to this site's customer types",
        "Segment 2",
        "Segment 3"
      ],
      "missingCapabilities": ["Capability 1", "Capability 2", "Capability 3"],
      "businessImpact": "Impact.",
      "cbSolution": "CB solution."
    }
  ],
  "cbMapping": [
    {"gap": "gap description",  "cbFeature": "CB feature name", "impact": "+15-30% search conversions"},
    {"gap": "gap 2",            "cbFeature": "feature 2",       "impact": "impact 2"},
    {"gap": "gap 3",            "cbFeature": "feature 3",       "impact": "impact 3"},
    {"gap": "gap 4",            "cbFeature": "feature 4",       "impact": "impact 4"},
    {"gap": "gap 5",            "cbFeature": "feature 5",       "impact": "impact 5"},
    {"gap": "gap 6",            "cbFeature": "feature 6",       "impact": "impact 6"},
    {"gap": "gap 7",            "cbFeature": "feature 7",       "impact": "impact 7"},
    {"gap": "gap 8",            "cbFeature": "feature 8",       "impact": "impact 8"}
  ],
  "projectedImpact": [
    {"metric": "Search-Driven Conversions",    "value": "+15-30%",   "note": "vs. current baseline"},
    {"metric": "Reduction in Zero Results",    "value": "Up to 50%", "note": "with smart fallbacks"},
    {"metric": "Product Page Engagement",      "value": "+20-35%",   "note": "via relevant discovery"},
    {"metric": "Bundle/Upsell Conversions",    "value": "+10-25%",   "note": "kit & package builder"},
    {"metric": "Chat-to-Conversion Rate",      "value": "Up to 3×",  "note": "vs. hours-limited chat"},
    {"metric": "Overall Conversion Lift",      "value": "+5-10%",    "note": "across all site traffic"},
    {"metric": "Customer Lifetime Value",      "value": "+20%",      "note": "from personalization"},
    {"metric": "Return Rate",                  "value": "-28%",      "note": "via size & fit guidance"}
  ]`;

  // ── Depth 2 addition: competitiveAnalysis ────────────────────────────────────
  const competitiveAnalysisSchema = `,
  "competitiveAnalysis": {
    "currentTool": "Name of the detected search solution (Native Magento/Shopify search, FastSimon, SearchPie, Searchanise, Algolia, or Unknown)",
    "currentToolAssessment": "2-3 sentence assessment of their current tool's limitations specific to this industry",
    "featureComparison": [
      {"feature": "Intent Understanding",   "currentTool": "description", "algolia": "description", "cb": "description"},
      {"feature": "Personalization",        "currentTool": "description", "algolia": "description", "cb": "description"},
      {"feature": "AI Shopping Assistant",  "currentTool": "description", "algolia": "description", "cb": "description"},
      {"feature": "Smart Merchandising",    "currentTool": "description", "algolia": "description", "cb": "description"},
      {"feature": "Zero Results Handling",  "currentTool": "description", "algolia": "description", "cb": "description"},
      {"feature": "Pricing Transparency",   "currentTool": "description", "algolia": "description", "cb": "description"}
    ],
    "cbAdvantages": [
      "Advantage 1 specific to this site",
      "Advantage 2",
      "Advantage 3",
      "Advantage 4"
    ],
    "estimatedSavingsNote": "Estimated annual savings vs Algolia equivalent with comparable features"
  }`;

  // ── Depth 3 addition: cbProposal ─────────────────────────────────────────────
  const cbProposalSchema = `,
  "cbProposal": {
    "tagline": "A 1-sentence transformative statement specific to this company's products and shoppers",
    "siteStats": {
      "estimatedSkus":          "Estimated SKU count like '5,000+' based on site type",
      "estimatedMonthlyVisits": "Estimated like '50K-100K'",
      "estimatedActivePages":   "Estimated like '2,000+'"
    },
    "discoveryChallenge": "2-3 sentences describing the core discovery problem specific to this site's shoppers",
    "coreFeatures": [
      {"feature": "AI Predictive Search",         "description": "How this specifically benefits shoppers on this domain"},
      {"feature": "AI Shopping Assistant",        "description": "Specific use for this domain's customers"},
      {"feature": "Smart Merchandising",          "description": "Specific merchandising opportunity for this vertical"},
      {"feature": "Product Bundling & Cross-sell","description": "Bundling opportunity specific to this catalog"},
      {"feature": "CRO Insights & Analytics",     "description": "Analytics value for this site"}
    ],
    "aiAssistantScenarios": [
      {"persona": "The [Persona Name e.g. First-Time Buyer]", "shopperMessage": "What shopper asks",  "aiResponse": "What AI responds"},
      {"persona": "The [Persona 2]",                          "shopperMessage": "Question",            "aiResponse": "Response"},
      {"persona": "The [Persona 3]",                          "shopperMessage": "Question",            "aiResponse": "Response"}
    ],
    "pricingOptions": [
      {
        "tier": "Search & Merchandising",
        "components": ["AI Predictive Search", "Smart Merchandising", "Search Analytics"],
        "listPrice": "$399/mo",
        "discountedPrice": "$199/mo",
        "implementationCost": "$4,800",
        "note": "Best for: Sites needing better search relevancy and merchandising control"
      },
      {
        "tier": "AI Shopping Assistant",
        "components": ["Product Page AI Assistant", "Website Shopping Assistant", "Chat Analytics"],
        "listPrice": "$599/mo",
        "discountedPrice": "$399/mo",
        "implementationCost": "$6,000",
        "note": "Best for: Sites with complex products needing guided discovery"
      },
      {
        "tier": "Complete Bundle",
        "components": ["All Search & Merchandising features", "All AI Assistant features", "Full Analytics Suite"],
        "listPrice": "$998/mo",
        "discountedPrice": "$499/mo",
        "implementationCost": "$8,000",
        "note": "Best value: Full AI-powered discovery transformation — recommended for this site"
      }
    ],
    "onboardingTimeline": [
      {"week": "Week 1", "title": "Discovery & Setup",              "details": "Technical kickoff, catalog indexing, platform integration, initial AI model training on your product data"},
      {"week": "Week 2", "title": "AI Training & Configuration",    "details": "Custom AI training with your product data, PDFs, and FAQs. Search relevance tuning and merchandising rules setup"},
      {"week": "Week 3", "title": "QA, Testing & Merchandising",    "details": "Full UAT, FAQ review and approval, A/B testing setup, personalization segment configuration"},
      {"week": "Week 4", "title": "Go-Live & Optimization",         "details": "Production launch, live performance monitoring, first merchandising campaigns, team onboarding to dashboard"}
    ],
    "commitments": [
      {"title": "Free Migration Support",    "detail": "Seamless transition from your current search tool — our team handles the technical implementation"},
      {"title": "Dedicated Success Team",    "detail": "Personalized onboarding and ongoing support from day one"},
      {"title": "Performance Guarantee",     "detail": "If you don't see measurable gains in conversion and engagement, we'll work with you until you do"},
      {"title": "18-Month Rate Lock",        "detail": "Your pricing is guaranteed locked for 18 months — zero surprise increases"}
    ]
  }`;

  // ── Assemble final schema based on depth ─────────────────────────────────────
  let schema;
  if (auditDepth === 1) {
    schema = baseSchema + '\n}';
  } else if (auditDepth === 2) {
    schema = baseSchema + competitiveAnalysisSchema + '\n}';
  } else {
    schema = baseSchema + competitiveAnalysisSchema + cbProposalSchema + '\n}';
  }

  const depthLabel =
    auditDepth === 1 ? 'Standard (8-section audit)' :
    auditDepth === 2 ? 'Deep (8-section audit + competitive analysis vs Algolia, SearchPie, Searchanise)' :
    'Full (8-section audit + competitive analysis + tailored ConversionBox pricing proposal)';

  return `You are ConversionBox.ai's expert eCommerce search auditor. Analyze this site for search & discovery gaps.

URL: ${url}
Domain: ${domain}
Site HTML excerpt: ${siteContent.substring(0, 3000) || 'Not available — perform URL-based analysis'}
Audit depth: ${depthLabel}

CRITICAL RULES:
1. Return ONLY valid JSON — no markdown fences, no prose, no explanation before or after
2. Replace ALL placeholder values ("Gap 2", "Capability 1", "Persona Name", "description", etc.) with REAL specific content about THIS domain
3. Make every finding, failing query, persona, and scenario specific to this site's actual products and shoppers
4. Do NOT copy placeholder text literally — write concrete, industry-specific insights
5. Scores must be honest (most sites score 2-5/10 on most dimensions)
6. Include ALL fields shown — do not omit any

JSON structure (replace every placeholder with real content specific to this domain):

${schema}`;
}

// ─── Main audit orchestrator ──────────────────────────────────────────────────
async function startAudit() {
  const url    = document.getElementById('urlInput').value.trim();

  if (!url) {
    showError('Please enter a website URL to audit.');
    document.getElementById('errorBox').style.display = 'block';
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : 'https://' + url);
  } catch {
    showError('Invalid URL. Please enter a full URL like https://yourstore.com');
    document.getElementById('errorBox').style.display = 'block';
    return;
  }

  currentDomain = parsedUrl.hostname.replace(/^www\./, '');

  // Reset UI
  document.getElementById('analyzeBtn').disabled   = true;
  document.getElementById('progressArea').style.display = 'block';
  document.getElementById('resultBox').style.display    = 'none';
  document.getElementById('errorBox').style.display     = 'none';
  document.getElementById('logBox').innerHTML = '';
  docBuffer  = null;
  auditData  = null;

  try {
    // Step 1 — Crawl
    setProgress(8, 'Crawling website...');
    log('Fetching ' + parsedUrl.href, 'info');

    const siteContent = await fetchSiteContent(parsedUrl.href);
    if (siteContent) {
      log('Site content retrieved (' + Math.round(siteContent.length / 1000) + 'KB)', 'ok');
    } else {
      log('Direct fetch blocked — proceeding with URL-based analysis', 'warn');
    }

    // Step 2 — Build prompt & call AI
    setProgress(22, 'Running AI audit engine...');
    log('Sending to Claude AI for analysis...', 'info');
    log('Domain: ' + currentDomain, 'info');

    const prompt = buildPrompt(parsedUrl.href, currentDomain, siteContent);

    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 16000,
        messages: [{
          role:    'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      let errMsg = `API error ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errJson.error || errJson.message || errText || errMsg;
      } catch {
        if (errText) errMsg = errText;
      }
      throw new Error(errMsg);
    }

    setProgress(65, 'Processing audit results...');
    log('AI analysis received', 'ok');

    const apiData  = await response.json();
    const rawText  = apiData.content?.[0]?.text || '';

    // Parse JSON from response
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse audit JSON from AI response. Try again.');

    let jsonStr = match[0];
    // If response was truncated, attempt to close any open structure
    try {
      auditData = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('Raw AI response (first 2000 chars):', rawText.substring(0, 2000));
      throw new Error('AI response was too long and got cut off. Try Standard depth instead of Deep/Full.');
    }
    log('Parsed ' + (auditData.sections?.length || 0) + ' audit sections', 'ok');
    log('Platform detected: ' + auditData.platform, 'info');
    log('Industry: ' + auditData.industry, 'info');

    // Step 3 — Build Word doc
    setProgress(78, 'Building Word document...');
    log('Generating formatted Word report...', 'info');

    docBuffer = await buildWordDoc(auditData, currentDomain, auditDepth);

    log('Word document generated successfully', 'ok');
    setProgress(100, 'Complete!');

    showResult(auditData);

  } catch (err) {
    console.error(err);
    showError(err.message || 'An unexpected error occurred. Please try again.');
  } finally {
    document.getElementById('analyzeBtn').disabled = false;
  }
}