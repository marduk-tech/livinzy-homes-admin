// SEO Optimize (Marketing > SEO Optimize) - shapes returned by
// /marketing/seo/* in livinzy-homes-services (services/seo/README.md).

export type SeoTaskStatus =
  | "proposed"
  | "approved"
  | "drafting"
  | "in_qa"
  | "ready"
  | "published"
  | "measuring"
  | "done"
  | "rejected"
  | "needs_changes"
  | "rolled_back"
  | "cancelled";

export type SeoTaskGroup = "inbox" | "in_progress" | "ready" | "measuring" | "closed";

export const SEO_CATEGORIES: Record<number, string> = {
  1: "Technical health",
  2: "Indexing",
  3: "Refresh",
  4: "Titles and meta",
  5: "Internal linking",
  6: "Merge or prune",
  8: "New content",
};

export interface SeoTitleOption {
  title: string;
  description: string;
  rationale?: string;
}

export interface SeoLinkOption {
  sourceUrl: string;
  sentence: string;
  anchorText: string;
  reason?: string;
  sourceKind?: string;
  selected?: boolean;
  applied?: boolean;
}

export interface SeoMeasure {
  days: number;
  before: { clicks: number; impressions: number; ctr: number; position: number | null };
  after: { clicks: number; impressions: number; ctr: number; position: number | null };
  conversions?: { before: number; after: number } | null;
  indexed?: boolean;
  verdict?: string;
}

export interface SeoTask {
  _id: string;
  category: number;
  priority: "P1" | "P2" | "P3" | "P4";
  status: SeoTaskStatus;
  title: string;
  targetUrl?: string;
  targetRef?: { kind?: string; id?: string; slug?: string };
  trigger?: { source?: string; rule?: string };
  evidence?: any;
  proposal?: string;
  successMetric?: string;
  draft?: {
    before?: any;
    after?: any;
    options?: (SeoTitleOption & SeoLinkOption)[];
    selectedOption?: number;
    brief?: any;
  };
  qa?: { passed?: boolean; notes?: string[]; rounds?: number };
  notes?: { text: string; by?: string; at?: string }[];
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  snoozedUntil?: string;
  publishedAt?: string;
  baseline?: any;
  inspections?: { dueAt: string; doneAt?: string; result?: any }[];
  results?: {
    d14?: SeoMeasure & { stillFailing?: number; of?: number };
    d28?: SeoMeasure;
    verdict?: string | null;
    suggestRollback?: boolean;
  };
  links?: { ghostId?: string; githubIssue?: string; previewUrl?: string };
  error?: string;
  weekOf?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeoMetric {
  value: number;
  previous: number;
}

export interface SeoSummary {
  weekOf: string;
  metrics: {
    clicks: SeoMetric;
    impressions: SeoMetric;
    organicLeads: SeoMetric;
    organicSessions: SeoMetric;
  };
  health: { failingChecks: number; unindexedPages: number };
  tasks: { inbox: number; inProgress: number; ready: number; measuring: number };
  integrations: Record<string, boolean>;
  jobs: {
    name: string;
    schedule: string;
    does: string;
    lastRun: {
      status: "running" | "ok" | "failed";
      startedAt: string;
      finishedAt?: string;
      result?: any;
      error?: string;
    } | null;
  }[];
}

export interface SeoHealth {
  weekOf: string;
  checks: {
    cause: string;
    count: number;
    taskId?: string;
    urls: { url: string; expected: string; actual: string }[];
  }[];
  orphans: { url: string; title?: string }[];
  coverage: Record<string, number>;
  notIndexed: { url: string; firstSeenAt?: string; latest?: { indexVerdict?: string; indexCheckedAt?: string } }[];
  coreWebVitals: { url: string; template: string; lcpMs?: number; inpMs?: number; cls?: number; source?: string }[];
}

export interface SeoQuestionTopic {
  _id: string;
  label: string;
  exampleQuestions: string[];
  lastWeekCount?: number;
  isComparison?: boolean;
  entities?: string[];
  coveredByUrl?: string;
  coverageNote?: string;
  markedCoveredBy?: string;
  trend: { weekOf: string; count: number }[];
}

export interface SeoPage {
  _id: string;
  url: string;
  kind: string;
  inSitemap?: boolean;
  firstSeenAt?: string;
  title?: string;
  ignored?: boolean;
  latest?: {
    weekOf?: string;
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
    conversions?: number;
    status?: number;
    failingChecks?: number;
    inLinks?: number;
    indexVerdict?: string;
  };
}

export interface SeoPlaybookEntry {
  _id: string;
  kind: "fact" | "voice" | "rule" | "correction";
  text: string;
  addedBy?: string;
  createdAt: string;
}

export interface SeoSettings {
  thresholds: Record<string, number | string[]>;
  defaults: Record<string, number | string[]>;
}
