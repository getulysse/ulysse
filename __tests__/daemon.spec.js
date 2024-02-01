import fs from 'fs';
import * as Utils from '../src/utils';

jest.mock('../src/utils');

beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(Utils, 'isSudo').mockReturnValue(true);
    jest.spyOn(Utils, 'blockApps').mockReturnValue(['chromium']);
    process.env.RESOLV_CONF_PATH = '/tmp/resolv.conf';
    process.env.SOCKET_PATH = '/tmp/ulysse.sock';
});

test('Should block a running app', async () => {
    await import('../src/daemon');

    expect(console.log).toHaveBeenCalledWith('Blocking chromium');
});

test.skip('Should edit /etc/resolv.conf', async () => {
    await import('../src/daemon');

    expect(fs.existsSync(process.env.RESOLV_CONF_PATH)).toBe(true);
    expect(fs.readFileSync(process.env.RESOLV_CONF_PATH, 'utf8')).toBe('nameserver 127.0.0.1');
});
