import { describe, it, expect } from 'vitest';
import { convertMarkdownToStyledHtml } from '../converter';

describe('convertMarkdownToStyledHtml', () => {
  describe('output structure', () => {
    it('produces semantic HTML without an outer table wrapper', () => {
      const html = convertMarkdownToStyledHtml('Hello');
      expect(html).not.toMatch(/^<table/);
      expect(html).toMatch(/^<p style="/);
    });
  });

  describe('headings', () => {
    it('renders h1 as <h1> with correct font-size', () => {
      const html = convertMarkdownToStyledHtml('# Title');
      expect(html).toContain('<h1 style="');
      expect(html).toContain('font-size: 24pt');
      expect(html).toContain('>Title</h1>');
    });

    it('renders h2 as <h2> with correct font-size', () => {
      const html = convertMarkdownToStyledHtml('## Subtitle');
      expect(html).toContain('<h2 style="');
      expect(html).toContain('font-size: 18pt');
      expect(html).toContain('>Subtitle</h2>');
    });

    it('renders h3-h6 as semantic heading tags', () => {
      expect(convertMarkdownToStyledHtml('### H3')).toMatch(/<h3 style="[^"]*font-size: 16pt/);
      expect(convertMarkdownToStyledHtml('#### H4')).toMatch(/<h4 style="[^"]*font-size: 14pt/);
      expect(convertMarkdownToStyledHtml('##### H5')).toMatch(/<h5 style="[^"]*font-size: 13pt/);
      expect(convertMarkdownToStyledHtml('###### H6')).toMatch(/<h6 style="[^"]*font-size: 12pt/);
    });

    it('uses margin (not spacer rows) for heading spacing', () => {
      const html = convertMarkdownToStyledHtml('# Title');
      expect(html).toContain('margin: 16px 0 8px 0');
      // No more spacer rows
      expect(html).not.toContain('<tr><td');
    });
  });

  describe('paragraphs', () => {
    it('renders paragraph as <p> with margin-based spacing', () => {
      const html = convertMarkdownToStyledHtml('Hello world');
      expect(html).toContain('<p style="');
      expect(html).toContain('Hello world</p>');
      expect(html).toContain('font-size: 11pt');
      expect(html).toContain('margin: 0 0 8px 0');
    });

    it('renders multiple paragraphs as separate <p> elements', () => {
      const html = convertMarkdownToStyledHtml('First para.\n\nSecond para.');
      const pMatches = html.match(/<p style="[^"]*">/g);
      expect(pMatches).toHaveLength(2);
    });

    it('uses Aptos as primary font in paragraph style', () => {
      const html = convertMarkdownToStyledHtml('Hello');
      expect(html).toContain('Aptos');
    });
  });

  describe('inline formatting', () => {
    it('renders bold with font-weight', () => {
      const html = convertMarkdownToStyledHtml('**bold text**');
      expect(html).toContain('<strong style="font-weight: 600;">bold text</strong>');
    });

    it('renders italic with font-style', () => {
      const html = convertMarkdownToStyledHtml('*italic text*');
      expect(html).toContain('<em style="font-style: italic;">italic text</em>');
    });

    it('renders links with href and color', () => {
      const html = convertMarkdownToStyledHtml('[click](https://example.com)');
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('#0066cc');
      expect(html).toContain('click');
    });

    it('renders link with title attribute', () => {
      const html = convertMarkdownToStyledHtml('[click](https://example.com "my title")');
      expect(html).toContain('title="my title"');
    });
  });

  describe('code blocks', () => {
    it('renders fenced code block wrapped in <div> (not <table>)', () => {
      const html = convertMarkdownToStyledHtml('```\nconst x = 1;\n```');
      expect(html).toMatch(/<div style="[^"]*background-color: #f6f8fa/);
      expect(html).toContain('font-family:Cascadia Mono, Consolas, Courier New, monospace');
      expect(html).toContain('const x = 1;');
    });

    it('wraps each line in a <p> with inline font-family', () => {
      const html = convertMarkdownToStyledHtml('```\nline1\nline2\n```');
      const pTags = html.match(/<p style="margin:0;font-family:Cascadia Mono, Consolas, Courier New, monospace;font-size:10pt">/g);
      expect(pTags).toHaveLength(2);
    });

    it('escapes HTML entities in code blocks', () => {
      const html = convertMarkdownToStyledHtml('```\n<div>&test</div>\n```');
      expect(html).toContain('&lt;div&gt;');
      expect(html).toContain('&amp;test');
    });

    it('replaces empty lines with &nbsp;', () => {
      const html = convertMarkdownToStyledHtml('```\nline1\n\nline3\n```');
      expect(html).toContain('&nbsp;</span>');
    });

    it('has code-block container with background color and border', () => {
      const html = convertMarkdownToStyledHtml('```\ncode\n```');
      expect(html).toContain('background-color: #f6f8fa');
      expect(html).toContain('border: 1px solid #d1d5db');
    });

    it('does not use class=MsoNormal (breaks New Outlook fonts)', () => {
      const html = convertMarkdownToStyledHtml('```\ncode\n```');
      expect(html).not.toContain('class=MsoNormal');
    });

    it('preserves leading indentation as &nbsp; (plain fallback)', () => {
      const html = convertMarkdownToStyledHtml('```\n{\n  "a": 1\n}\n```');
      // Two-space indent survives as non-breaking spaces
      expect(html).toContain('&nbsp;&nbsp;"a": 1');
    });

    it('expands leading tabs to &nbsp; (plain fallback)', () => {
      const html = convertMarkdownToStyledHtml('```\n\tindented\n```');
      expect(html).toContain('&nbsp;&nbsp;&nbsp;&nbsp;indented');
    });

    it('preserves leading indentation as &nbsp; (highlighted)', () => {
      const html = convertMarkdownToStyledHtml('```json\n{\n  "a": 1\n}\n```');
      expect(html).toContain('&nbsp;&nbsp;');
    });
  });

  describe('inline code', () => {
    it('renders inline code with monospace font stack and background', () => {
      const html = convertMarkdownToStyledHtml('Use `npm install`');
      expect(html).toContain('<span style="');
      expect(html).toContain('font-family: Cascadia Mono, Consolas, Courier New, monospace');
      expect(html).toContain('background-color: #f3f4f6');
      expect(html).toContain('npm install');
    });

    it('escapes HTML entities in inline code', () => {
      const html = convertMarkdownToStyledHtml('Use `<h1>` and `<div>` tags');
      expect(html).toContain('&lt;h1&gt;');
      expect(html).toContain('&lt;div&gt;');
      expect(html).not.toContain('>h1<');
    });
  });

  describe('lists', () => {
    it('renders unordered list as <ul> with <li> items (native bullets)', () => {
      const html = convertMarkdownToStyledHtml('- Item A\n- Item B');
      expect(html).toMatch(/<ul style="[^"]*font-size: 11pt[^"]*"/);
      expect(html).toContain('<li style="');
      expect(html).toContain('Item A');
      expect(html).toContain('Item B');
      // No manual bullet characters for non-task lists
      expect(html).not.toContain('&#8226;');
    });

    it('renders ordered list as <ol> with <li> items', () => {
      const html = convertMarkdownToStyledHtml('1. First\n2. Second');
      expect(html).toMatch(/<ol style="[^"]*"/);
      expect(html).toContain('First');
      expect(html).toContain('Second');
    });

    it('renders task list with list-style:none and checkboxes', () => {
      const html = convertMarkdownToStyledHtml('- [x] Done\n- [ ] Todo');
      expect(html).toContain('list-style: none');
      expect(html).toContain('&#9745; Done');
      expect(html).toContain('&#9744; Todo');
    });

    it('emits start attribute on ordered list with custom start number', () => {
      const html = convertMarkdownToStyledHtml('5. Fifth\n6. Sixth');
      expect(html).toContain('start="5"');
      expect(html).toContain('Fifth');
      expect(html).toContain('Sixth');
    });

    it('handles nested unordered list', () => {
      const html = convertMarkdownToStyledHtml('- Parent\n  - Child 1\n  - Child 2');
      expect(html).toContain('Parent');
      expect(html).toContain('Child 1');
      expect(html).toContain('Child 2');
      // Nested <ul> inside <li>
      expect(html.match(/<ul style="/g)?.length).toBeGreaterThanOrEqual(2);
    });

    it('handles nested list with inline formatting', () => {
      const html = convertMarkdownToStyledHtml('- **Bold parent**\n  - *Italic child*');
      expect(html).toContain('font-weight: 600');
      expect(html).toContain('font-style: italic');
    });

    it('handles three levels of nesting', () => {
      const md = '- Level 1\n  - Level 2\n    - Level 3';
      expect(() => convertMarkdownToStyledHtml(md)).not.toThrow();
      const html = convertMarkdownToStyledHtml(md);
      expect(html).toContain('Level 1');
      expect(html).toContain('Level 2');
      expect(html).toContain('Level 3');
    });

    it('handles code block inside list item', () => {
      const md = '- Option A: run this\n  ```bash\n  npm install\n  ```\n- Option B';
      expect(() => convertMarkdownToStyledHtml(md)).not.toThrow();
      const html = convertMarkdownToStyledHtml(md);
      expect(html).toContain('Option A');
      expect(html).toContain('npm install');
      expect(html).toContain('Option B');
    });
  });

  describe('blockquotes', () => {
    it('renders blockquote as <blockquote> with left border when stripBlockquote is off', () => {
      const html = convertMarkdownToStyledHtml('> Quote text', { stripBlockquote: false });
      expect(html).toContain('<blockquote style="');
      expect(html).toContain('border-left: 4px solid');
      expect(html).toContain('Quote text');
    });
  });

  describe('stripBlockquote', () => {
    it('strips leading "> " from every line when the entire input is a blockquote (default on)', () => {
      const md = '> Line one\n>\n> Line two';
      const html = convertMarkdownToStyledHtml(md);
      expect(html).not.toContain('<blockquote');
      expect(html).toContain('Line one');
      expect(html).toContain('Line two');
    });

    it('renders as blockquote when stripBlockquote is explicitly disabled', () => {
      const md = '> Line one\n>\n> Line two';
      const html = convertMarkdownToStyledHtml(md, { stripBlockquote: false });
      expect(html).toContain('<blockquote');
    });

    it('does not strip when only some lines start with ">"', () => {
      const md = '> quoted line\n\nNormal paragraph.';
      const html = convertMarkdownToStyledHtml(md);
      expect(html).toContain('<blockquote');
      expect(html).toContain('Normal paragraph.');
    });

    it('strips one level so nested quotes remain a blockquote', () => {
      const md = '> > inner';
      const html = convertMarkdownToStyledHtml(md);
      expect(html).toContain('<blockquote');
      expect(html).toContain('inner');
    });

    it('strips real-world Outlook reply pattern', () => {
      const md = '> Guten Tag Herr Spray\n>\n> Besten Dank für die Einladung.\n>\n> Freundliche Grüsse';
      const html = convertMarkdownToStyledHtml(md);
      expect(html).not.toContain('<blockquote');
      const pMatches = html.match(/<p style="[^"]*">/g);
      expect(pMatches?.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('tables', () => {
    it('renders table with header and body rows', () => {
      const html = convertMarkdownToStyledHtml('| A | B |\n|---|---|\n| 1 | 2 |');
      expect(html).toContain('<thead>');
      expect(html).toContain('<tbody>');
      expect(html).toMatch(/<th style="[^"]*font-size: 11pt[^"]*"/);
      expect(html).toMatch(/<td style="[^"]*font-size: 11pt[^"]*"/);
    });

    it('renders header cells with background color', () => {
      const html = convertMarkdownToStyledHtml('| H |\n|---|\n| D |');
      expect(html).toContain('background-color: #f3f4f6');
    });
  });

  describe('horizontal rule', () => {
    it('renders hr with border-top style', () => {
      const html = convertMarkdownToStyledHtml('---');
      expect(html).toContain('<hr style="');
      expect(html).toContain('border-top: 1px solid');
    });
  });

  describe('images', () => {
    it('renders img with src, alt, and style', () => {
      const html = convertMarkdownToStyledHtml('![Alt](https://example.com/img.png)');
      expect(html).toContain('src="https://example.com/img.png"');
      expect(html).toContain('alt="Alt"');
      expect(html).toContain('max-width: 100%');
    });
  });

  describe('frontmatter stripping', () => {
    it('strips YAML frontmatter', () => {
      const html = convertMarkdownToStyledHtml('---\ntitle: Test\nstatus: Draft\n---\n# Hello');
      expect(html).not.toContain('title: Test');
      expect(html).not.toContain('<hr');
      expect(html).toContain('Hello');
    });

    it('strips frontmatter with Windows line endings', () => {
      const html = convertMarkdownToStyledHtml('---\r\ntitle: Test\r\n---\r\n# Hello');
      expect(html).not.toContain('title: Test');
      expect(html).toContain('Hello');
    });

    it('does not strip --- in the middle of content', () => {
      const html = convertMarkdownToStyledHtml('# Title\n\n---\n\nAfter');
      expect(html).toContain('<hr');
      expect(html).toContain('After');
    });

    it('handles content without frontmatter', () => {
      const html = convertMarkdownToStyledHtml('# No frontmatter');
      expect(html).toContain('No frontmatter');
    });
  });

  describe('special characters', () => {
    it('handles umlauts correctly', () => {
      const html = convertMarkdownToStyledHtml('Ärger mit Öl und Übung');
      expect(html).toContain('Ärger mit Öl und Übung');
    });

    it('handles emoji', () => {
      const html = convertMarkdownToStyledHtml('Hello 🎉');
      expect(html).toContain('🎉');
    });
  });

  describe('syntax highlighting', () => {
    it('highlights TypeScript keywords with color', () => {
      const html = convertMarkdownToStyledHtml('```typescript\nconst x = 42;\n```');
      expect(html).toContain('color:#d73a49');
    });

    it('highlights number literals', () => {
      const html = convertMarkdownToStyledHtml('```javascript\nconst x = 42;\n```');
      expect(html).toContain('color:#005cc5');
    });

    it('highlights string literals', () => {
      const html = convertMarkdownToStyledHtml('```javascript\nconst s = "hello";\n```');
      expect(html).toContain('color:#032f62');
    });

    it('highlights function names', () => {
      const html = convertMarkdownToStyledHtml('```javascript\nfunction hello() {}\n```');
      expect(html).toContain('color:#6f42c1');
    });

    it('falls back to plain rendering for unknown language', () => {
      const html = convertMarkdownToStyledHtml('```unknownlang\nconst x = 1;\n```');
      expect(html).not.toContain('color:#d73a49');
      expect(html).toContain('font-family:Cascadia Mono, Consolas, Courier New, monospace');
      expect(html).toContain('const x = 1;');
    });

    it('falls back to plain rendering when no language is specified', () => {
      const html = convertMarkdownToStyledHtml('```\nconst x = 1;\n```');
      expect(html).not.toContain('color:#d73a49');
      expect(html).toContain('const x = 1;');
    });

    it('wraps each highlighted line in <p> with monospace font stack', () => {
      const html = convertMarkdownToStyledHtml('```typescript\nconst a = 1;\nconst b = 2;\n```');
      const pTags = html.match(/<p style="margin:0;font-family:Cascadia Mono, Consolas, Courier New, monospace;font-size:10pt">/g);
      expect(pTags).toHaveLength(2);
    });

    it('uses code-block container for highlighted blocks', () => {
      const html = convertMarkdownToStyledHtml('```typescript\nconst x = 1;\n```');
      expect(html).toContain('background-color: #f6f8fa');
      expect(html).toContain('border: 1px solid #d1d5db');
    });

    it('handles multi-line comments', () => {
      const html = convertMarkdownToStyledHtml('```javascript\n/* comment\nline 2 */\n```');
      expect(html).toContain('color:#6a737d');
      const pTags = html.match(/<p style="margin:0;font-family:Cascadia Mono, Consolas, Courier New, monospace;font-size:10pt">/g);
      expect(pTags).toHaveLength(2);
    });

    it('handles empty lines in highlighted code', () => {
      const html = convertMarkdownToStyledHtml('```javascript\nconst a = 1;\n\nconst b = 2;\n```');
      expect(html).toContain('&nbsp;');
    });

    it('does not contain CSS class attributes', () => {
      const html = convertMarkdownToStyledHtml('```typescript\nconst x = 1;\n```');
      expect(html).not.toContain('class="hljs');
    });
  });

  describe('edge cases', () => {
    it('handles empty input', () => {
      const html = convertMarkdownToStyledHtml('');
      expect(html).toBe('');
    });

    it('handles whitespace-only input', () => {
      const html = convertMarkdownToStyledHtml('   \n\n   ');
      expect(typeof html).toBe('string');
    });
  });
});
