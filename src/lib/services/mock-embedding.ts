import { EMBEDDING_DIMENSION } from "./embedding.constants";

const DEFAULT_DIMENSION = EMBEDDING_DIMENSION;

const normalizeInput = (text: string) => text.normalize("NFKD");

export const createMockEmbeddingVector = (text: string, dimension = DEFAULT_DIMENSION): number[] => {
  const normalized = normalizeInput(text).trim();

  if (!normalized) {
    return Array.from({ length: dimension }, () => 0);
  }

  const vector = Array.from({ length: dimension }, () => 0);
  let primaryHash = 0;
  let secondaryHash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    const charCode = normalized.charCodeAt(index);
    primaryHash = (primaryHash + charCode * (index + 1)) % dimension;
    secondaryHash = (secondaryHash + (charCode ^ (index + 31))) % dimension;

    vector[primaryHash] += (charCode % 17) / 10;
    vector[secondaryHash] += (charCode % 23) / 25;
  }

  const magnitude = Math.sqrt(vector.reduce((accumulator, value) => accumulator + value * value, 0));

  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => Number((value / magnitude).toFixed(6)));
};

export const createMockEmbeddings = (content: string | string[], dimension = DEFAULT_DIMENSION): number[][] => {
  const inputs = Array.isArray(content) ? content : [content];
  return inputs.map((item) => createMockEmbeddingVector(item, dimension));
};
