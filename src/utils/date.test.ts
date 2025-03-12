import test from 'ava'
import {
  formatDistanceToNow,
  compareAsc,
  format,
  parseISO,
  formatDistanceToNowStrict
} from './date'

// Helper function to create dates with specific offsets
function createDateWithOffset(offset: {
  seconds?: number
  minutes?: number
  hours?: number
  days?: number
  months?: number
  years?: number
}) {
  const now = new Date()
  const date = new Date(now)

  if (offset.seconds) date.setSeconds(now.getSeconds() - offset.seconds)
  if (offset.minutes) date.setMinutes(now.getMinutes() - offset.minutes)
  if (offset.hours) date.setHours(now.getHours() - offset.hours)
  if (offset.days) date.setDate(now.getDate() - offset.days)
  if (offset.months) date.setMonth(now.getMonth() - offset.months)
  if (offset.years) date.setFullYear(now.getFullYear() - offset.years)

  return date
}

// Tests for formatDistanceToNow
test('formatDistanceToNow - seconds', t => {
  const date = createDateWithOffset({ seconds: 3 })
  t.is(formatDistanceToNow(date, { includeSeconds: true }), 'less than 5 seconds')

  const date2 = createDateWithOffset({ seconds: 30 })
  t.is(formatDistanceToNow(date2, { includeSeconds: true }), 'half a minute')
})

test('formatDistanceToNow - minutes', t => {
  const date = createDateWithOffset({ minutes: 1 })
  t.is(formatDistanceToNow(date, {}), '1 minute')

  const date2 = createDateWithOffset({ minutes: 5 })
  t.is(formatDistanceToNow(date2, {}), '5 minutes')
})

test('formatDistanceToNow - hours', t => {
  const date = createDateWithOffset({ hours: 1 })
  t.is(formatDistanceToNow(date, {}), 'about 1 hour')

  const date2 = createDateWithOffset({ hours: 5 })
  t.is(formatDistanceToNow(date2, {}), 'about 5 hours')
})

test('formatDistanceToNow - days', t => {
  const date = createDateWithOffset({ days: 1 })
  t.is(formatDistanceToNow(date, {}), '1 day')

  const date2 = createDateWithOffset({ days: 5 })
  t.is(formatDistanceToNow(date2, {}), '5 days')
})

test('formatDistanceToNow - months', t => {
  const date = createDateWithOffset({ months: 1 })
  t.is(formatDistanceToNow(date, {}), '28 days')

  const date2 = createDateWithOffset({ months: 5 })
  t.is(formatDistanceToNow(date2, {}), '5 months')
})

test('formatDistanceToNow - years', t => {
  const date = createDateWithOffset({ years: 1 })
  t.is(formatDistanceToNow(date, {}), 'about 1 year')

  const date2 = createDateWithOffset({ years: 5 })
  t.is(formatDistanceToNow(date2, {}), 'about 5 years')
})

// Tests for compareAsc
test('compareAsc - comparing dates', t => {
  const date1 = new Date(2020, 0, 1)
  const date2 = new Date(2020, 0, 2)
  const date3 = new Date(2020, 0, 1)

  t.is(compareAsc(date1, date2), -1, 'date1 is before date2')
  t.is(compareAsc(date2, date1), 1, 'date2 is after date1')
  t.is(compareAsc(date1, date3), 0, 'date1 is the same as date3')
})

// Tests for format
test('format - basic date formatting', t => {
  const date = new Date(2021, 0, 15, 14, 30, 45) // Jan 15, 2021, 14:30:45

  t.is(format(date, 'yyyy-MM-dd', {}), '2021-01-15')
  t.is(format(date, 'MMM dd, yyyy', {}), 'Jan 15, 2021')
  t.is(format(date, 'MMMM dd, yyyy', {}), 'January 15, 2021')
  t.is(format(date, 'dd/MM/yyyy', {}), '15/01/2021')
  t.is(format(date, 'HH:mm:ss', {}), '14:30:45')
  t.is(format(date, 'hh:mm a', {}), '02:30 PM')
  t.is(format(date, 'hh:mm aaa', {}), '02:30 pm')
  t.is(format(date, "MMMM do 'at' HH:mm", {}), 'January 15th at 14:30')
})

test('format - with string date', t => {
  const dateStr = '2021-01-15T14:30:45.000Z'
  t.is(format(dateStr, 'yyyy-MM-dd', {}), '2021-01-15')
})

test('format - with timestamp', t => {
  const timestamp = new Date(2021, 0, 15, 14, 30, 45).getTime()
  t.is(format(timestamp, 'yyyy-MM-dd', {}), '2021-01-15')
})

// Additional tests for format with escaped characters
test('format - with escaped characters', t => {
  const date = new Date(2021, 0, 15, 14, 30, 45)

  // Single quotes to escape parts of the string
  t.is(format(date, "'The date is' yyyy-MM-dd", {}), 'The date is 2021-01-15')
  t.is(format(date, "yyyy-MM-dd 'at' HH:mm:ss", {}), '2021-01-15 at 14:30:45')
  t.is(format(date, "HH'h' mm'm'", {}), '14h 30m')

  // Escaping single quotes
  t.is(format(date, "yyyy-MM-dd 'at' HH:mm", {}), '2021-01-15 at 14:30')

  // Multiple quoted sections
  t.is(format(date, "'The year is' yyyy 'and the month is' MM", {}), 'The year is 2021 and the month is 01')

  // Empty quoted sections
  t.is(format(date, "yyyy-MM-dd", {}), '2021-01-15')

  // Quoted section at the end
  t.is(format(date, "yyyy-MM-dd 'end'", {}), '2021-01-15 end')
})

// Additional format tests for complex patterns
test('format - complex patterns', t => {
  const date = new Date(2021, 0, 15, 14, 30, 45)

  // Mix of tokens and literals
  t.is(format(date, "yyyy-MM-dd'T'HH:mm:ss", {}), '2021-01-15T14:30:45')

  // Multiple tokens of the same type
  t.is(format(date, "MM/dd/yyyy HH:mm:ss", {}), '01/15/2021 14:30:45')

  // Tokens with different lengths
  t.is(format(date, "MMMM d, yyyy", {}), 'January 15, 2021')
})

// Tests for parseISO
test('parseISO - parsing ISO date strings', t => {
  const dateStr = '2021-01-15T14:30:45.000Z'
  const date = parseISO(dateStr, {})

  t.true(date instanceof Date)
  t.is(date.getUTCFullYear(), 2021)
  t.is(date.getUTCMonth(), 0) // January is 0
  t.is(date.getUTCDate(), 15)
  t.is(date.getUTCHours(), 14)
  t.is(date.getUTCMinutes(), 30)
  t.is(date.getUTCSeconds(), 45)
})

// Tests for formatDistanceToNowStrict
test('formatDistanceToNowStrict - seconds', t => {
  const date = createDateWithOffset({ seconds: 30 })
  t.is(formatDistanceToNowStrict(date, {}), '30 seconds')
  t.is(formatDistanceToNowStrict(date, { addSuffix: true }), '30 seconds ago')
})

test('formatDistanceToNowStrict - minutes', t => {
  const date = createDateWithOffset({ minutes: 5 })
  t.is(formatDistanceToNowStrict(date, {}), '5 minutes')
  t.is(formatDistanceToNowStrict(date, { addSuffix: true }), '5 minutes ago')
})

test('formatDistanceToNowStrict - hours', t => {
  const date = createDateWithOffset({ hours: 3 })
  t.is(formatDistanceToNowStrict(date, {}), '3 hours')
  t.is(formatDistanceToNowStrict(date, { addSuffix: true }), '3 hours ago')
})

test('formatDistanceToNowStrict - days', t => {
  const date = createDateWithOffset({ days: 7 })
  t.is(formatDistanceToNowStrict(date, {}), '7 days')
  t.is(formatDistanceToNowStrict(date, { addSuffix: true }), '7 days ago')
})

test('formatDistanceToNowStrict - months', t => {
  const date = createDateWithOffset({ months: 3 })
  t.is(formatDistanceToNowStrict(date, {}), '3 months')
  t.is(formatDistanceToNowStrict(date, { addSuffix: true }), '3 months ago')
})

test('formatDistanceToNowStrict - years', t => {
  const date = createDateWithOffset({ years: 2 })
  t.is(formatDistanceToNowStrict(date, {}), '2 years')
  t.is(formatDistanceToNowStrict(date, { addSuffix: true }), '2 years ago')
})

// Edge cases
test('formatDistanceToNowStrict - future date', t => {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 1) // tomorrow
  t.is(formatDistanceToNowStrict(futureDate, {}), '1 day')
})

test('format - ordinal numbers', t => {
  const testOrdinals = (day: number, expected: string) => {
    const date = new Date(2021, 0, day)
    t.is(format(date, 'do', {}), expected)
  }

  testOrdinals(1, '1st')
  testOrdinals(2, '2nd')
  testOrdinals(3, '3rd')
  testOrdinals(4, '4th')
  testOrdinals(11, '11th')
  testOrdinals(12, '12th')
  testOrdinals(13, '13th')
  testOrdinals(21, '21st')
  testOrdinals(22, '22nd')
  testOrdinals(23, '23rd')
  testOrdinals(24, '24th')
}) 