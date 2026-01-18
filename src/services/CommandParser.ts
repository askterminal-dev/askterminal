import commands from '../data/commands.json'

export type SafetyLevel = 'safe' | 'moderate' | 'dangerous'

export interface CommandPart {
  text: string
  explanation: string
}

export interface CommandInfo {
  command: string
  description: string
  safety: SafetyLevel
  safetyMessage: string
  parts: CommandPart[]
}

interface CommandDef {
  description: string
  safety: SafetyLevel
  flags?: Record<string, string>
}

const commandDatabase = commands as Record<string, CommandDef>

const safetyMessages: Record<SafetyLevel, string> = {
  safe: 'This only reads information — nothing will be changed.',
  moderate: 'This will modify files or settings. Review before running.',
  dangerous: 'This can permanently delete data or change system settings. Be careful!'
}

/**
 * Parse a command string and return explanation info
 */
export function parseCommand(input: string): CommandInfo {
  const parts = input.trim().split(/\s+/)
  const baseCommand = parts[0]
  const args = parts.slice(1)

  // Look up command in database
  const cmdDef = commandDatabase[baseCommand]

  if (!cmdDef) {
    return {
      command: baseCommand,
      description: `Unknown command: ${baseCommand}`,
      safety: 'moderate',
      safetyMessage: 'This command is not in our database. Review carefully.',
      parts: [{ text: baseCommand, explanation: 'unknown command' }]
    }
  }

  // Build parts explanation
  const commandParts: CommandPart[] = [
    { text: baseCommand, explanation: cmdDef.description }
  ]

  // Parse flags and arguments
  for (const arg of args) {
    if (arg.startsWith('-') && cmdDef.flags) {
      // It's a flag - look it up
      const flagExplanation = cmdDef.flags[arg] || cmdDef.flags[arg.replace('--', '-')]
      if (flagExplanation) {
        commandParts.push({ text: arg, explanation: flagExplanation })
      } else {
        commandParts.push({ text: arg, explanation: 'flag' })
      }
    } else {
      // It's an argument
      commandParts.push({ text: arg, explanation: getArgumentType(arg) })
    }
  }

  // Build full description
  const description = buildDescription(baseCommand, cmdDef, args)

  return {
    command: baseCommand,
    description,
    safety: cmdDef.safety,
    safetyMessage: safetyMessages[cmdDef.safety],
    parts: commandParts
  }
}

/**
 * Determine argument type for explanation
 */
function getArgumentType(arg: string): string {
  if (arg.includes('/')) return 'path'
  if (arg.includes('.')) return 'file'
  if (arg === '.') return 'current directory'
  if (arg === '..') return 'parent directory'
  if (arg === '~') return 'home directory'
  if (arg === '*') return 'all files'
  return 'argument'
}

/**
 * Build a human-readable description of the full command
 */
function buildDescription(cmd: string, def: CommandDef, args: string[]): string {
  // Special handling for claude command
  if (cmd === 'claude') {
    return buildClaudeDescription(args)
  }

  let desc = def.description

  // Add context based on arguments
  if (args.length > 0) {
    const lastArg = args[args.length - 1]
    if (!lastArg.startsWith('-')) {
      if (lastArg.includes('/') || lastArg === '.' || lastArg === '..') {
        desc += ` in ${lastArg}`
      } else if (lastArg !== '*') {
        desc += ` for "${lastArg}"`
      }
    }
  }

  return desc
}

/**
 * Build description specifically for the claude command
 */
function buildClaudeDescription(args: string[]): string {
  // Check for specific flags
  const hasHelp = args.some(a => a === '--help' || a === '-h')
  const hasVersion = args.some(a => a === '--version' || a === '-v')
  const hasContinue = args.some(a => a === '-c' || a === '--continue')
  const hasResume = args.some(a => a === '-r' || a === '--resume')
  const hasPrint = args.some(a => a === '-p' || a === '--print')

  if (hasHelp) return 'Show Claude Code help and available options'
  if (hasVersion) return 'Show installed Claude Code version'
  if (hasContinue) return 'Continue your last Claude conversation'
  if (hasResume) return 'Resume a specific Claude conversation'

  // Check for prompt argument (non-flag argument)
  const promptArg = args.find(a => !a.startsWith('-'))
  if (promptArg) {
    const truncated = promptArg.length > 50 ? promptArg.substring(0, 50) + '...' : promptArg
    if (hasPrint) {
      return `Ask Claude (print mode): "${truncated}"`
    }
    return `Ask Claude a one-off question: "${truncated}"`
  }

  // Default: starting interactive session
  if (args.length === 0) {
    return 'Start an interactive Claude session in this directory'
  }

  return 'Start Claude Code AI assistant'
}

/**
 * Get all known commands (for autocomplete)
 */
export function getKnownCommands(): string[] {
  return Object.keys(commandDatabase)
}

/**
 * Check if a command exists in the database
 */
export function isKnownCommand(cmd: string): boolean {
  return cmd in commandDatabase
}
