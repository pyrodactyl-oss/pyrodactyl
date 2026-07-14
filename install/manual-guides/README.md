# Pyrodactyl Manual Installation Guides

This directory contains comprehensive manual installation guides for Pyrodactyl Panel and Elytra Daemon. These guides are designed for users who prefer to install and configure each component manually, or for those who want to understand the installation process in detail.

## 📚 Available Guides

| Guide | Description | Use Case |
|-------|-------------|----------|
| [Pyrodactyl Panel Manual](./pyrodactyl-panel-manual.md) | Complete standalone Panel installation | Control panel only, separate from game servers |
| [Elytra Daemon Manual](./elytra-manual.md) | Complete standalone Daemon installation | Game server node only, connects to existing Panel |
| [Both Same Machine](./both-same-machine.md) | Combined Panel + Daemon installation | Single-server setup for small deployments |

## 🤔 Which Guide Should I Use?

### Use the **Panel Only** guide if:
- You want a dedicated control panel server
- You plan to have multiple game server nodes
- You're setting up a distributed architecture
- You already have Elytra installed elsewhere

### Use the **Elytra Only** guide if:
- You already have a Pyrodactyl Panel running
- You're adding a new game server node
- You want dedicated game server hardware
- You're expanding an existing setup

### Use the **Both Same Machine** guide if:
- You're setting up a small deployment
- You're testing or developing
- You have limited server resources
- You want everything on one server for simplicity

## 🔄 Manual vs Automated Installer

We also provide an [automated installer](../install.sh) that can:
- Install everything with a single command
- Automatically configure all components
- Set up SSL certificates
- Configure firewalls
- Verify installations

**Use the automated installer if you:**
- Want a quick, one-command installation
- Are setting up a standard configuration
- Prefer automated configuration

**Use these manual guides if you:**
- Want to learn how each component works
- Need custom configurations
- Are troubleshooting an existing installation
- Want to install components separately
- Are using non-standard environments

## ⚙️ Prerequisites for All Guides

Before starting any manual installation, ensure you have:

- **Root access** to a fresh Linux server (Ubuntu 22.04+, Debian 12+, Rocky Linux 9+, or AlmaLinux 9+)
- **Domain name(s)** pointed to your server IP(s)
- **Server specifications** meeting minimum requirements:
  - Panel Only: 2 cores, 2GB RAM, 20GB SSD
  - Elytra Only: 2 cores, 2GB RAM, 20GB SSD
  - Both Same Machine: 4 cores, 4GB RAM, 50GB SSD
- **Supported virtualization** (KVM, VMware, Xen - OpenVZ/LXC not supported for Elytra)

## 🔧 Common Configuration

All installations require:
- MariaDB (MySQL) database server
- Redis cache server
- Nginx web server
- PHP 8.4 with required extensions
- SSL/TLS certificates (Let's Encrypt recommended)

Elytra additionally requires:
- Docker Engine
- Swap accounting enabled (for game server containers)

## 🆘 Getting Help

If you encounter issues with manual installation:

1. **Check the Troubleshooting section** in the specific guide
2. **Review logs**: `journalctl -u <service>` for systemd services
3. **Check our GitHub Issues**:
   - [Pyrodactyl Issues](https://github.com/pyrodactyl-oss/pyrodactyl/issues)
   - [Elytra Issues](https://github.com/pyrohost/elytra/issues)
4. **Community Support**: Join our Discord community

## 📖 Guide Structure

Each manual guide follows this structure:

1. **System Requirements** - Hardware and software prerequisites
2. **Step-by-Step Instructions** - Detailed commands and configurations
3. **Verification Steps** - How to confirm everything works
4. **Troubleshooting** - Common issues and solutions
5. **Post-Installation** - Recommended next steps and maintenance

## 🎓 Learning Path

New to Pyrodactyl? Follow this path:

1. **Start with the "Both Same Machine" guide** - Get everything running quickly
2. **Experiment and learn** - Understand how components interact
3. **Read individual guides** - Dive deeper into each component
4. **Plan your architecture** - Decide if you need separate servers
5. **Scale up** - Use separate guides for production deployment

## 📝 Contributing

Found an error in a guide? Want to improve documentation?

- Submit a PR to the [pyrodactyl-installer repository](https://github.com/Muspelheim-Hosting/pyrodactyl-installer)
- Report issues via GitHub Issues
- Suggest improvements based on your experience

## 🔗 Quick Links

- [Main Installer](../install.sh) - Automated one-command installer
- [Panel Guide](./pyrodactyl-panel-manual.md) - Panel-only installation
- [Elytra Guide](./elytra-manual.md) - Daemon-only installation
- [Combined Guide](./both-same-machine.md) - Both on same server

---

**Happy hosting!** 🎮🚀
