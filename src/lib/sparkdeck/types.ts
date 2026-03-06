export type SparkStatus = "inbox" | "expanded" | "forged" | "archived";

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";

export type BuildStatus = "pending" | "running" | "completed" | "failed";

export type EntityKind = "spark" | "task" | "build";

export type IdPrefix = "SPARK" | "TASK" | "BUILD";

export type SparkId = `SPARK-${string}`;
export type TaskId = `TASK-${string}`;
export type BuildId = `BUILD-${string}`;
export type ItemId = SparkId | TaskId | BuildId;

export interface Spark {
  id: SparkId;
  title: string;
  rawText: string;
  status: SparkStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: TaskId;
  title: string;
  description: string;
  status: TaskStatus;
  sourceSparkId: SparkId | null;
  createdAt: string;
  updatedAt: string;
}

export interface Build {
  id: BuildId;
  targetTaskId: TaskId | null;
  targetText: string | null;
  status: BuildStatus;
  createdAt: string;
  updatedAt: string;
}

export type SparkDeckItem = Spark | Task | Build;

export interface SparkDeckCounters {
  spark: number;
  task: number;
  build: number;
}

export interface SparkDeckData {
  sparks: Spark[];
  tasks: Task[];
  builds: Build[];
  counters: SparkDeckCounters;
}
