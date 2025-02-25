// A minimal implementation of the RxJS functions used in the codebase

// Observer interface
export interface Observer<T> {
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}

// Subscription interface
export interface Subscription {
  unsubscribe: () => void;
}

// Operator type
export type Operator<T, R> = (source: Observable<T>) => Observable<R>;

// Observable class
export class Observable<T> {
  constructor(private subscribe_fn: (observer: Observer<T>) => (() => void) | Subscription) {}

  static create<T>(subscribe: (observer: Observer<T>) => (() => void) | Subscription): Observable<T> {
    return new Observable<T>(subscribe);
  }

  subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): Subscription {
    const observer: Observer<T> = typeof observerOrNext === 'function'
      ? { next: observerOrNext, error: error || (() => {}), complete: complete || (() => {}) }
      : { next: observerOrNext?.next || (() => {}), error: observerOrNext?.error || (() => {}), complete: observerOrNext?.complete || (() => {}) };

    let teardown: (() => void) | Subscription;
    try {
      teardown = this.subscribe_fn(observer);
    } catch (err) {
      observer.error(err);
      return { unsubscribe: () => {} };
    }

    if (typeof teardown === 'function') {
      return { unsubscribe: teardown };
    } else {
      return teardown || { unsubscribe: () => {} };
    }
  }

  pipe(...operators: Operator<any, any>[]): Observable<any> {
    return operators.reduce((source, operator) => operator(source), this as any);
  }
}

// Subject class
export class Subject<T> extends Observable<T> {
  private observers: Observer<T>[] = [];
  private closed = false;

  constructor() {
    super((observer) => {
      this.observers.push(observer);
      return {
        unsubscribe: () => {
          const index = this.observers.indexOf(observer);
          if (index !== -1) {
            this.observers.splice(index, 1);
          }
        }
      };
    });
  }

  next(value: T): void {
    if (this.closed) return;
    const observers = this.observers.slice();
    for (const observer of observers) {
      observer.next(value);
    }
  }

  error(err: any): void {
    if (this.closed) return;
    this.closed = true;
    const observers = this.observers.slice();
    for (const observer of observers) {
      observer.error(err);
    }
    this.observers = [];
  }

  complete(): void {
    if (this.closed) return;
    this.closed = true;
    const observers = this.observers.slice();
    for (const observer of observers) {
      observer.complete();
    }
    this.observers = [];
  }
}

// Operators

// filter operator
export function filter<T>(predicate: (value: T) => boolean): Operator<T, T> {
  return (source: Observable<T>) => {
    return Observable.create((observer: Observer<T>) => {
      const subscription = source.subscribe({
        next: (value) => {
          try {
            if (predicate(value)) {
              observer.next(value);
            }
          } catch (err) {
            observer.error(err);
          }
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete()
      });
      return subscription;
    });
  };
}

// share operator
export function share<T>(): Operator<T, T> {
  return (source: Observable<T>) => {
    let refCount = 0;
    let subscription: Subscription | null = null;
    let subject: Subject<T> | null = null;

    return Observable.create((observer: Observer<T>) => {
      refCount++;
      if (!subject) {
        subject = new Subject<T>();
        subscription = source.subscribe({
          next: (value) => subject?.next(value),
          error: (err) => subject?.error(err),
          complete: () => subject?.complete()
        });
      }

      const innerSub = subject.subscribe(observer);

      return {
        unsubscribe: () => {
          innerSub.unsubscribe();
          refCount--;
          if (refCount === 0 && subscription) {
            subscription.unsubscribe();
            subscription = null;
            subject = null;
          }
        }
      };
    });
  };
}

// switchMap operator
export function switchMap<T, R>(project: (value: T) => Observable<R> | Promise<R>): Operator<T, R> {
  return (source: Observable<T>) => {
    return Observable.create((observer: Observer<R>) => {
      let innerSubscription: Subscription | null = null;
      let hasCompleted = false;
      let isUnsubscribed = false;

      const outerSubscription = source.subscribe({
        next: async (value) => {
          try {
            if (innerSubscription) {
              innerSubscription.unsubscribe();
              innerSubscription = null;
            }

            let innerSource: Observable<R>;
            const result = project(value);
            
            if (result instanceof Promise) {
              try {
                const resolvedValue = await result;
                if (isUnsubscribed) return;
                observer.next(resolvedValue);
                if (hasCompleted) observer.complete();
              } catch (err) {
                if (isUnsubscribed) return;
                observer.error(err);
              }
              return;
            } else {
              innerSource = result;
            }

            innerSubscription = innerSource.subscribe({
              next: (innerValue) => observer.next(innerValue),
              error: (err) => observer.error(err),
              complete: () => {
                innerSubscription = null;
                if (hasCompleted) observer.complete();
              }
            });
          } catch (err) {
            observer.error(err);
          }
        },
        error: (err) => {
          observer.error(err);
        },
        complete: () => {
          hasCompleted = true;
          if (!innerSubscription) {
            observer.complete();
          }
        }
      });

      return {
        unsubscribe: () => {
          isUnsubscribed = true;
          if (innerSubscription) {
            innerSubscription.unsubscribe();
          }
          outerSubscription.unsubscribe();
        }
      };
    });
  };
}

// take operator
export function take<T>(count: number): Operator<T, T> {
  return (source: Observable<T>) => {
    return Observable.create((observer: Observer<T>) => {
      let taken = 0;
      
      const subscription = source.subscribe({
        next: (value) => {
          if (taken < count) {
            taken++;
            observer.next(value);
            if (taken === count) {
              observer.complete();
              subscription.unsubscribe();
            }
          }
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete()
      });

      return subscription;
    });
  };
}

// takeUntil operator
export function takeUntil<T>(notifier: Observable<any>): Operator<T, T> {
  return (source: Observable<T>) => {
    return Observable.create((observer: Observer<T>) => {
      const sourceSubscription = source.subscribe({
        next: (value) => observer.next(value),
        error: (err) => observer.error(err),
        complete: () => observer.complete()
      });

      const notifierSubscription = notifier.subscribe({
        next: () => {
          observer.complete();
          sourceSubscription.unsubscribe();
          notifierSubscription.unsubscribe();
        },
        error: (err) => observer.error(err)
      });

      return {
        unsubscribe: () => {
          sourceSubscription.unsubscribe();
          notifierSubscription.unsubscribe();
        }
      };
    });
  };
}

// tap operator
export function tap<T>(
  nextOrObserver?: ((value: T) => void) | Partial<Observer<T>>
): Operator<T, T> {
  const next = typeof nextOrObserver === 'function' 
    ? nextOrObserver 
    : nextOrObserver?.next || (() => {});
  const error = typeof nextOrObserver === 'object' ? nextOrObserver.error : undefined;
  const complete = typeof nextOrObserver === 'object' ? nextOrObserver.complete : undefined;

  return (source: Observable<T>) => {
    return Observable.create((observer: Observer<T>) => {
      return source.subscribe({
        next: (value) => {
          try {
            next(value);
          } catch (err) {
            observer.error(err);
            return;
          }
          observer.next(value);
        },
        error: (err) => {
          if (error) {
            try {
              error(err);
            } catch (err) {
              observer.error(err);
              return;
            }
          }
          observer.error(err);
        },
        complete: () => {
          if (complete) {
            try {
              complete();
            } catch (err) {
              observer.error(err);
              return;
            }
          }
          observer.complete();
        }
      });
    });
  };
}

// merge function
export function merge<T>(...sources: Observable<T>[]): Observable<T> {
  return Observable.create((observer: Observer<T>) => {
    const subscriptions: Subscription[] = [];
    let completed = 0;

    for (const source of sources) {
      const subscription = source.subscribe({
        next: (value) => observer.next(value),
        error: (err) => {
          observer.error(err);
          subscriptions.forEach(sub => sub.unsubscribe());
        },
        complete: () => {
          completed++;
          if (completed === sources.length) {
            observer.complete();
          }
        }
      });
      
      subscriptions.push(subscription);
    }

    return {
      unsubscribe: () => {
        subscriptions.forEach(sub => sub.unsubscribe());
      }
    };
  });
} 