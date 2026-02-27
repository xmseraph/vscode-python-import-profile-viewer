import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { parseImportProfile, ImportNode } from "./parser";
import { openProfilePanel } from "./webviewPanel";

export function activate(context: vscode.ExtensionContext) {
  // Command: right-click a file in explorer → "Open with Import Profile Viewer"
  const openCmd = vscode.commands.registerCommand(
    "importProfileViewer.open",
    async (uri?: vscode.Uri) => {
      // If no URI (e.g. invoked from command palette), ask user to pick a file
      if (!uri) {
        const uris = await vscode.window.showOpenDialog({
          canSelectMany: false,
          filters: {
            "Import Profile": ["txt", "json", "log"],
            "All Files": ["*"],
          },
          openLabel: "Open Import Profile",
        });
        if (!uris || uris.length === 0) return;
        uri = uris[0];
      }

      const filePath = uri.fsPath;
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        let root: ImportNode;

        if (raw.trimStart().startsWith("{")) {
          root = JSON.parse(raw) as ImportNode;
        } else {
          root = parseImportProfile(raw);
        }

        const title = `Import Profile: ${path.basename(filePath)}`;
        openProfilePanel(context, root, title);
      } catch (err: any) {
        vscode.window.showErrorMessage(
          `Failed to load import profile: ${err.message}`
        );
      }
    }
  );

  context.subscriptions.push(openCmd);
}

export function deactivate() {}
