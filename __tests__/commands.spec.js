import { jest } from '@jest/globals';
import * as Utils from '../src/utils';
import { helpCmd, blockCmd, whitelistCmd, unblockCmd, shieldCmd } from '../src/commands';

jest.mock('../src/utils');

beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

test('As a user, I can display the help', async () => {
    helpCmd();

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usage: ulysse [OPTIONS]'));
});

test('As a user, I can block a domain', async () => {
    blockCmd('example.com');

    expect(console.log).toHaveBeenCalledWith('Blocking example.com');
});

test('As a user, I can block an app', async () => {
    blockCmd('chromium');

    expect(console.log).toHaveBeenCalledWith('Blocking chromium');
});

test('As a user, I can whitelist a domain', async () => {
    whitelistCmd('youtube.com');

    expect(console.log).toHaveBeenCalledWith('Whitelisting youtube.com');
});

test('As a user, I can unblock a domain', async () => {
    unblockCmd('example.com');

    expect(console.log).toHaveBeenCalledWith('Unblocking example.com');
});

test('As a user, I can unblock an app', async () => {
    unblockCmd('chromium');

    expect(console.log).toHaveBeenCalledWith('Unblocking chromium');
});

test('As a user, I can enable shield mode', async () => {
    shieldCmd();

    expect(console.log).toHaveBeenCalledWith('Shield mode enabled.');
});

test('As a user, I cannot enable shield mode if it is already enabled', async () => {
    jest.spyOn(Utils, 'readConfig').mockImplementation(() => ({ shield: true }));

    shieldCmd();

    expect(console.log).toHaveBeenCalledWith('Shield mode already enabled.');
});

test('As a user, I can disable shield mode', async () => {
    jest.spyOn(Utils, 'getParam').mockImplementation(() => 'password');
    jest.spyOn(Utils, 'isValidPassword').mockImplementation(() => true);

    shieldCmd('off');

    expect(console.log).toHaveBeenCalledWith('Shield mode disabled.');
});

test('As a user, I cannot unblock a distraction if shield mode is enabled', async () => {
    jest.spyOn(Utils, 'readConfig').mockImplementation(() => ({ shield: true }));
    const domain = 'youtube.com';

    unblockCmd(domain);

    expect(console.log).toHaveBeenCalledWith('You must disable the shield mode first.');
});

test('As a user, I cannot whitelist a distraction if shield mode is enabled', async () => {
    jest.spyOn(Utils, 'readConfig').mockImplementation(() => ({ shield: true }));
    const domain = 'youtube.com';

    whitelistCmd(domain);

    expect(console.log).toHaveBeenCalledWith('You must disable the shield mode first.');
});
