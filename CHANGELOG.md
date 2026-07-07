# Changelog

## [Unreleased]

## [0.4.1] - 2026-07-07

- Fixed: indentation inside fenced code blocks was lost when pasting into Outlook. Leading whitespace collapsed because HTML (and Outlook's Word renderer) drops leading spaces. Leading indentation is now emitted as `&nbsp;` (tabs expand to four), so JSON/YAML/XML and other structured code keep their indentation exactly. Applies to both syntax-highlighted and plain code blocks ([#1](https://github.com/ardimedia-com/vscode-copy-markdown-formatted/issues/1))

## [0.4.0] - 2026-06-28

- New: **persistent clipboard host on Windows (default)** — a background PowerShell process now stays ready between copies, loading the required `System.Windows.Forms` assembly once instead of on every copy. The first copy warms it up (~1–1.5s); subsequent copies are near-instant (~25–50ms). The process starts on first use, shuts down with VS Code, and self-exits if the editor closes without cleanup
- New setting **`copyMarkdownFormatted.windows.clipboardMode`** (`persistentHost` | `oneShot`, default `persistentHost`): choose between the fast persistent host and starting a fresh PowerShell for every copy. Windows only
- Fixed: copying on Windows could intermittently fail with `Clipboard write failed: Command failed: powershell.exe …` and no further detail. Root cause was the Windows PowerShell 5.1 `Add-Type System.Windows.Forms` cold-load occasionally exceeding the spawn timeout, so the process was killed before it finished — leaving an empty error message. Failures now surface the real reason (e.g. the clipboard being locked) instead of a blank `Command failed`
- Changed: the clipboard copy now prefers PowerShell 7 (`pwsh`) when it is installed, falling back to Windows PowerShell (`powershell.exe`). Loading `System.Windows.Forms` is far cheaper under `pwsh` (~0.8s vs ~2s, and up to ~13s cold), which also keeps the one-shot fallback from tripping the timeout. The resolved host is cached for the session
- Changed: CF_HTML and plain-text payloads are sent to the persistent host in-memory (base64 over stdin), eliminating the temporary files the previous one-shot path wrote and read on every copy
- The clipboard write now retries on transient locks (other apps such as Teams, RDP, or clipboard managers briefly holding the clipboard) and uses a longer, clearer timeout that reports as a timeout rather than a generic failure
- New: on Windows, when PowerShell 7 (`pwsh`) is not installed and the slower Windows PowerShell fallback is used, a one-time hint suggests installing PowerShell 7 for faster copies (with a link to the install docs). Shown at most once per machine/profile

## 0.3.1

- Docs: README "Supported Elements" table now notes that `> Quote` may be stripped to normal paragraphs when the entire input is quoted (default `stripBlockquote` behavior introduced in 0.3.0)
- Docs: README Usage section now references the new "Configure Copy Formatted…" command

## 0.3.0

- New **settings** (configuration contribution): font family + size for body and code, and a `stripBlockquote` toggle. Defaults match the previous hard-coded values (Aptos 11pt, Cascadia Mono 10pt)
- New behavior: if every non-empty line of the input starts with `>` (e.g. an Outlook reply copied as Markdown), one level of blockquote marker is stripped before conversion. Renders as normal paragraphs instead of a styled blockquote. Controlled by `copyMarkdownFormatted.stripBlockquote` (default `true`). Strips one level only, so nested quotes remain a blockquote
- New command **"Markdown: Configure Copy Formatted…"** opens VS Code Settings filtered to this extension. Added as a third entry in the editor context menu next to the two existing copy commands
- Heading sizes now scale from `font.bodySize` instead of being hard-coded (h1 = body + 13pt, h2 = body + 7pt, h3 = body + 5pt, h4 = body + 3pt, h5 = body + 2pt, h6 = body + 1pt). With the default body size of 11pt, the rendered sizes are unchanged from 0.2.2
- Refactored `styles.ts` from a static `STYLES` record to a `buildStyles(config)` factory so the converter can be parameterised at runtime

## 0.2.2

- Body font size changed from 12pt to 11pt to match the actual new Outlook / Microsoft 365 default (Aptos 11pt). Applies to paragraphs, lists, and table cells; headings and code blocks unchanged. h6 stays at 12pt so it remains one step above body text
- Extracted body font size into a shared `FONT_SIZE_BODY` constant in `styles.ts` (mirrors the existing `FONT_SIZE_CODE`)

## 0.2.1

- Font sizes switched from `px` to `pt` to match Outlook/Word conventions — body is now 12pt (Outlook default), headings scale 24/18/16/14/13/12pt (h1–h6). User-visible effect: pasted output renders about 14% larger than in 0.2.0
- Code-block font size is now a single `FONT_SIZE_CODE` constant shared between `styles.ts` and `converter.ts` (was duplicated as `10pt` / `10.0pt`)

## 0.2.0

**Breaking:** HTML output structure changed from a single outer `<table>` with `<tr><td>` per block to semantic HTML. This is the new default behavior — there is no opt-in setting or fallback to the previous table-based layout.

- Paragraphs now render as `<p style="...">text</p>` instead of `<tr><td>text</td></tr>` — Outlook respects `margin` on `<p>` for spacing
- Body font stack updated to `Aptos, 'Segoe UI', Calibri, Arial, sans-serif` — Aptos is the new Outlook/Office default (replaced Calibri in 2024), with Segoe UI and Calibri as legacy fallbacks
- Headings render as `<h1>`-`<h6>` with margin-based spacing instead of table rows with spacer rows
- Lists render as native `<ul>`/`<ol>` with `<li>` (native bullets / numbers via `start` attribute) instead of table rows with prepended bullet characters
- Task lists render as `<ul style="list-style: none;">` with checkbox unicode characters preserved
- Blockquotes render as `<blockquote>` with left border and margin
- Code blocks render as `<div>` container (no table wrapper) with `<p>` per line, retaining inline font-family for Outlook Classic + New compatibility
- Horizontal rules render as `<hr>` with margin
- Markdown tables continue to render as `<table>` (semantically correct for tabular data)
- No outer wrapper around the document — output starts directly with the first block element

## 0.1.4

- Cross-platform font stack for code blocks (Cascadia Mono, Consolas, Courier New, monospace)
- Fixed crash with nested lists (marked v15 token resolution)
- Fixed crash with code blocks inside list items
- Fixed HTML entity escaping in inline code spans (e.g. `<h1>`, `<div>`)

## 0.1.0

Initial release.

- Copy Markdown selection as formatted HTML
- Copy entire Markdown file as formatted HTML
- Table-based layout for Outlook compatibility (Classic and New)
- Syntax highlighting for fenced code blocks (via highlight.js)
- Consolas font for code blocks (inline + fenced)
- YAML frontmatter stripping
- Windows clipboard via PowerShell (CF_HTML format)
- macOS clipboard via Swift (NSPasteboard)
- Linux clipboard via xclip (X11) or wl-copy (Wayland)
