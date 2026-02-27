# Import Profile Viewer

A VS Code extension for viewing **Python module import profiling results** as an interactive, collapsible tree — right inside the editor.

When you run a Python script with the `-X importtime` flag, Python prints a detailed breakdown of every module import and how long each one takes. This extension parses that output and presents it as a clean, searchable tree view so you can quickly spot slow imports.

## Features

- **Collapsible tree view** — expand and collapse modules to explore the import hierarchy
- **Color-coded timing indicators** — modules are marked with colored dots based on cumulative import time:
  - 🟢 Green: < 2 ms
  - 🟡 Yellow: 2–10 ms
  - 🟠 Orange: 10–50 ms
  - 🔴 Red: > 50 ms
- **Self & cumulative time** — see both the module's own import time and the total time including sub-imports
- **Search / filter** — quickly find any module by name
- **Supports raw text and JSON** — load the original `-X importtime` output or a pre-parsed JSON tree

## How to Generate an Import Profile

Run your Python script with the `-X importtime` flag and redirect `stderr` to a file:

```bash
python -X importtime your_script.py 2> import_profile.txt
```

This produces a file like:

```
import time: self [us] | cumulative | imported package
import time:       170 |        170 |   _io
import time:        30 |         30 |   marshal
import time:       514 |        924 | _frozen_importlib_external
...
```

## How to Open the Result File

1. In VS Code, open the **Explorer** panel (file tree)
2. **Right-click** on your `import_profile.txt` (or `.json` / `.log`) file
3. Select **"Open with Import Profile Viewer"** from the context menu
4. The profiling tree opens in an editor tab

You can also use the **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`):
1. Type **"Open with Import Profile Viewer"**
2. Pick your profile file from the file dialog

## Example

Given a profile from `python -X importtime`, the viewer shows:

```
▶ numpy       (self: 1.2 ms | cumul: 156.3 ms)  🔴
  ▶ numpy.core  (self: 1.2 ms | cumul: 49.9 ms) 🟠
    ▶ numpy.core.multiarray  ...
    ▶ numpy.core.numeric      ...
  ▶ numpy.lib   (self: 1.0 ms | cumul: 30.8 ms) 🟠
  ▶ numpy.fft   (self: 0.6 ms | cumul: 2.9 ms)  🟡
▶ pandas       (self: 3.8 ms | cumul: 234.5 ms)  🔴
▶ sqlite3      (self: 15.7 ms | cumul: 30.4 ms)  🟠
```

## Requirements

- VS Code 1.80.0 or later
- A Python import profile file generated with `python -X importtime`

## License

MIT
