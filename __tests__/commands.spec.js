import { config, editConfig } from '../src/config';
import { DEFAULT_CONFIG } from '../src/constants';
import { disableShieldMode } from '../src/shield';
import { helpCmd, versionCmd, blockCmd, whitelistCmd, unblockCmd, shieldCmd } from '../src/commands';

beforeEach(async () => {
    process.argv = [];
    await disableShieldMode('ulysse');
    await editConfig(DEFAULT_CONFIG);
    Object.assign(config, DEFAULT_CONFIG);
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

test('Should display the help', async () => {
    helpCmd();

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usage: ulysse [OPTIONS]'));
});

test('Should display the version', async () => {
    versionCmd();

    expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/\d+\.\d+\.\d+/));
});

test('Should block a domain', async () => {
    blockCmd('example.com');

    expect(console.log).toHaveBeenCalledWith('Blocking example.com');
});

test('Should block an app', async () => {
    blockCmd('chromium');

    expect(console.log).toHaveBeenCalledWith('Blocking chromium');
});

test('Should unblock a domain', async () => {
    unblockCmd('example.com');

    expect(console.log).toHaveBeenCalledWith('Unblocking example.com');
});

test('Should unblock an app', async () => {
    unblockCmd('chromium');

    expect(console.log).toHaveBeenCalledWith('Unblocking chromium');
});

test('Should not block an invalid distraction', async () => {
    blockCmd('inexistent');

    expect(console.log).toHaveBeenCalledWith('You must provide a valid distraction.');
});

test('Should not unblock a distraction if shield mode is enabled', async () => {
    config.shield = true;
    config.passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';

    unblockCmd('youtube.com');

    expect(console.log).toHaveBeenCalledWith('You must disable the shield mode first.');
});

test('Should not whitelist a distraction if shield mode is enabled', async () => {
    config.shield = true;
    config.passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';

    whitelistCmd('youtube.com');

    expect(console.log).toHaveBeenCalledWith('You must disable the shield mode first.');
});

test('Should not whitelist an app with a relative path', async () => {
    whitelistCmd('signal-desktop');

    expect(console.log).toHaveBeenCalledWith('You must provide a valid distraction.');
});

test('Should not disable shield mode if it is already disabled', async () => {
    config.shield = false;
    config.password = 'ulysse';

    shieldCmd('off');

    expect(console.log).toHaveBeenCalledWith('Shield mode already disabled.');
});

test('Should not enable shield mode if it is already enabled', async () => {
    config.shield = true;
    config.passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';

    shieldCmd('on');

    expect(console.log).toHaveBeenCalledWith('Shield mode already enabled.');
});

test('Should whitelist a domain', async () => {
    whitelistCmd('youtube.com');

    expect(console.log).toHaveBeenCalledWith('Whitelisting youtube.com');
});

test('Should whitelist a domain with a wildcard', async () => {
    whitelistCmd('*.youtube.com');

    expect(console.log).toHaveBeenCalledWith('Whitelisting *.youtube.com');
});

test('Should enable shield mode', async () => {
    process.argv = ['ulysse', '-s', 'on', '-p', 'ulysse'];

    shieldCmd('on');

    expect(console.log).toHaveBeenCalledWith('Shield mode enabled.');
});

test('Should disable shield mode', async () => {
    process.argv = ['ulysse', '-s', 'off', '-p', 'ulysse'];
    config.shield = true;
    config.passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';

    shieldCmd('off');

    expect(console.log).toHaveBeenCalledWith('Shield mode disabled.');
});
