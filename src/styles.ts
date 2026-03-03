const FONT_BODY = 'Segoe UI, Arial, sans-serif';
export const FONT_CODE = 'Cascadia Mono, Consolas, Courier New, monospace';
const COLOR_TEXT = '#1f2937';
const COLOR_TEXT_LIGHT = '#374151';
const COLOR_MUTED = '#6b7280';
const COLOR_LINK = '#0066cc';
const COLOR_BORDER = '#d1d5db';
const COLOR_BG_LIGHT = '#f3f4f6';
const COLOR_CODE_BG = '#f6f8fa';
const COLOR_CODE_FG = '#24292e';

/** Spacer row heights (px) used between block elements */
export const SPACER_AFTER_HEADING = 8;
export const SPACER_BEFORE_HEADING = 4;
export const SPACER_BLOCK = 4;

/** Inline styles — td-based for Outlook table-layout compatibility */
export const STYLES: Record<string, string> = {
  h1: `font-family: ${FONT_BODY}; font-size: 28px; font-weight: 600; color: ${COLOR_TEXT}; padding: 0 0 8px 0;`,
  h2: `font-family: ${FONT_BODY}; font-size: 22px; font-weight: 600; color: ${COLOR_TEXT}; padding: 0 0 6px 0;`,
  h3: `font-family: ${FONT_BODY}; font-size: 18px; font-weight: 600; color: ${COLOR_TEXT}; padding: 0 0 4px 0;`,
  h4: `font-family: ${FONT_BODY}; font-size: 16px; font-weight: 600; color: ${COLOR_TEXT}; padding: 0 0 2px 0;`,
  h5: `font-family: ${FONT_BODY}; font-size: 14px; font-weight: 600; color: ${COLOR_TEXT}; padding: 0 0 2px 0;`,
  h6: `font-family: ${FONT_BODY}; font-size: 13px; font-weight: 600; color: ${COLOR_MUTED}; padding: 0 0 2px 0;`,
  p: `font-family: ${FONT_BODY}; font-size: 14px; line-height: 1.6; color: ${COLOR_TEXT_LIGHT}; padding: 0 0 8px 0;`,
  a: `color: ${COLOR_LINK}; text-decoration: none;`,
  strong: `font-weight: 600;`,
  em: `font-style: italic;`,
  code: `font-family: ${FONT_CODE}; background-color: ${COLOR_BG_LIGHT}; color: ${COLOR_TEXT}; padding: 2px 6px;`,
  'code-block-td': `background-color: ${COLOR_CODE_BG}; padding: 16px; border: 1px solid ${COLOR_BORDER}; font-family: ${FONT_CODE}; font-size: 10pt; color: ${COLOR_CODE_FG}; line-height: 1.6;`,
  'code-block-span': `font-family: ${FONT_CODE}`,
  blockquote: `border-left: 4px solid ${COLOR_BORDER}; padding: 4px 0 4px 16px; color: ${COLOR_MUTED};`,
  'blockquote-p': `font-family: ${FONT_BODY}; font-size: 14px; line-height: 1.6; color: ${COLOR_MUTED}; padding: 0;`,
  table: `border-collapse: collapse; width: 100%;`,
  th: `background-color: ${COLOR_BG_LIGHT}; padding: 8px 12px; font-weight: 600; border: 1px solid ${COLOR_BORDER}; text-align: left; font-family: ${FONT_BODY}; font-size: 14px;`,
  td: `padding: 8px 12px; border: 1px solid ${COLOR_BORDER}; font-family: ${FONT_BODY}; font-size: 14px;`,
  li: `font-family: ${FONT_BODY}; font-size: 14px; color: ${COLOR_TEXT_LIGHT}; padding: 0 0 4px 24px; line-height: 1.6;`,
  hr: `border: none; border-top: 1px solid ${COLOR_BORDER};`,
  img: `max-width: 100%; height: auto;`,
};
