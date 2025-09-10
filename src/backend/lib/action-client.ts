import type { StandardSchemaV1 } from "@standard-schema/spec";

type Fn<TPrevious, TNext> = (prev: TPrevious) => TNext | Promise<TNext>;

// eslint-disable-next-line
type EmptyCtx = Record<string, any>;

type Middleware<P, N extends P> = [...Fn<P, P>[], Fn<P, N>] | [];

function makeReqId() {
  // Cheap, collision-resistant enough for per-invocation correlation
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

class InputActionClient<
  TPreviousContext extends EmptyCtx,
  TNextContext extends TPreviousContext,
  TSchema extends StandardSchemaV1,
> {
  schema: TSchema;
  client: ActionClient<TPreviousContext, TNextContext>;

  constructor(
    client: ActionClient<TPreviousContext, TNextContext>,
    schema: TSchema,
  ) {
    this.client = client;
    this.schema = schema;
  }

  name(name: string) {
    return new InputActionClient(
      new ActionClient(this.client.middleware, name),
      this.schema,
    );
  }

  action<TResult>(
    fn: (input: {
      ctx: TNextContext;
      input: StandardSchemaV1.InferOutput<TSchema>;
    }) => TResult | Promise<TResult>,
  ) {
    return async (input: StandardSchemaV1.InferInput<TSchema>) => {
      const actionName = this.client.actionName ?? "anonymous";
      console.log(`[ACTION ${actionName}] start`);

      const ctx = await this.client.resolveCtx();

      let result = this.schema["~standard"].validate(input);
      if (result instanceof Promise) result = await result;

      if (result.issues) {
        throw new Error(JSON.stringify(result.issues, null, 2));
      }

      const response = await fn({ ctx, input: result.value });

      console.log(`[ACTION ${actionName}] end`);

      return response;
    };
  }
}

export class ActionClient<
  TPreviousContext extends EmptyCtx,
  TNextContext extends TPreviousContext,
> {
  middleware: Middleware<TPreviousContext, TNextContext>;
  actionName: string | undefined;

  constructor(
    middleware: Middleware<TPreviousContext, TNextContext> = [],
    name?: string,
  ) {
    this.middleware = middleware;
    this.actionName = name;
  }

  use<N extends EmptyCtx>(
    fn: Fn<TNextContext, N>,
  ): ActionClient<TNextContext, TNextContext & N> {
    const newMiddleware = [...this.middleware, fn] as Middleware<
      TNextContext,
      TNextContext & N
    >;
    return new ActionClient(newMiddleware);
  }

  name(name: string) {
    return new ActionClient(this.middleware, name);
  }

  action<TResult>(fn: (ctx: TNextContext) => TResult | Promise<TResult>) {
    return async () => {
      const actionName = this.actionName ?? "anonymous";
      console.log(`[ACTION ${actionName}] start`);

      const ctx = await this.resolveCtx();
      const result = await fn(ctx);

      console.log(`[ACTION ${actionName}] end`);
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
