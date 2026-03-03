import { Marked, type Renderer, type Tokens } from 'marked';
import { STYLES, SPACER_AFTER_HEADING, SPACER_BEFORE_HEADING, SPACER_BLOCK } from './styles';
import { highlightCode } from './highlighter';

function s(tag: string): string {
  return STYLES[tag] ?? '';
}

/** Wrap content in a table row. This is the core pattern for Outlook spacing. */
function row(style: string, content: string): string {
  return `<tr><td style="${style}">${content}</td></tr>\n`;
}

/** Insert an empty spacer row with a given height. */
function spacer(px: number): string {
  return `<tr><td style="padding: ${px}px 0 0 0; font-size: 1px; line-height: 1px;">&nbsp;</td></tr>\n`;
}

const renderer: Partial<Renderer> = {
  heading({ tokens, depth }: Tokens.Heading): string {
    const tag = `h${depth}`;
    const text = this.parser.parseInline(tokens);
    return spacer(SPACER_BEFORE_HEADING) + row(s(tag), text) + spacer(SPACER_AFTER_HEADING);
  },

  paragraph({ tokens }: Tokens.Paragraph): string {
    const text = this.parser.parseInline(tokens);
    return row(s('p'), text);
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
      // Each entry contains inline-styled <span> tags for syntax tokens.
      lines = highlightedLines.map(
        (line) => `<p style="margin:0;font-family:Consolas;font-size:10.0pt">${line || '&nbsp;'}</p>`
      ).join('');
    } else {
      // Fallback: no highlighting, escape manually.
      // No class=MsoNormal — New Outlook has built-in CSS for MsoNormal that overrides
      // inline font-family with Calibri. Pure inline styles work for both Classic and New.
      const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      lines = escaped.split('\n').map(
        (line) => `<p style="margin:0;font-family:Consolas;font-size:10.0pt"><span style="font-family:Consolas;font-size:10.0pt">${line || '&nbsp;'}</span></p>`
      ).join('');
    }

    return `<tr><td style="${s('code-block-td')}">${lines}</td></tr>\n` + spacer(SPACER_BLOCK);
  },

  codespan({ text }: Tokens.Codespan): string {
    return `<span style="${s('code')}">${text}</span>`;
  },

  blockquote({ tokens }: Tokens.Blockquote): string {
    // Parse inner tokens but strip table wrappers — blockquote content is inline
    const innerHtml = this.parser.parse(tokens);
    // Replace inner paragraph styles with blockquote-p style
    const body = innerHtml.replace(
      /<tr><td style="[^"]*">(.*?)<\/td><\/tr>/gs,
      '$1'
    );
    return row(s('blockquote'), body) + spacer(SPACER_BLOCK);
  },

  list({ ordered, start, items }: Tokens.List): string {
    let rows = '';
    items.forEach((item, i) => {
      const body = this.parser.parseInline(item.tokens[0]?.type === 'paragraph'
        ? (item.tokens[0] as Tokens.Paragraph).tokens
        : item.tokens);

      let bullet: string;
      if (item.task) {
        bullet = item.checked ? '&#9745; ' : '&#9744; ';
      } else if (ordered) {
        bullet = `${(start ?? 1) + i}. `;
      } else {
        bullet = '&#8226; ';
      }
      rows += row(s('li'), bullet + body);
    });
    return rows + spacer(SPACER_BLOCK);
  },

  listitem({ tokens, task, checked }: Tokens.ListItem): string {
    // Handled in list() above — this is a fallback
    const body = this.parser.parse(tokens);
    return row(s('li'), body);
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
        return `<tr>${cells}</tr>\n`;
      })
      .join('');

    const innerTable = `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="${s('table')}"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    return `<tr><td style="padding: 0;">${innerTable}</td></tr>\n` + spacer(SPACER_BLOCK);
  },

  hr(_token: Tokens.Hr): string {
    return `<tr><td style="padding: 0;"><hr style="${s('hr')}" /></td></tr>\n` + spacer(SPACER_BLOCK);
  },
};

const marked = new Marked({ renderer });

/** Strip YAML frontmatter (---\n...\n---) so it is not rendered as <hr> */
function stripFrontmatter(md: string): string {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

export function convertMarkdownToStyledHtml(markdown: string): string {
  const innerRows = marked.parse(stripFrontmatter(markdown)) as string;
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:none;mso-table-lspace:0;mso-table-rspace:0;">${innerRows}</table>`;
}
