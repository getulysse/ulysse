import { program } from '../src/index';
import * as utilsModule from '../src/utils';
import { description, version } from '../package.json';

const runCommand = (command) => {
    const args = command.split(' ');
    return program.parseAsync(['node', 'src/index.js', ...args]);
};

beforeEach(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(utilsModule, 'isDaemonRunning').mockReturnValue(true);
});

test('Should display the version', async () => {
    const mockWrite = jest.fn();
    program.exitOverride().configureOutput({ writeOut: mockWrite });

    await expect(runCommand('--version')).rejects.toThrow();

    expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining(version));
});

test('Should display the help message', async () => {
    const mockWrite = jest.fn();
    program.exitOverride().configureOutput({ writeOut: mockWrite });

    await expect(runCommand('--help')).rejects.toThrow();

    expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining(description));
});

test('Should block a domain', async () => {
    await runCommand('blocklist add --website example.com');

    expect(console.log).toHaveBeenCalledWith('Blocking website example.com');
});
