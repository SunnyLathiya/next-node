type Waiter<T> = {
  execute: (token: string | null) => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

export function createRequestQueue(refresh: () => Promise<string | null>) {
  let refreshing = false;
  const waiters: Waiter<unknown>[] = [];

  return async function recover<T>(
    execute: (token: string | null) => Promise<T>,
  ): Promise<T> {
    if (refreshing) {
      return new Promise<T>((resolve, reject) => {
        waiters.push({
          execute,
          resolve: resolve as (value: unknown) => void,
          reject,
        });
      });
    }

    refreshing = true;
    let nextToken: string | null = null;
    try {
      nextToken = await refresh();
    } catch {
      nextToken = null;
    }

    const pending = waiters.splice(0, waiters.length);
    refreshing = false;

    await Promise.all(
      pending.map(async (waiter) => {
        try {
          waiter.resolve(await waiter.execute(nextToken));
        } catch (error) {
          waiter.reject(error);
        }
      }),
    );

    return execute(nextToken);
  };
}
