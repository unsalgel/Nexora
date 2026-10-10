export const createRefreshCoordinator = <T>() => {
  let pending: Promise<T> | undefined;
  return (refresh: () => Promise<T>): Promise<T> => {
    if (!pending) {
      pending = Promise.resolve().then(refresh).finally(() => { pending = undefined; });
    }
    return pending;
  };
};
