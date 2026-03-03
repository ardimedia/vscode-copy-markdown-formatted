import { execFile, spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';
import { randomBytes } from 'crypto';

/** Wrap HTML fragment in a minimal document (for macOS/Linux — no CF_HTML header needed). */
export function wrapHtml(htmlFragment: string): string {
  return '<html><head><meta charset="utf-8"></head><body>' + htmlFragment + '</body></html>';
}

// ---------------------------------------------------------------------------
// Platform dispatcher
// ---------------------------------------------------------------------------

export async function copyHtmlToClipboard(html: string, plainText: string): Promise<void> {
  switch (process.platform) {
    case 'win32':  return copyWindows(html, plainText);
    case 'darwin': return copyMacOS(html, plainText);
    case 'linux':  return copyLinux(html, plainText);
    default:
      throw new Error(`Platform "${process.platform}" is not supported.`);
  }
}

// ---------------------------------------------------------------------------
// Windows — CF_HTML via PowerShell
// ---------------------------------------------------------------------------

/**
 * Build CF_HTML clipboard format string.
 * Windows clipboard expects a specific header with byte offsets.
 * See: https://learn.microsoft.com/en-us/windows/win32/dataxchg/html-clipboard-format
 *
 * Outlook's Word rendering engine needs @font-face declarations and MSO namespaces
 * to recognise non-default fonts like Consolas.  We include a minimal <head> block
 * that mirrors what Outlook itself generates when saving HTML.
 */
export function buildCfHtml(htmlFragment: string): string {
  const header =
    'Version:0.9\r\n' +
    'StartHTML:SSSSSSSSSS\r\n' +
    'EndHTML:EEEEEEEEEE\r\n' +
    'StartFragment:FFFFFFFFFF\r\n' +
    'EndFragment:GGGGGGGGGG\r\n';

  const prefix =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office"\r\n' +
    'xmlns:w="urn:schemas-microsoft-com:office:word"\r\n' +
    'xmlns="http://www.w3.org/TR/REC-html40">\r\n' +
    '<head>\r\n' +
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">\r\n' +
    '<!--[if gte mso 9]>\r\n' +
    '<style>\r\n' +
    '@font-face\r\n' +
    '\t{font-family:Consolas;\r\n' +
    '\tpanose-1:2 11 6 9 2 2 4 3 2 4;\r\n' +
    '\tmso-font-charset:0;\r\n' +
    '\tmso-generic-font-family:modern;\r\n' +
    '\tmso-font-pitch:fixed;}\r\n' +
    '</style>\r\n' +
    '<![endif]-->\r\n' +
    '</head>\r\n' +
    '<body style="margin:0;padding:0;border:none">\r\n<!--StartFragment-->';
  const suffix = '<!--EndFragment-->\r\n</body></html>';

  const headerBytes = Buffer.byteLength(header, 'utf-8');
  const prefixBytes = Buffer.byteLength(prefix, 'utf-8');
  const fragmentBytes = Buffer.byteLength(htmlFragment, 'utf-8');
  const suffixBytes = Buffer.byteLength(suffix, 'utf-8');

  const startHtml = headerBytes;
  const startFragment = headerBytes + prefixBytes;
  const endFragment = startFragment + fragmentBytes;
  const endHtml = endFragment + suffixBytes;

  const filledHeader = header
    .replace('SSSSSSSSSS', startHtml.toString().padStart(10, '0'))
    .replace('EEEEEEEEEE', endHtml.toString().padStart(10, '0'))
    .replace('FFFFFFFFFF', startFragment.toString().padStart(10, '0'))
    .replace('GGGGGGGGGG', endFragment.toString().padStart(10, '0'));

  return filledHeader + prefix + htmlFragment + suffix;
}

/**
 * Copy HTML to Windows clipboard as both CF_HTML and plain text.
 * Uses PowerShell with .NET System.Windows.Forms.Clipboard.
 *
 * Key: CF_HTML data must be passed as a raw UTF-8 byte MemoryStream,
 * not as a string — otherwise .NET may prepend a BOM which corrupts
 * the byte offsets in the CF_HTML header.
 */
async function copyWindows(html: string, plainText: string): Promise<void> {
  const cfHtml = buildCfHtml(html);

  const id = randomBytes(4).toString('hex');
  const cfHtmlFile = join(tmpdir(), `vscode-md-cf-${id}.txt`);
  const plainFile = join(tmpdir(), `vscode-md-plain-${id}.txt`);

  // Write without BOM — Node.js writeFile('utf-8') does not add BOM
  await writeFile(cfHtmlFile, cfHtml, 'utf-8');
  await writeFile(plainFile, plainText, 'utf-8');

  // Use forward slashes for PowerShell — .NET handles them fine on Windows
  const cfHtmlPath = cfHtmlFile.replace(/\\/g, '/');
  const plainPath = plainFile.replace(/\\/g, '/');

  const psScript = `
Add-Type -AssemblyName System.Windows.Forms

# Read CF_HTML as raw bytes (no BOM reinterpretation)
$bytes = [System.IO.File]::ReadAllBytes('${cfHtmlPath}')
$stream = New-Object System.IO.MemoryStream(,$bytes)

$plain = [System.IO.File]::ReadAllText('${plainPath}', [System.Text.Encoding]::UTF8)

$dataObj = New-Object System.Windows.Forms.DataObject
$dataObj.SetData([System.Windows.Forms.DataFormats]::Html, $stream)
$dataObj.SetData([System.Windows.Forms.DataFormats]::UnicodeText, $plain)
[System.Windows.Forms.Clipboard]::SetDataObject($dataObj, $true)
`;

  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-STA', '-Command', psScript],
      { timeout: 10000 },
      async (error, _stdout, stderr) => {
        await unlink(cfHtmlFile).catch(() => {});
        await unlink(plainFile).catch(() => {});

        if (error) {
          reject(new Error(`Clipboard write failed: ${stderr || error.message}`));
        } else {
          resolve();
        }
      }
    );
  });
}

// ---------------------------------------------------------------------------
// macOS — NSPasteboard via osascript
// ---------------------------------------------------------------------------

/**
 * Copy HTML to macOS clipboard using osascript (AppleScript).
 * Sets both HTML and plain text on the pasteboard.
 */
async function copyMacOS(html: string, plainText: string): Promise<void> {
  const fullHtml = wrapHtml(html);
  const id = randomBytes(4).toString('hex');
  const htmlFile = join(tmpdir(), `vscode-md-${id}.html`);
  await writeFile(htmlFile, fullHtml, 'utf-8');

  // Use Swift via osascript — more reliable than AppleScript for setting
  // multiple pasteboard types (HTML + plain text) simultaneously.
  const swiftScript = `
import Cocoa

let htmlPath = "${htmlFile}"
let plainText = """
${plainText.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}
"""

let htmlData = FileManager.default.contents(atPath: htmlPath)!
let pb = NSPasteboard.general
pb.clearContents()
pb.setData(htmlData, forType: .html)
pb.setString(plainText, forType: .string)
`;

  const swiftFile = join(tmpdir(), `vscode-md-${id}.swift`);
  await writeFile(swiftFile, swiftScript, 'utf-8');

  return new Promise((resolve, reject) => {
    execFile(
      'swift',
      [swiftFile],
      { timeout: 10000 },
      async (error, _stdout, stderr) => {
        await unlink(htmlFile).catch(() => {});
        await unlink(swiftFile).catch(() => {});

        if (error) {
          reject(new Error(`Clipboard write failed: ${stderr || error.message}`));
        } else {
          resolve();
        }
      }
    );
  });
}

// ---------------------------------------------------------------------------
// Linux — xclip (X11) or wl-copy (Wayland)
// ---------------------------------------------------------------------------

/**
 * Copy HTML to Linux clipboard.
 * Detects Wayland vs X11 and uses the appropriate tool.
 * Falls back to xclip if detection is ambiguous.
 */
async function copyLinux(html: string, plainText: string): Promise<void> {
  const fullHtml = wrapHtml(html);
  const isWayland = !!process.env.WAYLAND_DISPLAY;

  if (isWayland) {
    await pipeToClipboard('wl-copy', ['--type', 'text/html'], fullHtml,
      'wl-copy not found. Install wl-clipboard: sudo apt install wl-clipboard');
  } else {
    await pipeToClipboard('xclip', ['-selection', 'clipboard', '-t', 'text/html'], fullHtml,
      'xclip not found. Install it: sudo apt install xclip');
  }

  // Also set plain text (separate clipboard operation)
  if (isWayland) {
    await pipeToClipboard('wl-copy', ['--primary'], plainText).catch(() => {});
  } else {
    await pipeToClipboard('xclip', ['-selection', 'clipboard'], plainText).catch(() => {});
  }
}

/** Pipe content to a clipboard CLI tool via stdin. */
function pipeToClipboard(cmd: string, args: string[], content: string, notFoundHint?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { timeout: 10000 });
    let stderr = '';

    proc.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
    proc.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT' && notFoundHint) {
        reject(new Error(notFoundHint));
      } else {
        reject(new Error(`Clipboard write failed: ${err.message}`));
      }
    });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Clipboard write failed (exit ${code}): ${stderr}`));
      }
    });

    proc.stdin.write(content, 'utf-8');
    proc.stdin.end();
  });
}
