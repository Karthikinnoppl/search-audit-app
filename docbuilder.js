/**
 * docbuilder.js
 * ConversionBox Search Audit — Word Document Generator
 * Uses docx.js (UMD build) loaded via CDN
 */

async function buildWordDoc(data, domain, depth = 1) {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
    VerticalAlign, PageBreak, Header, Footer, LevelFormat
  } = docx;

  // ── Colour palette ──────────────────────────────────────────────────────────
  const C = {
    navy:    '0A1628',
    blue:    '1A56DB',
    lblue:   'EEF3FF',
    accent:  '00C2A8',
    red:     'DC2626',
    orange:  'EA580C',
    green:   '16A34A',
    lred:    'FEF2F2',
    lorange: 'FFF7ED',
    lgreen:  'F0FDF4',
    muted:   '64748B',
    border:  'E2E8F0',
    white:   'FFFFFF',
  };

  // ── Border helpers ──────────────────────────────────────────────────────────
  const bdr  = (s = 1, c = C.border) => ({ style: BorderStyle.SINGLE, size: s, color: c });
  const bAll = (s = 1, c = C.border) => ({ top: bdr(s, c), bottom: bdr(s, c), left: bdr(s, c), right: bdr(s, c) });
  const bNone = () => {
    const n = { style: BorderStyle.NONE, size: 0, color: C.white };
    return { top: n, bottom: n, left: n, right: n };
  };
  const pad = (t = 80, b = 80, l = 120, r = 120) => ({ top: t, bottom: b, left: l, right: r });

  // ── Score colour helpers ────────────────────────────────────────────────────
  const scoreColor = s => s <= 3 ? C.red    : s <= 6 ? C.orange : C.green;
  const scoreBg    = s => s <= 3 ? C.lred   : s <= 6 ? C.lorange: C.lgreen;

  // ── Paragraph factories ─────────────────────────────────────────────────────
  const sp   = (n = 120) => new Paragraph({ spacing: { before: n, after: 0 }, children: [new TextRun('')] });
  const pb   = ()        => new Paragraph({ children: [new PageBreak()] });

  const tag = text => new Paragraph({
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text: `  ${text}  `, font: 'Arial', size: 16, bold: true, color: C.white, shading: { fill: C.blue, type: ShadingType.CLEAR } })]
  });

  const h1 = text => new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 140 },
    children: [new TextRun({ text, font: 'Arial', size: 30, bold: true, color: C.navy })]
  });

  const h3 = text => new Paragraph({
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, font: 'Arial', size: 21, bold: true, color: C.navy })]
  });

  const body = (text, color = '333333', italic = false) => new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: 'Arial', size: 19, color, italics: italic })]
  });

  const bul = (text, boldPrefix = null) => {
    const runs = boldPrefix
      ? [new TextRun({ text: boldPrefix + ' ', font: 'Arial', size: 19, bold: true, color: '333333' }),
         new TextRun({ text, font: 'Arial', size: 19, color: '333333' })]
      : [new TextRun({ text, font: 'Arial', size: 19, color: '333333' })];
    return new Paragraph({
      numbering: { reference: 'bullets', level: 0 },
      spacing:   { before: 60, after: 60 },
      children:  runs
    });
  };

  // ── Table cell factories ────────────────────────────────────────────────────
  const hdrCell = (text, width) => new TableCell({
    borders:  bAll(1),
    width:    { size: width, type: WidthType.DXA },
    shading:  { fill: C.navy, type: ShadingType.CLEAR },
    margins:  pad(80, 80, 120, 120),
    children: [new Paragraph({ children: [new TextRun({ text, font: 'Arial', size: 18, bold: true, color: C.white })] })]
  });

  const hdrRow = (cols, widths) =>
    new TableRow({ children: cols.map((c, i) => hdrCell(c, widths[i])) });

  const scoreRow = s => new TableRow({ children: [
    new TableCell({ borders: bAll(1), width: { size: 2800, type: WidthType.DXA }, shading: { fill: C.white, type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: s.area, font: 'Arial', size: 18, bold: true, color: C.navy })] })] }),
    new TableCell({ borders: bAll(1), width: { size: 900,  type: WidthType.DXA }, shading: { fill: scoreBg(s.score), type: ShadingType.CLEAR }, margins: pad(), verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.score + '/10', font: 'Arial', size: 22, bold: true, color: scoreColor(s.score) })] })] }),
    new TableCell({ borders: bAll(1), width: { size: 5660, type: WidthType.DXA }, shading: { fill: C.white, type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: s.finding, font: 'Arial', size: 17, color: '444444' })] })] }),
  ]});

  const impactCell = (title, value, note) => new TableCell({
    borders:  bAll(1),
    width:    { size: 2160, type: WidthType.DXA },
    shading:  { fill: C.lblue, type: ShadingType.CLEAR },
    margins:  pad(120, 120, 120, 120),
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: value, font: 'Arial', size: 38, bold: true, color: C.blue })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: title, font: 'Arial', size: 17, bold: true, color: C.navy })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: note,  font: 'Arial', size: 15, color: C.muted, italics: true })] }),
    ]
  });

  const gapCell = () => new TableCell({ borders: bNone(), width: { size: 300, type: WidthType.DXA }, children: [sp()] });

  const impactRow = items => new TableRow({
    children: items.flatMap((it, i) => [
      impactCell(it.metric, it.value, it.note),
      ...(i < items.length - 1 ? [gapCell()] : [])
    ])
  });

  const impactGapRow = () => new TableRow({
    children: [new TableCell({ borders: bNone(), columnSpan: 7, children: [sp(160)] })]
  });

  const revBox = text => new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [10080],
    rows: [new TableRow({ children: [new TableCell({
      borders: { top: bdr(6, C.red), bottom: bdr(6, C.red), left: { style: BorderStyle.NONE, size: 0, color: C.white }, right: { style: BorderStyle.NONE, size: 0, color: C.white } },
      shading:  { fill: C.lred, type: ShadingType.CLEAR },
      margins:  pad(140, 140, 200, 200),
      children: [new Paragraph({ children: [
        new TextRun({ text: 'Revenue Impact: ', font: 'Arial', size: 18, bold: true, color: C.red }),
        new TextRun({ text, font: 'Arial', size: 18, color: '333333' })
      ]})]
    })]}) ]
  });

  // ── Build content array ─────────────────────────────────────────────────────
  const children = [];

  // Cover page
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 160 }, children: [new TextRun({ text: 'SITE SEARCH & DISCOVERY AUDIT', font: 'Arial', size: 32, bold: true, color: C.blue, allCaps: true })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 100 },   children: [new TextRun({ text: data.domain || domain, font: 'Arial', size: 52, bold: true, color: C.navy })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 100 },   children: [new TextRun({ text: 'Industry: ' + data.industry + '  ·  Platform: ' + data.platform, font: 'Arial', size: 20, color: C.muted })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 400 },   children: [new TextRun({ text: 'Prepared by ConversionBox.ai  ·  ' + new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), font: 'Arial', size: 20, color: C.muted, italics: true })] }));

  // Executive summary box
  children.push(new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [10080],
    rows: [new TableRow({ children: [new TableCell({
      borders: { top: bdr(8, C.blue), bottom: bdr(8, C.blue), left: bdr(8, C.blue), right: bdr(8, C.blue) },
      shading:  { fill: C.lblue, type: ShadingType.CLEAR },
      margins:  pad(200, 200, 240, 240),
      children: [
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'EXECUTIVE SUMMARY', font: 'Arial', size: 19, bold: true, color: C.blue, allCaps: true })] }),
        body(data.executiveSummary)
      ]
    })] })]
  }));
  children.push(sp(280));

  // Scorecard
  children.push(h1('Overall Search Health Scorecard'));
  children.push(body('Scored 1–10 based on public-facing audit, UX analysis, and platform intelligence. Red = critical gap, Orange = partial, Green = functional.', C.muted, true));
  children.push(sp(120));
  children.push(new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [2800, 900, 5660],
    rows: [
      hdrRow(['Area', 'Score', 'Key Finding'], [2800, 900, 5660]),
      ...(data.scores || []).map(scoreRow)
    ]
  }));
  children.push(pb());

  // ── Sections ────────────────────────────────────────────────────────────────
  (data.sections || []).forEach((sec, i) => {
    children.push(tag('SECTION ' + (i + 1)));
    children.push(h1(sec.title + ' — Score: ' + sec.score + '/10'));

    children.push(h3('Current State'));
    children.push(body(sec.currentState));

    // Critical gaps (bullets)
    if (sec.criticalGaps?.length) {
      children.push(h3('Critical Gaps Identified'));
      sec.criticalGaps.forEach(g => children.push(bul(g)));
    }

    // Failing queries table
    if (sec.failingQueries?.length) {
      children.push(h3('Queries That Fail Today'));
      children.push(new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [4500, 5580],
        rows: [
          hdrRow(['Shopper Query', 'Current Result / Problem'], [4500, 5580]),
          ...sec.failingQueries.map(q => new TableRow({ children: [
            new TableCell({ borders: bAll(1), width: { size: 4500, type: WidthType.DXA }, shading: { fill: C.lred, type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: q.query, font: 'Arial', size: 17, bold: true, color: C.red })] })] }),
            new TableCell({ borders: bAll(1), width: { size: 5580, type: WidthType.DXA }, shading: { fill: C.white, type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: q.problem, font: 'Arial', size: 17, color: '444444' })] })] }),
          ]}))
        ]
      }));
    }

    // Missing filters table
    if (sec.missingFilters?.length) {
      children.push(h3('Critical Missing Filters'));
      children.push(new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [2800, 7280],
        rows: [
          hdrRow(['Missing Filter', 'Why It Matters'], [2800, 7280]),
          ...sec.missingFilters.map((f, idx) => new TableRow({ children: [
            new TableCell({ borders: bAll(1), width: { size: 2800, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? C.lblue : C.white, type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: f.filter, font: 'Arial', size: 17, bold: true, color: C.blue })] })] }),
            new TableCell({ borders: bAll(1), width: { size: 7280, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? C.lblue : C.white, type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: f.reason, font: 'Arial', size: 17, color: '444444' })] })] }),
          ]}))
        ]
      }));
      if (sec.filterUxIssues?.length) {
        children.push(sp());
        children.push(h3('Filter UX Issues'));
        sec.filterUxIssues.forEach(g => children.push(bul(g)));
      }
    }

    // Missing capabilities (bullets)
    if (sec.missingCapabilities?.length) {
      children.push(h3('What Is Missing'));
      sec.missingCapabilities.forEach(c => children.push(bul(c)));
    }

    // Seasonal opportunity
    if (sec.seasonalOpportunity) {
      children.push(h3('Seasonal Opportunity'));
      children.push(body(sec.seasonalOpportunity));
    }

    // Zero results table
    if (sec.shouldHappen?.length) {
      children.push(h3('What Should Happen vs. What Currently Happens'));
      children.push(new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [5040, 5040],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: bAll(1), width: { size: 5040, type: WidthType.DXA }, shading: { fill: C.green, type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: '✓  What Should Happen (ConversionBox)', font: 'Arial', size: 18, bold: true, color: C.white })] })] }),
            new TableCell({ borders: bAll(1), width: { size: 5040, type: WidthType.DXA }, shading: { fill: C.red,   type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: '✗  What Currently Happens',              font: 'Arial', size: 18, bold: true, color: C.white })] })] }),
          ]}),
          ...sec.shouldHappen.map((s, idx) => new TableRow({ children: [
            new TableCell({ borders: bAll(1), width: { size: 5040, type: WidthType.DXA }, shading: { fill: C.lgreen, type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: s, font: 'Arial', size: 17, color: C.green })] })] }),
            new TableCell({ borders: bAll(1), width: { size: 5040, type: WidthType.DXA }, shading: { fill: C.lred,   type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: (sec.whatHappens || [])[idx] || 'Dead end — no recovery', font: 'Arial', size: 17, color: C.red })] })] }),
          ]}))
        ]
      }));
      if (sec.revenuemath) {
        children.push(sp());
        children.push(h3('The Revenue Math'));
        children.push(body(sec.revenuemath));
      }
    }

    // Autocomplete gaps
    if (sec.gaps?.length) {
      children.push(h3('Gaps vs. Best-in-Class'));
      sec.gaps.forEach(g => children.push(bul(g)));
    }

    // AI Use cases table
    if (sec.useCases?.length) {
      children.push(h3('AI Assistant Use Cases for This Site'));
      children.push(new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [2000, 8080],
        rows: sec.useCases.map((u, idx) => new TableRow({ children: [
          new TableCell({ borders: bAll(1), width: { size: 2000, type: WidthType.DXA }, shading: { fill: C.blue, type: ShadingType.CLEAR }, margins: pad(120, 120, 140, 140), verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: u.persona, font: 'Arial', size: 18, bold: true, color: C.white })] })] }),
          new TableCell({ borders: bAll(1), width: { size: 8080, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? C.lblue : C.white, type: ShadingType.CLEAR }, margins: pad(120, 120, 140, 140), children: [new Paragraph({ children: [new TextRun({ text: u.scenario, font: 'Arial', size: 17, color: '333333' })] })] }),
        ]}))
      }));
      if (sec.dataSources?.length) {
        children.push(sp());
        children.push(h3('Data Sources Powering the AI Assistant'));
        sec.dataSources.forEach(d => children.push(bul(d)));
      }
    }

    // Personalization segments
    if (sec.segments?.length) {
      children.push(h3('Personalization Segments'));
      sec.segments.forEach(s => children.push(bul(s)));
    }

    // Revenue impact + CB solution
    if (sec.businessImpact) {
      children.push(sp());
      children.push(revBox(sec.businessImpact));
    }

    children.push(h3('ConversionBox Solution'));
    children.push(body(sec.cbSolution || ''));

    if (i < (data.sections || []).length - 1) children.push(pb());
  });

  // ── CB Mapping table ────────────────────────────────────────────────────────
  children.push(tag('CONVERSIONBOX SOLUTION MAP'));
  children.push(h1('ConversionBox Feature-to-Gap Mapping'));
  children.push(body('Every identified gap maps directly to a ConversionBox capability with a projected impact range.', C.muted, true));
  children.push(sp(120));
  children.push(new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [3200, 3200, 3040],
    rows: [
      hdrRow(['Identified Gap', 'ConversionBox Solution', 'Projected Impact'], [3200, 3200, 3040]),
      ...(data.cbMapping || []).map(m => new TableRow({ children: [
        new TableCell({ borders: bAll(1), width: { size: 3200, type: WidthType.DXA }, shading: { fill: C.white,  type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: m.gap,       font: 'Arial', size: 17, color: '333333' })] })] }),
        new TableCell({ borders: bAll(1), width: { size: 3200, type: WidthType.DXA }, shading: { fill: C.lblue,  type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: m.cbFeature, font: 'Arial', size: 17, bold: true, color: C.blue })] })] }),
        new TableCell({ borders: bAll(1), width: { size: 3040, type: WidthType.DXA }, shading: { fill: C.lgreen, type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: m.impact,    font: 'Arial', size: 17, color: C.green })] })] }),
      ]}))
    ]
  }));
  children.push(pb());

  // ── Projected impact grid ───────────────────────────────────────────────────
  children.push(tag('PROJECTED BUSINESS IMPACT'));
  children.push(h1('What ' + domain + ' Can Expect'));
  children.push(body('Based on results from comparable specialty & technical retail deployments: Ecco Bella (+25% AOV), Lazy One (+35% retention), Gleam Jewels (+30% search visibility), Belk (+23% search-to-conversion), Buffalo Games (+38% AOV from bundling).', C.muted, true));
  children.push(sp(160));

  const impacts = data.projectedImpact || [];
  children.push(new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [2160, 300, 2160, 300, 2160, 300, 2160],
    rows: [
      impactRow(impacts.slice(0, 4)),
      impactGapRow(),
      impactRow(impacts.slice(4, 8))
    ]
  }));
  children.push(sp(280));

  // ── Competitive Analysis (depth >= 2) ──────────────────────────────────────
  if (depth >= 2 && data.competitiveAnalysis) {
    const ca = data.competitiveAnalysis;
    children.push(pb());
    children.push(tag('COMPETITIVE ANALYSIS'));
    children.push(h1('Search Platform Comparison: ConversionBox vs. The Market'));
    children.push(body(ca.currentToolAssessment || '', C.muted, true));
    children.push(h3('Current Search Solution: ' + (ca.currentTool || 'Unknown')));
    children.push(sp(120));

    // Feature comparison table: Feature | Current Tool | Algolia | ConversionBox
    if (ca.featureComparison?.length) {
      children.push(new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [2020, 2680, 2680, 2700],
        rows: [
          // Header row
          new TableRow({ children: [
            new TableCell({ borders: bAll(1), width: { size: 2020, type: WidthType.DXA }, shading: { fill: C.navy, type: ShadingType.CLEAR }, margins: pad(80, 80, 120, 120), children: [new Paragraph({ children: [new TextRun({ text: 'Feature',       font: 'Arial', size: 18, bold: true, color: C.white })] })] }),
            new TableCell({ borders: bAll(1), width: { size: 2680, type: WidthType.DXA }, shading: { fill: C.navy, type: ShadingType.CLEAR }, margins: pad(80, 80, 120, 120), children: [new Paragraph({ children: [new TextRun({ text: 'Current Tool',  font: 'Arial', size: 18, bold: true, color: C.white })] })] }),
            new TableCell({ borders: bAll(1), width: { size: 2680, type: WidthType.DXA }, shading: { fill: C.navy, type: ShadingType.CLEAR }, margins: pad(80, 80, 120, 120), children: [new Paragraph({ children: [new TextRun({ text: 'Algolia',       font: 'Arial', size: 18, bold: true, color: C.white })] })] }),
            new TableCell({ borders: bAll(1), width: { size: 2700, type: WidthType.DXA }, shading: { fill: C.navy, type: ShadingType.CLEAR }, margins: pad(80, 80, 120, 120), children: [new Paragraph({ children: [new TextRun({ text: 'ConversionBox', font: 'Arial', size: 18, bold: true, color: C.white })] })] }),
          ]}),
          // Data rows
          ...ca.featureComparison.map((row, idx) => new TableRow({ children: [
            new TableCell({ borders: bAll(1), width: { size: 2020, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? C.white : 'F8F9FA', type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: row.feature,     font: 'Arial', size: 17, bold: true, color: C.navy })] })] }),
            new TableCell({ borders: bAll(1), width: { size: 2680, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? C.white : 'F8F9FA', type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: row.currentTool, font: 'Arial', size: 17, color: '444444' })] })] }),
            new TableCell({ borders: bAll(1), width: { size: 2680, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? C.white : 'F8F9FA', type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: row.algolia,     font: 'Arial', size: 17, color: '444444' })] })] }),
            new TableCell({ borders: bAll(1), width: { size: 2700, type: WidthType.DXA }, shading: { fill: C.lgreen, type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: row.cb,          font: 'Arial', size: 17, bold: true, color: C.green })] })] }),
          ]}))
        ]
      }));
    }

    children.push(sp(200));
    children.push(h3('Why Switch to ConversionBox'));
    (ca.cbAdvantages || []).forEach(adv => children.push(bul(adv)));
    children.push(sp(160));

    // Savings callout box (blue/green toned)
    if (ca.estimatedSavingsNote) {
      children.push(new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [10080],
        rows: [new TableRow({ children: [new TableCell({
          borders: { top: bdr(6, C.accent), bottom: bdr(6, C.accent), left: { style: BorderStyle.NONE, size: 0, color: C.white }, right: { style: BorderStyle.NONE, size: 0, color: C.white } },
          shading:  { fill: C.lgreen, type: ShadingType.CLEAR },
          margins:  pad(140, 140, 200, 200),
          children: [new Paragraph({ children: [
            new TextRun({ text: 'Estimated Savings: ', font: 'Arial', size: 18, bold: true, color: C.green }),
            new TextRun({ text: ca.estimatedSavingsNote, font: 'Arial', size: 18, color: '333333' })
          ]})]
        })]}) ]
      }));
    }
  }

  // ── Full Proposal (depth >= 3) ───────────────────────────────────────────────
  if (depth >= 3 && data.cbProposal) {
    const p = data.cbProposal;
    children.push(pb());

    // 1. Proposal cover
    children.push(tag('CONVERSIONBOX PROPOSAL'));
    children.push(h1('Transform ' + domain + ' with ConversionBox.ai'));
    children.push(body(p.tagline || '', C.navy));
    children.push(sp(160));

    // 2. Site stats — 3-column navy table
    if (p.siteStats) {
      const st = p.siteStats;
      const statCell = (value, label) => new TableCell({
        borders:  bAll(1),
        width:    { size: 3360, type: WidthType.DXA },
        shading:  { fill: C.navy, type: ShadingType.CLEAR },
        margins:  pad(160, 160, 160, 160),
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: value, font: 'Arial', size: 40, bold: true, color: C.white })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, font: 'Arial', size: 17, color: C.accent })] }),
        ]
      });
      children.push(new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [3360, 3360, 3360],
        rows: [new TableRow({ children: [
          statCell(st.estimatedSkus,          'SKUs'),
          statCell(st.estimatedMonthlyVisits,  'Monthly Visits'),
          statCell(st.estimatedActivePages,    'Active Pages'),
        ]})]
      }));
      children.push(sp(200));
    }

    // 3. Discovery challenge box (red-bordered like revBox)
    if (p.discoveryChallenge) {
      children.push(new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [10080],
        rows: [new TableRow({ children: [new TableCell({
          borders: { top: bdr(6, C.red), bottom: bdr(6, C.red), left: { style: BorderStyle.NONE, size: 0, color: C.white }, right: { style: BorderStyle.NONE, size: 0, color: C.white } },
          shading:  { fill: C.lred, type: ShadingType.CLEAR },
          margins:  pad(140, 140, 200, 200),
          children: [new Paragraph({ children: [
            new TextRun({ text: 'The Challenge: ', font: 'Arial', size: 18, bold: true, color: C.red }),
            new TextRun({ text: p.discoveryChallenge, font: 'Arial', size: 18, color: '333333' })
          ]})]
        })]}) ]
      }));
      children.push(sp(200));
    }

    // 4. Core features table
    if (p.coreFeatures?.length) {
      children.push(h3('ConversionBox.ai: The Next-Gen AI Discovery Suite'));
      children.push(new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [2800, 7280],
        rows: [
          hdrRow(['Feature', 'What It Does for ' + domain], [2800, 7280]),
          ...p.coreFeatures.map((f, idx) => new TableRow({ children: [
            new TableCell({ borders: bAll(1), width: { size: 2800, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? C.lblue : C.white, type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: f.feature,     font: 'Arial', size: 17, bold: true, color: C.blue })] })] }),
            new TableCell({ borders: bAll(1), width: { size: 7280, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? C.lblue : C.white, type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: f.description, font: 'Arial', size: 17, color: '333333' })] })] }),
          ]}))
        ]
      }));
      children.push(sp(200));
    }

    // 5. AI Shopping Assistant scenarios
    if (p.aiAssistantScenarios?.length) {
      children.push(h3('AI Shopping Assistant — Live Use Cases for ' + domain));
      p.aiAssistantScenarios.forEach(sc => {
        children.push(new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [10080],
          rows: [
            new TableRow({ children: [new TableCell({ borders: bAll(1), width: { size: 10080, type: WidthType.DXA }, shading: { fill: C.blue, type: ShadingType.CLEAR }, margins: pad(80, 80, 120, 120), children: [new Paragraph({ children: [new TextRun({ text: sc.persona, font: 'Arial', size: 18, bold: true, color: C.white })] })] })] }),
            new TableRow({ children: [new TableCell({ borders: bAll(1), width: { size: 10080, type: WidthType.DXA }, shading: { fill: C.lblue, type: ShadingType.CLEAR }, margins: pad(80, 80, 200, 200), children: [new Paragraph({ children: [new TextRun({ text: '💬 Shopper: ', font: 'Arial', size: 17, bold: true, color: C.navy }), new TextRun({ text: sc.shopperMessage, font: 'Arial', size: 17, color: '333333', italics: true })] })] })] }),
            new TableRow({ children: [new TableCell({ borders: bAll(1), width: { size: 10080, type: WidthType.DXA }, shading: { fill: C.white, type: ShadingType.CLEAR }, margins: pad(80, 80, 200, 200), children: [new Paragraph({ children: [new TextRun({ text: '🤖 AI: ', font: 'Arial', size: 17, bold: true, color: C.green }), new TextRun({ text: sc.aiResponse, font: 'Arial', size: 17, color: '333333' })] })] })] }),
          ]
        }));
        children.push(sp(80));
      });
      children.push(sp(160));
    }

    // 6. Pricing table
    if (p.pricingOptions?.length) {
      children.push(pb());
      children.push(tag('PRICING'));
      children.push(h1('Transparent Pricing for ' + domain));
      children.push(sp(120));
      p.pricingOptions.forEach((opt, idx) => {
        const isBundle = idx === p.pricingOptions.length - 1;
        const bgColor  = isBundle ? C.navy : C.lblue;
        const fgColor  = isBundle ? C.white : C.navy;
        children.push(new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [10080],
          rows: [
            new TableRow({ children: [new TableCell({ borders: bAll(1, isBundle ? C.navy : C.border), width: { size: 10080, type: WidthType.DXA }, shading: { fill: bgColor, type: ShadingType.CLEAR }, margins: pad(120, 40, 160, 160), children: [new Paragraph({ children: [new TextRun({ text: opt.tier, font: 'Arial', size: 24, bold: true, color: fgColor })] })] })] }),
            new TableRow({ children: [new TableCell({ borders: bAll(1, C.border), width: { size: 10080, type: WidthType.DXA }, shading: { fill: C.white, type: ShadingType.CLEAR }, margins: pad(100, 100, 160, 160), children: [
              // Components as bullet-like list
              ...(opt.components || []).map(comp => new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: '• ' + comp, font: 'Arial', size: 17, color: '333333' })] })),
              new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: 'List Price: ', font: 'Arial', size: 17, color: C.muted }), new TextRun({ text: opt.listPrice, font: 'Arial', size: 17, color: C.muted })] }),
              new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: 'Your Price: ', font: 'Arial', size: 22, bold: true, color: C.green }), new TextRun({ text: opt.discountedPrice, font: 'Arial', size: 28, bold: true, color: C.green })] }),
              new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: 'Implementation: ', font: 'Arial', size: 17, color: C.navy, bold: true }), new TextRun({ text: opt.implementationCost, font: 'Arial', size: 17, color: '333333' })] }),
              new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: opt.note, font: 'Arial', size: 16, color: C.muted, italics: true })] }),
            ]})] }),
          ]
        }));
        children.push(sp(isBundle ? 40 : 120));
      });
      // Bundle recommendation callout
      children.push(new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [10080],
        rows: [new TableRow({ children: [new TableCell({
          borders: { top: bdr(6, C.orange), bottom: bdr(6, C.orange), left: { style: BorderStyle.NONE, size: 0, color: C.white }, right: { style: BorderStyle.NONE, size: 0, color: C.white } },
          shading:  { fill: C.lorange, type: ShadingType.CLEAR },
          margins:  pad(140, 140, 200, 200),
          children: [new Paragraph({ children: [
            new TextRun({ text: '★ Recommended: ', font: 'Arial', size: 18, bold: true, color: C.orange }),
            new TextRun({ text: 'The Complete Bundle delivers the full AI-powered discovery transformation at the best value — and includes free migration support from your current search tool.', font: 'Arial', size: 18, color: '333333' })
          ]})]
        })]}) ]
      }));
      children.push(sp(200));
    }

    // 7. Onboarding timeline
    if (p.onboardingTimeline?.length) {
      children.push(h3('From Signed Proposal to Live Search in 4 Weeks'));
      children.push(new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [1400, 8680],
        rows: p.onboardingTimeline.map((wk, idx) => new TableRow({ children: [
          new TableCell({ borders: bAll(1), width: { size: 1400, type: WidthType.DXA }, shading: { fill: C.blue, type: ShadingType.CLEAR }, margins: pad(120, 120, 100, 100), verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: wk.week, font: 'Arial', size: 17, bold: true, color: C.white })] })] }),
          new TableCell({ borders: bAll(1), width: { size: 8680, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? C.lblue : C.white, type: ShadingType.CLEAR }, margins: pad(120, 120, 140, 140), children: [
            new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: wk.title, font: 'Arial', size: 18, bold: true, color: C.navy })] }),
            new Paragraph({ spacing: { before: 0, after: 0  }, children: [new TextRun({ text: wk.details, font: 'Arial', size: 16, color: '444444' })] }),
          ] }),
        ]}))
      }));
      children.push(sp(200));
    }

    // 8. Commitments
    if (p.commitments?.length) {
      children.push(h3('Our Commitment to ' + domain));
      children.push(new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [2800, 7280],
        rows: p.commitments.map((com, idx) => new TableRow({ children: [
          new TableCell({ borders: bAll(1), width: { size: 2800, type: WidthType.DXA }, shading: { fill: C.lblue, type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: com.title, font: 'Arial', size: 17, bold: true, color: C.blue })] })] }),
          new TableCell({ borders: bAll(1), width: { size: 7280, type: WidthType.DXA }, shading: { fill: idx % 2 === 0 ? C.white : C.lblue, type: ShadingType.CLEAR }, margins: pad(), children: [new Paragraph({ children: [new TextRun({ text: com.detail, font: 'Arial', size: 17, color: '333333' })] })] }),
        ]}))
      }));
      children.push(sp(240));
    }

    // 9. CTA footer
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: 'Ready to See ConversionBox in Action for ' + domain + '?', font: 'Arial', size: 28, bold: true, color: C.navy })] }));
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'Book a personalized demo — hello@conversionbox.ai  |  www.conversionbox.ai', font: 'Arial', size: 19, color: C.blue, italics: true })] }));
    children.push(sp(200));
  }

  // ── Next steps ──────────────────────────────────────────────────────────────
  children.push(tag('NEXT STEPS'));
  children.push(h1('Recommended Next Steps'));
  const steps = [
    'Live Demo: See ConversionBox AI Search running on ' + domain + ' — semantic search, intelligent filtering, and AI assistant handling real queries in real time.',
    'Free 30-Day Trial: Full platform access with no contract commitment — measure AI search impact on your actual conversion data before signing anything.',
    'Search Analytics Deep-Dive: Share top 100 queries, zero-result queries, and high-bounce queries for a data-driven ROI projection specific to your traffic volume.',
    'Platform Integration Review: Confirm your ' + data.platform + ' configuration and current search stack. ConversionBox deploys in 4 weeks from signed proposal to go-live.'
  ];
  children.push(new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [800, 9280],
    rows: steps.map((text, i) => new TableRow({ children: [
      new TableCell({ borders: bAll(1), width: { size: 800,  type: WidthType.DXA }, shading: { fill: C.blue,  type: ShadingType.CLEAR }, margins: pad(140, 140, 120, 120), verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '0' + (i + 1), font: 'Arial', size: 24, bold: true, color: C.white })] })] }),
      new TableCell({ borders: bAll(1), width: { size: 9280, type: WidthType.DXA }, shading: { fill: C.lblue, type: ShadingType.CLEAR }, margins: pad(140, 140, 160, 160), children: [new Paragraph({ children: [new TextRun({ text, font: 'Arial', size: 19, color: '333333' })] })] }),
    ]}))
  }));
  children.push(sp(300));

  // Contact footer
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: 'www.conversionbox.ai  |  hello@conversionbox.ai', font: 'Arial', size: 22, bold: true, color: C.blue })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0,   after: 80 }, children: [new TextRun({ text: '© ' + new Date().getFullYear() + ' ConversionBox. All rights reserved. | Prepared exclusively for ' + domain, font: 'Arial', size: 16, color: C.muted, italics: true })] }));

  // ── Assemble document ───────────────────────────────────────────────────────
  const doc = new Document({
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{
          level:     0,
          format:    LevelFormat.BULLET,
          text:      '\u2022',
          alignment: AlignmentType.LEFT,
          style:     { paragraph: { indent: { left: 540, hanging: 270 } } }
        }]
      }]
    },
    styles: {
      default: { document: { run: { font: 'Arial', size: 20 } } },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run:       { size: 30, bold: true, font: 'Arial', color: C.navy },
          paragraph: { spacing: { before: 300, after: 140 }, outlineLevel: 0 }
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run:       { size: 24, bold: true, font: 'Arial', color: C.blue },
          paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1 }
        },
      ]
    },
    sections: [{
      properties: {
        page: {
          size:   { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border:   { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.blue, space: 1 } },
            spacing:  { after: 80 },
            children: [new TextRun({ text: 'CONFIDENTIAL — ConversionBox.ai  |  ' + domain + ' Site Search Audit', font: 'Arial', size: 16, color: C.muted })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            border:   { top: { style: BorderStyle.SINGLE, size: 4, color: C.blue, space: 1 } },
            spacing:  { before: 80 },
            children: [new TextRun({ text: 'www.conversionbox.ai  |  hello@conversionbox.ai', font: 'Arial', size: 16, color: C.muted })]
          })]
        })
      },
      children
    }]
  });

  return await Packer.toBlob(doc);
}
