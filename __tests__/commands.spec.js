import { jest } from '@jest/globals';
import * as Utils from '../src/utils';
import { helpCmd, blockCmd, whitelistCmd, unblockCmd, shieldCmd } from '../src/commands';

jest.mock('../src/utils');

beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

test('As a user, I can display the help', async () => {
    const output = jest.spyOn(console, 'log');

    helpCmd();

    expect(output).toHaveBeenCalledWith(expect.stringContaining('Usage: ulysse [OPTIONS]'));
});

test('As a user, I can block a domain', async () => {
    const output = jest.spyOn(console, 'log');

    blockCmd('example.com');

    expect(output).toHaveBeenCalledWith('Blocking example.com');
});

test('As a user, I can block an app', async () => {
    const output = jest.spyOn(console, 'log');

    blockCmd('chromium');

    expect(output).toHaveBeenCalledWith('Blocking chromium');
});

test('As a user, I can whitelist a domain', async () => {
    const output = jest.spyOn(console, 'log');

    whitelistCmd('youtube.com');

    expect(output).toHaveBeenCalledWith('Whitelisting youtube.com');
});

test('As a user, I can unblock a domain', async () => {
    const output = jest.spyOn(console, 'log');

    unblockCmd('example.com');

    expect(output).toHaveBeenCalledWith('Unblocking example.com');
});

test('As a user, I can unblock an app', async () => {
    const output = jest.spyOn(console, 'log');

    unblockCmd('chromium');

    expect(output).toHaveBeenCalledWith('Unblocking chromium');
});

test('As a user, I can enable shield mode', async () => {
    const output = jest.spyOn(console, 'log');

    await shieldCmd();

    expect(output).toHaveBeenCalledWith('Shield mode enabled.');
});

test('As a user, I cannot enable shield mode if it is already enabled', async () => {
    jest.spyOn(Utils, 'readConfig').mockImplementation(() => ({ shield: true }));
    const output = jest.spyOn(console, 'log');

    await shieldCmd();

    expect(output).toHaveBeenCalledWith('Shield mode already enabled.');
});

test('As a user, I can disable shield mode', async () => {
    jest.spyOn(Utils, 'getParam').mockImplementation(() => 'password');
    jest.spyOn(Utils, 'isValidPassword').mockImplementation(() => true);
    const output = jest.spyOn(console, 'log');

    await shieldCmd('off');

    expect(output).toHaveBeenCalledWith('Shield mode disabled.');
});

test('As a user, I cannot unblock a distraction if shield mode is enabled', async () => {
    jest.spyOn(Utils, 'readConfig').mockImplementation(() => ({ shield: true }));
    const output = jest.spyOn(console, 'log');
    const domain = 'youtube.com';

    await shieldCmd();
    unblockCmd(domain);

    expect(output).toHaveBeenCalledWith('You must disable the shield mode first.');
});

test('As a user, I cannot whitelist a distraction if shield mode is enabled', async () => {
    jest.spyOn(Utils, 'readConfig').mockImplementation(() => ({ shield: true }));
    const output = jest.spyOn(console, 'log');
    const domain = 'youtube.com';

    await shieldCmd();
    whitelistCmd(domain);

    expect(output).toHaveBeenCalledWith('You must disable the shield mode first.');
});
