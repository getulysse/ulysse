# ulysse

[![License](https://img.shields.io/badge/license-GPL%20v3%2B-yellow.svg?label=License&style=flat&colorA=2B323B&colorB=1e2329)](https://raw.githubusercontent.com/getulysse/ulysse/master/LICENSE.txt)

ulysse is a simple CLI tool for blocking all apps and websites except the ones you whitelist.

The block cannot be bypassed from software, even if you are the administrator of your computer, because it uses eBPF to block apps and websites at the kernel level.

Physical bypass (GRUB, Live USB) is out of scope.

> [!WARNING]
> This project is in early development and is not yet ready for production use. Use at your own risk.
>
> If you ever lock yourself out, boot from a Live USB and run:
>
> ```bash
> mount /dev/sdX /mnt
> chroot /mnt
> ulysse unlock
> ```

## 🤔 Why?

I created ulysse because I wanted a simple way to block all apps and websites by default and only allow the ones I need, without any way to bypass the block.

## 📋 Requirements

- Linux 5.7+ with `lsm=bpf` enabled in the kernel boot parameters
- Debian, Ubuntu, Fedora, Arch, etc.

## 📦 Installation

```bash
curl -sL https://getulysse.github.io/install.sh | sh
```

## 📖 Usage

```txt
A simple CLI tool for blocking your distracting apps and websites.

Usage: ulysse <COMMAND>

Commands:
  block      Block all apps and websites
  unlock     Unlock the block
  whitelist  Manage the whitelist (add/remove apps and domains)
  status     Show the current block status and whitelist
  help       Print this message or the help of the given subcommand(s)

Options:
  -h, --help     Print help
  -V, --version  Print version

Examples:
  ulysse whitelist add spotify                  # Allow a specific app
  ulysse whitelist add wikipedia.org            # Allow a specific domain
  ulysse whitelist remove spotify               # Remove an app from the whitelist
  ulysse whitelist list                         # List the current whitelist

  ulysse block                                  # Block all apps and websites
  ulysse block --duration 2h                    # Block everything for 2 hours
  ulysse block --duration 8h-20h                # Block every day from 8am to 8pm
  ulysse block --space writing                  # Start a session with a workspace
```

## 🎁 Support me

Please support me with a one-time or monthly donation to help me continue my work.

[![Github sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors)](https://github.com/sponsors/johackim/)

## 📜 License

This project is licensed under the GNU GPL v3.0 - see the [LICENSE.txt](https://raw.githubusercontent.com/getulysse/ulysse/master/LICENSE.txt) file for details.

**Free Software, Hell Yeah!**
