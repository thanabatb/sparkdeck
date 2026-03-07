import { detectItemType, generateId } from "./ids";
import { queryDb, withDbClient } from "../supabase/db";
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
  created_at: string | Date;
  updated_at: string | Date;
}

interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: Task["status"];
  source_spark_id: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

interface BuildRow {
  id: string;
  target_task_id: string | null;
  target_text: string | null;
  status: Build["status"];
  created_at: string | Date;
  updated_at: string | Date;
}

interface CounterRow {
  name: EntityKind;
  next_value: number;
}

const COUNTER_NAMES: EntityKind[] = ["spark", "task", "build"];

function toIsoString(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

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

function mapSparkRow(row: SparkRow): Spark {
  return {
    id: row.id as SparkId,
    title: row.title,
    rawText: row.raw_text,
    status: row.status,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at)
  };
}

function mapTaskRow(row: TaskRow): Task {
  return {
    id: row.id as TaskId,
    title: row.title,
    description: row.description,
    status: row.status,
    sourceSparkId: row.source_spark_id as SparkId | null,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at)
  };
}

function mapBuildRow(row: BuildRow): Build {
  return {
    id: row.id as BuildId,
    targetTaskId: row.target_task_id as TaskId | null,
    targetText: row.target_text,
    status: row.status,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at)
  };
}

function normalizeCounters(rows: CounterRow[]): SparkDeckCounters {
  const counters = createDefaultCounters();

  for (const row of rows) {
    if (row.name === "spark") {
      counters.spark = ensurePositiveInteger(row.next_value, counters.spark);
    }

    if (row.name === "task") {
      counters.task = ensurePositiveInteger(row.next_value, counters.task);
    }

    if (row.name === "build") {
      counters.build = ensurePositiveInteger(row.next_value, counters.build);
    }
  }

  return counters;
}

function throwStorageError(context: string, details: string): never {
  throw new Error(`${context}: ${details}`);
}

function parseReservedCounterValue(value: unknown, counter: EntityKind): number {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  throwStorageError("Failed to reserve counter", `Unexpected value for ${counter} counter.`);
}

async function ensureCountersInitialized(): Promise<void> {
  try {
    await queryDb(
      `insert into public.counters(name, next_value)
       values ('spark', 1), ('task', 1), ('build', 1)
       on conflict (name) do nothing`
    );
  } catch (error) {
    throwStorageError("Failed to initialize counters", (error as Error).message);
  }
}

export function getStorageFilePath(): string {
  return "supabase-postgres://sparkdeck";
}

export async function readStorage(): Promise<SparkDeckData> {
  await ensureCountersInitialized();

  try {
    const [sparksResult, tasksResult, buildsResult, countersResult] = await Promise.all([
      queryDb<SparkRow>("select * from public.sparks"),
      queryDb<TaskRow>("select * from public.tasks"),
      queryDb<BuildRow>("select * from public.builds"),
      queryDb<CounterRow>("select name, next_value from public.counters")
    ]);

    return {
      sparks: sparksResult.rows.map(mapSparkRow),
      tasks: tasksResult.rows.map(mapTaskRow),
      builds: buildsResult.rows.map(mapBuildRow),
      counters: normalizeCounters(countersResult.rows)
    };
  } catch (error) {
    throwStorageError("Failed to read storage", (error as Error).message);
  }
}

export async function writeStorage(data: SparkDeckData): Promise<void> {
  await ensureCountersInitialized();
  const normalized = normalizeStorageData(data);

  await withDbClient(async (client) => {
    await client.query("begin");

    try {
      for (const spark of normalized.sparks) {
        await client.query(
          `insert into public.sparks (id, title, raw_text, status, created_at, updated_at)
           values ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz)
           on conflict (id)
           do update set
             title = excluded.title,
             raw_text = excluded.raw_text,
             status = excluded.status,
             created_at = excluded.created_at,
             updated_at = excluded.updated_at`,
          [
            spark.id,
            spark.title,
            spark.rawText,
            spark.status,
            spark.createdAt,
            spark.updatedAt
          ]
        );
      }

      for (const task of normalized.tasks) {
        await client.query(
          `insert into public.tasks (id, title, description, status, source_spark_id, created_at, updated_at)
           values ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz)
           on conflict (id)
           do update set
             title = excluded.title,
             description = excluded.description,
             status = excluded.status,
             source_spark_id = excluded.source_spark_id,
             created_at = excluded.created_at,
             updated_at = excluded.updated_at`,
          [
            task.id,
            task.title,
            task.description,
            task.status,
            task.sourceSparkId,
            task.createdAt,
            task.updatedAt
          ]
        );
      }

      for (const build of normalized.builds) {
        await client.query(
          `insert into public.builds (id, target_task_id, target_text, status, created_at, updated_at)
           values ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz)
           on conflict (id)
           do update set
             target_task_id = excluded.target_task_id,
             target_text = excluded.target_text,
             status = excluded.status,
             created_at = excluded.created_at,
             updated_at = excluded.updated_at`,
          [
            build.id,
            build.targetTaskId,
            build.targetText,
            build.status,
            build.createdAt,
            build.updatedAt
          ]
        );
      }

      for (const counterName of COUNTER_NAMES) {
        await client.query(
          `insert into public.counters (name, next_value)
           values ($1, $2)
           on conflict (name)
           do update set next_value = excluded.next_value`,
          [counterName, normalized.counters[counterName]]
        );
      }

      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  });
}

export async function reserveNextId(kind: EntityKind): Promise<ItemId> {
  await ensureCountersInitialized();

  try {
    const result = await queryDb<{ reserved_value: number }>(
      "select public.reserve_next_counter($1) as reserved_value",
      [kind]
    );

    const counterValue = parseReservedCounterValue(result.rows[0]?.reserved_value, kind);
    return generateId(kind, counterValue);
  } catch (error) {
    throwStorageError(`Failed to reserve ${kind} ID`, (error as Error).message);
  }
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
  try {
    const result = await queryDb<SparkRow>(
      "select * from public.sparks where id = $1 limit 1",
      [id]
    );

    const row = result.rows[0];
    return row ? mapSparkRow(row) : null;
  } catch (error) {
    throwStorageError("Failed to find spark", (error as Error).message);
  }
}

export async function findTaskById(id: TaskId): Promise<Task | null> {
  try {
    const result = await queryDb<TaskRow>(
      "select * from public.tasks where id = $1 limit 1",
      [id]
    );

    const row = result.rows[0];
    return row ? mapTaskRow(row) : null;
  } catch (error) {
    throwStorageError("Failed to find task", (error as Error).message);
  }
}

export async function findBuildById(id: BuildId): Promise<Build | null> {
  try {
    const result = await queryDb<BuildRow>(
      "select * from public.builds where id = $1 limit 1",
      [id]
    );

    const row = result.rows[0];
    return row ? mapBuildRow(row) : null;
  } catch (error) {
    throwStorageError("Failed to find build", (error as Error).message);
  }
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
