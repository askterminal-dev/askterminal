import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Interactive program types and their controls
export type InteractiveType = 'pager' | 'editor-vim' | 'editor-nano' | 'monitor' | null
export type PromptType = 'yesno' | 'input' | null

export const interactiveCommands: Record<string, InteractiveType> = {
  man: 'pager',
  less: 'pager',
  more: 'pager',
  vim: 'editor-vim',
  vi: 'editor-vim',
  nvim: 'editor-vim',
  nano: 'editor-nano',
  top: 'monitor',
  htop: 'monitor',
}

// Patterns that indicate the shell prompt has returned (must be at end of output)
const shellPromptPatterns = [
  /→\s+[^\n]*[~\/]\s*$/, // oh-my-zsh style: → ~ (at very end)
  /\n[^\n]*\$\s*$/,      // basic: $ on its own line at end
  /\n[^\n]*%\s*$/,       // zsh: % on its own line at end
]

// Patterns for Y/n prompts
const yesNoPatterns = [
  /\[Y\/n\]\s*$/i,
  /\[y\/N\]\s*$/i,
  /\(yes\/no\)\s*$/i,
  /\(y\/n\)\s*$/i,
  /\[yes\/no\]\s*$/i,
]

// Patterns that indicate we're still in a pager (less/man)
const pagerPromptPatterns = [
  /:\s*$/,           // less prompt: :
  /\(END\)\s*$/,     // less at end of file
  /--More--/i,       // more pager
  /lines \d+-\d+/i,  // man pager indicator
]

export const useTerminalStore = defineStore('terminal', () => {
  // State
  const cwd = ref('~')
  const draftCommand = ref('')
  const isRunning = ref(false)
  const history = ref<string[]>([])
  const interactiveMode = ref<InteractiveType>(null)
  const promptMode = ref<PromptType>(null)
  const promptQuestion = ref('')

  // Actions
  function setDraftCommand(cmd: string) {
    draftCommand.value = cmd
  }

  function clearDraftCommand() {
    draftCommand.value = ''
  }

  function addToHistory(cmd: string) {
    if (cmd.trim()) {
      history.value.push(cmd)
    }
  }

  function setCwd(path: string) {
    cwd.value = path
  }

  function setIsRunning(running: boolean) {
    isRunning.value = running
  }

  function setInteractiveMode(mode: InteractiveType) {
    interactiveMode.value = mode
  }

  function detectInteractiveCommand(cmd: string): InteractiveType {
    const command = cmd.trim().split(/\s+/)[0]
    return interactiveCommands[command] || null
  }

  function setPromptMode(mode: PromptType, question: string = '') {
    promptMode.value = mode
    promptQuestion.value = question
  }

  // Process PTY output to detect prompts and mode changes
  function processPtyOutput(data: string) {
    // Strip ANSI escape codes for pattern matching
    const cleanData = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')

    // Check for Y/n prompts first (higher priority)
    for (const pattern of yesNoPatterns) {
      if (pattern.test(cleanData)) {
        // Extract the question (last line before the prompt)
        const lines = cleanData.trim().split('\n')
        const question = lines[lines.length - 1] || ''
        setPromptMode('yesno', question)
        return
      }
    }

    // If we're in pager mode, check if we're still in the pager
    if (interactiveMode.value === 'pager') {
      // Check for pager prompt - if found, stay in pager mode
      for (const pattern of pagerPromptPatterns) {
        if (pattern.test(cleanData)) {
          // Still in pager, don't exit
          return
        }
      }
    }

    // If we're in interactive mode, check if shell prompt has returned
    if (interactiveMode.value) {
      for (const pattern of shellPromptPatterns) {
        if (pattern.test(cleanData)) {
          // Shell prompt detected - exit interactive mode
          interactiveMode.value = null
          return
        }
      }
    }

    // If we're in prompt mode and shell prompt returns, exit prompt mode
    if (promptMode.value) {
      for (const pattern of shellPromptPatterns) {
        if (pattern.test(cleanData)) {
          promptMode.value = null
          promptQuestion.value = ''
          return
        }
      }
    }
  }

  return {
    // State
    cwd,
    draftCommand,
    isRunning,
    history,
    interactiveMode,
    promptMode,
    promptQuestion,
    // Actions
    setDraftCommand,
    clearDraftCommand,
    addToHistory,
    setCwd,
    setIsRunning,
    setInteractiveMode,
    setPromptMode,
    detectInteractiveCommand,
    processPtyOutput
  }
})
