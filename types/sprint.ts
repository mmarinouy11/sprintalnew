export type SprintStatus = "planned" | "active" | "closed";

/** A row from the sprints table. */
export interface Sprint {
  id: string;
  org_id: string;
  name: string;
  status: SprintStatus;
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}
