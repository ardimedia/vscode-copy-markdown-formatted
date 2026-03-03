import { describe, it, expect } from 'vitest';
import { convertMarkdownToStyledHtml } from '../converter';

/** Helper: extract the inner content of the first <td> in the output */
function firstTdContent(html: string): string {
  const m = html.match(/<td style="[^"]*">([\s\S]*?)<\/td>/);
  return m?.[1] ?? '';
}

/** Helper: check that output is wrapped in the outer table */
function expectOuterTable(html: string): void {
  expect(html).toMatch(/^<table cellpadding="0" cellspacing="0" border="0" width="100%"/);
  expect(html).toMatch(/<\/table>$/);
}

describe('convertMarkdownToStyledHtml', () => {
  describe('outer structure', () => {
    it('wraps output in a table with Outlook-compatible attributes', () => {
      const html = convertMarkdownToStyledHtml('Hello');
      expectOuterTable(html);
      expect(html).toContain('border-collapse:collapse');
      expect(html).toContain('mso-table-lspace:0');
    });
  });

  describe('headings', () => {
    it('renders h1 with correct font-size', () => {
      const html = convertMarkdownToStyledHtml('# Title');
      expect(html).toContain('font-size: 28px');
      expect(html).toContain('Title');
    });

    it('renders h2 with correct font-size', () => {
      const html = convertMarkdownToStyledHtml('## Subtitle');
      expect(html).toContain('font-size: 22px');
      expect(html).toContain('Subtitle');
    });

    it('renders h3-h6', () => {
      expect(convertMarkdownToStyledHtml('### H3')).toContain('font-size: 18px');
      expect(convertMarkdownToStyledHtml('#### H4')).toContain('font-size: 16px');
      expect(convertMarkdownToStyledHtml('##### H5')).toContain('font-size: 14px');
      expect(convertMarkdownToStyledHtml('###### H6')).toContain('font-size: 13px');
    });

    it('adds spacer rows around headings', () => {
      const html = convertMarkdownToStyledHtml('# Title');
      // Should have spacer rows (4px before, 8px after heading)
      expect(html).toContain('padding: 4px 0 0 0');
      expect(html).toContain('padding: 8px 0 0 0');
    });
  });

  describe('paragraphs', () => {
    it('renders paragraph in a table row', () => {
      const html = convertMarkdownToStyledHtml('Hello world');
      expect(html).toContain('<tr><td');
      expect(html).toContain('Hello world');
      expect(html).toContain('font-size: 14px');
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
    it('renders fenced code block with Consolas font', () => {
      const html = convertMarkdownToStyledHtml('```\nconst x = 1;\n```');
      expect(html).toContain('font-family:Consolas');
      expect(html).toContain('const x = 1;');
    });

    it('wraps each line in a <p> with inline font-family', () => {
      const html = convertMarkdownToStyledHtml('```\nline1\nline2\n```');
      const pTags = html.match(/<p style="margin:0;font-family:Consolas;font-size:10\.0pt">/g);
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

    it('has code-block-td with background color and border', () => {
      const html = convertMarkdownToStyledHtml('```\ncode\n```');
      expect(html).toContain('background-color: #f6f8fa');
      expect(html).toContain('border: 1px solid #d1d5db');
    });

    it('does not use class=MsoNormal (breaks New Outlook fonts)', () => {
      const html = convertMarkdownToStyledHtml('```\ncode\n```');
      expect(html).not.toContain('class=MsoNormal');
    });
  });

  describe('inline code', () => {
    it('renders inline code with Consolas and background', () => {
      const html = convertMarkdownToStyledHtml('Use `npm install`');
      expect(html).toContain('<span style="');
      expect(html).toContain('font-family:Consolas');
      expect(html).toContain('background-color: #f3f4f6');
      expect(html).toContain('npm install');
    });
  });

  describe('lists', () => {
    it('renders unordered list with bullet character', () => {
      const html = convertMarkdownToStyledHtml('- Item A\n- Item B');
      expect(html).toContain('&#8226; Item A');
      expect(html).toContain('&#8226; Item B');
    });

    it('renders ordered list with numbers', () => {
      const html = convertMarkdownToStyledHtml('1. First\n2. Second');
      expect(html).toContain('1. First');
      expect(html).toContain('2. Second');
    });

    it('renders task list with checkboxes', () => {
      const html = convertMarkdownToStyledHtml('- [x] Done\n- [ ] Todo');
      expect(html).toContain('&#9745; Done');
      expect(html).toContain('&#9744; Todo');
    });

    it('starts ordered list at custom number', () => {
      const html = convertMarkdownToStyledHtml('5. Fifth\n6. Sixth');
      expect(html).toContain('5. Fifth');
      expect(html).toContain('6. Sixth');
    });
  });

  describe('blockquotes', () => {
    it('renders blockquote with left border', () => {
      const html = convertMarkdownToStyledHtml('> Quote text');
      expect(html).toContain('border-left: 4px solid');
      expect(html).toContain('Quote text');
    });
  });

  describe('tables', () => {
    it('renders table with header and body rows', () => {
      const html = convertMarkdownToStyledHtml('| A | B |\n|---|---|\n| 1 | 2 |');
      expect(html).toContain('<thead>');
      expect(html).toContain('<tbody>');
      expect(html).toContain('<th style="');
      expect(html).toContain('<td style="');
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
      // "const" keyword → red
      expect(html).toContain('color:#d73a49');
    });

    it('highlights number literals', () => {
      const html = convertMarkdownToStyledHtml('```javascript\nconst x = 42;\n```');
      // 42 → blue
      expect(html).toContain('color:#005cc5');
    });

    it('highlights string literals', () => {
      const html = convertMarkdownToStyledHtml('```javascript\nconst s = "hello";\n```');
      // string → dark blue
      expect(html).toContain('color:#032f62');
    });

    it('highlights function names', () => {
      const html = convertMarkdownToStyledHtml('```javascript\nfunction hello() {}\n```');
      // function name → purple
      expect(html).toContain('color:#6f42c1');
    });

    it('falls back to plain rendering for unknown language', () => {
      const html = convertMarkdownToStyledHtml('```unknownlang\nconst x = 1;\n```');
      expect(html).not.toContain('color:#d73a49');
      expect(html).toContain('font-family:Consolas');
      expect(html).toContain('const x = 1;');
    });

    it('falls back to plain rendering when no language is specified', () => {
      const html = convertMarkdownToStyledHtml('```\nconst x = 1;\n```');
      expect(html).not.toContain('color:#d73a49');
      expect(html).toContain('const x = 1;');
    });

    it('wraps each highlighted line in <p> with Consolas font', () => {
      const html = convertMarkdownToStyledHtml('```typescript\nconst a = 1;\nconst b = 2;\n```');
      const pTags = html.match(/<p style="margin:0;font-family:Consolas;font-size:10\.0pt">/g);
      expect(pTags).toHaveLength(2);
    });

    it('uses code-block-td style for highlighted blocks', () => {
      const html = convertMarkdownToStyledHtml('```typescript\nconst x = 1;\n```');
      expect(html).toContain('background-color: #f6f8fa');
      expect(html).toContain('border: 1px solid #d1d5db');
    });

    it('handles multi-line comments', () => {
      const html = convertMarkdownToStyledHtml('```javascript\n/* comment\nline 2 */\n```');
      // Comment color should appear
      expect(html).toContain('color:#6a737d');
      // Each line should be in its own <p> tag
      const pTags = html.match(/<p style="margin:0;font-family:Consolas;font-size:10\.0pt">/g);
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
      expectOuterTable(html);
    });

    it('handles whitespace-only input', () => {
      const html = convertMarkdownToStyledHtml('   \n\n   ');
      expectOuterTable(html);
    });
  });
});
