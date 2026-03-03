import hljs from 'highlight.js/lib/common';

/**
 * GitHub Light theme — maps hljs CSS class names to inline style values.
 * Only color (and occasionally font-weight/font-style) are needed.
 * Background is already set on the <td> wrapper.
 */
const THEME: Record<string, string> = {
  // Keywords, doctags, template tags/variables, types
  'hljs-keyword':           'color:#d73a49',
  'hljs-doctag':            'color:#d73a49',
  'hljs-template-tag':      'color:#d73a49',
  'hljs-template-variable': 'color:#d73a49',
  'hljs-type':              'color:#d73a49',

  // Titles (functions, classes)
  'hljs-title':             'color:#6f42c1',
  'hljs-title.class_':      'color:#6f42c1',
  'hljs-title.function_':   'color:#6f42c1',

  // Attributes, literals, numbers, operators, variables, selectors
  'hljs-attr':              'color:#005cc5',
  'hljs-attribute':         'color:#005cc5',
  'hljs-literal':           'color:#005cc5',
  'hljs-meta':              'color:#005cc5',
  'hljs-number':            'color:#005cc5',
  'hljs-operator':          'color:#005cc5',
  'hljs-variable':          'color:#005cc5',
  'hljs-selector-attr':     'color:#005cc5',
  'hljs-selector-class':    'color:#005cc5',
  'hljs-selector-id':       'color:#005cc5',

  // Strings, regexps
  'hljs-regexp':            'color:#032f62',
  'hljs-string':            'color:#032f62',

  // Built-ins, symbols
  'hljs-built_in':          'color:#e36209',
  'hljs-symbol':            'color:#e36209',

  // Comments
  'hljs-comment':           'color:#6a737d',
  'hljs-code':              'color:#6a737d',
  'hljs-formula':           'color:#6a737d',

  // Names (HTML tags, selector tags)
  'hljs-name':              'color:#22863a',
  'hljs-quote':             'color:#22863a',
  'hljs-selector-tag':      'color:#22863a',
  'hljs-selector-pseudo':   'color:#22863a',

  // Subst inherits base color
  'hljs-subst':             'color:#24292e',

  // Sections (bold)
  'hljs-section':           'color:#005cc5;font-weight:bold',

  // Bullets
  'hljs-bullet':            'color:#735c0f',

  // Emphasis
  'hljs-emphasis':          'color:#24292e;font-style:italic',
  'hljs-strong':            'color:#24292e;font-weight:bold',

  // Diff additions/deletions
  'hljs-addition':          'color:#22863a;background-color:#f0fff4',
  'hljs-deletion':          'color:#b31d28;background-color:#ffeef0',
};

/** Resolve hljs class name(s) to an inline style string. */
function resolveStyle(classNames: string): string {
  const trimmed = classNames.trim();

  // Exact match (single class like "hljs-keyword")
  if (THEME[trimmed]) {
    return THEME[trimmed];
  }

  // Compound classes like "hljs-title function_" → try "hljs-title.function_"
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) {
    const dotKey = parts.join('.');
    if (THEME[dotKey]) {
      return THEME[dotKey];
    }
  }

  // Fall back to first class
  if (parts.length > 0 && THEME[parts[0]]) {
    return THEME[parts[0]];
  }

  return '';
}

/** Replace class="hljs-*" attributes with inline style="" attributes. */
function classesToInlineStyles(html: string): string {
  return html.replace(
    /<span class="([^"]+)">/g,
    (_match, classNames: string) => {
      const style = resolveStyle(classNames);
      return style ? `<span style="${style}">` : '<span>';
    }
  );
}

/**
 * Split highlighted HTML into per-line fragments, handling spans that
 * cross newline boundaries. Each returned line has balanced <span>
 * open/close tags.
 */
export function splitIntoLines(html: string): string[] {
  const lines: string[] = [];
  let currentLine = '';
  const spanStack: string[] = []; // stack of full opening tags
  let i = 0;

  while (i < html.length) {
    if (html[i] === '\n') {
      // Close all open spans for this line
      for (let j = spanStack.length - 1; j >= 0; j--) {
        currentLine += '</span>';
      }
      lines.push(currentLine);
      // Start new line, reopen all spans
      currentLine = spanStack.join('');
      i++;
    } else if (html[i] === '<') {
      const rest = html.substring(i);
      const closeMatch = rest.match(/^<\/span>/);
      if (closeMatch) {
        currentLine += '</span>';
        spanStack.pop();
        i += closeMatch[0].length;
      } else {
        const openMatch = rest.match(/^(<span[^>]*>)/);
        if (openMatch) {
          currentLine += openMatch[1];
          spanStack.push(openMatch[1]);
          i += openMatch[1].length;
        } else {
          // Other tag — pass through
          currentLine += html[i];
          i++;
        }
      }
    } else {
      currentLine += html[i];
      i++;
    }
  }

  // Push the last line (close remaining open spans)
  for (let j = spanStack.length - 1; j >= 0; j--) {
    currentLine += '</span>';
  }
  lines.push(currentLine);

  return lines;
}

/**
 * Highlight code with syntax coloring using highlight.js.
 * Returns per-line HTML fragments with inline styles, or null if
 * the language is missing/unsupported (caller should use plain fallback).
 */
export function highlightCode(text: string, lang?: string): string[] | null {
  if (!lang) {
    return null;
  }

  if (!hljs.getLanguage(lang)) {
    return null;
  }

  const result = hljs.highlight(text, { language: lang, ignoreIllegals: true });
  const styledHtml = classesToInlineStyles(result.value);
  return splitIntoLines(styledHtml);
}
