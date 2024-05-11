import Gun from 'gun';
import { GUN_SERVER } from './constants';
import { editConfig, readConfig } from './config';

export const synchronize = () => {
    const attachListeners = (gun, fn) => {
        gun.get('db').get('config').on(fn);
    };

    const createGunInstance = () => {
        const options = {
            peers: [GUN_SERVER],
            axe: false,
            multicast: false,
            radisk: false,
            rfs: false,
            localStorage: false,
        };

        return new Gun(options);
    };

    let gun = createGunInstance();

    const sync = async (data) => {
        const newConfig = typeof data === 'string' ? JSON.parse(data) : data;

        if (new Date(newConfig.date) > new Date(readConfig().date)) {
            editConfig({ ...newConfig, gun: false });
            console.log('Synchronize...');
        }
    };

    const reconnectToNewInstance = (fn) => {
        gun.get('db').get('config').off();
        gun = createGunInstance();

        attachListeners(gun, fn);
    };

    attachListeners(gun, sync);

    setInterval(() => {
        console.log('Reconnecting...');
        reconnectToNewInstance(sync);
    }, 60000);
};
