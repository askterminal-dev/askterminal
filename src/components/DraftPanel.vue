<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useTerminalStore } from '../stores/terminal'
import { useSettingsStore } from '../stores/settings'
import { parseCommand, getKnownCommands, type CommandInfo } from '../services/CommandParser'
import ConfirmDialog from './ConfirmDialog.vue'

const terminalStore = useTerminalStore()
const settingsStore = useSettingsStore()
const inputRef = ref<HTMLInputElement | null>(null)

const emit = defineEmits<{
  openSettings: []
}>()
const tabIndex = ref(0)
const suggestions = ref<string[]>([])

// Confirmation dialog state
const showConfirmDialog = ref(false)
const pendingCommand = ref('')

// Suggested commands for empty state
const suggestedCommands = ['ls', 'pwd', 'cd ~', 'echo "hello"', 'cat', 'mkdir']

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

// Skill level display style
const skillLevelStyle = computed(() => {
  const level = settingsStore.skillLevel
  const styles = {
    beginner: { label: 'Beginner', dot: 'bg-green-500' },
    intermediate: { label: 'Intermediate', dot: 'bg-amber-500' },
    advanced: { label: 'Advanced', dot: 'bg-blue-500' }
  }
  return styles[level]
})

// Check if command is blocked based on skill level
const commandStatus = computed(() => {
  if (!commandInfo.value) return { allowed: true, action: 'allow' as const }
  const safety = commandInfo.value.safety
  const action = settingsStore.canRunCommand(safety)
  return {
    allowed: action === 'allow',
    action,
    blockMessage: action === 'block' ? settingsStore.getBlockMessage(safety) : ''
  }
})

// Actually execute the command
async function executeCommand(cmd: string) {
  terminalStore.setIsRunning(true)
  terminalStore.addToHistory(cmd)

  // Check if this is an interactive command
  const interactiveType = terminalStore.detectInteractiveCommand(cmd)
  if (interactiveType) {
    terminalStore.setInteractiveMode(interactiveType)
  }

  // Send command to PTY (with newline to execute)
  await window.electron.pty.write(cmd + '\n')

  terminalStore.clearDraftCommand()
  terminalStore.setIsRunning(false)

  // Refocus the input for the next command (delay to let terminal finish updating)
  setTimeout(() => {
    inputRef.value?.focus()
  }, 50)
}

// Interactive mode controls
const interactiveControls = {
  pager: [
    { keyLabel: 'j', action: 'Down', key: 'j', title: 'Scroll down one line (or arrow down)' },
    { keyLabel: 'k', action: 'Up', key: 'k', title: 'Scroll up one line (or arrow up)' },
    { keyLabel: '␣', action: 'Page Down', key: ' ', title: 'Scroll down one page' },
    { keyLabel: 'b', action: 'Page Up', key: 'b', title: 'Scroll up one page' },
    { keyLabel: '/', action: 'Search', key: '/', title: 'Search in document' },
    { keyLabel: 'n', action: 'Next Match', key: 'n', title: 'Jump to next search result' },
    { keyLabel: 'q', action: 'Quit', key: 'q', title: 'Quit and return to terminal' },
  ],
  'editor-vim': [
    { keyLabel: 'Esc', action: '', key: '\x1b', title: 'Exit insert mode' },
    { keyLabel: ':q!', action: 'Quit', key: ':q!\n', title: 'Quit without saving' },
    { keyLabel: ':wq', action: 'Save & Quit', key: ':wq\n', title: 'Save and quit' },
  ],
  'editor-nano': [
    { keyLabel: 'Ctrl+X', action: 'Exit', key: '\x18', title: 'Exit nano' },
    { keyLabel: 'Ctrl+O', action: 'Save', key: '\x0f', title: 'Save file' },
  ],
  monitor: [
    { keyLabel: 'q', action: 'Quit', key: 'q', title: 'Quit' },
    { keyLabel: 'k', action: 'Kill', key: 'k', title: 'Kill a process' },
  ],
}

// Send a key to the PTY (for interactive mode)
async function sendKey(key: string) {
  await window.electron.pty.write(key)
}

// Exit interactive mode
async function exitInteractiveMode() {
  const mode = terminalStore.interactiveMode
  if (mode === 'pager') {
    await sendKey('q')
  } else if (mode === 'editor-vim') {
    await sendKey('\x1b:q!\n')
  } else if (mode === 'editor-nano') {
    await sendKey('\x18')
  } else if (mode === 'monitor') {
    await sendKey('q')
  }
  terminalStore.setInteractiveMode(null)
}

// Search input mode for pagers
const isSearchMode = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

function startSearch() {
  isSearchMode.value = true
  // Send "/" to start search in less/man
  sendKey('/')
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

async function submitSearch() {
  if (searchQuery.value) {
    await sendKey(searchQuery.value + '\n')
  } else {
    // Cancel search with Escape
    await sendKey('\x1b')
  }
  isSearchMode.value = false
  searchQuery.value = ''
}

function cancelSearch() {
  sendKey('\x1b')
  isSearchMode.value = false
  searchQuery.value = ''
}

// Y/n prompt responses
async function sendYes() {
  await sendKey('y\n')
  terminalStore.setPromptMode(null)
}

async function sendNo() {
  await sendKey('n\n')
  terminalStore.setPromptMode(null)
}

// Keyboard handling for interactive mode
const activeKey = ref<string | null>(null)
const interactiveContainerRef = ref<HTMLDivElement | null>(null)

// Map keyboard keys to control keys
const keyMap: Record<string, string> = {
  j: 'j',
  k: 'k',
  ArrowDown: 'j',  // Arrow down = scroll down (same as j)
  ArrowUp: 'k',    // Arrow up = scroll up (same as k)
  ' ': ' ',
  b: 'b',
  '/': '/',
  n: 'n',
  q: 'q',
  y: 'y',
  Escape: '\x1b',
}

async function handleInteractiveKeydown(e: KeyboardEvent) {
  const key = e.key

  // Handle Y/n prompt mode
  if (terminalStore.promptMode === 'yesno') {
    if (key.toLowerCase() === 'y') {
      e.preventDefault()
      activeKey.value = 'y'
      await sendYes()
      setTimeout(() => activeKey.value = null, 150)
    } else if (key.toLowerCase() === 'n') {
      e.preventDefault()
      activeKey.value = 'n'
      await sendNo()
      setTimeout(() => activeKey.value = null, 150)
    }
    return
  }

  // Handle interactive mode
  if (terminalStore.interactiveMode && !isSearchMode.value) {
    const controls = interactiveControls[terminalStore.interactiveMode]
    const control = controls?.find(c => c.key === key || c.key === keyMap[key])

    if (control) {
      e.preventDefault()
      activeKey.value = control.key

      if (control.key === '/') {
        startSearch()
      } else if (control.key === 'q') {
        await exitInteractiveMode()
      } else {
        await sendKey(control.key)
      }

      setTimeout(() => activeKey.value = null, 150)
    }
  }
}

// Auto-focus interactive container when mode changes
watch(() => terminalStore.interactiveMode, (mode) => {
  if (mode) {
    nextTick(() => {
      interactiveContainerRef.value?.focus()
    })
  }
})

watch(() => terminalStore.promptMode, (mode) => {
  if (mode) {
    nextTick(() => {
      interactiveContainerRef.value?.focus()
    })
  }
})

// Run the command (with skill level checks)
async function runCommand() {
  const cmd = terminalStore.draftCommand.trim()
  if (!cmd) return

  const status = commandStatus.value

  if (status.action === 'block') {
    // Command is blocked - don't run, message is shown in UI
    return
  }

  if (status.action === 'confirm') {
    // Need confirmation for dangerous command
    pendingCommand.value = cmd
    showConfirmDialog.value = true
    return
  }

  // Command is allowed
  await executeCommand(cmd)
}

// Handle confirmation dialog
function onConfirm() {
  showConfirmDialog.value = false
  if (pendingCommand.value) {
    executeCommand(pendingCommand.value)
    pendingCommand.value = ''
  }
}

function onCancel() {
  showConfirmDialog.value = false
  pendingCommand.value = ''
  inputRef.value?.focus()
}

// Send Ctrl+C interrupt signal to PTY
async function sendInterrupt() {
  // ASCII 3 is Ctrl+C (ETX - End of Text)
  await window.electron.pty.write('\x03')
  inputRef.value?.focus()
}

// Handle keyboard shortcuts
async function handleKeydown(e: KeyboardEvent) {
  // Ctrl+C to send interrupt
  if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    sendInterrupt()
    return
  }

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
})

// Focus input on mount
watch(inputRef, (el) => {
  el?.focus()
})
</script>

<template>
  <div class="draft-panel">
    <!-- Y/n Prompt Mode -->
    <div v-if="terminalStore.promptMode === 'yesno'" class="interactive-controls" tabindex="0" @keydown="handleInteractiveKeydown" ref="interactiveContainerRef">
      <div class="flex items-center justify-between mb-3">
        <span class="text-gray-600 text-sm font-medium">
          Prompt: Waiting for response...
        </span>
      </div>
      <p class="text-gray-700 mb-3">{{ terminalStore.promptQuestion }}</p>
      <div class="flex gap-3">
        <button
          @click="sendYes"
          :class="['interactive-key flex-1', activeKey === 'y' && 'active']"
        >
          Yes (Y)
        </button>
        <button
          @click="sendNo"
          :class="['interactive-key flex-1', activeKey === 'n' && 'active']"
        >
          No (N)
        </button>
      </div>
      <p class="text-gray-400 text-xs mt-3">Press Y or N to respond</p>
    </div>

    <!-- Interactive Mode Controls -->
    <div v-else-if="terminalStore.interactiveMode" class="interactive-controls" tabindex="0" @keydown="handleInteractiveKeydown" ref="interactiveContainerRef">
      <div class="flex items-center justify-between mb-3">
        <span class="text-gray-600 text-sm font-medium">
          Interactive Mode: {{ terminalStore.interactiveMode === 'pager' ? 'Pager (man/less)' :
                              terminalStore.interactiveMode === 'editor-vim' ? 'Vim Editor' :
                              terminalStore.interactiveMode === 'editor-nano' ? 'Nano Editor' : 'Monitor' }}
        </span>
        <button
          @click="exitInteractiveMode"
          class="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
        >
          Exit '{{ terminalStore.interactiveMode === 'pager' ? 'man/less' :
                   terminalStore.interactiveMode === 'editor-vim' ? 'vim' :
                   terminalStore.interactiveMode === 'editor-nano' ? 'nano' : 'top' }}'
        </button>
      </div>

      <!-- Search Input Mode -->
      <div v-if="isSearchMode" class="flex items-center gap-2 mb-3">
        <span class="text-gray-500 font-mono">/</span>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          class="flex-1 font-mono bg-gray-100 border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500"
          placeholder="Search..."
          @keydown.enter="submitSearch"
          @keydown.escape="cancelSearch"
        />
        <button @click="submitSearch" class="interactive-key">Search</button>
        <button @click="cancelSearch" class="interactive-key">Cancel</button>
      </div>

      <!-- Control Buttons -->
      <div v-else class="flex flex-wrap gap-2">
        <button
          v-for="control in interactiveControls[terminalStore.interactiveMode]"
          :key="control.keyLabel"
          @click="control.key === '/' ? startSearch() : control.key === 'q' ? exitInteractiveMode() : sendKey(control.key)"
          :class="['interactive-key', activeKey === control.key && 'active']"
          :title="control.title"
        >
          <span class="font-bold">{{ control.keyLabel }}</span><span v-if="control.action">&nbsp;&nbsp;{{ control.action }}</span>
        </button>
      </div>
      <p class="text-gray-400 text-xs mt-3">Press keys or click buttons to navigate</p>
    </div>

    <!-- Normal Command Input Mode -->
    <template v-else>
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
          @click="sendInterrupt"
          class="px-3 py-2 bg-gray-200 text-gray-600 rounded-md font-medium hover:bg-gray-300 transition-colors"
          title="Send Ctrl+C to stop running process"
        >
          Stop
        </button>
        <button
          @click="runCommand"
          :disabled="!terminalStore.draftCommand.trim() || terminalStore.isRunning || commandStatus.action === 'block'"
          :class="[
            'px-4 py-2 rounded-md font-medium transition-colors',
            commandStatus.action === 'block'
              ? 'bg-red-100 text-red-400 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
          ]"
        >
          {{ commandStatus.action === 'block' ? 'Blocked' : 'Run' }}
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

      <!-- Blocked Command Message -->
      <div v-if="commandStatus.action === 'block'" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-start gap-2">
          <svg class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke-width="2"/>
            <path stroke-width="2" d="M15 9l-6 6M9 9l6 6"/>
          </svg>
          <div>
            <p class="text-red-700 font-medium text-sm">Command blocked</p>
            <p class="text-red-600 text-sm">{{ commandStatus.blockMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Confirmation Required Message -->
      <div v-else-if="commandStatus.action === 'confirm'" class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div class="flex items-start gap-2">
          <svg class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-width="2" d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <div>
            <p class="text-amber-700 font-medium text-sm">Confirmation required</p>
            <p class="text-amber-600 text-sm">This command requires confirmation before running.</p>
          </div>
        </div>
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

    <!-- Empty State with Suggestions -->
    <div v-else class="empty-state">
      <p class="text-gray-400 text-sm mb-3">Type a command to see its explanation</p>
      <div class="flex flex-wrap gap-2">
        <span class="text-gray-400 text-sm">Try:</span>
        <button
          v-for="cmd in suggestedCommands"
          :key="cmd"
          class="suggestion-badge"
          @click="terminalStore.setDraftCommand(cmd)"
        >{{ cmd }}</button>
      </div>
    </div>
    </template>

    <!-- Skill Level Indicator (fixed position) -->
    <button
      class="skill-indicator"
      @click="$emit('openSettings')"
      :title="'Click to change skill level'"
    >
      <span class="skill-dot" :class="skillLevelStyle.dot"></span>
      <span class="skill-text">{{ skillLevelStyle.label }}</span>
    </button>

    <!-- Confirmation Dialog -->
    <ConfirmDialog
      :show="showConfirmDialog"
      :command="pendingCommand"
      message="This command can permanently delete or modify files. This action cannot be undone."
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </div>
</template>

<style scoped>
.draft-panel {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 16px;
  height: 150px;
  overflow-y: auto;
  position: relative;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.draft-panel::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.suggestion-badge {
  padding: 4px 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}

.suggestion-badge:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.skill-indicator {
  position: absolute;
  bottom: 8px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.15s;
}

.skill-indicator:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.skill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.skill-text {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.interactive-controls {
  padding: 4px 0;
}

.interactive-key {
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
}

.interactive-key:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.interactive-key:active,
.interactive-key.active {
  background: #d1d5db;
  transform: scale(0.98);
  border-color: #6b7280;
}

.interactive-controls:focus {
  outline: none;
}
</style>
