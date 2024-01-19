import os from 'os';

export const DEFAULT_CONFIG_FOLDER_PATH = `/home/${process.env.SUDO_USER || os.userInfo().username}/.config/ulysse`;

export const DEFAULT_CONFIG_PATH = `${DEFAULT_CONFIG_FOLDER_PATH}/${process.env.NODE_ENV === 'test' ? 'test' : 'config'}.json`;

export const DEFAULT_CONFIG = {
    shield: false,
    blocklist: [],
    whitelist: [],
};

export const PIPE_PATH = `${DEFAULT_CONFIG_FOLDER_PATH}/pipe.json`;

export const DNS_SERVER = process.env.DNS_SERVER || '9.9.9.9';

export const DNS_PORT = process.env.DNS_PORT || 53;

export const HELP = `Usage: ulysse [OPTIONS]

  Ulysse: A simple and powerful tool to block your distracting apps and websites.

Options:
  -b, --block TARGET [-t, --time VALUE]
                           Block a specific website or application. Optionally, add a time-based setting.
                           The VALUE format can include usage limits, specific time intervals,
                           or a quick block duration.
                           Examples: 
                             'ulysse -b example.com' (block indefinitely)
                             'ulysse -b example.com -t 30m/day' (block with a daily limit)
                             'ulysse -b example.com -t 10m' (block for a short duration)
                             'ulysse -b MyAppName -t 10am-6pm' (block during specific hours)
                             'ulysse -b "*.*"' (block all websites)

  -u, --unblock TARGET     Unblock a specific website or application.
                           Example: 'ulysse -u example.com' or 'ulysse -u MyAppName'.

  -w, --whitelist          Whitelist a specific website.
                           Example: 'ulysse -w example.com'.

  -s, --shield [on|off] [-p, --password VALUE]
                           Enable or disable shield mode to prevent jailbreak.
                           By default, the shield mode is on. Use 'off' along with a password to disable it.
                           The password is required to disable the shield mode.
                           Example: 'ulysse -s on' to enable or 'ulysse -s off -p myp@ssw0rd' to disable.

  -d, --daemon             Run Ulysse as a daemon.
                           Example: 'ulysse -d' or 'ulysse --daemon'.

  -v, --version            Show the version and exit.

  -h, --help               Show this message and exit.`;
