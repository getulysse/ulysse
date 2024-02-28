import { editConfig } from '../src/utils';
import { helpCmd, blockCmd, whitelistCmd, unblockCmd, shieldCmd } from '../src/commands';

jest.mock('net', () => ({
    createConnection: jest.fn().mockReturnThis(),
    write: jest.fn(),
    end: jest.fn(),
}));

jest.mock('child_process', () => ({
    execSync: jest.fn().mockImplementation(() => false),
}));

beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    editConfig({ shield: false, password: 'ulysse', blocklist: [], whitelist: [] });
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

test('As a user, I cannot block an invalid distraction', async () => {
    blockCmd('inexistent');

    expect(console.log).toHaveBeenCalledWith('You must provide a valid distraction.');
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
    const passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';
    editConfig({ shield: true, passwordHash });

    shieldCmd();

    expect(console.log).toHaveBeenCalledWith('Shield mode already enabled.');
});

test('As a user, I can disable shield mode', async () => {
    process.argv = ['ulysse', '-s', 'off', '-p', 'ulysse'];
    const passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';
    editConfig({ shield: true, passwordHash });

    shieldCmd('off');

    expect(console.log).toHaveBeenCalledWith('Shield mode disabled.');
});

test('As a user, I cannot disable shield mode if it is already disabled', async () => {
    editConfig({ shield: false, password: 'ulysse' });

    shieldCmd('off');

    expect(console.log).toHaveBeenCalledWith('Shield mode already disabled.');
});

test('As a user, I cannot unblock a distraction if shield mode is enabled', async () => {
    const passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';
    editConfig({ shield: true, passwordHash });

    unblockCmd('youtube.com');

    expect(console.log).toHaveBeenCalledWith('You must disable the shield mode first.');
});

test('As a user, I cannot whitelist a distraction if shield mode is enabled', async () => {
    const passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';
    editConfig({ shield: true, passwordHash });

    whitelistCmd('youtube.com');

    expect(console.log).toHaveBeenCalledWith('You must disable the shield mode first.');
});
