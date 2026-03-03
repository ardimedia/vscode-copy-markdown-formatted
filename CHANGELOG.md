# Changelog

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
