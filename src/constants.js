export const DEFAULT_CONFIG = process.env.DEFAULT_CONFIG || { shield: false, blocklist: [], whitelist: [], date: new Date().toISOString() };

export const RESOLV_CONF_PATH = process.env.RESOLV_CONF_PATH || '/etc/resolv.conf';

export const CONFIG_PATH = process.env.CONFIG_PATH || '/etc/ulysse/config.json';

export const SOCKET_PATH = process.env.SOCKET_PATH || '/var/run/ulysse.sock';

export const DNS_SERVER = process.env.DNS_SERVER || '9.9.9.9';

export const DNS_PORT = process.env.DNS_PORT || 53;

export const SERVER_HOST = process.env.SERVER_HOST || 'http://ulysse.localhost';

export const SERVER_PORT = process.env.SERVER_PORT || 3000;

export const DNS_TYPE = { A: 1, AAAA: 28 };

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
                             'ulysse -b MyAppName -t 10h-18h' (block during specific hours)

  -u, --unblock TARGET     Unblock a specific website or application.
                           Example: 'ulysse -u example.com' or 'ulysse -u MyAppName'.

  -w, --whitelist TARGET   Whitelist a specific website.
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
