import { detectItemType, generateId } from "./ids";
import { getSupabaseAdminClient } from "../supabase/client";
import type {
  Build,
  BuildId,
  EntityKind,
  ItemId,
  Spark,
  SparkDeckCounters,
  SparkDeckData,
  SparkDeckItem,
  SparkId,
  Task,
  TaskId
} from "./types";

interface SparkRow {
  id: string;
  title: string;
  raw_text: string;
  status: Spark["status"];
  created_at: string;
  updated_at: string;
}

interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: Task["status"];
  source_spark_id: string | null;
  created_at: string;
  updated_at: string;
}

interface BuildRow {
  id: string;
  target_task_id: string | null;
  target_text: string | null;
  status: Build["status"];
  created_at: string;
  updated_at: string;
}

interface CounterRow {
  name: EntityKind;
  next_value: number;
}

const COUNTER_NAMES: EntityKind[] = ["spark", "task", "build"];

function createDefaultCounters(): SparkDeckCounters {
  return {
    spark: 1,
    task: 1,
    build: 1
  };
}

export function createDefaultStorageData(): SparkDeckData {
  return {
    sparks: [],
    tasks: [],
    builds: [],
    counters: createDefaultCounters()
  };
}

function ensurePositiveInteger(value: unknown, fallback: number): number {
  return Number.isInteger(value) && (value as number) > 0 ? (value as number) : fallback;
}

function normalizeStorageData(input: SparkDeckData): SparkDeckData {
  return {
    sparks: Array.isArray(input.sparks) ? input.sparks : [],
    tasks: Array.isArray(input.tasks) ? input.tasks : [],
    builds: Array.isArray(input.builds) ? input.builds : [],
    counters: {
      spark: ensurePositiveInteger(input.counters?.spark, 1),
      task: ensurePositiveInteger(input.counters?.task, 1),
      build: ensurePositiveInteger(input.counters?.build, 1)
    }
  };
}

function mapSparkRowToSpark(row: SparkRow): Spark {
  return {
    id: row.id as SparkId,
    title: row.title,
    rawText: row.raw_text,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapTaskRowToTask(row: TaskRow): Task {
  return {
    id: row.id as TaskId,
    title: row.title,
    description: row.description,
    status: row.status,
    sourceSparkId: row.source_spark_id as SparkId | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapBuildRowToBuild(row: BuildRow): Build {
  return {
    id: row.id as BuildId,
    targetTaskId: row.target_task_id as TaskId | null,
    targetText: row.target_text,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSparkToRow(spark: Spark): SparkRow {
  return {
    id: spark.id,
    title: spark.title,
    raw_text: spark.rawText,
    status: spark.status,
    created_at: spark.createdAt,
    updated_at: spark.updatedAt
  };
}

function mapTaskToRow(task: Task): TaskRow {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    source_spark_id: task.sourceSparkId,
    created_at: task.createdAt,
    updated_at: task.updatedAt
  };
}

function mapBuildToRow(build: Build): BuildRow {
  return {
    id: build.id,
    target_task_id: build.targetTaskId,
    target_text: build.targetText,
    status: build.status,
    created_at: build.createdAt,
    updated_at: build.updatedAt
  };
}

function countersToRows(counters: SparkDeckCounters): CounterRow[] {
  return [
    { name: "spark", next_value: counters.spark },
    { name: "task", next_value: counters.task },
    { name: "build", next_value: counters.build }
  ];
}

function normalizeCounters(rows: CounterRow[] | null): SparkDeckCounters {
  const base = createDefaultCounters();

  for (const row of rows ?? []) {
    if (row.name === "spark") {
      base.spark = ensurePositiveInteger(row.next_value, 1);
    }

    if (row.name === "task") {
      base.task = ensurePositiveInteger(row.next_value, 1);
    }

    if (row.name === "build") {
      base.build = ensurePositiveInteger(row.next_value, 1);
    }
  }

  return base;
}

function throwStorageError(context: string, details: string): never {
  throw new Error(`${context}: ${details}`);
}

function parseReservedCounterValue(value: unknown, counter: EntityKind): number {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);

    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  throwStorageError("Failed to reserve counter", `Unexpected value for ${counter} counter.`);
}

async function ensureCountersInitialized(): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const initialRows: CounterRow[] = COUNTER_NAMES.map((name) => ({
    name,
    next_value: 1
  }));

  const { error } = await supabase
    .from("counters")
    .upsert(initialRows, { onConflict: "name", ignoreDuplicates: true });

  if (error) {
    throwStorageError("Failed to initialize counters", error.message);
  }
}

async function reserveCounterViaRpc(kind: EntityKind): Promise<unknown> {
  const supabase = getSupabaseAdminClient();

  const primary = await supabase.rpc("reserve_next_counter", {
    counter_name: kind
  });

  if (!primary.error) {
    return primary.data;
  }

  const couldBeArgNameMismatch = primary.error.message.includes(
    "Could not find the function public.reserve_next_counter(counter_name)"
  );

  if (!couldBeArgNameMismatch) {
    throwStorageError(`Failed to reserve ${kind} ID`, primary.error.message);
  }

  const fallback = await supabase.rpc("reserve_next_counter", {
    p_counter_name: kind
  });

  if (fallback.error) {
    throwStorageError(
      `Failed to reserve ${kind} ID`,
      `${fallback.error.message}. Ensure function public.reserve_next_counter(counter_name text) exists, then run: NOTIFY pgrst, 'reload schema';`
    );
  }

  return fallback.data;
}

export function getStorageFilePath(): string {
  return "supabase://sparkdeck";
}

export async function readStorage(): Promise<SparkDeckData> {
  await ensureCountersInitialized();
  const supabase = getSupabaseAdminClient();

  const [sparksResult, tasksResult, buildsResult, countersResult] = await Promise.all([
    supabase.from("sparks").select("*"),
    supabase.from("tasks").select("*"),
    supabase.from("builds").select("*"),
    supabase.from("counters").select("name,next_value")
  ]);

  if (sparksResult.error) {
    throwStorageError("Failed to read sparks", sparksResult.error.message);
  }

  if (tasksResult.error) {
    throwStorageError("Failed to read tasks", tasksResult.error.message);
  }

  if (buildsResult.error) {
    throwStorageError("Failed to read builds", buildsResult.error.message);
  }

  if (countersResult.error) {
    throwStorageError("Failed to read counters", countersResult.error.message);
  }

  return {
    sparks: (sparksResult.data as SparkRow[] | null)?.map(mapSparkRowToSpark) ?? [],
    tasks: (tasksResult.data as TaskRow[] | null)?.map(mapTaskRowToTask) ?? [],
    builds: (buildsResult.data as BuildRow[] | null)?.map(mapBuildRowToBuild) ?? [],
    counters: normalizeCounters(countersResult.data as CounterRow[] | null)
  };
}

export async function writeStorage(data: SparkDeckData): Promise<void> {
  await ensureCountersInitialized();
  const normalized = normalizeStorageData(data);
  const supabase = getSupabaseAdminClient();

  if (normalized.sparks.length > 0) {
    const { error } = await supabase
      .from("sparks")
      .upsert(normalized.sparks.map(mapSparkToRow), { onConflict: "id" });

    if (error) {
      throwStorageError("Failed to write sparks", error.message);
    }
  }

  if (normalized.tasks.length > 0) {
    const { error } = await supabase
      .from("tasks")
      .upsert(normalized.tasks.map(mapTaskToRow), { onConflict: "id" });

    if (error) {
      throwStorageError("Failed to write tasks", error.message);
    }
  }

  if (normalized.builds.length > 0) {
    const { error } = await supabase
      .from("builds")
      .upsert(normalized.builds.map(mapBuildToRow), { onConflict: "id" });

    if (error) {
      throwStorageError("Failed to write builds", error.message);
    }
  }

  const { error: countersError } = await supabase
    .from("counters")
    .upsert(countersToRows(normalized.counters), { onConflict: "name" });

  if (countersError) {
    throwStorageError("Failed to write counters", countersError.message);
  }
}

export async function reserveNextId(kind: EntityKind): Promise<ItemId> {
  await ensureCountersInitialized();
  const data = await reserveCounterViaRpc(kind);
  const nextCounter = parseReservedCounterValue(data, kind);
  return generateId(kind, nextCounter);
}

export async function reserveNextSparkId(): Promise<SparkId> {
  return (await reserveNextId("spark")) as SparkId;
}

export async function reserveNextTaskId(): Promise<TaskId> {
  return (await reserveNextId("task")) as TaskId;
}

export async function reserveNextBuildId(): Promise<BuildId> {
  return (await reserveNextId("build")) as BuildId;
}

export async function findSparkById(id: SparkId): Promise<Spark | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sparks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throwStorageError("Failed to find spark", error.message);
  }

  return data ? mapSparkRowToSpark(data as SparkRow) : null;
}

export async function findTaskById(id: TaskId): Promise<Task | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throwStorageError("Failed to find task", error.message);
  }

  return data ? mapTaskRowToTask(data as TaskRow) : null;
}

export async function findBuildById(id: BuildId): Promise<Build | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("builds")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throwStorageError("Failed to find build", error.message);
  }

  return data ? mapBuildRowToBuild(data as BuildRow) : null;
}

export async function findItemById(id: ItemId): Promise<SparkDeckItem | null> {
  const type = detectItemType(id);

  if (type === "spark") {
    return findSparkById(id as SparkId);
  }

  if (type === "task") {
    return findTaskById(id as TaskId);
  }

  if (type === "build") {
    return findBuildById(id as BuildId);
  }

  return null;
}
