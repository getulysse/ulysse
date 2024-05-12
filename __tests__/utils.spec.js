import { getTimeType, createTimeout, isWithinTimeRange, getParam } from '../src/utils';

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

test('Should get a parameter from the command line', async () => {
    process.argv = ['ulysse', '--time', '30m', '-w', 'example.com'];
    expect(getParam('--time')).toBe('30m');
    expect(getParam('-w')).toBe('example.com');
});

test('Should get a -f parameter without value', async () => {
    process.argv = ['ulysse', '-f', '-w', 'example.com'];
    expect(getParam('-w')).toBe('example.com');
    expect(getParam('-f')).toBe(true);
});
