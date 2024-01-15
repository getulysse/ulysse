import * as Utils from '../src/utils.js';
import { readConfig, editConfig, getDomainIp } from '../src/utils.js';
import { helpCmd, blockCmd, unblockCmd, whitelistCmd, shieldCmd } from '../src/index.js';

beforeEach(() => {
    editConfig({ blocklist: [], whitelist: [], shield: false });
});

test('As a user, I can display the help', async () => {
    const output = jest.spyOn(console, 'log');

    helpCmd();

    expect(output).toHaveBeenCalledWith('Usage: ulysse [options]');
});

test('As a user, I can block a domain', async () => {
    const output = jest.spyOn(console, 'log');
    const domain = 'youtube.com';

    blockCmd(domain);

    const config = readConfig();
    expect(config.blocklist).toContain(domain);
    expect(output).toHaveBeenCalledWith(`Blocking ${domain}`);
});

test('As a user, I can block an app', async () => {
    const output = jest.spyOn(console, 'log');
    const app = 'chromium';

    blockCmd(app);

    const config = readConfig();
    expect(config.blocklist).toContain(app);
    expect(output).toHaveBeenCalledWith(`Blocking ${app}`);
});

test('As a user, I can block internet access', async () => {
    jest.spyOn(Utils, 'getDomainIp').mockReturnValue('127.0.0.1');
    const output = jest.spyOn(console, 'log');
    const domain = '*.*';

    blockCmd(domain);

    const ip = await getDomainIp('youtube.com');
    expect(output).toHaveBeenCalledWith(`Blocking ${domain}`);
    expect(ip).toBe('127.0.0.1');
});

test('As a user, I can whitelist a domain', async () => {
    const output = jest.spyOn(console, 'log');
    const domain = 'youtube.com';

    whitelistCmd(domain);

    const config = readConfig();
    expect(config.whitelist).toContain(domain);
    expect(output).toHaveBeenCalledWith(`Whitelisting ${domain}`);
});

test('As a user, I can unblock a domain', async () => {
    const output = jest.spyOn(console, 'log');
    const domain = 'youtube.com';

    unblockCmd(domain);

    const config = readConfig();
    expect(config.blocklist).not.toContain(domain);
    expect(output).toHaveBeenCalledWith(`Unblocking ${domain}`);
});

test('As a user, I can unblock an app', async () => {
    const output = jest.spyOn(console, 'log');
    const app = 'chromium';

    unblockCmd(app);

    const config = readConfig();
    expect(config.blocklist).not.toContain(app);
    expect(output).toHaveBeenCalledWith(`Unblocking ${app}`);
});

test('As a user, I can enable shield mode to prevent me from unblocking a domain or an app', async () => {
    const output = jest.spyOn(console, 'log');

    shieldCmd();

    const config = readConfig();
    expect(config.shield).toBe(true);
    expect(output).toHaveBeenCalledWith('Shield mode enabled');
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
