import type {
  BuildId,
  EntityKind,
  IdPrefix,
  ItemId,
  SparkId,
  TaskId
} from "./types";

const ID_PADDING = 3;
const ID_REGEX = /^(SPARK|TASK|BUILD)-(\d{3,})$/;

const PREFIX_BY_KIND: Record<EntityKind, IdPrefix> = {
  spark: "SPARK",
  task: "TASK",
  build: "BUILD"
};

const KIND_BY_PREFIX: Record<IdPrefix, EntityKind> = {
  SPARK: "spark",
  TASK: "task",
  BUILD: "build"
};

function formatIdNumber(counter: number, padding = ID_PADDING): string {
  if (!Number.isInteger(counter) || counter < 1) {
    throw new Error("ID counter must be a positive integer.");
  }

  return String(counter).padStart(padding, "0");
}

export function generateSparkId(counter: number): SparkId {
  return `SPARK-${formatIdNumber(counter)}`;
}

export function generateTaskId(counter: number): TaskId {
  return `TASK-${formatIdNumber(counter)}`;
}

export function generateBuildId(counter: number): BuildId {
  return `BUILD-${formatIdNumber(counter)}`;
}

export function generateId(kind: EntityKind, counter: number): ItemId {
  return `${PREFIX_BY_KIND[kind]}-${formatIdNumber(counter)}` as ItemId;
}

export interface ParsedItemId {
  raw: string;
  normalized: ItemId;
  prefix: IdPrefix;
  kind: EntityKind;
  sequence: number;
}

export function parseItemId(input: string): ParsedItemId | null {
  const raw = input.trim();
  const upper = raw.toUpperCase();
  const match = upper.match(ID_REGEX);

  if (!match) {
    return null;
  }

  const prefix = match[1] as IdPrefix;
  const numericPart = match[2];
  const sequence = Number.parseInt(numericPart, 10);

  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    return null;
  }

  return {
    raw,
    normalized: `${prefix}-${numericPart}` as ItemId,
    prefix,
    kind: KIND_BY_PREFIX[prefix],
    sequence
  };
}

export function detectItemType(input: string): EntityKind | null {
  return parseItemId(input)?.kind ?? null;
}

export function isItemId(input: string): input is ItemId {
  return parseItemId(input) !== null;
}

export function isSparkId(input: string): input is SparkId {
  return detectItemType(input) === "spark";
}

export function isTaskId(input: string): input is TaskId {
  return detectItemType(input) === "task";
}

export function isBuildId(input: string): input is BuildId {
  return detectItemType(input) === "build";
}
