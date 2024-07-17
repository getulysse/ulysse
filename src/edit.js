import fs from 'fs';
import { config } from './config';
import { CONFIG_PATH } from './constants';
import { isValidPassword, blockRoot, unblockRoot } from './shield';
import { removeDuplicates } from './utils';

const removeTimeouts = (list) => list.filter(({ timeout }) => !timeout || timeout >= Math.floor(Date.now() / 1000));

export const editConfig = (newConfig) => {
    const { blocklist = [], whitelist = [], profiles = [], date, shield, password, passwordHash } = newConfig;

    config.date = date;
    config.profiles = profiles;
    config.whitelist = removeTimeouts(removeDuplicates(config.shield ? config.whitelist : whitelist));
    config.blocklist = removeTimeouts(removeDuplicates(config.shield ? [...config.blocklist, ...blocklist] : blocklist));

    if (isValidPassword(password)) {
        unblockRoot();
        config.shield = false;
        delete config.passwordHash;
    }

    if (shield && passwordHash) {
        blockRoot();
        config.shield = true;
        config.passwordHash = passwordHash;
    }

    delete config.password;

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4), 'utf8');
};
