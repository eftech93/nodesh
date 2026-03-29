# Installation

NodeSH can be installed globally for use across multiple projects, or locally per project.

## Global Installation (Recommended)

Installing NodeSH globally allows you to use it with any Node.js project on your system without adding it as a dependency.

```bash
npm install -g @eftech93/nodesh
```

After global installation, you can use any of these commands:

```bash
# Full command
nodesh --yes

# Short alias (3 characters)
nsh --yes

# EFTECH93 brand alias
eft --yes
```

## Local Installation

For team consistency or CI/CD environments, install NodeSH as a dev dependency:

```bash
npm install --save-dev @eftech93/nodesh
```

Add to your `package.json` scripts:

```json
{
  "scripts": {
    "console": "nodesh --yes"
  }
}
```

Then run:

```bash
npm run console
```

## Requirements

- **Node.js**: >= 14.0.0
- **TypeScript**: >= 4.0 (for TypeScript projects)

## Verifying Installation

```bash
# Check version
nodesh --version

# Show help
nodesh --help
```

## Docker Support

For projects using Docker:

```dockerfile
# Add to your Dockerfile
RUN npm install -g @eftech93/nodesh

# Or in docker-compose.yml
services:
  app:
    command: sh -c "npm install -g @eftech93/nodesh && nodesh"
```

## Troubleshooting

### Permission Errors (Global Install)

On Linux/Mac, you might need to use `sudo`:

```bash
sudo npm install -g @eftech93/nodesh
```

Or fix npm permissions:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
npm install -g @eftech93/nodesh
```

### Command Not Found

Ensure global npm packages are in your PATH:

```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$(npm config get prefix)/bin:$PATH"
```

### Windows Users

On Windows, you may need to run PowerShell as Administrator for global installation.
