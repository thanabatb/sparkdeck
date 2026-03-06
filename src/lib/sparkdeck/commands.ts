import { generateTaskId, parseItemId } from "./ids";
import { readStorage, reserveNextSparkId, writeStorage } from "./storage";
import type { Spark, SparkId, Task } from "./types";

export const SPARK_INPUT_REQUIRED_MESSAGE = "Please provide an idea description.";
export const FORGE_INPUT_REQUIRED_MESSAGE =
  "Please provide a Spark ID or task description.";

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
