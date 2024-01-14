import fs from 'fs';
import { PIPE_PATH } from '../src/constants.js';
import { readConfig, editConfig, execSync, getDomainIp, getApps } from '../src/utils.js';
import * as Utils from '../src/utils.js';

beforeEach(() => {
    editConfig({ blocklist: [], whitelist: [], shield: false }, PIPE_PATH);
});

test('As a user, I can display the help', async () => {
    const output = await execSync('npm run start -- --help');

    expect(output).toContain('Usage: ulysse [options]');
});

test('As a user, I can block a domain', async () => {
    const domain = 'example.com';
    jest.spyOn(Utils, 'getDomainIp').mockReturnValue('127.0.0.1');

    const output = await execSync(`npm run start -- --block ${domain}`);

    const ip = await getDomainIp(domain);
    const config = readConfig(PIPE_PATH);
    expect(config.blocklist).toContain(domain);
    expect(output).toContain(`Blocking ${domain}`);
    expect(ip).toBe('127.0.0.1');
});

test('As a user, I can block an app', async () => {
    const app = 'chromium';

    const output = await execSync(`npm run start -- --block ${app}`);

    const apps = await getApps();
    const config = readConfig(PIPE_PATH);
    expect(config.blocklist).toContain(app);
    expect(output).toContain(`Blocking ${app}`);
    expect(apps).not.toContain(app);
});

test('As a user, I can block internet access', async () => {
    const domain = '*.*';
    jest.spyOn(Utils, 'getDomainIp').mockReturnValue('127.0.0.1');

    const output = await execSync(`npm run start -- --block "${domain}"`);

    const ip = await getDomainIp('youtube.com');
    expect(output).toContain(`Blocking ${domain}`);
    expect(ip).toBe('127.0.0.1');
});

test('As a user, I can whitelist a domain', async () => {
    const domain = 'youtube.com';

    const output = await execSync(`npm run start -- --whitelist ${domain}`);

    const config = readConfig(PIPE_PATH);
    expect(config.whitelist).toContain(domain);
    expect(output).toContain(`Whitelisting ${domain}`);
});

test('As a user, I can unblock a domain', async () => {
    const domain = 'youtube.com';

    const output = await execSync(`npm run start -- --unblock ${domain}`);

    const config = readConfig(PIPE_PATH);
    expect(config.blocklist).not.toContain(domain);
    expect(output).toContain(`Unblocking ${domain}`);
});

test('As a user, I can unblock an app', async () => {
    const app = 'chromium';

    const output = await execSync(`npm run start -- --unblock ${app}`);

    const config = readConfig(PIPE_PATH);
    expect(config.blocklist).not.toContain(app);
    expect(output).toContain(`Unblocking ${app}`);
});

test('As a user, I can enable shield mode to prevent me from unblocking a domain or an app', async () => {
    const output = await execSync('npm run start -- --shield');

    const config = readConfig();
    expect(config.shield).toBe(true);
    expect(output).toContain('Shield mode enabled');
});

test.skip('As a user, I can block a specific web page', async () => {
    const page = 'youtube.com/trending';

    const output = await execSync(`npm run start -- --block ${page}`);

    expect(output).toContain(`Blocking ${page}`);
});

test.skip('As a user, I can whitelist a web page', async () => {
    const page = 'youtube.com/@TED/videos';

    const output = await execSync(`npm run start -- --whitelist ${page}`);

    expect(output).toContain(`Whitelisting ${page}`);
});

test.skip('As a user, I cannot unblock a domain or an app if shield mode is enabled', async () => {
    const domain = 'youtube.com';
    await execSync('npm run start -- --shield');

    const output = await execSync(`npm run start -- --unblock ${domain}`);

    expect(output).toContain('You cannot unblock a domain or an app while shield mode is enabled');
});

test.skip('As a user, I cannot whitelist a domain or an app if shield mode is enabled', async () => {
    const domain = 'youtube.com';
    await execSync('npm run start -- --shield');

    const output = await execSync(`npm run start -- --whitelist ${domain}`);

    expect(output).toContain('You cannot whitelist a domain or an app while shield mode is enabled');
});

test.skip('As a user, I can disable shield mode with a QR code to unblock a domain or an app', async () => {
    expect(true).toBe(true);
});

test.skip('As a user, I can send a webhook when a domain or an app is blocked', async () => {
    expect(true).toBe(true);
});

test.skip('As a user, I can sync my settings across devices', async () => {
    expect(true).toBe(true);
});

afterAll(() => {
    fs.unlinkSync(PIPE_PATH);
});
