import fs from 'fs';
import childProcess from 'child_process';
import { DEFAULT_CONFIG } from '../src/constants';
import {
    readConfig,
    editConfig,
    rootDomain,
    createConfig,
    getTimeType,
    decrementTime,
    getRunningApps,
    isValidDistraction,
    isDistractionBlocked,
} from '../src/utils';

const TEST_CONFIG_PATH = '/tmp/config.json';

beforeEach(() => {
    jest.spyOn(childProcess, 'execSync').mockImplementation(() => {});
    if (fs.existsSync(TEST_CONFIG_PATH)) {
        fs.unlinkSync(TEST_CONFIG_PATH);
    }
});

test('Should create a config file', async () => {
    const config = { blocklist: [], whitelist: [] };

    createConfig(config, TEST_CONFIG_PATH);

    expect(fs.existsSync(TEST_CONFIG_PATH)).toBe(true);
    expect(fs.readFileSync(TEST_CONFIG_PATH, 'utf8')).toBe(JSON.stringify(config, null, 4));
});

test('Should read config file', async () => {
    createConfig({ blocklist: [], whitelist: [] }, TEST_CONFIG_PATH);

    const config = readConfig(TEST_CONFIG_PATH);

    expect(config).toEqual({ blocklist: [], whitelist: [] });
});

test('Should check distraction value', async () => {
    expect(isValidDistraction({ name: 'chess.com' })).toBe(true);
    expect(isValidDistraction({ name: 'chromium' })).toBe(true);
    expect(isValidDistraction({ name: 'chromium', time: 'badtime' })).toBe(false);
    expect(isValidDistraction({ name: 'chromium', time: '1m' })).toBe(true);
    expect(isValidDistraction({ name: 'inexistent' })).toBe(false);
});

test('Should add a distraction to blocklist', async () => {
    const distraction = { name: 'chess.com' };
    editConfig({ ...DEFAULT_CONFIG, blocklist: [distraction] }, TEST_CONFIG_PATH);

    const config = readConfig(TEST_CONFIG_PATH);
    expect(config.blocklist).toEqual(expect.arrayContaining([distraction]));
});

test('Should remove a distraction from blocklist', async () => {
    const distraction = { name: 'chess.com' };
    createConfig({ ...DEFAULT_CONFIG, blocklist: [distraction] }, TEST_CONFIG_PATH);

    editConfig({ blocklist: [] }, TEST_CONFIG_PATH);

    const config = readConfig(TEST_CONFIG_PATH);
    expect(config.blocklist).toEqual(expect.arrayContaining([]));
});

test('Should not remove a distraction from blocklist if shield mode is enabled', async () => {
    const distraction = { name: 'chess.com' };
    createConfig({ ...DEFAULT_CONFIG, blocklist: [distraction], shield: true }, TEST_CONFIG_PATH);

    editConfig({ blocklist: [] }, TEST_CONFIG_PATH);

    const config = readConfig(TEST_CONFIG_PATH);
    expect(config.shield).toBe(true);
    expect(config.blocklist).toEqual(expect.arrayContaining([distraction]));
});

test('Should not whitelist a distraction if shield mode is enabled', async () => {
    const distraction = { name: 'chess.com' };
    createConfig({ ...DEFAULT_CONFIG, shield: true }, TEST_CONFIG_PATH);

    editConfig({ whitelist: [distraction] }, TEST_CONFIG_PATH);

    const config = readConfig(TEST_CONFIG_PATH);
    expect(config.shield).toBe(true);
    expect(config.whitelist).toEqual(expect.arrayContaining([]));
});

test('Should enable shield mode', async () => {
    const passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';

    editConfig({ shield: true, passwordHash }, TEST_CONFIG_PATH);

    const config = readConfig(TEST_CONFIG_PATH);
    expect(config.shield).toBe(true);
    expect(config.passwordHash).toBe(passwordHash);
});

test('Should disable shield mode', async () => {
    const passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';
    createConfig({ ...DEFAULT_CONFIG, passwordHash, shield: true }, TEST_CONFIG_PATH);

    editConfig({ shield: false, password: 'ulysse' }, TEST_CONFIG_PATH);

    const config = readConfig(TEST_CONFIG_PATH);
    expect(config.shield).toBe(false);
});

test('Should not disable shield mode if password is wrong', async () => {
    const passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';
    createConfig({ ...DEFAULT_CONFIG, passwordHash, shield: true }, TEST_CONFIG_PATH);

    editConfig({ shield: false, password: 'badpassword' }, TEST_CONFIG_PATH);

    const config = readConfig(TEST_CONFIG_PATH);
    expect(config.shield).toBe(true);
});

test('Should get all running apps', async () => {
    const apps = getRunningApps();

    expect(JSON.stringify(apps)).toContain('node');
});

test('Should decrement time', () => {
    expect(decrementTime('30m')).toBe('29m');
    expect(decrementTime('2h')).toBe('1h59m');
    expect(decrementTime('1h59m')).toBe('1h58m');
    expect(decrementTime('1d')).toBe('23h59m');
    expect(decrementTime('1m')).toBe('0m');
});

test('Should get duration time type', () => {
    expect(getTimeType('1d')).toBe('duration');
    expect(getTimeType('30m')).toBe('duration');
    expect(getTimeType('1h30m')).toBe('duration');
    expect(getTimeType('10h-18h')).toBe('interval');
});

test.skip('Should block a distraction with a time-based interval', async () => {
    const distraction = { name: 'chess.com', time: '0h-23h' };
    createConfig({ blocklist: [distraction], whitelist: [] }, TEST_CONFIG_PATH);

    const isBlocked = isDistractionBlocked(distraction.name);

    expect(isBlocked).toBe(true);
});

test('Should get root domain', async () => {
    expect(rootDomain('www.example.com')).toBe('example.com');
    expect(rootDomain('example.com')).toBe('example.com');
});

test.skip('Should block a subdomain', async () => {
    const distraction = { name: 'chess.com' };
    createConfig({ blocklist: [distraction], whitelist: [] }, TEST_CONFIG_PATH);

    const isBlocked = isDistractionBlocked('www.chess.com');

    expect(isBlocked).toBe(true);
});
