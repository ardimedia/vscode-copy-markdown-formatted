import * as vscode from 'vscode';
import { convertMarkdownToStyledHtml } from './converter';
import { copyHtmlToClipboard } from './clipboard';

function buildClipboardErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (process.platform === 'darwin') {
    if (lower.includes('swift') || lower.includes('xcode')) {
      return 'Clipboard write failed on macOS. Swift/Xcode Command Line Tools may be missing. Install with "xcode-select --install" and try again.';
    }
    return `Clipboard write failed on macOS. ${raw}`;
  }

  if (process.platform === 'linux') {
    if (lower.includes('wl-copy')) {
      return 'Clipboard write failed on Linux (Wayland). Install wl-clipboard (for example: sudo apt install wl-clipboard) and try again.';
    }
    if (lower.includes('xclip')) {
      return 'Clipboard write failed on Linux (X11). Install xclip (for example: sudo apt install xclip) and try again.';
    }
    return `Clipboard write failed on Linux. ${raw}`;
  }

  if (process.platform === 'win32') {
    return `Clipboard write failed on Windows. ${raw}`;
  }

  return `Clipboard write failed. ${raw}`;
}

async function copyFormatted(text: string): Promise<void> {
  if (!text.trim()) {
    vscode.window.showWarningMessage('No text to copy.');
    return;
  }

  try {
    const html = convertMarkdownToStyledHtml(text);
    await copyHtmlToClipboard(html, text);
    vscode.window.showInformationMessage('Formatted Markdown copied to clipboard.');
  } catch (err: unknown) {
    const message = buildClipboardErrorMessage(err);
    vscode.window.showErrorMessage(message);
  }
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('copyMarkdownFormatted.copySelection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const selection = editor.selection;
      const text = editor.document.getText(selection);
      if (!text) {
        vscode.window.showWarningMessage('No text selected. Use "Copy File as Formatted HTML" to copy the entire file.');
        return;
      }
      await copyFormatted(text);
    }),

    vscode.commands.registerCommand('copyMarkdownFormatted.copyFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const text = editor.document.getText();
      await copyFormatted(text);
    })
  );
}

export function deactivate(): void {}
