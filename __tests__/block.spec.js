import { config } from '../src/config';
import {
    blockDistraction,
    isWithinTimeRange,
    unblockDistraction,
    isValidDistraction,
    isDistractionBlocked,
} from '../src/block';

import('../src/socket');

jest.mock('child_process', () => ({
    execSync: jest.fn().mockImplementation(() => false),
}));

beforeEach(() => {
    config.blocklist = [];
    config.whitelist = [];
    config.shield = false;
});

test('Should check a distraction', async () => {
    expect(isValidDistraction({ name: '' })).toBe(false);
    expect(isValidDistraction({ name: '*' })).toBe(false);
    expect(isValidDistraction({ name: '*.*' })).toBe(true);
    expect(isValidDistraction({ name: '*.example.com' })).toBe(true);
    expect(isValidDistraction({ name: 'example.com' })).toBe(true);
    expect(isValidDistraction({ name: 'chromium' })).toBe(true);
    expect(isValidDistraction({ name: 'chromium', time: 'badtime' })).toBe(false);
    expect(isValidDistraction({ name: 'chromium', time: '1m' })).toBe(true);
    expect(isValidDistraction({ name: 'inexistent' })).toBe(false);
});

test('Should check if a time is within an interval', async () => {
    const currentDate = new Date('2021-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

    expect(isWithinTimeRange('0h-23h')).toBe(true);
    expect(isWithinTimeRange('0h-19h')).toBe(true);
    expect(isWithinTimeRange('20h-23h')).toBe(false);
});

test('Should block a distraction', async () => {
    blockDistraction({ name: 'example.com' });

    expect(isDistractionBlocked('example.com')).toEqual(true);
});

test('Should block a distraction with a duration', async () => {
    blockDistraction({ name: 'twitter.com', time: '2m' });

    expect(isDistractionBlocked('twitter.com')).toBe(true);
    expect(config.blocklist).toEqual([{ name: 'twitter.com', time: '2m', timeout: expect.any(Number) }]);
});

test('Should block a distraction with a time-based interval', async () => {
    const currentDate = new Date('2021-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

    blockDistraction({ name: 'example.com', time: '0h-23h' });

    expect(isDistractionBlocked('example.com')).toBe(true);
});

test('Should block a specific subdomain', async () => {
    blockDistraction({ name: 'www.example.com' });

    expect(isDistractionBlocked('www.example.com')).toBe(true);
    expect(isDistractionBlocked('example.com')).toBe(false);
});

test('Should block all subdomains of a domain with a wildcard', async () => {
    blockDistraction({ name: '*.example.com' });

    expect(isDistractionBlocked('www.example.com')).toBe(true);
});

test('Should block all subdomains of a domain with a wildcard & a time-based interval', async () => {
    const currentDate = new Date('2021-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

    blockDistraction({ name: '*.example.com', time: '0h-19h' });

    expect(isDistractionBlocked('www.example.com')).toBe(true);
});

test('Should block all domains with *.*', async () => {
    blockDistraction({ name: '*.*' });

    expect(isDistractionBlocked('example.com')).toBe(true);
});

test('Should not block an app with a time-based interval', async () => {
    const currentDate = new Date('2021-01-01T22:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

    blockDistraction({ name: 'chromium', time: '0h-20h' });

    expect(isDistractionBlocked('chromium')).toBe(false);
});

test('Should not block a subdomain of a domain with a wildcard & a time-based interval', async () => {
    const currentDate = new Date('2021-01-01T20:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

    blockDistraction({ name: '*.example.com', time: '0h-19h' });

    expect(isDistractionBlocked('www.example.com')).toBe(false);
});

test('Should not block apps if *.* is in the blocklist', async () => {
    blockDistraction({ name: '*.*' });

    expect(isDistractionBlocked('chromium')).toBe(false);
});

test('Should unblock a distraction', async () => {
    blockDistraction({ name: 'example.com' });

    unblockDistraction({ name: 'example.com' });

    expect(isDistractionBlocked('example.com')).toBe(false);
});

test('Should run isDistractionBlocked in less than 150ms with a large blocklist', async () => {
    config.blocklist = Array.from({ length: 500000 }, (_, i) => ({ name: `${i + 1}.com` }));

    isDistractionBlocked('example.com');
    const start = process.hrtime();
    isDistractionBlocked('example.com');
    const end = process.hrtime(start);

    expect(end[1] / 1000000).toBeLessThan(150);
});
