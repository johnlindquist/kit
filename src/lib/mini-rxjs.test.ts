import test from 'ava'
import {
  Observable,
  Subject,
  filter,
  share,
  switchMap,
  take,
  takeUntil,
  tap,
  merge
} from './mini-rxjs'

// Helper function to collect values from an Observable
function collectValues<T>(observable: Observable<T>, count?: number): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const values: T[] = []
    let subscription: any;
    
    subscription = observable.subscribe({
      next: (value) => {
        values.push(value)
        if (count !== undefined && values.length >= count) {
          subscription.unsubscribe()
          resolve(values)
        }
      },
      error: (err) => reject(err),
      complete: () => resolve(values)
    })
  })
}

// Tests for Observable
test('Observable - basic subscription', async (t) => {
  const observable = new Observable<number>((observer) => {
    observer.next(1)
    observer.next(2)
    observer.next(3)
    observer.complete()
    return () => {}
  })

  const values = await collectValues(observable)
  t.deepEqual(values, [1, 2, 3])
})

test('Observable - error handling', async (t) => {
  const observable = new Observable<number>((observer) => {
    observer.next(1)
    observer.error(new Error('Test error'))
    return () => {}
  })

  await t.throwsAsync(async () => {
    await collectValues(observable)
  }, { message: 'Test error' })
})

test('Observable.create', async (t) => {
  const observable = Observable.create<number>((observer) => {
    observer.next(1)
    observer.next(2)
    observer.complete()
    return () => {}
  })

  const values = await collectValues(observable)
  t.deepEqual(values, [1, 2])
})

test('Observable - subscription with function', async (t) => {
  const values: number[] = []
  const observable = new Observable<number>((observer) => {
    observer.next(1)
    observer.next(2)
    observer.complete()
    return () => {}
  })

  observable.subscribe((value) => values.push(value))
  t.deepEqual(values, [1, 2])
})

test('Observable - unsubscribe', (t) => {
  let unsubscribeCalled = false
  const observable = new Observable<number>((observer) => {
    return () => {
      unsubscribeCalled = true
    }
  })

  const subscription = observable.subscribe()
  subscription.unsubscribe()
  t.true(unsubscribeCalled)
})

// Tests for Subject
test('Subject - basic functionality', (t) => {
  const subject = new Subject<number>()
  const values: number[] = []

  subject.subscribe((value) => values.push(value))
  subject.next(1)
  subject.next(2)
  subject.next(3)
  subject.complete()

  t.deepEqual(values, [1, 2, 3])
})

test('Subject - multiple subscribers', (t) => {
  const subject = new Subject<number>()
  const values1: number[] = []
  const values2: number[] = []

  subject.subscribe((value) => values1.push(value))
  subject.next(1)
  
  subject.subscribe((value) => values2.push(value))
  subject.next(2)
  subject.next(3)
  
  t.deepEqual(values1, [1, 2, 3])
  t.deepEqual(values2, [2, 3])
})

test('Subject - error handling', (t) => {
  const subject = new Subject<number>()
  let errorCaught = false

  subject.subscribe({
    next: () => {},
    error: () => { errorCaught = true }
  })

  subject.error(new Error('Test error'))
  t.true(errorCaught)
  
  // After error, subject should be closed
  const values: number[] = []
  subject.subscribe((value) => values.push(value))
  subject.next(1)
  t.deepEqual(values, [])
})

test('Subject - completion', (t) => {
  const subject = new Subject<number>()
  let completed = false

  subject.subscribe({
    next: () => {},
    complete: () => { completed = true }
  })

  subject.complete()
  t.true(completed)
  
  // After completion, subject should be closed
  const values: number[] = []
  subject.subscribe((value) => values.push(value))
  subject.next(1)
  t.deepEqual(values, [])
})

// Tests for operators
test('filter operator', async (t) => {
  const observable = new Observable<number>((observer) => {
    observer.next(1)
    observer.next(2)
    observer.next(3)
    observer.next(4)
    observer.complete()
    return () => {}
  })

  const filtered = observable.pipe(filter(x => x % 2 === 0))
  const values = await collectValues(filtered)
  t.deepEqual(values, [2, 4])
})

// Fixed share operator test
test('share operator', (t) => {
  let subscribeCount = 0
  const subject = new Subject<number>()
  
  const shared = subject.pipe(share())
  
  const values1: number[] = []
  const values2: number[] = []
  
  shared.subscribe(value => values1.push(value))
  shared.subscribe(value => values2.push(value))
  
  subject.next(1)
  subject.next(2)
  
  t.deepEqual(values1, [1, 2])
  t.deepEqual(values2, [1, 2])
})

// Fixed switchMap operator with Observable test
test('switchMap operator with Observable', (t) => {
  const subject = new Subject<number>()
  const values: string[] = []

  const switched = subject.pipe(
    switchMap(x => new Observable<string>(observer => {
      observer.next(`Value: ${x}`)
      observer.complete()
      return () => {}
    }))
  )

  switched.subscribe({
    next: value => values.push(value),
    complete: () => {}
  })
  
  subject.next(1)
  subject.next(2)
  subject.complete()
  
  t.deepEqual(values, ['Value: 1', 'Value: 2'])
})

test('switchMap operator with Promise', async (t) => {
  const observable = new Observable<number>((observer) => {
    observer.next(1)
    observer.next(2)
    observer.complete()
    return () => {}
  })

  const switched = observable.pipe(
    switchMap(x => Promise.resolve(`Value: ${x}`))
  )

  const values = await collectValues(switched)
  t.deepEqual(values, ['Value: 1', 'Value: 2'])
})

test('take operator', async (t) => {
  const observable = new Observable<number>((observer) => {
    observer.next(1)
    observer.next(2)
    observer.next(3)
    observer.next(4)
    observer.complete()
    return () => {}
  })

  const taken = observable.pipe(take(2))
  const values = await collectValues(taken)
  t.deepEqual(values, [1, 2])
})

test('takeUntil operator', async (t) => {
  const observable = new Observable<number>((observer) => {
    observer.next(1)
    observer.next(2)
    setTimeout(() => {
      observer.next(3) // This should not be emitted
      observer.complete()
    }, 50)
    return () => {}
  })

  const notifier = new Subject<void>()
  const taken = observable.pipe(takeUntil(notifier))
  
  setTimeout(() => {
    notifier.next()
  }, 10)

  const values = await collectValues(taken)
  t.deepEqual(values, [1, 2])
})

test('tap operator', async (t) => {
  const observable = new Observable<number>((observer) => {
    observer.next(1)
    observer.next(2)
    observer.complete()
    return () => {}
  })

  const tappedValues: number[] = []
  const tapped = observable.pipe(tap(value => tappedValues.push(value)))
  
  await collectValues(tapped)
  t.deepEqual(tappedValues, [1, 2])
})

test('tap operator with observer object', async (t) => {
  const observable = new Observable<number>((observer) => {
    observer.next(1)
    observer.next(2)
    observer.complete()
    return () => {}
  })

  const events: string[] = []
  const tapped = observable.pipe(
    tap({
      next: value => events.push(`Next: ${value}`),
      complete: () => events.push('Completed')
    })
  )
  
  await collectValues(tapped)
  t.deepEqual(events, ['Next: 1', 'Next: 2', 'Completed'])
})

test('merge operator', async (t) => {
  const observable1 = new Observable<number>((observer) => {
    observer.next(1)
    observer.next(3)
    observer.complete()
    return () => {}
  })

  const observable2 = new Observable<number>((observer) => {
    observer.next(2)
    observer.next(4)
    observer.complete()
    return () => {}
  })

  const merged = merge(observable1, observable2)
  const values = await collectValues(merged)
  
  // Order might vary, so we sort before comparing
  t.deepEqual(values.sort(), [1, 2, 3, 4])
})

// Fixed pipe with multiple operators test
test('pipe with multiple operators', (t) => {
  const subject = new Subject<number>()
  const values: number[] = []

  const result = subject.pipe(
    filter(x => x % 2 === 1), // 1, 3, 5
    take(2),                  // 1, 3
    tap(x => x),              // No change, just for side effects
    switchMap(x => Observable.create(observer => {
      observer.next(x * 10)
      observer.complete()
      return () => {}
    }))
  )

  result.subscribe({
    next: value => values.push(value),
    complete: () => {}
  })
  
  subject.next(1)
  subject.next(2) // Filtered out
  subject.next(3)
  subject.next(5) // Not taken due to take(2)
  subject.complete()
  
  t.deepEqual(values, [10, 30])
})

// Test error propagation through operators
test('error propagation through operators', async (t) => {
  const observable = new Observable<number>((observer) => {
    observer.next(1)
    observer.error(new Error('Test error'))
    return () => {}
  })

  const result = observable.pipe(
    filter(x => true),
    tap(x => x),
    switchMap(x => Observable.create(observer => {
      observer.next(x)
      observer.complete()
      return () => {}
    }))
  )

  await t.throwsAsync(async () => {
    await collectValues(result)
  }, { message: 'Test error' })
})

// Additional tests for edge cases

test('Observable - empty observable', (t) => {
  const observable = new Observable<number>((observer) => {
    observer.complete()
    return () => {}
  })
  
  const values: number[] = []
  let completed = false
  
  observable.subscribe({
    next: (value) => values.push(value),
    complete: () => { completed = true }
  })
  
  t.deepEqual(values, [])
  t.true(completed)
})

test('Observable - synchronous error in subscribe function', (t) => {
  const error = new Error('Sync error')
  const observable = new Observable<number>(() => {
    throw error
  })
  
  let caughtError: any = null
  
  observable.subscribe({
    next: () => {},
    error: (err) => { caughtError = err }
  })
  
  t.is(caughtError, error)
})

test('Subject - subscription after completion', (t) => {
  const subject = new Subject<number>()
  subject.complete()
  
  let nextCalled = false
  let completeCalled = false
  
  subject.subscribe({
    next: () => { nextCalled = true },
    complete: () => { completeCalled = true }
  })
  
  subject.next(1)
  
  t.false(nextCalled)
  t.false(completeCalled)
})

test('filter operator - predicate throws error', (t) => {
  const observable = new Observable<number>((observer) => {
    observer.next(1)
    return () => {}
  })
  
  const error = new Error('Predicate error')
  const filtered = observable.pipe(
    filter(() => { throw error })
  )
  
  let caughtError: any = null
  
  filtered.subscribe({
    next: () => {},
    error: (err) => { caughtError = err }
  })
  
  t.is(caughtError, error)
})

test('tap operator - next handler throws error', (t) => {
  const observable = new Observable<number>((observer) => {
    observer.next(1)
    return () => {}
  })
  
  const error = new Error('Tap error')
  const tapped = observable.pipe(
    tap(() => { throw error })
  )
  
  let caughtError: any = null
  
  tapped.subscribe({
    next: () => {},
    error: (err) => { caughtError = err }
  })
  
  t.is(caughtError, error)
})

test('switchMap - inner observable errors', (t) => {
  const subject = new Subject<number>()
  const error = new Error('Inner observable error')
  
  const switched = subject.pipe(
    switchMap(() => new Observable<string>(observer => {
      observer.error(error)
      return () => {}
    }))
  )
  
  let caughtError: any = null
  
  switched.subscribe({
    next: () => {},
    error: (err) => { caughtError = err }
  })
  
  subject.next(1)
  
  t.is(caughtError, error)
})

test('take - zero count', (t) => {
  const observable = new Observable<number>((observer) => {
    observer.next(1)
    observer.next(2)
    return () => {}
  })
  
  const taken = observable.pipe(take(0))
  
  const values: number[] = []
  let completed = false
  
  taken.subscribe({
    next: (value) => values.push(value),
    complete: () => { completed = true }
  })
  
  t.deepEqual(values, [])
  t.false(completed)
})

test('merge - empty array of observables', (t) => {
  const merged = merge()
  
  let completed = false
  
  merged.subscribe({
    complete: () => { completed = true }
  })
  
  t.false(completed)
})

// Tests for operator combinations and edge cases

test('filter + take combination', (t) => {
  const subject = new Subject<number>()
  const values: number[] = []
  
  subject.pipe(
    filter(x => x % 2 === 0),
    take(2)
  ).subscribe(value => values.push(value))
  
  subject.next(1) // Filtered out
  subject.next(2) // Taken
  subject.next(3) // Filtered out
  subject.next(4) // Taken
  subject.next(6) // Not taken due to take(2)
  
  t.deepEqual(values, [2, 4])
})

test('takeUntil with immediate completion', (t) => {
  const subject = new Subject<number>()
  const notifier = new Subject<void>()
  const values: number[] = []
  
  subject.pipe(
    takeUntil(notifier)
  ).subscribe(value => values.push(value))
  
  // Complete immediately
  notifier.next()
  
  // These should not be emitted
  subject.next(1)
  subject.next(2)
  
  t.deepEqual(values, [])
})

test('switchMap with synchronous inner observable', (t) => {
  const subject = new Subject<number>()
  const values: string[] = []
  let completeCount = 0
  
  subject.pipe(
    switchMap(x => {
      // Create a synchronously completing Observable
      return new Observable<string>(observer => {
        observer.next(`Value: ${x}`)
        observer.complete()
        return () => {}
      })
    })
  ).subscribe({
    next: value => values.push(value),
    complete: () => completeCount++
  })
  
  subject.next(1)
  subject.next(2)
  subject.complete()
  
  t.deepEqual(values, ['Value: 1', 'Value: 2'])
  t.is(completeCount, 0)
})

test('tap with error in complete handler', (t) => {
  const subject = new Subject<number>()
  const error = new Error('Complete handler error')
  let errorCaught: any = null
  
  subject.pipe(
    tap({
      complete: () => { throw error }
    })
  ).subscribe({
    error: err => { errorCaught = err }
  })
  
  subject.complete()
  
  t.is(errorCaught, error)
})

test('Observable subscription with partial observer', (t) => {
  const observable = new Observable<number>(observer => {
    observer.next(1)
    observer.error(new Error('Test error'))
    return () => {}
  })
  
  const values: number[] = []
  
  // Only provide next handler, no error handler
  observable.subscribe({
    next: value => values.push(value)
    // No error handler provided
  })
  
  // Should still work without throwing
  t.deepEqual(values, [1])
})

test('Subject with multiple error handlers', (t) => {
  const subject = new Subject<number>()
  let errorCount = 0
  
  subject.subscribe({
    error: () => { errorCount++ }
  })
  
  subject.subscribe({
    error: () => { errorCount++ }
  })
  
  subject.error(new Error('Test error'))
  
  t.is(errorCount, 2)
})

// Tests for unsubscription behavior

test('Observable - unsubscribe stops emissions', (t) => {
  let nextCount = 0
  const observable = new Observable<number>((observer) => {
    const interval = setInterval(() => {
      observer.next(nextCount++)
    }, 10)
    
    return () => {
      clearInterval(interval)
    }
  })
  
  const values: number[] = []
  const subscription = observable.subscribe(value => values.push(value))
  
  // Wait for some emissions
  setTimeout(() => {
    subscription.unsubscribe()
    
    // Store the current length
    const lengthAfterUnsubscribe = values.length
    
    // Wait to ensure no more values are emitted
    setTimeout(() => {
      t.is(values.length, lengthAfterUnsubscribe)
    }, 50)
  }, 50)
  
  // This is a bit of a hack for the test to work with AVA
  return new Promise(resolve => setTimeout(resolve, 150))
})

test('Subject - unsubscribe single observer', (t) => {
  const subject = new Subject<number>()
  
  const values1: number[] = []
  const values2: number[] = []
  
  const subscription1 = subject.subscribe(value => values1.push(value))
  const subscription2 = subject.subscribe(value => values2.push(value))
  
  subject.next(1)
  
  // Unsubscribe only the first observer
  subscription1.unsubscribe()
  
  subject.next(2)
  
  t.deepEqual(values1, [1])
  t.deepEqual(values2, [1, 2])
})

test('takeUntil - unsubscribe from source and notifier', (t) => {
  let sourceUnsubscribed = false
  let notifierUnsubscribed = false
  
  const source = new Observable<number>((observer) => {
    return () => {
      sourceUnsubscribed = true
    }
  })
  
  const notifier = new Observable<void>((observer) => {
    return () => {
      notifierUnsubscribed = true
    }
  })
  
  const result = source.pipe(takeUntil(notifier))
  const subscription = result.subscribe()
  
  subscription.unsubscribe()
  
  t.true(sourceUnsubscribed)
  t.true(notifierUnsubscribed)
})

test('switchMap - unsubscribe inner observable on new value', (t) => {
  let innerUnsubscribed = false
  
  const subject = new Subject<number>()
  
  subject.pipe(
    switchMap(x => new Observable<string>(() => {
      return () => {
        if (x === 1) {
          innerUnsubscribed = true
        }
      }
    }))
  ).subscribe()
  
  subject.next(1)
  subject.next(2) // Should unsubscribe from the previous inner observable
  
  t.true(innerUnsubscribed)
}) 