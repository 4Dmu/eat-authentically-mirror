/**
 * Returns a new array after updating each objects property with the provided value
 */
export function withProperty<T, TKey extends keyof T>(
  array: T[],
  property: TKey,
  value: T[TKey],
) {
  for (let i = 0; i < array.length; i++) {
    array[i][property] = value;
  }
  return [...array];
}

/**
 * Mutates array updating each objects property with the provided value
 */
export function setProperty<T, TKey extends keyof T>(
  array: T[],
  property: TKey,
  value: T[TKey],
) {
  for (let i = 0; i < array.length; i++) {
    array[i][property] = value;
  }
  return array;
}

export function some<T>(
  arr: T[],
  requiredNumberOfMatches: number,
  predicate: (value: T) => boolean,
): boolean {
  let hitCount = 0;

  for (const value of arr) {
    if (predicate(value)) {
      hitCount++;
    }

    if (hitCount == requiredNumberOfMatches) {
      break;
    }
  }

  return hitCount >= requiredNumberOfMatches;
}

export function countListItemsByPropertyValues<T, TKey extends keyof T>(
  arr: T[],
  key: TKey,
) {
  const results = new Map<T[TKey], number>();

  for (const value of arr) {
    const current = results.get(value[key]) ?? 0;
    results.set(value[key], current + 1);
  }

  return results.entries();
}
