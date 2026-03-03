import { describe, it, expect } from 'vitest';
import { highlightCode, splitIntoLines } from '../highlighter';

describe('highlightCode', () => {
  it('returns null for undefined language', () => {
    expect(highlightCode('const x = 1;')).toBeNull();
  });

  it('returns null for empty string language', () => {
    expect(highlightCode('const x = 1;', '')).toBeNull();
  });

  it('returns null for unsupported language', () => {
    expect(highlightCode('code', 'brainfuck-fantasy')).toBeNull();
  });

  it('returns array of strings for valid language', () => {
    const result = highlightCode('const x = 1;', 'typescript');
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
    expect(result!.length).toBe(1);
  });

  it('splits multi-line code into correct number of lines', () => {
    const result = highlightCode('line1\nline2\nline3', 'typescript');
    expect(result).toHaveLength(3);
  });

  it('contains inline style attributes, not class attributes', () => {
    const result = highlightCode('const x = 1;', 'typescript');
    expect(result!.join('')).not.toContain('class="hljs');
    expect(result!.join('')).toContain('style="');
  });

  it('applies keyword color to keywords', () => {
    const result = highlightCode('const x = 1;', 'typescript');
    // "const" is a keyword -> #d73a49
    expect(result![0]).toContain('color:#d73a49');
  });

  it('applies number color to numeric literals', () => {
    const result = highlightCode('const x = 42;', 'javascript');
    expect(result![0]).toContain('color:#005cc5');
  });

  it('applies string color to string literals', () => {
    const result = highlightCode('const s = "hello";', 'javascript');
    expect(result![0]).toContain('color:#032f62');
  });

  it('applies comment color to comments', () => {
    const result = highlightCode('// this is a comment', 'javascript');
    expect(result![0]).toContain('color:#6a737d');
  });

  it('handles multi-line block comments correctly', () => {
    const code = '/* first\nsecond\nthird */';
    const result = highlightCode(code, 'javascript');
    expect(result).toHaveLength(3);
    // Each line should have the comment color
    for (const line of result!) {
      expect(line).toContain('color:#6a737d');
    }
  });

  it('produces balanced span tags on every line', () => {
    const code = '/* first\nsecond\nthird */';
    const result = highlightCode(code, 'javascript');
    for (const line of result!) {
      const opens = (line.match(/<span/g) || []).length;
      const closes = (line.match(/<\/span>/g) || []).length;
      expect(opens).toBe(closes);
    }
  });

  it('returns empty string for empty lines', () => {
    const code = 'a\n\nb';
    const result = highlightCode(code, 'javascript');
    expect(result).toHaveLength(3);
    // Middle line should be empty (caller adds &nbsp;)
    expect(result![1]).toBe('');
  });

  it('handles language aliases (js → javascript)', () => {
    const result = highlightCode('const x = 1;', 'js');
    expect(result).not.toBeNull();
    expect(result![0]).toContain('color:#d73a49');
  });

  it('highlights Python code', () => {
    const result = highlightCode('def hello():\n    print("world")', 'python');
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    // "def" is a keyword
    expect(result![0]).toContain('color:#d73a49');
  });

  it('highlights C# code', () => {
    const result = highlightCode('public class Foo {}', 'csharp');
    expect(result).not.toBeNull();
    expect(result![0]).toContain('style="');
  });

  it('escapes HTML entities in source code', () => {
    const result = highlightCode('<div>&test</div>', 'html');
    expect(result).not.toBeNull();
    const joined = result!.join('');
    expect(joined).toContain('&lt;');
    expect(joined).toContain('&amp;');
  });
});

describe('splitIntoLines', () => {
  it('splits plain text at newlines', () => {
    const result = splitIntoLines('line1\nline2\nline3');
    expect(result).toEqual(['line1', 'line2', 'line3']);
  });

  it('handles single line without newlines', () => {
    const result = splitIntoLines('hello');
    expect(result).toEqual(['hello']);
  });

  it('handles empty string', () => {
    const result = splitIntoLines('');
    expect(result).toEqual(['']);
  });

  it('closes and reopens spans across newlines', () => {
    const html = '<span style="color:red">line1\nline2</span>';
    const result = splitIntoLines(html);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('<span style="color:red">line1</span>');
    expect(result[1]).toBe('<span style="color:red">line2</span>');
  });

  it('handles nested spans across newlines', () => {
    const html = '<span style="color:red"><span style="color:blue">a\nb</span></span>';
    const result = splitIntoLines(html);
    expect(result).toHaveLength(2);
    // Line 1: both spans opened and closed
    expect(result[0]).toBe('<span style="color:red"><span style="color:blue">a</span></span>');
    // Line 2: both spans reopened and closed
    expect(result[1]).toBe('<span style="color:red"><span style="color:blue">b</span></span>');
  });

  it('handles spans that do not cross newlines', () => {
    const html = '<span style="color:red">a</span>\n<span style="color:blue">b</span>';
    const result = splitIntoLines(html);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('<span style="color:red">a</span>');
    expect(result[1]).toBe('<span style="color:blue">b</span>');
  });

  it('produces empty string for consecutive newlines', () => {
    const html = 'a\n\nb';
    const result = splitIntoLines(html);
    expect(result).toEqual(['a', '', 'b']);
  });
});
