type Result<T, E = Error> = { data: T; error: null } | { data: null; error: E };

// biome-ignore lint/suspicious/noExplicitAny: Need any
export function tryCatch<TArgs extends any[], TResult, E = Error>(
  fn: (...args: TArgs) => TResult | Promise<TResult>
): (...args: TArgs) => Promise<Result<TResult, E>> {
  return async (...args: TArgs): Promise<Result<TResult, E>> => {
    try {
      const result = fn(...args);
      const data = result instanceof Promise ? await result : result;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as E };
    }
  };
}

export function withTry<T, TResult extends T | Promise<T>, E = Error>(
  fn: () => TResult
): (() => TResult) & {
  try: () => Promise<{ data: T | null; error: E | null }>;
};

export function withTry<T, TResult extends T | Promise<T>, TInput, E = Error>(
  fn: (input: TInput) => TResult
): ((input: TInput) => TResult) & {
  try: (input: TInput) => Promise<{ data: T | null; error: E | null }>;
};

// biome-ignore lint/suspicious/noExplicitAny: Need any
export function withTry(fn: any) {
  // biome-ignore lint/suspicious/noExplicitAny: Need any
  const tryFn = async (input?: any) => {
    try {
      const data = await fn(input);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };
  // biome-ignore lint/suspicious/noExplicitAny: Need any
  const wrapped = ((input?: any) => fn(input)) as typeof fn & {
    try: typeof tryFn;
  };

  wrapped.try = tryFn;
  return wrapped;
}
