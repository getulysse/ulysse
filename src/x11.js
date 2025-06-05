import x11 from './x11-shim';

const connectToX11 = () => new Promise((resolve, reject) => {
    const client = x11.createClient((err, display) => {
        if (err) {
            reject(err);
        } else {
            resolve(display);
        }
    });

    client.on('error', (err) => {
        reject(err);
    });
});

const getProperty = (display, windowId, atom, type) => new Promise((resolve, reject) => {
    display.client.GetProperty(0, windowId, atom, type, 0, 1000000, (err, prop) => {
        if (err) {
            reject(err);
        } else {
            resolve(prop);
        }
    });
});

const internAtom = (display, atomName) => new Promise((resolve, reject) => {
    display.client.InternAtom(false, atomName, (err, atom) => {
        if (err) {
            reject(err);
        } else {
            resolve(atom);
        }
    });
});

export const closeWindow = async (windowId) => {
    let display;

    try {
        display = await connectToX11();
        display.client.DestroyWindow(windowId);
    } finally {
        await display.client.terminate();
    }
};

export const listActiveWindows = async () => {
    let display;
    const windows = [];

    try {
        display = await connectToX11();
        const { root } = display.screen[0];

        const atom = await internAtom(display, '_NET_CLIENT_LIST');
        const type = await internAtom(display, 'WINDOW');
        const prop = await getProperty(display, root, atom, type);

        const windowIds = Array.from({ length: prop.data.length / 4 }, (_, i) => prop.data.readUInt32LE(i * 4));

        for await (const windowId of windowIds) {
            const nameProp = await getProperty(display, windowId, display.client.atoms.WM_CLASS, display.client.atoms.STRING);
            const name = nameProp?.data?.toString().split('\0')[0] || 'N/A';

            const pidAtom = await internAtom(display, '_NET_WM_PID');
            const pidProp = await getProperty(display, windowId, pidAtom, display.client.atoms.CARDINAL);
            const pid = pidProp?.data?.length > 0 ? pidProp.data.readUInt32LE(0) : 'N/A';

            windows.push({ windowId, name, pid });
        }
    } catch {
        return windows;
    } finally {
        await display.client.terminate();
    }

    return windows;
};
