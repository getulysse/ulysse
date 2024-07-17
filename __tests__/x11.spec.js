import { listActiveWindows } from '../src/x11';

test.skip('Should list active windows', async () => {
    const windows = await listActiveWindows();

    expect(windows[0]).toEqual(
        { windowId: expect.any(Number), name: expect.any(String), pid: expect.any(Number) },
    );
});
