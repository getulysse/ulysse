import Gun from 'gun';
import { GUN_SERVER } from './constants';
import { editConfig, readConfig } from './config';

export const synchronize = () => {
    const gun = Gun({ peers: [GUN_SERVER], axe: false });

    gun.get('db').get('config').on(async (data) => {
        const newConfig = typeof data === 'string' ? JSON.parse(data) : data;

        if (new Date(newConfig.date) > new Date(readConfig().date)) {
            editConfig({ ...newConfig, gun: false });
            console.log('Synchronize...');
        }
    });
};
