// Shared types between main process and renderer

export type SafetyLevel = 'safe' | 'moderate' | 'dangerous'

export interface CommandDefinition {
  description: string
  safety: SafetyLevel
  flags?: Record<string, string>
}

export interface CommandDatabase {
  [command: string]: CommandDefinition
}

// PTY types
export interface PtyOptions {
  cols: number
  rows: number
  cwd?: string
}

// Terminal types
export interface TerminalState {
  cwd: string
  isRunning: boolean
  history: string[]
}
