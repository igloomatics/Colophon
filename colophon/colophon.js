/*! Colophon · quiet academic homepages from one YAML file · MIT License */
(() => {
  'use strict';

  // Set this to your fork's URL if you redistribute Colophon; leave '' for plain-text credit.
  const COLOPHON_URL = '';

  // Looks: margin (set like a paper, notes in the margin) and catalog (library index cards).
  const STYLES = ['margin', 'catalog'];
  const STYLE_ALIASES = { notebook: 'margin', journal: 'margin', modern: 'margin', serif: 'margin', paper: 'margin', garden: 'margin', note: 'margin', zine: 'margin', terminal: 'catalog', swiss: 'catalog', card: 'catalog', cards: 'catalog' };
  const styleId = (v) => { const id = STYLE_ALIASES[v] || v; return STYLES.includes(id) ? id : 'margin'; };
  const FONTS = {
    margin: 'family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..600&family=Instrument+Sans:ital,wght@0,400..700;1,400..600&family=Noto+Serif+SC:wght@400..700',
    catalog: 'family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..600&family=Instrument+Sans:ital,wght@0,400..700;1,400..600&family=IBM+Plex+Mono:wght@400;500&family=Noto+Serif+SC:wght@400..700',
  };
  const PAPERS = ['auto', 'plain', 'grid', 'dots'];   // auto = plain paper

  const I18N = {
    en: {
      about: 'About', news: 'News', publications: 'Publications', selected: 'Selected', all: 'All',
      showAll: 'Show all', showLess: 'Show less', advisedBy: 'Advised by ', interests: 'Interests', researchInterests: 'Research Interests', selectedPubs: 'Selected Publications', viewAll: 'All publications',
      note: 'Note', authorCard: 'Author card', position: 'Position', affiliation: 'Affiliation', subjects: 'Subjects', contact: 'Contact', advisor: 'Advisor', pronouns: 'Pronouns', of: 'of',
      search: 'Search title, author, venue', allYears: 'All years', year: 'Year', noMatch: 'No papers match', sendEmail: 'Send email', switchLang: '中文', location: 'Location', openMap: 'Open in map',
      updated: 'Updated', equal: 'Equal contribution', corresponding: 'Corresponding author',
      bibtex: 'BibTeX', copy: 'Copy', copied: 'Copied', builtWith: 'Built with', email: 'Email',
      preprint: 'arXiv preprint', more: 'more', toggleMode: 'Toggle dark mode', isNew: 'new', menu: 'Sections',
    },
    zh: {
      about: '简介', news: '动态', publications: '论文', selected: '代表作', all: '全部',
      showAll: '展开全部', showLess: '收起', advisedBy: '导师：', interests: '研究兴趣', researchInterests: '研究兴趣', selectedPubs: '代表作', viewAll: '全部论文',
      note: '近况', authorCard: '作者卡', position: '身份', affiliation: '单位', subjects: '研究兴趣', contact: '联系', advisor: '导师', pronouns: '称谓', of: '/',
      search: '搜索标题、作者、会议', allYears: '全部年份', year: '年份', noMatch: '没有匹配的论文', sendEmail: '发送邮件', switchLang: 'English', location: '地址', openMap: '在地图中打开',
      updated: '更新于', equal: '共同第一作者', corresponding: '通讯作者',
      bibtex: 'BibTeX', copy: '复制', copied: '已复制', builtWith: '基于', email: '邮箱',
      preprint: 'arXiv 预印本', more: '位作者', toggleMode: '切换深色模式', isNew: '新', menu: '栏目',
    },
  };
  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  class ColophonError extends Error {
    constructor(message, hint) { super(message); this.hint = hint; }
  }

  // ── small helpers ──────────────────────────────────────────────────────
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const arr = (x) => (x == null || x === false ? [] : Array.isArray(x) ? x : [x]);
  const slug = (s) => String(s).toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* private mode */ } },
  };

  // ── Markdown (the useful 5%) ───────────────────────────────────────────
  function inline(src) {
    if (src == null) return '';
    const slots = [];
    const keep = (html) => `\u0000${slots.push(html) - 1}\u0000`;
    let s = String(src);
    s = s.replace(/`([^`]+)`/g, (_, c) => keep(`<code>${esc(c)}</code>`));
    s = s.replace(/\[([^\]]+)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)/g, (_, t, u, title) =>
      keep(`<a href="${esc(u)}"${title ? ` title="${esc(title)}"` : ''}>${inline(t)}</a>`));
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\s](?:[^*]*[^*\s])?)\*(?![*\w])/g, '$1<em>$2</em>');
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => slots[i]);
  }

  function md(src) {
    if (src == null) return '';
    return String(src).trim().split(/\n\s*\n/).map((block) => {
      const lines = block.split('\n');
      if (/^\s*[-*]\s+/.test(lines[0])) {
        const items = [];
        for (const l of lines) {
          if (/^\s*[-*]\s+/.test(l)) items.push(l.replace(/^\s*[-*]\s+/, ''));
          else if (items.length) items[items.length - 1] += ' ' + l.trim();
        }
        return `<ul>${items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;
      }
      const h = /^(#{1,4})\s+(.*)$/.exec(block);
      if (h && lines.length === 1) return `<h${h[1].length + 2}>${inline(h[2])}</h${h[1].length + 2}>`;
      if (/^\s*</.test(block)) return block; // raw HTML passes through
      return `<p>${inline(lines.map((l) => l.trim()).join(' '))}</p>`;
    }).join('\n');
  }
  const plain = (s) => String(s ?? '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`~#>]/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  // ── BibTeX ─────────────────────────────────────────────────────────────
  function parseBibtex(src) {
    src = src.replace(/^[ \t]*%.*$/gm, (m) => ' '.repeat(m.length)); // keep offsets for line numbers
    const macros = Object.fromEntries(MONTHS.map((m, i) => [m, String(i + 1)]));
    const entries = [];
    let i = 0;
    const lineAt = (p) => src.slice(0, p).split('\n').length;
    const fail = (msg, p) => { throw new ColophonError(`publications.bib, line ${lineAt(p)}: ${msg}`, 'Check for a missing comma, brace or quote near that line.'); };
    const ws = () => { while (i < src.length && /\s/.test(src[i])) i++; };
    const word = (re) => { re.lastIndex = i; const m = re.exec(src); if (!m) return null; i = re.lastIndex; return m[0]; };
    const balanced = (open, close) => { // i points just past `open`
      let depth = 1; const start = i;
      while (i < src.length) {
        const c = src[i];
        if (c === '\\') { i += 2; continue; }
        if (c === open) depth++;
        else if (c === close && --depth === 0) { i++; return src.slice(start, i - 1); }
        i++;
      }
      return fail('unbalanced braces', start);
    };
    const quoted = () => { // i points just past `"`
      let depth = 0; const start = i;
      while (i < src.length) {
        const c = src[i];
        if (c === '\\') { i += 2; continue; }
        if (c === '{') depth++;
        else if (c === '}') depth--;
        else if (c === '"' && depth === 0) { i++; return src.slice(start, i - 1); }
        i++;
      }
      return fail('unterminated quote', start);
    };
    const value = () => {
      const start = i; let out = '';
      for (;;) {
        ws();
        const c = src[i];
        if (c === '{') { i++; out += balanced('{', '}'); }
        else if (c === '"') { i++; out += quoted(); }
        else {
          const w = word(/[^\s,#{}()"=]+/y);
          if (w == null) fail('expected a value', i);
          out += /^\d+$/.test(w) ? w : (macros[w.toLowerCase()] ?? w);
        }
        ws();
        if (src[i] === '#') { i++; continue; }
        return { value: out, raw: src.slice(start, i).trim() };
      }
    };
    const fields = (close) => {
      const f = {}, raw = [];
      for (;;) {
        ws();
        if (src[i] === close) { i++; return { f, raw }; }
        if (i >= src.length) fail('entry is not closed', i);
        const name = word(/[A-Za-z0-9_\-:.+]+/y);
        if (!name) fail(`unexpected “${src[i]}”`, i);
        ws();
        if (src[i] !== '=') fail(`expected “=” after “${name}”`, i);
        i++;
        const v = value();
        f[name.toLowerCase()] = v.value;
        raw.push([name, v.raw]);
        ws();
        if (src[i] === ',') i++;
        else if (src[i] !== close) fail(`expected “,” after field “${name}”`, i);
      }
    };

    for (;;) {
      const at = src.indexOf('@', i);
      if (at === -1) break;
      i = at + 1;
      const type = word(/[A-Za-z]+/y);
      if (!type) continue;
      ws();
      const open = src[i];
      if (open !== '{' && open !== '(') continue;
      const close = open === '{' ? '}' : ')';
      i++;
      const t = type.toLowerCase();
      if (t === 'comment' || t === 'preamble') { balanced(open, close); continue; }
      if (t === 'string') {
        const { f } = fields(close);
        for (const [k, v] of Object.entries(f)) macros[k] = v;
        continue;
      }
      ws();
      const key = word(/[^\s,]+/y) || `entry${entries.length + 1}`;
      ws();
      if (src[i] === ',') i++;
      const { f, raw } = fields(close);
      entries.push({ type: t, key, fields: f, raw, line: lineAt(at) });
    }
    return entries;
  }

  const ACCENT = { '`': '̀', "'": '́', '^': '̂', '~': '̃', '=': '̄', '.': '̇', '"': '̈', u: '̆', r: '̊', H: '̋', v: '̌', c: '̧', k: '̨' };
  const LETTERS = { ss: 'ß', o: 'ø', O: 'Ø', ae: 'æ', AE: 'Æ', oe: 'œ', OE: 'Œ', aa: 'å', AA: 'Å', l: 'ł', L: 'Ł', i: 'ı', j: 'ȷ' };
  const SYMBOLS = {
    textendash: '–', textemdash: '—', ldots: '…', dots: '…', textellipsis: '…', dag: '†', dagger: '†', ddagger: '‡',
    textregistered: '®', texttrademark: '™', copyright: '©', S: '§', P: '¶', times: '×', pm: '±', cdot: '·',
    leq: '≤', geq: '≥', le: '≤', ge: '≥', neq: '≠', approx: '≈', infty: '∞', to: '→', rightarrow: '→', leftarrow: '←',
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ',
    iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ',
    phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω', Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ',
    Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω', LaTeX: 'LaTeX', TeX: 'TeX',
  };
  function delatex(input) {
    if (input == null) return '';
    let s = String(input);
    s = s.replace(/\\([{}$&%#_])/g, (_, c) => `\u0001${c.charCodeAt(0)}\u0001`).replace(/\\[ ,;:!]/g, ' ');
    const acc = (_, a, ch) => (ch === '\\i' ? 'i' : ch === '\\j' ? 'j' : ch) + ACCENT[a];
    s = s.replace(/\\([`'^~=."])\s*\{?\s*(\\[ij](?![A-Za-z])|[A-Za-z])\s*\}?/g, acc);
    s = s.replace(/\\([urHvck])\s*\{\s*(\\[ij](?![A-Za-z])|[A-Za-z])\s*\}/g, acc);
    s = s.replace(/\\([urHvck]) ([A-Za-z])/g, acc);
    s = s.replace(/\\href\s*\{[^}]*\}\s*/g, '');
    s = s.replace(/\\(?:url|textbf|textit|emph|textsc|textrm|textsf|texttt|textup|textnormal|mathrm|mathbf|mathit|mathsf|mathtt|mathcal|mathbb|operatorname|text|mbox|bm|boldsymbol)\s*(?=\{)/g, '');
    s = s.replace(/\\([A-Za-z]+)(?![A-Za-z])(\s*\{\})?(\s?)/g, (_, name, braces, space) => {
      // TeX swallows the space after a bare control word: Stra\ss e → Straße
      if (name in LETTERS) return LETTERS[name] + (braces ? space : '');
      return (SYMBOLS[name] ?? name) + space;
    });
    s = s.replace(/[{}$]/g, '')
      .replace(/---/g, '—').replace(/--/g, '–').replace(/``/g, '“').replace(/''/g, '”')
      .replace(/(^|[^\\])~/g, '$1 ').replace(/\\\\/g, ' ')
      .replace(/\u0001(\d+)\u0001/g, (_, c) => String.fromCharCode(+c))
      .replace(/\s+/g, ' ').trim();
    return s.normalize('NFC');
  }

  function splitAuthors(raw) {
    const out = []; let depth = 0, last = 0;
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (depth === 0 && /\s/.test(c)) {
        const m = /^\s+and\s+/i.exec(raw.slice(i));
        if (m) { out.push(raw.slice(last, i)); i += m[0].length - 1; last = i + 1; }
      }
    }
    out.push(raw.slice(last));
    return out.map((a) => a.trim()).filter(Boolean);
  }

  function parseAuthors(raw, equal) {
    if (!raw) return [];
    return splitAuthors(raw).map((a, idx) => {
      let s = a
        .replace(/\$\^\{?\s*\*\s*\}?\$|\\textsuperscript\{\s*\*\s*\}/g, '*')
        .replace(/\$\^\{?\s*\\dag(?:ger)?\s*\}?\$|\\textsuperscript\{\s*\\dag(?:ger)?\s*\}|\\dag(?:ger)?(?![A-Za-z])/g, '†');
      let marks = (s.match(/[*†]/g) || []).join('');
      s = s.replace(/[*†]/g, '').trim();
      if (/^others$/i.test(s)) return { name: 'et al.', marks: '', others: true };
      const parts = [];
      let depth = 0, last = 0;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === '{') depth++; else if (s[i] === '}') depth--;
        else if (s[i] === ',' && depth === 0) { parts.push(s.slice(last, i)); last = i + 1; }
      }
      parts.push(s.slice(last));
      const p = parts.map((x) => x.trim());
      const name = p.length === 2 ? `${p[1]} ${p[0]}` : p.length >= 3 ? `${p[2]} ${p[0]} ${p[1]}` : p[0];
      if (idx < equal && !marks.includes('*')) marks = '*' + marks;
      return { name: delatex(name), marks };
    });
  }

  const HIDDEN_FIELDS = new Set(['selected', 'topic', 'topics', 'preview', 'abbr', 'award', 'pdf', 'code', 'project', 'website', 'html',
    'video', 'slides', 'poster', 'blog', 'equal', 'arxiv', 'bibtex_show', 'note_html']);

  function exportBib(e) {
    const rows = e.raw.filter(([k]) => !HIDDEN_FIELDS.has(k.toLowerCase()));
    const pad = Math.max(0, ...rows.map(([k]) => k.length));
    return `@${e.type}{${e.key},\n${rows.map(([k, v]) => `  ${k.padEnd(pad)} = ${v}`).join(',\n')}\n}`;
  }

  const monthNum = (m) => {
    if (m == null || m === '') return 0;
    if (/^\d+$/.test(m)) return +m;
    const i = MONTHS.indexOf(String(m).slice(0, 3).toLowerCase());
    return i + 1;
  };
  const truthy = (v) => /^(true|yes|1|y)$/i.test(String(v ?? '').trim());

  function toPub(e, idx, L) {
    const f = e.fields;
    const clean = (k) => (f[k] ? delatex(f[k]) : '');
    const date = f.date ? String(f.date).split('-') : [];
    const year = parseInt(f.year, 10) || parseInt(date[0], 10) || 0;
    const month = monthNum(f.month) || monthNum(date[1]);

    let arxiv = f.arxiv || (f.eprint && /arxiv/i.test(f.archiveprefix || f.eprinttype || 'arxiv') ? f.eprint : '');
    if (!arxiv) { const m = /arxiv[:\s]*(\d{4}\.\d{4,5})/i.exec(`${f.journal || ''} ${f.url || ''}`); if (m) arxiv = m[1]; }
    const arxivUrl = arxiv ? (/^https?:/.test(arxiv) ? arxiv : `https://arxiv.org/abs/${arxiv.replace(/^arxiv:/i, '')}`) : '';
    const doiUrl = f.doi ? (/^https?:/.test(f.doi) ? f.doi : `https://doi.org/${f.doi}`) : '';

    const links = [];
    const add = (label, url) => { if (url) links.push({ label, url: url.trim() }); };
    add('PDF', f.pdf); add('arXiv', arxivUrl); add('Code', f.code); add('Project', f.project || f.website || f.html);
    add('Video', f.video); add('Slides', f.slides); add('Poster', f.poster); add('Blog', f.blog);
    if (!f.pdf && !arxivUrl) add('DOI', doiUrl);

    let venue = clean('booktitle') || clean('journal') || clean('school') || clean('institution') || clean('howpublished');
    if (!venue && arxivUrl) venue = L.preprint;
    if (!venue && e.type === 'phdthesis') venue = 'PhD thesis';

    return {
      key: e.key, idx, year, month,
      title: clean('title') || '(untitled)',
      authors: parseAuthors(f.author || f.editor, parseInt(f.equal, 10) || 0),
      venue, abbr: clean('abbr'), award: clean('award'), note: clean('note'),
      selected: truthy(f.selected), preview: (f.preview || '').trim(),
      topics: String(f.topic || f.topics || '').split(/[,;]/).map((x) => delatex(x).trim()).filter(Boolean),
      links, href: (f.project || f.website || f.html || f.url || f.pdf || arxivUrl || doiUrl || '').trim(),
      bib: exportBib(e),
    };
  }

  // ── dates ──────────────────────────────────────────────────────────────
  function fmtDate(d, lang) {
    if (d == null || d === '') return '';
    let y, m;
    if (d instanceof Date && !isNaN(d)) { y = d.getUTCFullYear(); m = d.getUTCMonth() + 1; }
    else {
      const r = /^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?$/.exec(String(d).trim());
      if (!r) return esc(d);
      y = +r[1]; m = +r[2];
    }
    return lang === 'zh' ? `${y}.${String(m).padStart(2, '0')}` : `${MONTHS_EN[m - 1]} ${y}`;
  }
  const isoDate = (d) => {
    if (d instanceof Date && !isNaN(d)) return d.toISOString().slice(0, 10);
    const r = /^(\d{4})[-/.](\d{1,2})/.exec(String(d ?? ''));
    return r ? `${r[1]}-${r[2].padStart(2, '0')}` : '';
  };

  // ── icons (24px grid, drawn as strokes so they take the text colour) ─
  const ICONS = {
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    scholar: '<path d="M2 9.5 12 4l10 5.5L12 15z"/><path d="M6 12v4.5c3.3 2.6 8.7 2.6 12 0V12M22 9.5V15"/>',
    code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
    x: '<path d="M5 4l14 16M19 4 5 20"/>',
    sky: '<path d="M12 11.5C10 7.5 6.5 5 4.5 5.5 2.5 6 3 12 7.5 12.5 4 13.5 5 18 8 18c2 0 3.2-2.5 4-4.5.8 2 2 4.5 4 4.5 3 0 4-4.5.5-5.5C21 12 21.5 6 19.5 5.5 17.5 5 14 7.5 12 11.5z"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    work: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18"/>',
    orcid: '<circle cx="12" cy="12" r="9"/><path d="M9 10v6M9 7.5v.01M12.5 8h1.2a4 4 0 0 1 0 8h-1.2z"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/>',
    pen: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z"/>',
    play: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="m10.5 9.5 4 2.5-4 2.5z"/>',
    pin: '<path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    half: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
  };
  const svg = (inner) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  function iconFor(l) {
    if (l.icon && ICONS[l.icon]) return svg(ICONS[l.icon]);
    const k = `${l.label} ${l.url}`.toLowerCase();
    const name = /mailto:|e-?mail|邮箱/.test(k) ? 'mail' : /scholar/.test(k) ? 'scholar'
      : /github/.test(k) ? 'github' : /gitlab|huggingface|\bcode\b/.test(k) ? 'code' : /bsky|bluesky/.test(k) ? 'sky'
      : /twitter|x\.com|^x\s/.test(k) ? 'x' : /linkedin/.test(k) ? 'linkedin' : /orcid/.test(k) ? 'orcid'
      : /\bcv\b|resume|简历|\.pdf/.test(k) ? 'file' : /blog|medium|substack|zhihu|知乎/.test(k) ? 'pen'
      : /youtube|bilibili|video/.test(k) ? 'play' : 'link';
    return svg(ICONS[name]);
  }

  // ── theme ──────────────────────────────────────────────────────────────
  const S = { c: null, entries: [], modified: null, params: null, root: null, fonts: new Set(), spy: null, headDone: false };

  const parseHex = (hex) => {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex ?? '').trim());
    if (!m) return null;
    const h = m[1].length === 3 ? [...m[1]].map((x) => x + x).join('') : m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };
  const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  const mixHex = (a, b, t) => { const x = parseHex(a), y = parseHex(b); return x && y ? toHex(x.map((v, i) => v + (y[i] - v) * t)) : a; };
  const luminance = (hex) => {
    const rgb = parseHex(hex); if (!rgb) return null;
    const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const textOn = (hex) => { const l = luminance(hex); return l != null && l > 0.3 ? '#111111' : '#ffffff'; };
  const navOn = (v) => !(v === false || v === 'none' || v === 'off' || v === 'hide');
  const tabsOn = (t) => navOn(t.tabs) && t.tabs !== 'scroll';
  const accentOf = (t) => { const a = t.accent || t.primary; return a && a !== 'none' ? String(a) : ''; };

  function applyTheme(t) {
    const root = document.documentElement;
    const style = styleId(t.style);
    root.dataset.style = style;
    root.dataset.layout = t.layout === 'single' ? 'single' : 'sidebar';
    root.dataset.nav = navOn(t.nav) ? 'on' : 'none';
    // Tabs: each top-bar item opens its own page. Needs the top bar to switch pages.
    root.dataset.tabs = tabsOn(t) && navOn(t.nav) ? 'on' : 'off';
    root.dataset.paper = PAPERS.includes(t.paper) ? t.paper : 'auto';

    const accent = accentOf(t);
    if (accent) {
      root.style.setProperty('--accent-l', accent);
      root.style.setProperty('--accent-d', parseHex(accent) ? mixHex(accent, '#ffffff', 0.4) : accent);
    } else {
      root.style.removeProperty('--accent-l');
      root.style.removeProperty('--accent-d');
    }
    if (t.background) root.style.setProperty('--l-bg', t.background);

    const mode = S.params.get('mode') || store.get('colophon-mode') || t.mode || 'auto';
    if (mode === 'light' || mode === 'dark') root.dataset.theme = mode;
    else delete root.dataset.theme;

    if ((t.fonts || 'web') !== 'system' && !S.fonts.has(style)) {
      S.fonts.add(style);
      const cdn = String(t.font_cdn || 'https://fonts.googleapis.com').replace(/\/$/, '');
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = `${cdn}/css2?${FONTS[style]}&display=swap`;
      document.head.append(css);
    }
  }
  const isDark = () => {
    const t = document.documentElement.dataset.theme;
    return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  };

  function setHead(c) {
    if (S.headDone) return;
    S.headDone = true;
    const head = document.head;
    const meta = (name, content) => {
      const attr = name.startsWith('og:') ? 'property' : 'name';
      // Tags written by hand in index.html (for link previews) win over generated ones.
      if (!content || head.querySelector(`meta[${attr}="${name}"]`)) return;
      const m = document.createElement('meta');
      m.setAttribute(attr, name);
      m.content = content; head.append(m);
    };
    document.title = c.title || c.name;
    const desc = c.description || plain(c.about).slice(0, 180);
    meta('description', desc);
    meta('og:title', c.title || c.name);
    meta('og:description', desc);
    meta('og:type', 'profile');
    meta('author', c.name);

    const fill = parseHex(accentOf(c.theme)) ? accentOf(c.theme) : '#1b1b1b';
    const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="${fill}"/><text x="32" y="41" font-family="Helvetica,Arial,sans-serif" font-weight="600" font-size="24" text-anchor="middle" fill="${textOn(fill)}">${esc(initials(c.name))}</text></svg>`;
    const link = document.createElement('link');
    link.rel = 'icon'; link.href = `data:image/svg+xml,${encodeURIComponent(icon)}`;
    head.append(link);

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Person', name: c.name, alternateName: c.name_alt || undefined,
      jobTitle: plain(c.role) || undefined, url: location.href.split(/[?#]/)[0],
      affiliation: c.affiliation ? { '@type': 'Organization', name: plain(c.affiliation) } : undefined,
      sameAs: linkList(c).map((l) => l.url).filter((u) => /^https?:/.test(u)),
      knowsAbout: arr(c.interests).length ? arr(c.interests) : undefined,
    }).replace(/</g, '\\u003c');
    head.append(ld);
  }

  // ── building blocks ────────────────────────────────────────────────────
  function initials(name) {
    const w = String(name || '?').trim().split(/\s+/);
    if (w.length === 1) return [...w[0]].slice(0, /[㐀-鿿]/.test(w[0]) ? 1 : 2).join('');
    return (w[0][0] + w[w.length - 1][0]).toUpperCase();
  }

  function linkList(c, L) {
    let links = c.links;
    if (links && !Array.isArray(links) && typeof links === 'object') links = Object.entries(links).map(([label, url]) => ({ label, url }));
    links = arr(links).filter((l) => l && l.url).map((l) => ({ label: String(l.label || l.name || l.url), url: String(l.url), icon: l.icon }));
    if (L && c.email && !links.some((l) => /^mailto:/i.test(l.url))) {
      const shown = c.email.length <= 30 ? c.email.replace('@', ' [at] ') : L.email;
      links.unshift({ label: shown, url: `mailto:${c.email}`, icon: 'mail' });
    }
    return links;
  }

  const avatarHTML = (c) => `<span class="portrait">${c.avatar
    ? `<img class="avatar" src="${esc(c.avatar)}" alt="${esc(c.name)}" width="320" height="320" decoding="async">`
    : `<span class="avatar avatar--mono" aria-hidden="true"><span>${esc(initials(c.name))}</span></span>`}</span>`;

  function advisorHTML(c, L) {
    if (!shown(c, 'advisor')) return '';
    const advisors = arr(c.advisor).map((a) => (typeof a === 'string' ? { name: a } : a));
    if (!advisors.length) return '';
    return `<p class="who-advisor">${esc(L.advisedBy)}${advisors.map((a) => (a.url ? `<a href="${esc(a.url)}">${esc(a.name)}</a>` : esc(a.name))).join(c.lang === 'zh' ? '、' : ' & ')}</p>`;
  }
  // One name at a time: in Chinese pages the name written in Chinese, otherwise the other one.
  const CJK = /[㐀-鿿]/;
  const nameOf = (c) => {
    const names = [c.name, c.name_alt].filter(Boolean).map(String);
    const want = c.lang === 'zh';
    return names.find((n) => CJK.test(n) === want) || c.name;
  };
  // Advisor, location and pronouns are off until you switch them on: show: { advisor: true }.
  const shown = (c, k) => !!(c.show && c.show[k] === true);


  // Contact links as icon buttons; the email one opens a small card with Copy / Send.
  function iconsHTML(c, L) {
    const links = linkList(c, L);
    if (!links.length) return '';
    const icon = (l) => (/^mailto:/i.test(l.url)
      ? `<li class="has-pop"><button class="icon-btn pop-btn" data-act="pop" aria-label="${esc(L.email)}" aria-expanded="false" aria-haspopup="dialog">${iconFor(l)}</button>
          <div class="pop" role="dialog" aria-label="${esc(L.email)}"><p class="pop-title">${esc(L.email)}</p>
            <p class="pop-addr">${esc(l.url.slice(7).replace('@', ' (at) '))}</p>
            <a class="pop-send" href="${esc(l.url)}">${svg(ICONS.mail)}<span>${esc(L.sendEmail)}</span></a></div></li>`
      : `<li data-tip="${esc(l.label)}"><a class="icon-btn" href="${esc(l.url)}" aria-label="${esc(l.label)}">${iconFor(l)}</a></li>`);
    return `<ul class="icons">${links.map(icon).join('')}</ul>`;
  }
  const locationHTML = (c) => (c.location_url ? `<a href="${esc(c.location_url)}">${inline(c.location)}</a>` : inline(c.location));
  const advisorsInline = (c) => arr(c.advisor).map((a) => (typeof a === 'string' ? { name: a } : a))
    .map((a) => (a.url ? `<a href="${esc(a.url)}">${esc(a.name)}</a>` : esc(a.name))).join(c.lang === 'zh' ? '、' : ' & ');

  // The About page's header. Same facts, two arrangements:
  //   margin  — name, role and bio in the text column; photo, links, interests in the margin
  //   catalog — an "author card" with labelled fields, then a card with the bio
  function profileHTML(c, L, style) {
    const ab = about(c, L);
    const ints = arr(c.interests);
    const extras = [
      shown(c, 'advisor') && c.advisor && [L.advisor, advisorsInline(c)],
      shown(c, 'location') && c.location && [L.location, locationHTML(c)],
      shown(c, 'pronouns') && c.pronouns && [L.pronouns, esc(c.pronouns)],
    ].filter(Boolean);
    if (style === 'catalog') {
      const fact = (k, v, cls = '') => (v ? `<div class="fact${cls}"><dt>${esc(k)}</dt><dd>${v}</dd></div>` : '');
      const call = c.call_number ? esc(c.call_number) : `${esc(initials(c.name))} · ${new Date().getFullYear()}`;
      return `<section class="profile card" id="profile">
          <div class="card-meta"><span>${esc(L.authorCard)}</span><span class="call">${call}</span></div>
          <div class="author">
            ${avatarHTML(c)}
            <div class="author-text">
              <h1 class="who-name">${esc(nameOf(c))}</h1>
              <dl class="facts">
                ${fact(L.position, c.role && inline(c.role))}
                ${fact(L.affiliation, c.affiliation && inline(c.affiliation))}
                ${extras.map(([k, v]) => fact(k, v)).join('')}
                ${fact(L.subjects, ints.map(inline).join('<span class="sep">·</span>'))}
                ${fact(L.contact, iconsHTML(c, L), ' fact--icons')}
              </dl>
            </div>
          </div>
        </section>
        ${ab ? `<section class="intro card">${ab.callout ? `<div class="callout"><span class="stamp">${esc(L.note)}</span>${md(c.callout)}</div>` : ''}<div class="prose">${ab.prose}</div></section>` : ''}`;
    }
    const role = [c.role, c.affiliation].filter(Boolean).map(inline).join(c.lang === 'zh' ? '，' : ', ');
    return `<section class="profile" id="profile">
        <div class="row">
          <div class="r-main">
            <h1 class="who-name">${esc(nameOf(c))}</h1>
            ${role ? `<p class="who-role">${role}</p>` : ''}
            ${extras.map(([k, v]) => `<p class="who-extra"><span>${esc(k)}</span> ${v}</p>`).join('')}
            ${ab ? `<div class="prose intro">${ab.prose}</div>${ab.callout ? `<div class="callout">${md(c.callout)}</div>` : ''}` : ''}
          </div>
          <aside class="r-note">
            ${avatarHTML(c)}
            ${iconsHTML(c, L) ? `<div class="note-block note-block--contact"><span class="note-label">${esc(L.contact)}</span>${iconsHTML(c, L)}</div>` : ''}
            ${ints.length ? `<div class="note-block note-block--interests"><span class="note-label">${esc(L.interests)}</span><p>${ints.map(inline).join('<span class="sep">·</span>')}</p></div>` : ''}
          </aside>
        </div>
      </section>`;
  }

  // Shown only when a translated config (config.zh.yml / config.en.yml) exists.
  const langHTML = (c, L) => (S.altLang ? `<button class="lang" data-act="lang" lang="${c.lang === 'zh' ? 'en' : 'zh'}" title="${esc(L.switchLang)}" aria-label="${esc(L.switchLang)}">${c.lang === 'zh' ? 'EN' : '中'}</button>` : '');

  function navHTML(c, L, secs) {
    const root = document.documentElement;
    if (root.dataset.nav === 'none') return '';
    let items;
    if (c.menu === false) items = [];
    else if (Array.isArray(c.menu)) {
      items = c.menu.map((m) => {
        if (m && typeof m === 'object' && m.url) return { label: m.label || m.url, href: m.url };
        const s = secs.find((x) => x.id === slug(m));
        return s && { label: s.title, href: `#${s.id}`, id: s.id };
      }).filter(Boolean);
    } else {
      items = secs.map((s) => ({ label: s.title, href: `#${s.id}`, id: s.id }));
      const cv = linkList(c).find((l) => /^(cv|resume|简历)$/i.test(l.label.trim()));
      if (cv) items.push({ label: cv.label, href: cv.url });
    }
    return `<header class="nav"><div class="nav-inner">
      <a class="nav-brand" href="#">${esc(c.short_name || nameOf(c))}</a>
      <nav class="nav-links" aria-label="${esc(L.menu)}"><span class="nav-pill" aria-hidden="true"></span>${items.map((i) => `<a href="${esc(i.href)}"${i.id ? ` data-spy="${esc(i.id)}"` : ''}>${esc(plain(i.label))}</a>`).join('')}</nav>
      ${langHTML(c, L)}<button class="mode" data-act="mode" aria-label="${esc(L.toggleMode)}" title="${esc(L.toggleMode)}">${svg(ICONS.half)}</button>
    </div></header>`;
  }

  const section = (s) => `<section class="sec" id="${esc(s.id)}">
      <div class="sec-head"><h2 class="sec-title">${inline(s.title)}</h2>${s.count ? `<span class="sec-count">${esc(s.count)}</span>` : ''}</div>
      ${s.extra || ''}
      ${s.body}
    </section>`;

  function about(c, L) {
    if (!c.about && !c.callout) return null;
    return { title: c.about_title || L.about, prose: md(c.about), callout: !!c.callout };
  }

  const dateValue = (d) => {
    if (d instanceof Date && !isNaN(d)) return d.getTime();
    const r = /^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?$/.exec(String(d ?? '').trim());
    return r ? Date.UTC(+r[1], +r[2] - 1, +(r[3] || 1)) : null;
  };

  function news(c, L) {
    const n = Array.isArray(c.news) ? { items: c.news } : (c.news || {});
    const items = arr(n.items).map((it) => (typeof it === 'string' ? { text: it } : it));
    if (!items.length) return null;
    const show = n.show ?? 6;
    const fresh = (n.new_days ?? 60) * 864e5;
    const rows = items.map((it, i) => {
      const t = dateValue(it.date);
      const isNew = it.new ?? (t != null && Date.now() - t < fresh && Date.now() >= t);
      return `<li class="row item${i >= show ? ' is-folded' : ''}">
        <div class="r-main">${isNew ? `<span class="sticker">${esc(L.isNew)}</span>` : ''}${inline(it.text)}</div>
        <div class="r-note"><time${isoDate(it.date) ? ` datetime="${isoDate(it.date)}"` : ''}>${fmtDate(it.date, c.lang)}</time></div></li>`;
    }).join('');
    const more = items.length > show
      ? `<button class="more" data-act="fold" data-more="${esc(L.showAll)} (${items.length})" data-less="${esc(L.showLess)}" aria-expanded="false">${esc(L.showAll)} (${items.length})</button>` : '';
    return { title: n.title || L.news, count: items.length > show ? `${show} ${L.of} ${items.length}` : `${items.length}`, body: `<ul class="list list--log news" data-folded>${rows}</ul>${more}` };
  }

  function authorsHTML(authors, isMe, L, limit = 12) {
    const one = (a) => {
      const marks = a.marks ? `<sup title="${esc([a.marks.includes('*') && L.equal, a.marks.includes('†') && L.corresponding].filter(Boolean).join(' · '))}">${esc(a.marks)}</sup>` : '';
      return isMe(a.name) ? `<span class="me">${esc(a.name)}</span>${marks}` : `${esc(a.name)}${marks}`;
    };
    const join = (list) => list.map(one).join(', ');
    if (authors.length <= limit) return join(authors);
    const keep = new Set([0, 1, 2, 3, 4, 5, authors.length - 1]);
    authors.forEach((a, i) => { if (isMe(a.name)) keep.add(i); });
    const short = []; let gap = 0;
    authors.forEach((a, i) => {
      if (keep.has(i)) { if (gap) short.push('<span class="gap">…</span>'); gap = 0; short.push(one(a)); } else gap++;
    });
    return `<span class="authors-short">${short.join(', ')} <button class="inline-btn" data-act="authors">+${authors.length - keep.size} ${esc(L.more)}</button></span><span class="authors-full" hidden>${join(authors)}</span>`;
  }

  function pubItem(p, ctx, rich) {
    const title = p.href ? `<a href="${esc(p.href)}">${esc(p.title)}</a>` : esc(p.title);
    const short = [p.abbr || p.venue, p.year || ''].filter(Boolean).join(' ');
    const links = p.links.map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join('')
      + `<button data-act="bib" aria-expanded="false">${esc(ctx.L.bibtex)}</button>`;
    const thumb = rich && p.preview ? `<div class="thumb"><img src="${esc(p.preview)}" alt="" loading="lazy" decoding="async"></div>` : '';
    return `<li class="row item pub${p.selected ? ' is-selected' : ''}${thumb ? ' has-thumb' : ''}"${p.topics.length ? ` data-topics="${esc(p.topics.join('|'))}"` : ''} data-year="${esc(p.year || '')}">
        <div class="r-main pub-body">
          <h3 class="pub-title">${title}</h3>
          <p class="pub-authors">${authorsHTML(p.authors, ctx.isMe, ctx.L)}</p>
          ${p.award ? `<p class="pub-award">${esc(p.award)}</p>` : ''}
          ${p.note ? `<p class="pub-note">${esc(p.note)}</p>` : ''}
          <p class="pub-links">${links}</p>
          <div class="pub-bib" hidden><pre>${esc(p.bib)}</pre><button data-act="copy">${esc(ctx.L.copy)}</button></div>
        </div>
        <div class="r-note pub-meta">
          <span class="pub-no">No. ${String(p.no).padStart(3, '0')}</span>
          <span class="pub-short">${esc(short)}</span>
          ${p.award ? `<span class="award">${esc(p.award.split(/\s*[(（]/)[0])}</span>` : ''}
        </div>
        ${thumb}
      </li>`;
  }

  // A short list for the home page, linking to the full Publications page.
  function selectedPubs(c, L, pubs, isMe) {
    const pc = c.publications || {};
    let list = pubs.filter((p) => p.selected);
    if (!list.length) list = pubs.slice(0, 3);
    if (!list.length) return null;
    const rich = pc.previews !== false && list.some((p) => p.preview);
    return {
      id: 'selected', title: L.selectedPubs,
      count: `${list.length} ${L.of} ${pubs.length}`,
      body: `<ol class="list list--cards pubs" data-view="selected">${list.map((p) => pubItem(p, { L, isMe }, rich)).join('')}</ol>
        <a class="sec-more" href="#publications">${esc(L.viewAll)} (${pubs.length}) →</a>`,
    };
  }

  function publications(c, L, pubs, isMe, forceView) {
    if (!pubs.length) return null;
    const pc = c.publications || {};
    const ctx = { L, isMe };
    const selected = pubs.filter((p) => p.selected);
    const rich = pc.previews !== false && pubs.some((p) => p.preview);
    const byYear = new Map();
    for (const p of pubs) { const y = p.year || '—'; if (!byYear.has(y)) byYear.set(y, []); byYear.get(y).push(p); }
    const all = [...byYear].map(([y, list]) => `<div class="year-group"><h3 class="year"><span>${esc(y)}</span></h3>
        <ol class="list list--cards pubs">${list.map((p) => pubItem(p, ctx, rich)).join('')}</ol></div>`).join('');
    const hasSel = selected.length > 0;
    const view = hasSel && (forceView || pc.default || 'selected') !== 'all' ? 'selected' : 'all';
    const topics = new Map();
    for (const p of pubs) for (const t of p.topics) topics.set(t, (topics.get(t) || 0) + 1);
    const chip = (f, label, n) => `<button data-act="filter" data-f="${esc(f)}" aria-pressed="${f === view}">${esc(label)}${n != null ? `<span class="count">${n}</span>` : ''}</button>`;
    const seg = hasSel || topics.size
      ? `<div class="filters" role="group" aria-label="${esc(L.publications)}">
          ${hasSel ? chip('selected', L.selected, selected.length) : ''}${chip('all', L.all, pubs.length)}
          ${[...topics].map(([t, n]) => chip(`t:${t}`, t, n)).join('')}
        </div>` : '';
    const anyEqual = pubs.some((p) => p.authors.some((a) => a.marks.includes('*')));
    const anyCorr = pubs.some((p) => p.authors.some((a) => a.marks.includes('†')));
    const legend = anyEqual || anyCorr
      ? `<p class="legend">${[anyEqual && `<sup>*</sup>${esc(L.equal)}`, anyCorr && `<sup>†</sup>${esc(L.corresponding)}`].filter(Boolean).join('<span class="dot"></span>')}</p>` : '';
    const body = `${hasSel ? `<ol class="list list--cards pubs" data-view="selected"${view !== 'selected' ? ' hidden' : ''}>${selected.map((p) => pubItem(p, ctx, rich)).join('')}</ol>` : ''}
      <div class="pubs-all"${view !== 'all' ? ' hidden' : ''}>${all}</div>${legend}`;
    const years = [...byYear.keys()];
    const tools = `<div class="pub-tools">
        <label class="pub-search">${svg(ICONS.search)}<input type="search" data-act="q" placeholder="${esc(L.search)}" aria-label="${esc(L.search)}" autocomplete="off" spellcheck="false"><kbd>/</kbd></label>
        ${years.length > 1 ? `<select data-act="year" aria-label="${esc(L.year)}"><option value="">${esc(L.allYears)}</option>${years.map((y) => `<option>${esc(y)}</option>`).join('')}</select>` : ''}
        <span class="pub-count" aria-live="polite"></span>
      </div>`;
    return { title: pc.title || L.publications, count: `${pubs.length}`, body: `${body}<p class="pub-empty" hidden></p>`, extra: `<div class="pub-bar">${tools}${seg}</div>` };
  }

  function custom(s, c) {
    let body = '';
    if (s.items) {
      body += `<ul class="list list--log entries">${arr(s.items).map((it) => {
        if (typeof it === 'string') return `<li class="row item"><div class="r-main"><div class="entry-what">${inline(it)}</div></div><div class="r-note"></div></li>`;
        const what = it.url ? `<a href="${esc(it.url)}">${inline(it.title)}</a>` : inline(it.title);
        return `<li class="row item"><div class="r-main"><div class="entry-what">${what}</div>${it.detail ? `<div class="entry-detail">${inline(it.detail)}</div>` : ''}</div>
          <div class="r-note"><span class="entry-when">${it.date instanceof Date ? fmtDate(it.date, c.lang) : esc(it.date ?? '')}</span></div></li>`;
      }).join('')}</ul>`;
    }
    if (s.markdown || s.text) body += `<div class="prose card-prose">${md(s.markdown || s.text)}</div>`;
    return { title: s.title, body };
  }

  function footer(c, L) {
    const left = c.footer ? inline(c.footer) : `© ${new Date().getFullYear()} ${esc(c.name)}`;
    let updated = '';
    if (c.updated !== false) {
      const d = c.updated && c.updated !== 'auto' ? c.updated : (S.modified ? new Date(S.modified) : null);
      if (d && !(d instanceof Date && isNaN(d))) updated = `<span>${esc(L.updated)} ${fmtDate(d, c.lang)}</span>`;
    }
    const credit = c.credit === false ? '' : `<span>${esc(L.builtWith)} ${COLOPHON_URL ? `<a href="${COLOPHON_URL}">Colophon</a>` : 'Colophon'}</span>`;
    const toggle = document.documentElement.dataset.nav === 'none'
      ? `${langHTML(c, L)}<button class="mode" data-act="mode" aria-label="${esc(L.toggleMode)}" title="${esc(L.toggleMode)}">${svg(ICONS.half)}</button>` : '';
    return `<footer class="foot"><div class="foot-meta"><span>${left}</span>${updated}${credit}</div>${toggle}</footer>`;
  }

  // ── page ───────────────────────────────────────────────────────────────
  function render() {
    const c = S.c;
    const L = { ...(I18N[c.lang] || I18N.en), ...(c.labels || {}) };
    applyTheme(c.theme);
    document.documentElement.lang = c.lang === 'zh' ? 'zh-CN' : c.lang;
    setHead(c);

    const norm = (s) => delatex(s).toLowerCase().replace(/[.\s\-‐]+/g, ' ').trim();
    const mine = new Set(arr(c.me ?? c.name).map(norm));
    const isMe = (n) => mine.has(norm(n));
    const pubs = S.entries.map((e, i) => toPub(e, i, L))
      .sort((a, b) => (b.year - a.year) || (b.month - a.month) || (a.idx - b.idx));

    pubs.forEach((p, i) => { p.no = pubs.length - i; });
    const extra = arr(c.sections).map((s) => ({ ...s, id: s.id || slug(s.title || 'section') }));
    const root = document.documentElement;
    const tabs = root.dataset.tabs === 'on';
    const style = root.dataset.style;
    const builders = {
      news: () => news(c, L),
      publications: () => publications(c, L, pubs, isMe, tabs ? 'all' : null),
    };
    for (const s of extra) builders[s.id] = () => custom(s, c);
    const order = c.order ? arr(c.order).map((o) => slug(o)) : ['news', 'publications', ...extra.map((s) => s.id)];
    const build = (id) => { const r = builders[id] && builders[id](); return r && { id, ...r }; };
    const aboutTitle = c.about_title || L.about;
    const profile = profileHTML(c, L, style);
    const shell = (inner) => `<div class="shell"><main class="main">${inner}</main></div>`;

    if (tabs) {
      // Home = profile and bio + news + selected papers; every other section is its own page.
      const home = profile + [build('news'), selectedPubs(c, L, pubs, isMe)].map((x) => (x ? section(x) : '')).join('');
      const pages = [{ id: 'about', title: aboutTitle, html: home }];
      for (const id of order) {
        if (id === 'about' || id === 'news') continue;
        const r = build(id);
        if (r) pages.push({ id, title: r.title, html: section(r) });
      }
      S.root.innerHTML = navHTML(c, L, pages) + shell(
        pages.map((p) => `<div class="page" data-page="${esc(p.id)}" hidden>${p.html}</div>`).join('') + footer(c, L));
    } else {
      const secs = order.filter((id) => id !== 'about').map(build).filter(Boolean);
      const navSecs = [{ id: 'about', title: aboutTitle }, ...secs];
      S.root.innerHTML = navHTML(c, L, navSecs) + shell(`<div id="about">${profile}</div>` + secs.map(section).join('') + footer(c, L));
    }
    S.root.removeAttribute('aria-busy');
    S.L = L;
    if (tabs) route(); else { delete root.dataset.page; scrollSpy(); pill(); reveal(S.root.querySelector('.main')); }
  }

  // Tabs: the URL hash picks the page (#publications), so links, Back and bookmarks all work.
  function route() {
    if (document.documentElement.dataset.tabs !== 'on') return;
    const pages = [...S.root.querySelectorAll('.page')];
    if (!pages.length) return;
    if (S.spy) { S.spy.disconnect(); S.spy = null; }
    const h = decodeURIComponent(location.hash.slice(1));
    let page = pages.find((p) => p.dataset.page === h);
    let target = null;
    if (!page && h) { target = document.getElementById(h); page = target && target.closest('.page'); }
    page = page || pages[0];
    pages.forEach((p) => { p.hidden = p !== page; });
    document.documentElement.dataset.page = page.dataset.page;
    S.root.querySelectorAll('.nav-links a[data-spy]').forEach((a) => {
      if (a.dataset.spy === page.dataset.page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    pill();
    centerNav();
    if (target) target.scrollIntoView(); else window.scrollTo({ top: 0, behavior: 'instant' });
    reveal(page);
  }

  // ── motion ─────────────────────────────────────────────────────────────
  // Content is never hidden by default: animations start from the visible
  // state's opposite only while they run, and a timer finishes them anyway
  // if the browser stalls (background tabs, slow devices).
  const calm = () => !Element.prototype.animate || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.2,.7,.2,1)';
  // Every animation is forced to its end after a while, so a stalled timeline never leaves content hidden.
  const play = (el, frames, opts) => {
    const a = el.animate(frames, opts);
    setTimeout(() => { try { a.finish(); } catch { /* removed */ } }, (opts.delay || 0) + opts.duration + 500);
    return a;
  };
  function rise(els, offset = 0) {
    if (calm()) return;
    const list = els.filter((el) => el.getClientRects().length).slice(0, 16);
    list.forEach((el, i) => play(el,
      [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
      { duration: 320, delay: (offset + i) * 45, easing: EASE, fill: 'backwards' }));
  }
  function parts(scope) {
    const out = [];
    for (const el of scope.children) {
      if (el.matches('.sec')) {
        for (const ch of el.children) {
          if (ch.matches('.list, .pubs-all')) out.push(...ch.children); else out.push(ch);
        }
      } else out.push(el);
    }
    return out;
  }
  function reveal(scope) {
    const side = null;
    S.revealed = true;
    if (side) rise([...side.children]);
    rise(parts(scope), side ? 3 : 0);
  }
  function slide(el, open, done) {
    if (calm()) { if (done) done(); return; }
    el.style.overflow = 'hidden';
    const a = play(el, [{ height: '0px', opacity: 0 }, { height: `${el.scrollHeight}px`, opacity: 1 }],
      { duration: 240, easing: EASE, direction: open ? 'normal' : 'reverse' });
    let ended = false;
    const end = () => { if (ended) return; ended = true; el.style.overflow = ''; if (done) done(); };
    a.onfinish = end; a.oncancel = end;
  }

  // The top-bar highlight: sits under the current page, follows the pointer.
  function pill(to, hover) {
    const nav = S.root.querySelector('.nav-links');
    const p = nav && nav.querySelector('.nav-pill');
    if (!p) return;
    const cur = to || nav.querySelector('a[aria-current]');
    nav.querySelectorAll('a[data-pill]').forEach((a) => a.removeAttribute('data-pill'));
    S.pillHover = !!(hover && cur);
    if (!cur) { p.removeAttribute('data-on'); return; }
    cur.setAttribute('data-pill', '');
    const first = !p.hasAttribute('data-on');
    if (first) p.classList.add('is-still');
    p.style.cssText = `--x:${cur.offsetLeft}px;--y:${cur.offsetTop}px;--w:${cur.offsetWidth}px;--h:${cur.offsetHeight}px`;
    p.toggleAttribute('data-hover', !!hover && !cur.hasAttribute('aria-current'));
    p.setAttribute('data-on', '');
    if (first) { void p.offsetWidth; p.classList.remove('is-still'); }
  }
  function centerNav() {
    const nav = S.root.querySelector('.nav-links');
    const a = nav && nav.querySelector('a[aria-current]');
    if (!a || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollTo({ left: a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2, behavior: calm() ? 'auto' : 'smooth' });
  }

  // ── publication search ────────────────────────────────────────────────
  const ORIG = new WeakMap();
  const TEXT = new WeakMap();
  const pubText = (li) => {
    if (!TEXT.has(li)) TEXT.set(li, [...li.querySelectorAll('.pub-title, .pub-authors, .pub-award, .pub-short')].map((e) => e.textContent).join(' ').toLowerCase());
    return TEXT.get(li);
  };
  function mark(li, q) {
    for (const el of li.querySelectorAll('.pub-title, .pub-authors, .pub-award, .pub-short')) {
      if (ORIG.has(el)) el.innerHTML = ORIG.get(el);
      else if (q) ORIG.set(el, el.innerHTML);
      if (!q) continue;
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walk.nextNode()) nodes.push(walk.currentNode);
      for (const t of nodes) {
        if (t.parentNode.closest('button')) continue;
        const str = t.nodeValue, low = str.toLowerCase();
        let i = low.indexOf(q);
        if (i < 0) continue;
        const frag = document.createDocumentFragment();
        let last = 0;
        while (i >= 0) {
          frag.append(str.slice(last, i));
          const m = document.createElement('mark');
          m.textContent = str.slice(i, i + q.length);
          frag.append(m);
          last = i + q.length;
          i = low.indexOf(q, last);
        }
        frag.append(str.slice(last));
        t.replaceWith(frag);
      }
    }
  }
  function applyPubs(sec) {
    const L = S.L;
    const pressed = sec.querySelector('.filters [aria-pressed="true"]');
    const f = pressed ? pressed.dataset.f : 'all';
    const qIn = sec.querySelector('[data-act="q"]');
    const raw = qIn ? qIn.value.trim() : '';
    const q = raw.toLowerCase();
    const year = (sec.querySelector('[data-act="year"]') || {}).value || '';
    const sel = sec.querySelector('.pubs[data-view="selected"]');
    const all = sec.querySelector('.pubs-all');
    const useSel = f === 'selected' && !!sel;
    if (sel) sel.hidden = !useSel;
    if (all) all.hidden = useSel;
    const list = useSel ? sel : all;
    const topic = f.startsWith('t:') ? f.slice(2) : null;
    let shown = 0, total = 0;
    list.querySelectorAll('.pub').forEach((li) => {
      total++;
      const ok = (!topic || (li.dataset.topics || '').split('|').includes(topic))
        && (!year || li.dataset.year === year) && (!q || pubText(li).includes(q));
      li.hidden = !ok;
      if (ok) shown++;
      mark(li, ok ? q : '');
    });
    list.querySelectorAll('.year-group').forEach((g) => { g.hidden = !g.querySelector('.pub:not([hidden])'); });
    const count = sec.querySelector('.pub-count');
    if (count) count.textContent = q || year || topic ? `${shown} / ${total}` : '';
    const empty = sec.querySelector('.pub-empty');
    if (empty) { empty.hidden = shown > 0; empty.textContent = `${L.noMatch}${raw ? ` “${raw}”` : ''}.`; }
    const legend = sec.querySelector('.legend');
    if (legend) legend.hidden = shown === 0;
  }

  function scrollSpy() {
    if (S.spy) S.spy.disconnect();
    const links = [...S.root.querySelectorAll('[data-spy]')];
    if (!links.length || !('IntersectionObserver' in window)) return;
    const byId = new Map(links.map((a) => [a.dataset.spy, a]));
    S.spy = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.removeAttribute('aria-current'));
        byId.get(e.target.id)?.setAttribute('aria-current', 'true');
        pill();
      }
    }, { rootMargin: '-25% 0px -65% 0px' });
    byId.forEach((_, id) => { const el = document.getElementById(id); if (el) S.spy.observe(el); });
  }

  function copyText(text, btn, done = 'Copied', idle = btn.textContent) {
    const ok = () => { btn.textContent = done; setTimeout(() => { btn.textContent = idle; }, 1400); };
    const legacy = () => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.append(ta); ta.select();
      try { if (document.execCommand('copy')) ok(); } catch { /* not allowed */ }
      ta.remove();
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(ok, legacy); else legacy();
  }

  // Keep the email card on screen: nudge it sideways when the icon sits near an edge.
  function placePop(li) {
    const pop = li.querySelector('.pop');
    if (!pop) return;
    pop.style.setProperty('--dx', '0px');
    li.classList.remove('pop-below');
    const nav = S.root.querySelector('.nav');
    if (pop.getBoundingClientRect().top < (nav ? nav.getBoundingClientRect().bottom : 0) + 8) li.classList.add('pop-below');
    const r = pop.getBoundingClientRect();
    const dx = Math.max(12 - r.left, 0) - Math.max(r.right - (innerWidth - 12), 0);
    pop.style.setProperty('--dx', `${dx}px`);
  }
  function closePops() {
    S.root.querySelectorAll('.has-pop.is-open').forEach((li) => li.classList.remove('is-open'));
    S.root.querySelectorAll('[data-act="pop"][aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }

  function wire(root) {
    root.addEventListener('input', (ev) => {
      const el = ev.target.closest('[data-act="q"], [data-act="year"]');
      if (el) applyPubs(el.closest('.sec'));
    });
    root.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && ev.target.matches('[data-act="q"]') && ev.target.value) {
        ev.target.value = ''; applyPubs(ev.target.closest('.sec')); ev.stopPropagation();
      }
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') closePops();
      if (ev.key !== '/' || ev.metaKey || ev.ctrlKey || ev.altKey || ev.target.closest('input, textarea, select, [contenteditable]')) return;
      const box = [...root.querySelectorAll('[data-act="q"]')].find((i) => i.getClientRects().length);
      if (box) { ev.preventDefault(); box.focus(); }
    });
    document.addEventListener('click', (ev) => { if (!ev.target.closest('.pop, [data-act="pop"]')) closePops(); });
    root.addEventListener('mouseover', (ev) => {
      const host = ev.target.closest('.has-pop');
      if (host && host !== S.popHost) { S.popHost = host; placePop(host); }
      if (!host) S.popHost = null;
      const a = ev.target.closest('.nav-links a');
      if (a) pill(a, true); else if (S.pillHover) pill();
    });
    root.addEventListener('focusin', (ev) => { const a = ev.target.closest('.nav-links a'); if (a) pill(a, true); });
    root.addEventListener('mouseleave', () => { if (S.pillHover) pill(); });
    let rz;
    addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { const p = root.querySelector('.nav-pill'); if (p) { p.removeAttribute('data-on'); pill(); } }, 80); });
    const onScroll = () => document.documentElement.toggleAttribute('data-scrolled', scrollY > 8);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (document.fonts) document.fonts.ready.then(() => { const p = root.querySelector('.nav-pill'); if (p) { p.removeAttribute('data-on'); pill(); } });
    root.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-act]');
      if (!btn) return;
      const L = S.L;
      const act = btn.dataset.act;
      const sec = btn.closest('.sec');
      if (act === 'filter') {
        sec.querySelectorAll('.filters button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        applyPubs(sec);
      } else if (act === 'bib') {
        const box = btn.closest('.pub-body').querySelector('.pub-bib');
        const open = box.hidden;
        btn.setAttribute('aria-expanded', String(open));
        if (open) { box.hidden = false; slide(box, true); } else slide(box, false, () => { box.hidden = true; });
      } else if (act === 'pop') {
        const li = btn.closest('li');
        const open = !li.classList.contains('is-open');
        closePops();
        if (open) { placePop(li); li.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
      } else if (act === 'pop-copy') {
        copyText(btn.closest('.pop').querySelector('.pop-addr').textContent, btn, `✓ ${L.copied}`, L.copy);
      } else if (act === 'lang') {
        const next = S.c.lang === S.baseLang ? S.altLang : S.baseLang;
        store.set('colophon-lang', next);
        S.params.delete('lang');
        S.c = configFor(next);
        render();
      } else if (act === 'copy') {
        const pre = btn.previousElementSibling;
        copyText(pre.textContent, btn, L.copied, L.copy);
        const r = document.createRange(); r.selectNodeContents(pre);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      } else if (act === 'fold') {
        const list = sec.querySelector('.news');
        const open = btn.getAttribute('aria-expanded') !== 'true';
        list.toggleAttribute('data-folded', !open);
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? btn.dataset.less : btn.dataset.more;
        if (open) rise([...list.querySelectorAll('.is-folded')]);
      } else if (act === 'authors') {
        const p = btn.closest('.pub-authors');
        p.querySelector('.authors-short').hidden = true;
        p.querySelector('.authors-full').hidden = false;
      } else if (act === 'mode') {
        const next = isDark() ? 'light' : 'dark';
        document.documentElement.classList.add('q-anim');
        document.documentElement.dataset.theme = next;
        S.params.delete('mode');
        store.set('colophon-mode', next);
      }
    });
  }

  // ── customizer: open your site with ?customize ─────────────────────────
  function customizer() {
    const t = S.c.theme;
    const panel = document.createElement('aside');
    panel.className = 'qz';
    panel.setAttribute('aria-label', 'Customize');
    const cur = () => ({
      accent: accentOf(t),
      style: styleId(t.style),
      tabs: tabsOn(t) ? 'tabs' : 'scroll',
      nav: navOn(t.nav) ? 'on' : 'off',
      paper: PAPERS.includes(t.paper) ? t.paper : 'auto',
      mode: ['light', 'dark'].includes(t.mode) ? t.mode : 'auto',
    });
    const yaml = () => {
      const k = cur();
      const out = ['theme:'];
      out.push(k.accent ? `  accent: "${k.accent}"` : '  # accent: "#2f5db3"   # optional link colour');
      out.push(`  style: ${k.style}`, `  tabs: ${k.tabs === 'tabs'}`, `  nav: ${k.nav === 'on'}`, `  paper: ${k.paper}`, `  mode: ${k.mode}`);
      if (t.fonts) out.push(`  fonts: ${t.fonts}`);
      if (t.font_cdn) out.push(`  font_cdn: ${t.font_cdn}`);
      return out.join('\n');
    };
    const seg = (key, label, opts, on) => `<div class="qz-row"><span class="qz-label">${label}</span><div class="qz-seg">${opts.map((o) => `<button data-qz="${key}" data-v="${o}" aria-pressed="${o === on}">${o}</button>`).join('')}</div></div>`;
    const draw = () => {
      const k = cur();
      panel.innerHTML = `
        <div class="qz-head"><strong>Customize</strong><span>preview only</span><button data-qz="min" aria-label="Minimize">–</button></div>
        <div class="qz-body">
          <div class="qz-row"><span class="qz-label">Accent</span><div class="qz-accent">
            <input type="color" data-qz="accent" value="${parseHex(k.accent) ? toHex(parseHex(k.accent)) : '#2f5db3'}" aria-label="Accent colour">
            <div class="qz-seg"><button data-qz="accent-none" aria-pressed="${!k.accent}">none</button></div>
          </div></div>
          ${seg('style', 'Look', STYLES, k.style)}
          ${seg('tabs', 'Pages', ['tabs', 'scroll'], k.tabs)}
          ${seg('nav', 'Top bar', ['on', 'off'], k.nav)}
          ${seg('paper', 'Paper', PAPERS, k.paper)}
          ${seg('mode', 'Mode', ['auto', 'light', 'dark'], k.mode)}
          <div class="qz-label">Paste into config.yml</div>
          <pre class="qz-yaml">${esc(yaml())}</pre>
          <button class="qz-copy" data-qz="copy">Copy theme</button>
        </div>`;
    };
    panel.addEventListener('click', (e) => {
      const b = e.target.closest('[data-qz]');
      if (!b || b.tagName === 'INPUT') return;
      const key = b.dataset.qz, v = b.dataset.v;
      if (key === 'min') { panel.classList.toggle('is-min'); return; }
      if (key === 'copy') { copyText(yaml(), b, 'Copied!'); return; }
      if (key === 'accent-none') { delete t.accent; delete t.primary; }
      else if (key === 'nav') t.nav = v === 'on';
      else if (key === 'tabs') t.tabs = v === 'tabs';
      else if (key === 'mode') { t.mode = v; store.del('colophon-mode'); S.params.delete('mode'); }
      else t[key] = v;
      render(); draw();
    });
    panel.addEventListener('input', (e) => {
      const key = e.target.dataset.qz;
      if (key !== 'accent') return;
      t.accent = e.target.value; delete t.primary;
      applyTheme(t);
      panel.querySelector('.qz-yaml').textContent = yaml();
      panel.querySelector('[data-qz="accent-none"]').setAttribute('aria-pressed', 'false');
    });
    draw();
    document.body.append(panel);
  }

  // ── boot ───────────────────────────────────────────────────────────────
  function renderError(root, err) {
    console.error(err);
    root.removeAttribute('aria-busy');
    root.innerHTML = `<div class="shell"><div class="q-error" role="alert">
      <p class="q-error-title">Colophon couldn’t build this page</p>
      <pre>${esc(err.message)}</pre>
      ${err.hint ? `<p>${esc(err.hint)}</p>` : ''}
    </div></div>`;
  }

  async function load(path, optional) {
    let res;
    try { res = await fetch(path, { cache: 'no-cache' }); } catch (e) {
      throw new ColophonError(`Could not load ${path}: ${e.message}`);
    }
    if (!res.ok) {
      if (optional && res.status === 404) return null;
      throw new ColophonError(`Could not load ${path} (HTTP ${res.status}).`, `Make sure ${path} exists next to index.html.`);
    }
    return { text: await res.text(), modified: res.headers.get('last-modified') };
  }

  function parseYaml(text, file) {
    try { return window.jsyaml.load(text) || {}; } catch (e) {
      throw new ColophonError(`${file}: ${e.reason || e.message}${e.mark ? ` (line ${e.mark.line + 1}, column ${e.mark.column + 1})` : ''}`,
        'YAML is indentation-sensitive: use spaces (not tabs), and wrap text containing “: ” or “#” in quotes.');
    }
  }
  const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x) && !(x instanceof Date);
  const merge = (a, b) => {
    const out = { ...a };
    for (const [k, v] of Object.entries(b || {})) out[k] = isObj(v) && isObj(a[k]) ? merge(a[k], v) : v;
    return out;
  };
  // The page in one language: config.yml, overlaid with the translation when there is one.
  function configFor(lang) {
    const { theme, ...alt } = S.alt || {};
    const c = lang === S.altLang ? merge(S.base, alt) : { ...S.base };
    c.lang = lang === S.altLang || lang === S.baseLang || !S.altLang ? lang : S.baseLang;
    c.theme = S.theme;
    return c;
  }

  async function main() {
    const root = S.root = document.getElementById('colophon');
    S.params = new URLSearchParams(location.search);
    try {
      if (location.protocol === 'file:') {
        throw new ColophonError('Colophon needs to be opened through a web server, not as a local file.',
          'In this folder run:  python3 -m http.server 8000   then visit http://localhost:8000');
      }
      if (!window.jsyaml) throw new ColophonError('The YAML parser did not load.', 'Check that colophon/vendor/js-yaml.min.js exists.');
      const cfgFile = await load('config.yml');
      const base = parseYaml(cfgFile.text, 'config.yml');
      if (!base.name) throw new ColophonError('config.yml needs at least a `name:`.');
      base.lang = base.lang || 'en';
      // An optional translated config in the other language (only the fields that differ).
      const altLang = base.lang === 'zh' ? 'en' : 'zh';
      const altFile = await load(`config.${altLang}.yml`, true);
      S.base = base;
      S.alt = altFile ? parseYaml(altFile.text, `config.${altLang}.yml`) : null;
      S.baseLang = base.lang;
      S.altLang = S.alt ? altLang : null;
      S.theme = { ...(base.theme && typeof base.theme === 'object' ? base.theme : {}) };
      // The language of config.yml is the default; visitors switch with the 中 / EN button.
      const c = configFor(S.params.get('lang') || store.get('colophon-lang') || base.lang);
      const t = c.theme;
      for (const k of ['style', 'layout', 'nav', 'paper', 'tabs']) if (S.params.get(k)) t[k] = S.params.get(k);
      const accent = S.params.get('accent') || S.params.get('primary');
      if (accent) { t.accent = /^[0-9a-f]{3,6}$/i.test(accent) ? `#${accent}` : accent; delete t.primary; }
      S.c = c;
      S.modified = cfgFile.modified;
      if (c.publications !== false) {
        const file = (c.publications && c.publications.file) || 'publications.bib';
        const bib = await load(file, !(c.publications && c.publications.file));
        if (bib) S.entries = parseBibtex(bib.text);
      }
      render();
      wire(root);
      addEventListener('hashchange', route);
      if (S.params.has('customize')) customizer();
    } catch (err) {
      renderError(root, err instanceof ColophonError ? err : new ColophonError(err.message || String(err)));
    }
  }

  // Exposed for tests and tinkering.
  window.Colophon = { parseBibtex, delatex, parseAuthors, md, inline, version: '0.14.1' };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();
})();
