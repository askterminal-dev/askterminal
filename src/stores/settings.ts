import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'
export type SafetyLevel = 'safe' | 'moderate' | 'dangerous'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const skillLevel = ref<SkillLevel>('beginner')
  const directTerminalInput = ref(false)
  const theme = ref<'light' | 'dark'>('light')
  const terminalFontSize = ref<'small' | 'medium' | 'large'>('medium')

  // Computed: Check if direct terminal input should be enabled
  const isDirectInputEnabled = computed(() => {
    if (skillLevel.value === 'advanced') return true
    if (skillLevel.value === 'intermediate') return directTerminalInput.value
    return false // beginner
  })

  // Check if a command with given safety level is allowed
  function canRunCommand(commandSafety: SafetyLevel): 'allow' | 'confirm' | 'block' {
    const level = skillLevel.value

    if (level === 'beginner') {
      // Only safe commands allowed
      if (commandSafety === 'safe') return 'allow'
      return 'block'
    }

    if (level === 'intermediate') {
      // Safe and moderate allowed, dangerous needs confirmation
      if (commandSafety === 'safe' || commandSafety === 'moderate') return 'allow'
      return 'confirm'
    }

    // Advanced: everything allowed
    return 'allow'
  }

  // Get message for blocked command
  function getBlockMessage(commandSafety: SafetyLevel): string {
    if (commandSafety === 'dangerous') {
      return 'This command can permanently delete or modify critical files. Unlock by changing to Intermediate or Advanced mode in Settings.'
    }
    return 'This command modifies files or settings. Unlock by changing to Intermediate or Advanced mode in Settings.'
  }

  // Load settings from localStorage
  function loadSettings() {
    const saved = localStorage.getItem('askterminal-settings')
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        skillLevel.value = settings.skillLevel || 'beginner'
        directTerminalInput.value = settings.directTerminalInput ?? false
        theme.value = settings.theme || 'light'
        terminalFontSize.value = settings.terminalFontSize || 'medium'
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  // Save settings to localStorage
  function saveSettings() {
    localStorage.setItem('askterminal-settings', JSON.stringify({
      skillLevel: skillLevel.value,
      directTerminalInput: directTerminalInput.value,
      theme: theme.value,
      terminalFontSize: terminalFontSize.value
    }))
  }

  // Setters with auto-save
  function setSkillLevel(level: SkillLevel) {
    skillLevel.value = level
    // Reset direct input when going to beginner
    if (level === 'beginner') {
      directTerminalInput.value = false
    }
    saveSettings()
  }

  function setDirectTerminalInput(enabled: boolean) {
    directTerminalInput.value = enabled
    saveSettings()
  }

  function setTheme(newTheme: 'light' | 'dark') {
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
    saveSettings()
  }

  function setTerminalFontSize(size: 'small' | 'medium' | 'large') {
    terminalFontSize.value = size
    document.documentElement.setAttribute('data-terminal-font', size)
    saveSettings()
  }

  return {
    // State
    skillLevel,
    directTerminalInput,
    theme,
    terminalFontSize,
    // Computed
    isDirectInputEnabled,
    // Methods
    canRunCommand,
    getBlockMessage,
    loadSettings,
    saveSettings,
    setSkillLevel,
    setDirectTerminalInput,
    setTheme,
    setTerminalFontSize
  }
})
