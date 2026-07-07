import { Marked, type Renderer, type Tokens } from 'marked';
import { buildStyles, DEFAULT_STYLE_CONFIG, type StyleConfig } from './styles';
import { highlightCode } from './highlighter';

export interface ConvertOptions extends Partial<StyleConfig> {
  /** Strip one level of '>' blockquote marker if EVERY non-empty line starts with one. */
  stripBlockquote?: boolean;
}

const DEFAULT_OPTIONS: Required<ConvertOptions> = {
  ...DEFAULT_STYLE_CONFIG,
  stripBlockquote: true,
};

/** Strip YAML frontmatter (---\n...\n---) so it is not rendered as <hr> */
function stripFrontmatter(md: string): string {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

/**
 * If every non-empty line starts with '>' (optionally followed by a space),
 * strip one level of blockquote marker. Otherwise return the input unchanged.
 *
 * Typical use case: pasting an Outlook reply where each line is prefixed with '> '.
 */
export function stripLeadingBlockquote(md: string): string {
  const lines = md.split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim() !== '');
  if (nonEmpty.length === 0) return md;
  if (!nonEmpty.every((l) => /^\s*>/.test(l))) return md;
  return lines.map((l) => l.replace(/^(\s*)> ?/, '$1')).join('\n');
}

/**
 * Preserve leading indentation of a code line. HTML (and Outlook's Word
 * renderer) collapse leading whitespace, so the indentation of fenced code
 * blocks (JSON/YAML/XML, …) is lost on paste. Convert the leading run of
 * spaces/tabs to `&nbsp;` so it survives. A tab expands to four spaces.
 *
 * Works for both the plain branch (line is escaped text, no tags) and the
 * highlighted branch (line may start with reopened `<span…>` tags, which
 * carry no spaces of their own) — the leading whitespace is matched after
 * any such opening tags.
 */
function preserveIndent(lineHtml: string): string {
  return lineHtml.replace(
    /^((?:<[^>]*>)*)([ \t]+)/,
    (_m, tags: string, ws: string) => tags + ws.replace(/\t/g, '    ').replace(/ /g, '&nbsp;')
  );
}

function buildMarked(options: Required<ConvertOptions>): Marked {
  const bundle = buildStyles(options);
  const { styles, fontCode, fontCodeSize } = bundle;
  const s = (tag: string): string => styles[tag] ?? '';

  const renderer: Partial<Renderer> = {
    heading({ tokens, depth }: Tokens.Heading): string {
      const tag = `h${depth}`;
      const text = this.parser.parseInline(tokens);
      return `<${tag} style="${s(tag)}">${text}</${tag}>\n`;
    },

    paragraph({ tokens }: Tokens.Paragraph): string {
      const text = this.parser.parseInline(tokens);
      return `<p style="${s('p')}">${text}</p>\n`;
    },

    strong({ tokens }: Tokens.Strong): string {
      const text = this.parser.parseInline(tokens);
      return `<strong style="${s('strong')}">${text}</strong>`;
    },

    em({ tokens }: Tokens.Em): string {
      const text = this.parser.parseInline(tokens);
      return `<em style="${s('em')}">${text}</em>`;
    },

    link({ href, title, tokens }: Tokens.Link): string {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}" style="${s('a')}"${titleAttr}>${text}</a>`;
    },

    image({ href, title, text }: Tokens.Image): string {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<img src="${href}" alt="${text}" style="${s('img')}"${titleAttr} />`;
    },

    code({ text, lang }: Tokens.Code): string {
      const highlightedLines = highlightCode(text, lang);

      let lines: string;
      if (highlightedLines) {
        // Highlighted: hljs already HTML-escapes the source text.
        lines = highlightedLines.map(
          (line) => `<p style="margin:0;font-family:${fontCode};font-size:${fontCodeSize}">${preserveIndent(line) || '&nbsp;'}</p>`
        ).join('');
      } else {
        // No class=MsoNormal — New Outlook resets MsoNormal font-family to Calibri.
        // Pure inline styles work for both Classic and New Outlook.
        const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        lines = escaped.split('\n').map(
          (line) => `<p style="margin:0;font-family:${fontCode};font-size:${fontCodeSize}"><span style="font-family:${fontCode};font-size:${fontCodeSize}">${preserveIndent(line) || '&nbsp;'}</span></p>`
        ).join('');
      }

      return `<div style="${s('code-block')}">${lines}</div>\n`;
    },

    codespan({ text }: Tokens.Codespan): string {
      const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<span style="${s('code')}">${escaped}</span>`;
    },

    blockquote({ tokens }: Tokens.Blockquote): string {
      const innerHtml = this.parser.parse(tokens);
      return `<blockquote style="${s('blockquote')}">${innerHtml}</blockquote>\n`;
    },

    list({ ordered, start, items }: Tokens.List): string {
      const tag = ordered ? 'ol' : 'ul';
      const isTaskList = items.length > 0 && items.every((it) => it.task);
      const listStyle = isTaskList ? `${s('list')} list-style: none;` : s('list');
      const startAttr = ordered && start !== 1 && start !== undefined ? ` start="${start}"` : '';

      const itemsHtml = items.map((item) => {
        // Get inline content from the first paragraph (or text) token
        const firstToken = item.tokens[0];
        const inlineTokens = firstToken?.type === 'paragraph'
          ? (firstToken as Tokens.Paragraph).tokens
          : firstToken?.type === 'text' ? [firstToken] : [];
        const body = this.parser.parseInline(inlineTokens);

        // Render any block-level tokens after the first paragraph
        // (nested lists, code blocks, blockquotes, etc.)
        const blockTokens = item.tokens.slice(
          firstToken?.type === 'paragraph' || firstToken?.type === 'text' ? 1 : 0
        );
        const nestedContent = blockTokens.length > 0
          ? this.parser.parse(blockTokens)
          : '';

        const checkbox = item.task ? (item.checked ? '&#9745; ' : '&#9744; ') : '';

        return `<li style="${s('li')}">${checkbox}${body}${nestedContent}</li>`;
      }).join('\n');

      return `<${tag} style="${listStyle}"${startAttr}>\n${itemsHtml}\n</${tag}>\n`;
    },

    table({ header, rows: tableRows }: Tokens.Table): string {
      const headerCells = header
        .map((cell) => {
          const text = this.parser.parseInline(cell.tokens);
          const align = cell.align ? ` text-align: ${cell.align};` : '';
          return `<th style="${s('th')}${align}">${text}</th>`;
        })
        .join('');

      const bodyRows = tableRows
        .map((tableRow) => {
          const cells = tableRow
            .map((cell) => {
              const text = this.parser.parseInline(cell.tokens);
              const align = cell.align ? ` text-align: ${cell.align};` : '';
              return `<td style="${s('td')}${align}">${text}</td>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('\n');

      return `<table cellpadding="0" cellspacing="0" border="0" style="${s('table')}"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>\n`;
    },

    hr(_token: Tokens.Hr): string {
      return `<hr style="${s('hr')}" />\n`;
    },
  };

  return new Marked({ renderer });
}

export function convertMarkdownToStyledHtml(markdown: string, options?: ConvertOptions): string {
  const opts: Required<ConvertOptions> = { ...DEFAULT_OPTIONS, ...(options ?? {}) };
  const marked = buildMarked(opts);
  let md = stripFrontmatter(markdown);
  if (opts.stripBlockquote) {
    md = stripLeadingBlockquote(md);
  }
  return marked.parse(md) as string;
}
