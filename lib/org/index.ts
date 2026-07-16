/**
 * Server-only org helpers (spec sections 2 & 2.5). Import from /api/org routes
 * after authorizing the caller — all reach data via serviceClient() (rule #1).
 */
export { getRootPlan } from "./getRootPlan";
export { getOrgTree, flattenTree, type OrgTreeNode } from "./getOrgTree";
export { canCreateSubArea, type SubAreaCheck } from "./canCreateSubArea";
export {
  getRootOrg,
  getDescendants,
  getAncestors,
  countSubOrgs,
  createSubOrg,
} from "./rpc";
