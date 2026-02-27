/**
 * Shared types and parser for Python `-X importtime` profiling output.
 */

export interface ImportNode {
  name: string;
  selfTime: number;       // microseconds
  cumulativeTime: number; // microseconds
  children: ImportNode[];
}

/**
 * Parse raw `-X importtime` text into a tree.
 *
 * In the output, children appear BEFORE their parent.
 * Leading spaces in the module-name column encode depth (2 spaces = 1 level).
 */
export function parseImportProfile(text: string): ImportNode {
  const lines = text.split(/\r?\n/).filter((l) => l.startsWith("import time:"));

  const stack: { node: ImportNode; depth: number }[] = [];

  for (const line of lines) {
    const match = line.match(/^import time:\s+(\d+)\s*\|\s*(\d+)\s*\|(.+)$/);
    if (!match) continue;

    const selfTime = parseInt(match[1], 10);
    const cumulativeTime = parseInt(match[2], 10);
    const raw = match[3];

    const leadingSpaces = raw.length - raw.trimStart().length;
    const depth = Math.floor(leadingSpaces / 2);
    const name = raw.trim();

    const node: ImportNode = { name, selfTime, cumulativeTime, children: [] };

    // Pop deeper entries; depth+1 entries are direct children of this node
    const children: ImportNode[] = [];
    while (stack.length > 0 && stack[stack.length - 1].depth > depth) {
      const popped = stack.pop()!;
      if (popped.depth === depth + 1) {
        children.push(popped.node);
      }
    }
    children.reverse();
    node.children = children;

    stack.push({ node, depth });
  }

  // Remaining depth-0 entries are top-level imports
  const rootChildren: ImportNode[] = [];
  while (stack.length > 0) {
    const popped = stack.pop()!;
    if (popped.depth === 0) {
      rootChildren.push(popped.node);
    }
  }
  rootChildren.reverse();

  return { name: "<root>", selfTime: 0, cumulativeTime: 0, children: rootChildren };
}
