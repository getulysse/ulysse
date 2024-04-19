import fs from 'fs';
import { config } from './config';
import { CONFIG_PATH } from './constants';
import { getRootDomain, removeDuplicates, getTimeType, createTimeout } from './utils';

export const whitelistDistraction = (distraction) => {
    if (config.shield) return;

    config.whitelist = removeDuplicates([...config.whitelist, distraction]);
    config.whitelist = config.whitelist.map((d) => {
        if (getTimeType(d.time) === 'duration') {
            return { ...d, timeout: createTimeout(d.time) };
        }

        return d;
    });

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4), 'utf8');
};

export const isDistractionWhitelisted = (distraction) => {
    if (config.whitelist.some((d) => d.name === distraction)) return true;
    if (config.whitelist.some((d) => d.name === '*')) return true;
    if (config.whitelist.some((d) => d.name === `*.${getRootDomain(distraction)}`)) return true;

    return false;
};
