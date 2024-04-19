import fs from 'fs';
import { config } from '../src/config';
import { getRunningApps } from '../src/utils';
import { blockDistraction } from '../src/block';
import { handleAppBlocking, handleTimeout, updateResolvConf } from '../src/daemon';

jest.mock('../src/utils', () => ({
    ...jest.requireActual('../src/utils'),
    isSudo: jest.fn().mockImplementation(() => true),
}));

jest.mock('child_process', () => ({
    execSync: jest.fn().mockImplementation(() => false),
    exec: jest.fn().mockImplementation(() => false),
}));

beforeEach(() => {
    config.blocklist = [];
    config.whitelist = [];
    config.shield = false;
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

test('Should block a running app', async () => {
    blockDistraction({ name: 'node' });

    handleAppBlocking();

    expect(console.log).toHaveBeenCalledWith('Blocking node');
});

test('Should get all running apps', async () => {
    const apps = getRunningApps();

    expect(JSON.stringify(apps)).toContain('node');
});

test('Should edit /etc/resolv.conf', async () => {
    updateResolvConf('127.0.0.1');

    expect(fs.existsSync(process.env.RESOLV_CONF_PATH)).toBe(true);
    expect(fs.readFileSync(process.env.RESOLV_CONF_PATH, 'utf8')).toBe('nameserver 127.0.0.1');
});

test('Should remove a distraction from blocklist if timeout is reached', async () => {
    config.blocklist = [{ name: 'chromium' }, { name: 'example.com', timeout: 1708617136 }];

    handleTimeout();

    expect(config.blocklist).toEqual([{ name: 'chromium' }]);
});
