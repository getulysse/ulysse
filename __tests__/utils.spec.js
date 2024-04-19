import { getTimeType, createTimeout } from '../src/utils';

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
