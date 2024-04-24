import { config, editConfig } from './config';
import { getRootDomain, removeDuplicates, getTimeType, createTimeout } from './utils';

export const whitelistDistraction = async (distraction) => {
    if (config.shield) return;

    config.whitelist = removeDuplicates([...config.whitelist, distraction]);
    config.whitelist = config.whitelist.map((d) => {
        if (getTimeType(d.time) === 'duration') {
            return { ...d, timeout: createTimeout(d.time) };
        }

        return d;
    });

    await editConfig(config);
};

export const isDistractionWhitelisted = (distraction) => {
    if (config.whitelist.some((d) => d.name === distraction)) return true;
    if (config.whitelist.some((d) => d.name === '*')) return true;
    if (config.whitelist.some((d) => d.name === `*.${getRootDomain(distraction)}`)) return true;

    return false;
};
