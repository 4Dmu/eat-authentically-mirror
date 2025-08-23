/**
 * Returns a new array after updating each objects property with the provided value
 */
export function withProperty<T, TKey extends keyof T>(
  array: T[],
  property: TKey,
  value: T[TKey]
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
  value: T[TKey]
) {
  for (let i = 0; i < array.length; i++) {
    array[i][property] = value;
  }
  return array;
}
