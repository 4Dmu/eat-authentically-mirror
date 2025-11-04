export function throwIfNullable<T>(
  value: T,
  message = "Value was null"
): NonNullable<T> {
  if (value == null || value === undefined) {
    throw new Error(message);
  }
  return value;
}

export async function throwIfNullableAsync<T>(
  promise: Promise<T>,
  message = "Value was null"
): Promise<NonNullable<T>> {
  const value = await promise;
  if (value == null || value === undefined) {
    throw new Error(message);
  }
  return value;
}
