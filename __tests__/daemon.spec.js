import fs from 'fs';
import { config, editConfig, readConfig } from '../src/config';
import { getRunningApps } from '../src/utils';
import { listActiveWindows } from '../src/x11';
import { blockDistraction } from '../src/block';
import { DEFAULT_CONFIG } from '../src/constants';
import { disableShieldMode } from '../src/shield';
import { handleAppBlocking, handleTimeout, updateResolvConf } from '../src/daemon';

jest.mock('../src/utils', () => ({
    ...jest.requireActual('../src/utils'),
    isSudo: jest.fn().mockImplementation(() => true),
    getRunningApps: jest.fn(),
}));

jest.mock('../src/x11', () => ({
    listActiveWindows: jest.fn().mockResolvedValue([]),
    closeWindow: jest.fn(),
}));

jest.mock('child_process', () => ({
    execSync: jest.fn().mockImplementation(() => false),
    exec: jest.fn().mockImplementation(() => false),
}));

beforeEach(async () => {
    await disableShieldMode('ulysse');
    await editConfig(DEFAULT_CONFIG);
    Object.assign(config, DEFAULT_CONFIG);
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

test('Should get all running apps', async () => {
    getRunningApps.mockReturnValue([{ name: 'node', pid: 1234 }]);
    const apps = getRunningApps();

    expect(getRunningApps).toHaveBeenCalled();
    expect(JSON.stringify(apps)).toContain('node');
});

test('Should block app by windows name', async () => {
    listActiveWindows.mockResolvedValue([{ name: 'signal' }]);
    blockDistraction({ name: 'signal' });

    await handleAppBlocking();

    expect(console.log).toHaveBeenCalledWith('Blocking signal');
});

test('Should block app by process name', async () => {
    getRunningApps.mockReturnValue([{ name: 'signal-desktop', pid: 1234 }]);

    await blockDistraction({ name: 'signal-desktop' });

    await handleAppBlocking();

    expect(console.log).toHaveBeenCalledWith('Blocking signal-desktop');
});

test('Should edit /etc/resolv.conf', async () => {
    updateResolvConf('127.0.0.1');

    expect(fs.existsSync(process.env.RESOLV_CONF_PATH)).toBe(true);
    expect(fs.readFileSync(process.env.RESOLV_CONF_PATH, 'utf8')).toBe('nameserver 127.0.0.1');
});

test('Should remove a distraction from blocklist if timeout is reached', async () => {
    config.blocklist = [{ name: 'chromium' }, { name: 'example.com', timeout: 1708617136 }];

    await handleTimeout();

    expect(readConfig().blocklist).toEqual([{ name: 'chromium' }]);
});

test('Should execute handleTimeout() if shield mode is enabled', async () => {
    config.shield = true;
    config.blocklist = [{ name: 'example.com', timeout: 1708617136 }];

    await handleTimeout();

    expect(readConfig().blocklist).toEqual([]);
});
