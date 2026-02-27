import * as vscode from "vscode";
import { ImportNode } from "./parser";

/**
 * VS Code TreeDataProvider backed by an ImportNode tree.
 */
export class ImportProfileTreeProvider
  implements vscode.TreeDataProvider<ImportNode>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    ImportNode | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private root: ImportNode | undefined;

  setRoot(root: ImportNode): void {
    this.root = root;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ImportNode): vscode.TreeItem {
    const hasChildren = element.children.length > 0;
    const item = new vscode.TreeItem(
      element.name,
      hasChildren
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );

    // Show timing info as description (appears to the right of the label)
    item.description = `self: ${formatTime(element.selfTime)}  |  cumul: ${formatTime(element.cumulativeTime)}`;

    // Tooltip with more detail
    item.tooltip = new vscode.MarkdownString(
      `**${element.name}**\n\n` +
        `| Metric | Value |\n|---|---|\n` +
        `| Self time | ${formatTime(element.selfTime)} |\n` +
        `| Cumulative time | ${formatTime(element.cumulativeTime)} |\n` +
        `| Sub-modules | ${element.children.length} |`
    );

    // Color-code by cumulative time using themeIcon
    if (element.cumulativeTime > 50_000) {
      item.iconPath = new vscode.ThemeIcon("circle-filled", new vscode.ThemeColor("charts.red"));
    } else if (element.cumulativeTime > 10_000) {
      item.iconPath = new vscode.ThemeIcon("circle-filled", new vscode.ThemeColor("charts.orange"));
    } else if (element.cumulativeTime > 2_000) {
      item.iconPath = new vscode.ThemeIcon("circle-filled", new vscode.ThemeColor("charts.yellow"));
    } else {
      item.iconPath = new vscode.ThemeIcon("circle-filled", new vscode.ThemeColor("charts.green"));
    }

    return item;
  }

  getChildren(element?: ImportNode): ImportNode[] {
    if (!element) {
      return this.root?.children ?? [];
    }
    return element.children;
  }

  getParent(element: ImportNode): ImportNode | undefined {
    // Not strictly needed for basic tree views, but helps with reveal()
    if (!this.root) return undefined;
    return findParent(this.root, element);
  }
}

function findParent(
  current: ImportNode,
  target: ImportNode
): ImportNode | undefined {
  for (const child of current.children) {
    if (child === target) return current;
    const found = findParent(child, target);
    if (found) return found;
  }
  return undefined;
}

/** Format microseconds into a human-friendly string. */
function formatTime(us: number): string {
  if (us >= 1_000_000) {
    return `${(us / 1_000_000).toFixed(2)} s`;
  }
  if (us >= 1_000) {
    return `${(us / 1_000).toFixed(1)} ms`;
  }
  return `${us} µs`;
}
