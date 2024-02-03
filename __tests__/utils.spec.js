import fs from 'fs';
import childProcess from 'child_process';
import { DEFAULT_CONFIG } from '../src/constants';
import {
    readConfig,
    editConfig,
    createConfig,
    getRunningApps,
    isValidDistraction,
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
    expect(isValidDistraction('chess.com')).toBe(true);
    expect(isValidDistraction('chromium')).toBe(true);
    expect(isValidDistraction('inexistent')).toBe(false);
});

test('Should add a distraction to blocklist', async () => {
    editConfig({ ...DEFAULT_CONFIG, blocklist: ['chess.com'] }, TEST_CONFIG_PATH);

    const config = readConfig(TEST_CONFIG_PATH);
    expect(config.blocklist).toEqual(expect.arrayContaining(['chess.com']));
});

test('Should remove a distraction from blocklist', async () => {
    createConfig({ ...DEFAULT_CONFIG, blocklist: ['chess.com'] }, TEST_CONFIG_PATH);

    editConfig({ blocklist: [] }, TEST_CONFIG_PATH);

    const config = readConfig(TEST_CONFIG_PATH);
    expect(config.blocklist).toEqual(expect.not.arrayContaining(['chess.com']));
});

test('Should not remove a distraction from blocklist if shield mode is enabled', async () => {
    createConfig({ ...DEFAULT_CONFIG, blocklist: ['chess.com'], shield: true }, TEST_CONFIG_PATH);

    editConfig({ blocklist: [] }, TEST_CONFIG_PATH);

    const config = readConfig(TEST_CONFIG_PATH);
    expect(config.shield).toBe(true);
    expect(config.blocklist).toEqual(expect.arrayContaining(['chess.com']));
});

test('Should not whitelist a distraction if shield mode is enabled', async () => {
    createConfig({ ...DEFAULT_CONFIG, shield: true }, TEST_CONFIG_PATH);

    editConfig({ whitelist: ['chess.com'] }, TEST_CONFIG_PATH);

    const config = readConfig(TEST_CONFIG_PATH);
    expect(config.shield).toBe(true);
    expect(config.whitelist).toEqual(expect.not.arrayContaining(['chess.com']));
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
