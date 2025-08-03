import fs from 'fs';
import { isAbsolute } from 'path';
import { execSync } from 'child_process';
import { isValidApp } from './block';
import { config, editConfig } from './config';
import { DEFAULT_TIMEOUT } from './constants';
import { sha256, createTimeout } from './utils';

export const isValidPassword = (password) => {
    if (!password) return false;
    const sha256sum = sha256(String(password));
    return sha256sum === config.passwordHash;
};

export const enableShieldMode = async (password, timeout = DEFAULT_TIMEOUT) => {
    const passwordHash = password ? sha256(password) : null;

    await editConfig({
        ...config,
        passwordHash,
        shield: { enable: true, ...(timeout ? { timeout: createTimeout(timeout) } : {}) },
    });
};

export const disableShieldMode = async (password) => {
    await editConfig({ ...config, password, shield: { enable: false } });
};

export const blockRoot = () => {
    if (process.env.NODE_ENV === 'test') return;

    execSync('usermod -s /usr/sbin/nologin root');
    fs.writeFileSync('/etc/sudoers.d/ulysse', `${process.env.SUDO_USER} ALL=(ALL) !ALL`, 'utf8');

    for (const w of config.whitelist) {
        if (isValidApp(w.name) && isAbsolute(w.name)) {
            fs.appendFileSync('/etc/sudoers.d/ulysse', `\n${process.env.SUDO_USER} ALL=(ALL) ${w.name}`, 'utf8');
        }
    }

    fs.chmodSync('/etc/sudoers.d/ulysse', '0440');
};

export const unblockRoot = () => {
    if (process.env.NODE_ENV === 'test') return;

    execSync('usermod -s /bin/bash root');
    if (fs.existsSync('/etc/sudoers.d/ulysse')) {
        fs.unlinkSync('/etc/sudoers.d/ulysse');
    }
};
