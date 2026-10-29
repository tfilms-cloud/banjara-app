/** Limit Expo's promise-based binary cache I/O; graceful-fs only patches callbacks. */
function limitCacheStores(stores, { concurrency = 8, retries = 5, retryDelayMs = 25 } = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error('Cache concurrency must be positive');
  let active = 0;
  const waiting = [];
  const drain = () => {
    while (active < concurrency && waiting.length) {
      const { task, resolve, reject } = waiting.shift();
      active++;
      Promise.resolve().then(task).then(resolve, reject).finally(() => { active--; drain(); });
    }
  };
  const run = task => new Promise((resolve, reject) => { waiting.push({ task, resolve, reject }); drain(); });
  const retry = async operation => {
    for (let attempt = 0; ; attempt++) {
      try { return await operation(); }
      catch (error) {
        if (!['EMFILE', 'ENFILE'].includes(error?.code) || attempt >= retries) throw error;
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * 2 ** attempt));
      }
    }
  };
  const wrap = list => list.map(store => ({
    name: `Limited${store.name ?? store.constructor.name}`,
    get: key => run(() => retry(() => store.get(key))),
    set: (key, value) => run(() => retry(() => store.set(key, value))),
    // Metro clears stores before starting a new graph; retain the store's synchronous contract.
    clear: () => store.clear(),
  }));
  return typeof stores === 'function' ? metroCache => wrap(stores(metroCache)) : wrap(stores);
}

module.exports = { limitCacheStores };
