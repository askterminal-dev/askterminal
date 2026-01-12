# Ask Terminal

A beginner-friendly terminal that explains every command before you run it. Understand what you're doing, build confidence, and never accidentally break anything.

![Ask Terminal Screenshot](docs/screenshot.svg)

## Features

### Plain English Explanations
Every command is broken down and explained before you run it. No more guessing what `chmod 755` actually does.

### Safety Indicators
Color-coded warnings show if a command is safe, needs caution, or could be dangerous:
- **Green** - Safe commands (ls, cd, pwd, cat...)
- **Yellow** - Caution commands (cp, mv, mkdir, git...)
- **Red** - Dangerous commands (rm, sudo, chmod...)

### Skill Levels
Progress at your own pace with three skill levels:

| Level | Commands Allowed | Direct Typing |
|-------|-----------------|---------------|
| **Beginner** | Safe only | Draft Panel only |
| **Intermediate** | Safe + Moderate | Optional toggle |
| **Advanced** | All commands | Always enabled |

### Tab Completion
Smart autocomplete for commands and file paths. Press Tab to see suggestions.

### Typo Detection
Misspell a command? Ask Terminal suggests what you might have meant.

## Installation

### macOS

Download the latest `.dmg` from [Releases](https://github.com/askterminal/ask-terminal/releases) and drag to Applications.

### Build from Source

```bash
# Clone the repository
git clone https://github.com/askterminal/ask-terminal.git
cd ask-terminal

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **Electron** - Cross-platform desktop framework
- **Vue 3** - Frontend framework
- **Pinia** - State management
- **xterm.js** - Terminal emulator
- **node-pty** - Pseudo-terminal
- **Tailwind CSS** - Styling

## Command Safety Classification

### Safe
`ls`, `cd`, `pwd`, `echo`, `cat`, `head`, `tail`, `grep`, `find`, `man`, `history`, `which`, `whoami`, `date`, `cal`

### Moderate
`cp`, `mv`, `mkdir`, `touch`, `npm`, `git`, `curl`, `wget`, `tar`, `zip`, `unzip`

### Dangerous
`rm`, `sudo`, `chmod`, `chown`, `kill`, `mkfs`, `dd`, `>` (redirect overwrite)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Run command |
| `Tab` | Autocomplete |
| `Ctrl+C` / `Cmd+C` | Stop running process |
| `Cmd+,` | Open Settings |

## License

MIT

## Links

- [Website](https://askterminal.dev)
- [Documentation](https://askterminal.dev/docs.html)
- [Report Issue](https://github.com/askterminal/ask-terminal/issues)
