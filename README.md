# Copy Markdown Formatted

Copy Markdown as **formatted HTML** to the clipboard. Paste it into Outlook, Teams, Word, or any rich text editor with full styling preserved.

## Features

- **Copy Selection as Formatted HTML** — select text in a Markdown file and copy it with formatting
- **Copy File as Formatted HTML** — copy the entire Markdown file with formatting

Both commands are available via:
- **Right-click context menu** (in Markdown files)
- **Command Palette** (`Ctrl+Shift+P` > "Markdown: Copy ...")

## Usage

1. Open a Markdown file in VS Code
2. Optionally select a portion of text
3. Right-click and choose **"Copy Selection as Formatted HTML"** or **"Copy File as Formatted HTML"**
4. Paste into Outlook, Teams, Word, or any application that accepts rich text (`Ctrl+V`)

The pasted content will include styled headings, bold/italic text, code blocks, tables, lists, blockquotes, and links.

## Paste as **"Keep Source Formatting"**

Most application require **"Keep Source Formatting"** to preserve fonts, colors, backgrounds, and spacing.

### Outlook Classic

After `Ctrl+V`, click the small paste-options icon that appears and select **"Keep Source Formatting"**.

### New Outlook

Two options:

1. **Per paste:** Click the **Paste** icon (or `Ctrl+V`), select **"Keep Source Formatting"**, then confirm with **"Paste anyway"** in the dialog that appears.
2. **Permanent setting:** Go to **Settings** > **Mail** > **Compose and reply** > set **"Paste from other programs"** to **"Keep Source Formatting"**. After this, `Ctrl+V` always preserves the formatting.

## Supported Elements

| Markdown | Rendered as |
|---|---|
| `# Heading` | Styled headings (H1-H6) |
| `**bold**` | **Bold text** |
| `*italic*` | *Italic text* |
| `` `code` `` | Inline code with background and syntax coloring |
| Code blocks | Dark-themed code blocks |
| `> Quote` | Styled blockquotes |
| Tables | Bordered tables with header styling |
| Lists | Ordered and unordered lists |
| `[link](url)` | Clickable links |
| `---` | Horizontal rules |

## Platform Support

| Platform | Status | Clipboard tool |
|---|---|---|
| Windows | Supported | PowerShell (built-in) |
| macOS | Supported | Swift (built-in) |
| Linux (X11) | Supported | `xclip` (install: `sudo apt install xclip`) |
| Linux (Wayland) | Supported | `wl-copy` (install: `sudo apt install wl-clipboard`) |

## Requirements

- VS Code 1.85.0 or newer
- **Windows**: PowerShell (pre-installed)
- **macOS**: Swift runtime (pre-installed with Xcode CLI tools)
- **Linux**: `xclip` (X11) or `wl-clipboard` (Wayland)

## Known Limitations

- **Images**: Web image URLs (`https://...`) work — Outlook fetches them when rendering. Local file paths (`./image.png`) will not display because the recipient has no access to your filesystem. Embedding images via base64 data URIs is not possible because Outlook strips `data:` URIs for security reasons. CID embedding requires MIME multipart, which the clipboard format does not support.
- **Language / spell check**: The HTML output does not include a `lang` attribute, so email clients may flag words as misspelled when the content language differs from the application's default. Automatic language detection would add a dependency with uncertain accuracy — especially on short texts — and Outlook Classic primarily relies on its own proofing language settings rather than the HTML `lang` attribute.
- macOS and Linux clipboard support has not yet been tested on those platforms.

## License

MIT
