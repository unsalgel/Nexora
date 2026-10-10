interface HubLifecycle {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  onclose: (callback: () => void) => void;
}
// İlk bağlantı hatası ve otomatik yeniden bağlanma tükendiğinde tekrar dener.
export const startHubConnection = (connection: HubLifecycle, retryDelay = 5000) => {
  let stopped = false, starting = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    if (stopped || timer)
      return;
    timer = setTimeout(() => { timer = undefined; void start(); }, retryDelay);
  };
  const start = async () => {
    if (stopped || starting)
      return;
    starting = true;
    try {
      await connection.start();
    }
    catch {
      schedule();
    }
    finally {
      starting = false;
    }
  };
  connection.onclose(schedule);
  void start();
  return () => { stopped = true; if (timer)
    clearTimeout(timer); void connection.stop().catch(() => { }); };
};
