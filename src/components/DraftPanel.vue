<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useTerminalStore } from '../stores/terminal'
import { parseCommand, getKnownCommands, type CommandInfo } from '../services/CommandParser'

const terminalStore = useTerminalStore()
const inputRef = ref<HTMLInputElement | null>(null)
const tabIndex = ref(0)
const suggestions = ref<string[]>([])

// Parse the current command
const commandInfo = computed<CommandInfo | null>(() => {
  if (!terminalStore.draftCommand.trim()) return null
  return parseCommand(terminalStore.draftCommand)
})

// Levenshtein distance for typo detection
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i-1] === a[j-1]
        ? matrix[i-1][j-1]
        : Math.min(matrix[i-1][j-1] + 1, matrix[i][j-1] + 1, matrix[i-1][j] + 1)
    }
  }
  return matrix[b.length][a.length]
}

// Get command suggestions (sync) - prefix match + fuzzy match for typos
function getCommandSuggestions(partial: string): string[] {
  const commands = getKnownCommands()
  const input = partial.toLowerCase()

  // First: prefix matches
  const prefixMatches = commands.filter(cmd => cmd.startsWith(input))

  // Second: fuzzy matches for typos (within edit distance 2)
  const fuzzyMatches = commands
    .filter(cmd => !cmd.startsWith(input)) // exclude prefix matches
    .filter(cmd => {
      const dist = levenshtein(input, cmd)
      // Allow distance up to 2, but scale with word length
      return dist <= Math.min(2, Math.floor(cmd.length / 2))
    })
    .sort((a, b) => levenshtein(input, a) - levenshtein(input, b))

  return [...prefixMatches, ...fuzzyMatches]
}

// Get path completions (async)
async function getPathCompletions(partialPath: string): Promise<string[]> {
  if (!partialPath) {
    // List current directory
    const result = await window.electron.fs.getCompletions('./', terminalStore.cwd)
    return result.matches.map(m => m.name + (m.isDirectory ? '/' : ''))
  }

  const result = await window.electron.fs.getCompletions(partialPath, terminalStore.cwd)
  return result.matches.map(m => {
    // Preserve the path prefix the user typed
    const prefix = partialPath.substring(0, partialPath.lastIndexOf('/') + 1)
    return prefix + m.name + (m.isDirectory ? '/' : '')
  })
}

// Safety indicator colors
const safetyColors = {
  safe: { bg: 'bg-green-500', text: 'text-green-700', label: 'Safe' },
  moderate: { bg: 'bg-amber-500', text: 'text-amber-700', label: 'Caution' },
  dangerous: { bg: 'bg-red-500', text: 'text-red-700', label: 'Dangerous' }
}

const safetyStyle = computed(() => {
  const safety = commandInfo.value?.safety || 'safe'
  return safetyColors[safety]
})

// Live command suggestions as user types
const liveSuggestions = computed(() => {
  const input = terminalStore.draftCommand.trim()
  if (!input) return []

  // Only suggest for first word (the command)
  const parts = input.split(/\s+/)
  if (parts.length > 1) return []

  // Get matching commands
  const matches = getCommandSuggestions(parts[0])
  return matches.slice(0, 5)
})

// Check if current command is unknown (not in database)
const isUnknownCommand = computed(() => {
  return commandInfo.value?.description.startsWith('Unknown command')
})

// Run the command
async function runCommand() {
  const cmd = terminalStore.draftCommand.trim()
  if (!cmd) return

  terminalStore.setIsRunning(true)
  terminalStore.addToHistory(cmd)

  // Send command to PTY (with newline to execute)
  await window.electron.pty.write(cmd + '\n')

  terminalStore.clearDraftCommand()
  terminalStore.setIsRunning(false)

  // Refocus the input for the next command (delay to let terminal finish updating)
  setTimeout(() => {
    inputRef.value?.focus()
  }, 50)
}

// Handle keyboard shortcuts
async function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    runCommand()
    return
  }

  // Tab autocomplete
  if (e.key === 'Tab') {
    e.preventDefault()

    const input = terminalStore.draftCommand
    const parts = input.trim().split(/\s+/)
    const lastPart = parts[parts.length - 1] || ''

    let currentSuggestions: string[] = []

    if (parts.length === 1) {
      // Command completion
      currentSuggestions = getCommandSuggestions(lastPart)
    } else {
      // Path completion for arguments
      currentSuggestions = await getPathCompletions(lastPart)
    }

    if (currentSuggestions.length === 0) return

    // If suggestions changed, reset index
    if (JSON.stringify(currentSuggestions) !== JSON.stringify(suggestions.value)) {
      suggestions.value = currentSuggestions
      tabIndex.value = 0
    } else {
      // Cycle through suggestions
      tabIndex.value = (tabIndex.value + 1) % suggestions.value.length
    }

    // Apply the suggestion
    if (parts.length === 1) {
      // Replace command
      terminalStore.setDraftCommand(suggestions.value[tabIndex.value])
    } else {
      // Replace last argument (path)
      parts[parts.length - 1] = suggestions.value[tabIndex.value]
      terminalStore.setDraftCommand(parts.join(' '))
    }
  }
}

// Reset tab index when input changes manually
let lastInput = ''
watch(() => terminalStore.draftCommand, (newVal) => {
  // Only reset if user is typing, not from tab completion
  if (suggestions.value.length > 0) {
    const parts = newVal.trim().split(/\s+/)
    const lastPart = parts[parts.length - 1]
    if (!suggestions.value.some(s => s === lastPart || newVal.endsWith(s))) {
      tabIndex.value = 0
      suggestions.value = []
    }
  }
  lastInput = newVal
})

// Focus input on mount
watch(inputRef, (el) => {
  el?.focus()
})
</script>

<template>
  <div class="bg-white border-t border-gray-200 p-4">
    <!-- Command Input Row -->
    <div class="flex items-center gap-3 mb-3">
      <span class="text-gray-500 font-mono">$</span>
      <input
        ref="inputRef"
        v-model="terminalStore.draftCommand"
        type="text"
        class="flex-1 font-mono text-lg bg-transparent outline-none"
        placeholder="Type a command..."
        @keydown="handleKeydown"
        :disabled="terminalStore.isRunning"
      />
      <button
        @click="runCommand"
        :disabled="!terminalStore.draftCommand.trim() || terminalStore.isRunning"
        class="px-4 py-2 bg-gray-900 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        Run
      </button>
    </div>

    <!-- Explanation Area -->
    <div v-if="commandInfo && !isUnknownCommand" class="space-y-2">
      <!-- Plain English Description -->
      <p class="text-gray-700">
        {{ commandInfo.description }}
      </p>

      <!-- Parts Breakdown -->
      <div class="flex flex-wrap gap-3 text-sm">
        <span
          v-for="part in commandInfo.parts"
          :key="part.text"
          class="inline-flex items-center gap-1"
        >
          <code class="text-blue-600 font-mono">{{ part.text }}</code>
          <span class="text-gray-500">= {{ part.explanation }}</span>
        </span>
      </div>

      <!-- Safety Indicator -->
      <div class="flex items-center gap-2 text-sm">
        <span
          :class="[safetyStyle.bg, 'w-2 h-2 rounded-full']"
        ></span>
        <span :class="safetyStyle.text">
          {{ commandInfo.safetyMessage }}
        </span>
      </div>
    </div>

    <!-- Command Suggestions (for unknown commands with matches) -->
    <div v-else-if="isUnknownCommand && liveSuggestions.length > 0" class="space-y-2">
      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-500">Did you mean:</span>
        <span
          v-for="cmd in liveSuggestions"
          :key="cmd"
          class="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-mono cursor-pointer hover:bg-gray-200"
          @click="terminalStore.setDraftCommand(cmd)"
        >{{ cmd }}</span>
      </div>
      <p class="text-gray-400 text-sm">Press Tab to autocomplete</p>
    </div>

    <!-- Unknown command with no suggestions -->
    <div v-else-if="isUnknownCommand" class="space-y-2">
      <p class="text-gray-500">{{ commandInfo?.description }}</p>
      <div class="flex items-center gap-2 text-sm">
        <span class="w-2 h-2 rounded-full bg-amber-500"></span>
        <span class="text-amber-700">{{ commandInfo?.safetyMessage }}</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-gray-400 text-sm">
      Type a command to see its explanation
    </div>
  </div>
</template>
