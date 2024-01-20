import * as Utils from '../src/utils.js';
import { readConfig, editConfig, getDomainIp } from '../src/utils.js';
import { helpCmd, blockCmd, unblockCmd, whitelistCmd, shieldCmd } from '../src/index.js';

beforeEach(() => {
    editConfig({ blocklist: [], whitelist: [], shield: false });
});

test('As a user, I can display the help', async () => {
    const output = jest.spyOn(console, 'log');

    helpCmd();

    expect(output).toHaveBeenCalledWith(expect.stringContaining('Usage: ulysse [OPTIONS]'));
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

    await shieldCmd();

    const config = readConfig();
    expect(config.shield).toBe(true);
    expect(output).toHaveBeenCalledWith('Shield mode enabled.');
});

test('As a user, I cannot unblock a domain or an app if shield mode is enabled', async () => {
    const output = jest.spyOn(console, 'log');
    const domain = 'youtube.com';

    blockCmd(domain);
    await shieldCmd();
    unblockCmd(domain);

    const config = readConfig();
    expect(config.shield).toBe(true);
    expect(config.blocklist).toContain(domain);
    expect(output).toHaveBeenCalledWith('You must disable the shield mode first.');
});

test('As a user, I cannot whitelist a domain or an app if shield mode is enabled', async () => {
    const output = jest.spyOn(console, 'log');
    const domain = 'youtube.com';

    await shieldCmd();
    whitelistCmd(domain);

    expect(output).toHaveBeenCalledWith('You must disable the shield mode first.');
});

test.skip('As a user, I can block internet access', async () => {
    jest.spyOn(Utils, 'getDomainIp').mockReturnValue('127.0.0.1');
    const output = jest.spyOn(console, 'log');
    const domain = '*.*';

    blockCmd(domain);

    const ip = await getDomainIp('youtube.com');
    expect(output).toHaveBeenCalledWith(`Blocking ${domain}`);
    expect(ip).toBe('127.0.0.1');
});

test.skip('As a user, I can block a specific web page', async () => {
    const output = jest.spyOn(console, 'log');
    const page = 'youtube.com/trending';

    blockCmd(page);

    expect(output).toHaveBeenCalledWith(`Blocking ${page}`);
});

test.skip('As a user, I can whitelist a web page', async () => {
    const output = jest.spyOn(console, 'log');
    const page = 'youtube.com/@TED/videos';

    whitelistCmd(page);

    expect(output).toHaveBeenCalledWith(`Whitelisting ${page}`);
});

test.skip('As a user, I can disable shield mode with a secret key', async () => {
    expect(true).toBe(true);
});

test.skip('As a user, I can send a webhook when a domain or an app is blocked', async () => {
    expect(true).toBe(true);
});

test.skip('As a user, I can sync my settings across devices', async () => {
    expect(true).toBe(true);
});
