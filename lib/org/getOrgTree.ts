import "server-only";
import type { Organization } from "@/types";
import { getDescendants } from "./rpc";

/** A node in the org hierarchy, with its children nested. */
export interface OrgTreeNode {
  id: string;
  name: string;
  slug: string;
  level: number;
  children: OrgTreeNode[];
}

/**
 * Return the full descendant tree rooted at `rootId` (the root included).
 * Returns null if the root org does not exist.
 */
export async function getOrgTree(rootId: string): Promise<OrgTreeNode | null> {
  const rows = await getDescendants(rootId);
  if (rows.length === 0) return null;

  const nodes = new Map<string, OrgTreeNode>();
  for (const o of rows) {
    nodes.set(o.id, {
      id: o.id,
      name: o.name,
      slug: o.slug,
      level: o.level,
      children: [],
    });
  }

  let root: OrgTreeNode | null = null;
  for (const o of rows) {
    const node = nodes.get(o.id)!;
    const parent = o.parent_org_id ? nodes.get(o.parent_org_id) : undefined;
    // Attach to parent only when the parent is within this subtree; the subtree
    // root's parent lives outside it, so that node becomes the tree root.
    if (o.id === rootId || !parent) {
      root = node;
    } else {
      parent.children.push(node);
    }
  }

  // Stable ordering by name within each level.
  const sortRec = (n: OrgTreeNode) => {
    n.children.sort((a, b) => a.name.localeCompare(b.name));
    n.children.forEach(sortRec);
  };
  if (root) sortRec(root);

  return root;
}

/** Flatten a tree to a list with depth, for simple list rendering. */
export function flattenTree(
  node: OrgTreeNode,
  depth = 0,
): Array<OrgTreeNode & { depth: number }> {
  return [
    { ...node, depth },
    ...node.children.flatMap((c) => flattenTree(c, depth + 1)),
  ];
}
