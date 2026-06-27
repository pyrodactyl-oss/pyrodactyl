<p align="center">
  <img alt="header" src="https://shieldcn.dev/header/gradient.svg?title=Pyrodactyl&amp;subtitle=The+world%27s+best+Pterodactyl+panel.+Unmatched+performance+and+features.&amp;mode=dark&amp;image=https%3A%2F%2Fpyrodactyl.dev%2Fpanelscreenshots%2Fpyrodactyl-server.png" />
</p>

> [!NOTE]
> All Issues and PRs should be made in the [pyrodactyl-oss repo](https://github.com/pyrodactyl-oss/pyrodactyl).

> [!WARNING]
> Pyrodactyl is under development and pre-release. Some UI elements may appear broken, and there might be some bugs.

> [!NOTE]
> Please read our documentation at [https://pyrodactyl.dev](https://pyrodactyl.dev/docs/pyrodactyl) before installing.

> [!IMPORTANT]
> For Pyrodactyl-specific issues, please use the [Pyrodactyl Discord](https://discord.gg/mnTJVSSaKp?utm_source=githubreadme&utm_medium=readme&utm_campaign=OSSLAUNCH&utm_id=OSSLAUNCH) instead of Pterodactyl or Pelican support channels.

<p align="center">
  <img alt="online" src="https://shieldcn.dev/discord/1515499709685436588.svg?variant=secondary" />
  <img alt="Custom badge" src="https://shieldcn.dev/badge/Pterodactyl.svg?variant=branded&amp;logo=pterodactyl&amp;label=Fork+of" />
</p>

## Changes from vanilla Pterodactyl

- **Smaller bundle sizes**: Pyrodactyl is built using Vite, and significant design changes mean Pyrodactyl's initial download size is over 170 times smaller than leading Pterodactyl forks, including Pelican.
- **Faster build times**: Pyrodactyl completes builds in milliseconds with the power of Turbo. Cold builds with zero cache finish in under 7 seconds.
- **Faster loading times**: Pyrodactyl's load times are, on average, over 16 times faster than other closed-source Pterodactyl forks and Pelican. Smarter code splitting and chunking means that pages you visit in the panel only load necessary resources on demand. Better caching means that everything is simply snappy.
- **More secure**: Pyrodactyl's modern architecture means most severe and easily exploitable CVEs simply do not exist. We have also implemented SRI and integrity checks for production builds.
- **More accessible**: Pyro believes that gaming should be easily available for everyone. Pyrodactyl builds with the latest Web accessibility guidelines in mind. Pyrodactyl is entirely keyboard-navigable, even context menus, and screen-readers are easily compatible.
- **More approachable**: Pyrodactyl's friendly, approachable interface means that anyone can confidently run a game server with Pyro.

## Easy Script Installation
**Officially licensed third-party script**

A community member has built an automated installer to get Pyrodactyl up and running quickly! You can find the script at their GitHub repository: [Muspelheim-Hosting/pyrodactyl-installer](https://github.com/Muspelheim-Hosting/pyrodactyl-installer)

## Quickstart
### System requirements
#### Minimum Requirements

| Component | Specification |
|-----------|--------------|
| **CPU** | 2 cores (x86_64 or ARM64) |
| **RAM** | 2 GB |
| **Storage** | 20 GB SSD |
| **Network** | Public IPv4 or IPv6 |
| **OS** | Ubuntu 22.04/24.04, Debian 11/12, Rocky Linux 8/9, AlmaLinux 8/9 |

#### Recommended Requirements

| Component | Specification |
|-----------|--------------|
| **CPU** | 4+ cores |
| **RAM** | 4+ GB |
| **Storage** | 50+ GB SSD |
| **Network** | Both IPv4 and IPv6 |
| **OS** | Ubuntu 24.04 |

## License & Legal

Pyrodactyl is licensed under the **Apache License 2.0**, ensuring the software remains free and open-source.

* Pterodactyl® Copyright © 2015–2022 Dane Everitt and contributors.
* Pyrodactyl™ Copyright © 2023–2025 Pyro Inc. and contributors.
* Pyrodactyl™ Copyright © 2025–present Pyrodactyl-OSS and contributors.
* You are permitted to use, modify, and distribute this project under the terms of the **Apache License 2.0**.

For full license details, see [LICENSE](./LICENSE).
