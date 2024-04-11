import fs from 'fs';
import childProcess from 'child_process';
import * as Utils from '../src/utils';

jest.mock('../src/utils');

jest.mock('dgram', () => ({
    createSocket: jest.fn().mockReturnThis(),
    bind: jest.fn().mockReturnThis(),
    on: jest.fn(),
}));

jest.mock('net', () => ({
    createServer: jest.fn().mockReturnThis(),
    listen: jest.fn().mockReturnThis(),
}));

jest.mock('socket.io-client', () => ({
    io: jest.fn(() => ({
        emit: jest.fn(),
        on: jest.fn(),
    })),
}));

beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(childProcess, 'execSync').mockImplementation(() => {});
    jest.spyOn(Utils, 'isSudo').mockReturnValue(true);
    jest.spyOn(Utils, 'getRunningBlockedApps').mockReturnValue([{ name: 'chromium', pid: 123 }]);
    jest.spyOn(Utils, 'updateResolvConf').mockImplementation(() => {
        fs.writeFileSync(process.env.RESOLV_CONF_PATH, 'nameserver 127.0.0.1', 'utf8');
    });
});

test('Should block a running app', async () => {
    await import('../src/daemon');

    expect(console.log).toHaveBeenCalledWith('Blocking chromium');
});

test('Should edit /etc/resolv.conf', async () => {
    await import('../src/daemon');

    expect(fs.existsSync(process.env.RESOLV_CONF_PATH)).toBe(true);
    expect(fs.readFileSync(process.env.RESOLV_CONF_PATH, 'utf8')).toBe('nameserver 127.0.0.1');
});
