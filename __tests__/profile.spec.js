import { config, resetConfig } from '../src/config';
import { disableShieldMode } from '../src/shield';

beforeEach(async () => {
    process.argv = [];
    await disableShieldMode('ulysse');
    await resetConfig();
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

test.skip('Should create a new profile', () => {
    process.argv = ['ulysse', '-p', 'work'];

    expect(config.profiles).toEqual([{ name: 'work', enabled: true }]);
});
