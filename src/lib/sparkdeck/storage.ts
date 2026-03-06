import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateBuildId, generateId, generateSparkId, generateTaskId } from "./ids";
import { detectItemType } from "./ids";
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

const isVercelRuntime = Boolean(process.env.VERCEL);
const STORAGE_FILE = isVercelRuntime
  ? path.join("/tmp", "sparkdeck.json")
  : path.join(process.cwd(), "data", "sparkdeck.json");
const STORAGE_DIR = path.dirname(STORAGE_FILE);

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

function normalizeStorageData(input: unknown): SparkDeckData {
  const candidate = input as Partial<SparkDeckData> | null;
  const counters = candidate?.counters ?? createDefaultCounters();

  return {
    sparks: Array.isArray(candidate?.sparks) ? (candidate.sparks as Spark[]) : [],
    tasks: Array.isArray(candidate?.tasks) ? (candidate.tasks as Task[]) : [],
    builds: Array.isArray(candidate?.builds) ? (candidate.builds as Build[]) : [],
    counters: {
      spark: ensurePositiveInteger(counters.spark, 1),
      task: ensurePositiveInteger(counters.task, 1),
      build: ensurePositiveInteger(counters.build, 1)
    }
  };
}

async function ensureStorageFileExists(): Promise<void> {
  await mkdir(STORAGE_DIR, { recursive: true });

  try {
    await readFile(STORAGE_FILE, "utf8");
  } catch (error) {
    const fsError = error as NodeJS.ErrnoException;
    if (fsError.code !== "ENOENT") {
      throw error;
    }

    await writeStorage(createDefaultStorageData());
  }
}

export function getStorageFilePath(): string {
  return STORAGE_FILE;
}

export async function readStorage(): Promise<SparkDeckData> {
  await ensureStorageFileExists();
  const raw = await readFile(STORAGE_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeStorageData(parsed);
  } catch {
    throw new Error(`Failed to parse storage JSON at ${STORAGE_FILE}.`);
  }
}

export async function writeStorage(data: SparkDeckData): Promise<void> {
  const normalized = normalizeStorageData(data);
  const payload = JSON.stringify(normalized, null, 2);
  await writeFile(STORAGE_FILE, `${payload}\n`, "utf8");
}

export async function reserveNextSparkId(): Promise<SparkId> {
  const data = await readStorage();
  const id = generateSparkId(data.counters.spark);
  data.counters.spark += 1;
  await writeStorage(data);
  return id;
}

export async function reserveNextTaskId(): Promise<TaskId> {
  const data = await readStorage();
  const id = generateTaskId(data.counters.task);
  data.counters.task += 1;
  await writeStorage(data);
  return id;
}

export async function reserveNextBuildId(): Promise<BuildId> {
  const data = await readStorage();
  const id = generateBuildId(data.counters.build);
  data.counters.build += 1;
  await writeStorage(data);
  return id;
}

export async function reserveNextId(kind: EntityKind): Promise<ItemId> {
  const data = await readStorage();
  const id = generateId(kind, data.counters[kind]);
  data.counters[kind] += 1;
  await writeStorage(data);
  return id;
}

export async function findSparkById(id: SparkId): Promise<Spark | null> {
  const data = await readStorage();
  return data.sparks.find((spark) => spark.id === id) ?? null;
}

export async function findTaskById(id: TaskId): Promise<Task | null> {
  const data = await readStorage();
  return data.tasks.find((task) => task.id === id) ?? null;
}

export async function findBuildById(id: BuildId): Promise<Build | null> {
  const data = await readStorage();
  return data.builds.find((build) => build.id === id) ?? null;
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
