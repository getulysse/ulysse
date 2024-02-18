import fs from 'fs';
import { isDistractionBlocked } from '../src/utils';

test('Should check if a domain from the blocklist is blocked', async () => {
    const config = { blocklist: [{ name: 'youtube.com' }], whitelist: [] };
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => JSON.stringify(config));

    const isBlocked = isDistractionBlocked('youtube.com');

    expect(isBlocked).toBe(true);
});

test('Should check if a domain from the whitelist is not blocked', async () => {
    const config = { blocklist: [{ name: 'youtube.com' }], whitelist: [{ name: 'youtube.com' }] };
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => JSON.stringify(config));

    const isBlocked = isDistractionBlocked('youtube.com');

    expect(isBlocked).toBe(false);
});
