import { describe, it, expect } from 'vitest';
import { buildCfHtml, wrapHtml } from '../clipboard';

describe('buildCfHtml', () => {
  it('starts with Version:0.9 header', () => {
    const cf = buildCfHtml('<b>test</b>');
    expect(cf).toMatch(/^Version:0\.9\r\n/);
  });

  it('contains all four offset fields', () => {
    const cf = buildCfHtml('<b>test</b>');
    expect(cf).toContain('StartHTML:');
    expect(cf).toContain('EndHTML:');
    expect(cf).toContain('StartFragment:');
    expect(cf).toContain('EndFragment:');
  });

  it('has correct StartHTML byte offset', () => {
    const cf = buildCfHtml('<b>test</b>');
    const match = cf.match(/StartHTML:(\d{10})/);
    expect(match).not.toBeNull();
    const startHtml = parseInt(match![1], 10);
    // StartHTML should point past the header to the <html> tag
    const headerEnd = cf.indexOf('<html');
    expect(startHtml).toBe(headerEnd);
  });

  it('has correct StartFragment byte offset', () => {
    const cf = buildCfHtml('<b>test</b>');
    const match = cf.match(/StartFragment:(\d{10})/);
    const startFrag = parseInt(match![1], 10);
    // StartFragment should point past <!--StartFragment-->
    const fragMarkerEnd = cf.indexOf('<!--StartFragment-->') + '<!--StartFragment-->'.length;
    expect(startFrag).toBe(fragMarkerEnd);
  });

  it('has correct EndFragment byte offset', () => {
    const fragment = '<b>test</b>';
    const cf = buildCfHtml(fragment);
    const match = cf.match(/EndFragment:(\d{10})/);
    const endFrag = parseInt(match![1], 10);
    // EndFragment should point to <!--EndFragment-->
    const fragEnd = cf.indexOf('<!--EndFragment-->');
    expect(endFrag).toBe(fragEnd);
  });

  it('has correct EndHTML byte offset', () => {
    const cf = buildCfHtml('<b>test</b>');
    const match = cf.match(/EndHTML:(\d{10})/);
    const endHtml = parseInt(match![1], 10);
    // EndHTML should be the total byte length
    expect(endHtml).toBe(Buffer.byteLength(cf, 'utf-8'));
  });

  it('byte offsets are correct for multi-byte characters (umlauts)', () => {
    const fragment = '<td>Ärger mit Übung</td>';
    const cf = buildCfHtml(fragment);
    const endHtml = parseInt(cf.match(/EndHTML:(\d{10})/)![1], 10);
    expect(endHtml).toBe(Buffer.byteLength(cf, 'utf-8'));

    const endFrag = parseInt(cf.match(/EndFragment:(\d{10})/)![1], 10);
    const fragEnd = Buffer.byteLength(cf.substring(0, cf.indexOf('<!--EndFragment-->')), 'utf-8');
    expect(endFrag).toBe(fragEnd);
  });

  it('byte offsets are correct for emoji', () => {
    const fragment = '<td>Hello 🎉🚀</td>';
    const cf = buildCfHtml(fragment);
    const endHtml = parseInt(cf.match(/EndHTML:(\d{10})/)![1], 10);
    expect(endHtml).toBe(Buffer.byteLength(cf, 'utf-8'));
  });

  it('contains MSO namespaces for Outlook Classic', () => {
    const cf = buildCfHtml('<b>test</b>');
    expect(cf).toContain('xmlns:o="urn:schemas-microsoft-com:office:office"');
    expect(cf).toContain('xmlns:w="urn:schemas-microsoft-com:office:word"');
  });

  it('contains @font-face for Consolas in MSO conditional comment', () => {
    const cf = buildCfHtml('<b>test</b>');
    expect(cf).toContain('<!--[if gte mso 9]>');
    expect(cf).toContain('font-family:Consolas');
    expect(cf).toContain('<![endif]-->');
  });

  it('contains the fragment between markers', () => {
    const fragment = '<td>my content</td>';
    const cf = buildCfHtml(fragment);
    expect(cf).toContain('<!--StartFragment-->' + fragment + '<!--EndFragment-->');
  });

  it('body has margin/padding/border reset', () => {
    const cf = buildCfHtml('<b>test</b>');
    expect(cf).toContain('body style="margin:0;padding:0;border:none"');
  });
});

describe('wrapHtml', () => {
  it('wraps fragment in html/head/body', () => {
    const html = wrapHtml('<b>test</b>');
    expect(html).toBe('<html><head><meta charset="utf-8"></head><body><b>test</b></body></html>');
  });

  it('handles empty fragment', () => {
    const html = wrapHtml('');
    expect(html).toBe('<html><head><meta charset="utf-8"></head><body></body></html>');
  });
});
