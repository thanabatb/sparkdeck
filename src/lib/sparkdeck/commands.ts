import { readStorage, reserveNextSparkId, writeStorage } from "./storage";
import type { Spark } from "./types";

export const SPARK_INPUT_REQUIRED_MESSAGE = "Please provide an idea description.";

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
