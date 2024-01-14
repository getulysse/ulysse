import { getApps, blockApps } from '../src/utils';

test('Should list all running apps', async () => {
    const apps = getApps();

    expect(apps).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                name: 'node',
            }),
        ]),
    );
});

test.skip('Should kill a running app from the blocklist', async () => {
    blockApps();
});
