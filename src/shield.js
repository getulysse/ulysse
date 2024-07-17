import fs from 'fs';
import { execSync } from 'child_process';
import { isValidApp } from './block';
import { config, editConfig } from './config';
import { generatePassword, sha256 } from './utils';

export const isValidPassword = (password) => {
    if (!password) return false;
    const sha256sum = sha256(String(password));
    return sha256sum === config.passwordHash;
};

export const enableShieldMode = async (password = generatePassword()) => {
    const passwordHash = sha256(password);
    console.log(`Your password is: ${password}`);

    await editConfig({ ...config, password, passwordHash, shield: true });
};

export const disableShieldMode = async (password) => {
    await editConfig({ ...config, password, shield: false });
};

export const blockRoot = () => {
    if (process.env.NODE_ENV === 'test') return;

    execSync('usermod -s /usr/sbin/nologin root');
    fs.writeFileSync('/etc/sudoers.d/ulysse', `${process.env.SUDO_USER} ALL=(ALL) !ALL`, 'utf8');

    for (const w of config.whitelist) {
        if (isValidApp(w.name)) {
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
