import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTerminalStore = defineStore('terminal', () => {
  // State
  const cwd = ref('~')
  const draftCommand = ref('')
  const isRunning = ref(false)
  const history = ref<string[]>([])

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

  return {
    // State
    cwd,
    draftCommand,
    isRunning,
    history,
    // Actions
    setDraftCommand,
    clearDraftCommand,
    addToHistory,
    setCwd,
    setIsRunning
  }
})
