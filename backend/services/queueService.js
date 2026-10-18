/**
 * Lightweight in-memory concurrency limiter / queue.
 * Ensures CPU-heavy operations (like bcrypt password hashing) do not choke
 * the Node.js event loop or starve the libuv threadpool.
 */

class ConcurrencyQueue {
  constructor(concurrency = 10) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  run(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.dequeue();
    });
  }

  dequeue() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const { fn, resolve, reject } = this.queue.shift();
    this.running++;

    Promise.resolve()
      .then(() => fn())
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      })
      .finally(() => {
        this.running--;
        this.dequeue();
      });
  }

  get stats() {
    return {
      running: this.running,
      queued: this.queue.length,
      concurrency: this.concurrency,
    };
  }
}

// Global bcrypt concurrency limiter (max 10 concurrent bcrypt tasks)
const bcryptQueue = new ConcurrencyQueue(10);

// Global database write queue for quiz submissions (throttles concurrent writes to Atlas M0)
const submitQueue = new ConcurrencyQueue(15);

module.exports = {
  ConcurrencyQueue,
  bcryptQueue,
  submitQueue,
};
