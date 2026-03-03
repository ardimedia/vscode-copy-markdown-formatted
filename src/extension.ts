import * as vscode from 'vscode';
import { convertMarkdownToStyledHtml } from './converter';
import { copyHtmlToClipboard } from './clipboard';

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
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Failed to copy: ${msg}`);
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
