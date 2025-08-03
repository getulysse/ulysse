import { getTimeType, createTimeout, isWithinTimeRange, isValidTimeout } from '../src/utils';

test('Should get duration time type', () => {
    expect(getTimeType('1d')).toBe('duration');
    expect(getTimeType('30m')).toBe('duration');
    expect(getTimeType('1h30m')).toBe('duration');
    expect(getTimeType('10h-18h')).toBe('interval');
});

test('Should create a timeout incremented by a duration', async () => {
    const timestamp = 1704063600;
    expect(createTimeout('1m', timestamp)).toBe(1704063660);
    expect(createTimeout('1d', timestamp)).toBe(1704150000);
    expect(createTimeout('2h', timestamp)).toBe(1704070800);
    expect(createTimeout('30m', timestamp)).toBe(1704065400);
    expect(createTimeout('1h59m', timestamp)).toBe(1704070740);
});

test('Should check if a time is within an interval', async () => {
    const currentDate = new Date('2021-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

    expect(isWithinTimeRange('0h-23h')).toBe(true);
    expect(isWithinTimeRange('0h-19h')).toBe(true);
    expect(isWithinTimeRange('20h-23h')).toBe(false);
});

test('Should check if a timeout is valid', () => {
    expect(isValidTimeout('1d')).toBe(true);
    expect(isValidTimeout('2h')).toBe(true);
    expect(isValidTimeout('30m')).toBe(true);
    expect(isValidTimeout('1h59m')).toBe(true);
    expect(isValidTimeout('12')).toBe(false);
    expect(isValidTimeout('abc')).toBe(false);
});
