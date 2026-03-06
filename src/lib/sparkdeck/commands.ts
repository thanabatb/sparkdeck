import { generateBuildId, generateTaskId, parseItemId } from "./ids";
import { readStorage, reserveNextSparkId, writeStorage } from "./storage";
import type { Build, Spark, SparkId, Task, TaskId } from "./types";

export const SPARK_INPUT_REQUIRED_MESSAGE = "Please provide an idea description.";
export const FORGE_INPUT_REQUIRED_MESSAGE =
  "Please provide a Spark ID or task description.";
export const BUILD_INPUT_REQUIRED_MESSAGE =
  "Please provide a Task ID or build target description.";
export const INVALID_ITEM_ID_MESSAGE =
  "Invalid ID format. Use SPARK-001, TASK-001, or BUILD-001.";

function normalizeInputText(inputText: string): string {
  return inputText.trim();
}

export async function createSpark(inputText: string): Promise<Spark> {
  const normalizedText = normalizeInputText(inputText);

  if (!normalizedText) {
    throw new Error(SPARK_INPUT_REQUIRED_MESSAGE);
  }

  const id = await reserveNextSparkId();
  const timestamp = new Date().toISOString();

  const spark: Spark = {
    id,
    title: normalizedText,
    rawText: normalizedText,
    status: "inbox",
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const storage = await readStorage();
  storage.sparks.push(spark);
  await writeStorage(storage);

  return spark;
}

export async function createTaskFromInput(input: string): Promise<Task> {
  const normalizedInput = normalizeInputText(input);

  if (!normalizedInput) {
    throw new Error(FORGE_INPUT_REQUIRED_MESSAGE);
  }

  const storage = await readStorage();
  const parsedId = parseItemId(normalizedInput);
  const timestamp = new Date().toISOString();

  let title = normalizedInput;
  let description = normalizedInput;
  let sourceSparkId: SparkId | null = null;

  if (parsedId?.kind === "spark") {
    const sparkId = parsedId.normalized as SparkId;
    const spark = storage.sparks.find((item) => item.id === sparkId);

    if (!spark) {
      throw new Error(`Spark not found: ${sparkId}`);
    }

    title = spark.title;
    description = spark.rawText;
    sourceSparkId = spark.id;
    spark.status = "forged";
    spark.updatedAt = timestamp;
  }

  const task: Task = {
    id: generateTaskId(storage.counters.task),
    title,
    description,
    status: "todo",
    sourceSparkId,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  storage.counters.task += 1;
  storage.tasks.push(task);
  await writeStorage(storage);

  return task;
}

export async function createBuild(input: string): Promise<Build> {
  const normalizedInput = normalizeInputText(input);

  if (!normalizedInput) {
    throw new Error(BUILD_INPUT_REQUIRED_MESSAGE);
  }

  const storage = await readStorage();
  const parsedId = parseItemId(normalizedInput);
  const timestamp = new Date().toISOString();

  let targetTaskId: TaskId | null = null;
  let targetText: string | null = normalizedInput;

  if (parsedId?.kind === "task") {
    const taskId = parsedId.normalized as TaskId;
    const task = storage.tasks.find((item) => item.id === taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    targetTaskId = task.id;
    targetText = null;
  }

  const build: Build = {
    id: generateBuildId(storage.counters.build),
    targetTaskId,
    targetText,
    status: "pending",
    createdAt: timestamp,
    updatedAt: timestamp
  };

  storage.counters.build += 1;
  storage.builds.push(build);
  await writeStorage(storage);

  return build;
}

export type ItemStatusResponse =
  | {
      type: "spark";
      id: string;
      title: string;
      status: Spark["status"];
    }
  | {
      type: "task";
      id: string;
      title: string;
      status: Task["status"];
      sourceSparkId: SparkId | null;
    }
  | {
      type: "build";
      id: string;
      status: "pending" | "running" | "completed" | "failed";
      targetTaskId: string | null;
      targetText: string | null;
    };

export async function getItemStatus(id: string): Promise<ItemStatusResponse> {
  const parsed = parseItemId(id);

  if (!parsed) {
    throw new Error(INVALID_ITEM_ID_MESSAGE);
  }

  const storage = await readStorage();

  if (parsed.kind === "spark") {
    const spark = storage.sparks.find((item) => item.id === parsed.normalized);

    if (!spark) {
      throw new Error(`Spark not found: ${parsed.normalized}`);
    }

    return {
      type: "spark",
      id: spark.id,
      title: spark.title,
      status: spark.status
    };
  }

  if (parsed.kind === "task") {
    const task = storage.tasks.find((item) => item.id === parsed.normalized);

    if (!task) {
      throw new Error(`Task not found: ${parsed.normalized}`);
    }

    return {
      type: "task",
      id: task.id,
      title: task.title,
      status: task.status,
      sourceSparkId: task.sourceSparkId
    };
  }

  const build = storage.builds.find((item) => item.id === parsed.normalized);

  if (!build) {
    throw new Error(`Build not found: ${parsed.normalized}`);
  }

  return {
    type: "build",
    id: build.id,
    status: build.status,
    targetTaskId: build.targetTaskId,
    targetText: build.targetText
  };
}
