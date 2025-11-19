import type { StandardSchemaV1 } from "@standard-schema/spec";

type Logger = {
  debug: (
    message: string,
    // biome-ignore lint/suspicious/noExplicitAny: Need any
    args?: Record<string | symbol, any> | undefined
  ) => void;
  info: (
    message: string,
    // biome-ignore lint/suspicious/noExplicitAny: Need any
    args?: Record<string | symbol, any> | undefined
  ) => void;
  warn: (
    message: string,
    // biome-ignore lint/suspicious/noExplicitAny: Need any
    args?: Record<string | symbol, any> | undefined
  ) => void;
  error: (
    message: string,
    // biome-ignore lint/suspicious/noExplicitAny: Need any
    args?: Record<string | symbol, any> | undefined
  ) => void;
};

type Fn<TPrevious, TNext> = (prev: TPrevious) => TNext | Promise<TNext>;

// biome-ignore lint/suspicious/noExplicitAny: Need any
type EmptyCtx = Record<string, any>;

type Middleware<P, N extends P> = [...Fn<P, P>[], Fn<P, N>] | [];

class InputActionClient<
  TPreviousContext extends EmptyCtx,
  TNextContext extends TPreviousContext,
  TSchema extends StandardSchemaV1
> {
  schema: TSchema;
  client: ActionClient<TPreviousContext, TNextContext>;

  constructor(
    client: ActionClient<TPreviousContext, TNextContext>,
    schema: TSchema
  ) {
    this.client = client;
    this.schema = schema;
  }

  name(name: string) {
    return new InputActionClient(
      new ActionClient(this.client.middleware, this.client.log, name),
      this.schema
    );
  }

  action<TResult>(
    fn: (input: {
      ctx: TNextContext;
      input: StandardSchemaV1.InferOutput<TSchema>;
    }) => TResult | Promise<TResult>
  ) {
    return async (input: StandardSchemaV1.InferInput<TSchema>) => {
      const actionName = this.client.actionName ?? "anonymous";
      this.client.log.info(`[ACTION ${actionName}] start`);

      const ctx = await this.client.resolveCtx();

      let result = this.schema["~standard"].validate(input);
      if (result instanceof Promise) result = await result;

      if (result.issues) {
        throw new Error(JSON.stringify(result.issues, null, 2));
      }

      const response = await fn({ ctx, input: result.value });

      this.client.log.info(`[ACTION ${actionName}] end`);

      return response;
    };
  }
}

export class ActionClient<
  TPreviousContext extends EmptyCtx,
  TNextContext extends TPreviousContext
> {
  middleware: Middleware<TPreviousContext, TNextContext>;
  actionName: string | undefined;
  log: Logger;

  constructor(
    middleware: Middleware<TPreviousContext, TNextContext> = [],
    log: Logger,
    name?: string
  ) {
    this.middleware = middleware;
    this.log = log;
    this.actionName = name;
  }

  use<N extends EmptyCtx>(
    fn: Fn<TNextContext, N>
  ): ActionClient<TNextContext, TNextContext & N> {
    const newMiddleware = [...this.middleware, fn] as Middleware<
      TNextContext,
      TNextContext & N
    >;
    return new ActionClient(newMiddleware, this.log);
  }

  name(name: string) {
    return new ActionClient(this.middleware, this.log, name);
  }

  action<TResult>(fn: (ctx: TNextContext) => TResult | Promise<TResult>) {
    return async () => {
      const actionName = this.actionName ?? "anonymous";
      this.log.info(`[ACTION ${actionName}] start`);

      const ctx = await this.resolveCtx();
      const result = await fn(ctx);

      this.log.info(`[ACTION ${actionName}] end`);
      return result;
    };
  }

  async resolveCtx() {
    let ctx: EmptyCtx = {};
    for (const fn of this.middleware) {
      const result = await fn(ctx as TPreviousContext);
      ctx = { ...ctx, ...result };
    }
    return ctx as TNextContext;
  }

  input<T extends StandardSchemaV1>(schema: T) {
    return new InputActionClient(this, schema);
  }
}
