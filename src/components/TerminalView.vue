<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { useSettingsStore } from '../stores/settings'
import '@xterm/xterm/css/xterm.css'

const terminalContainer = ref<HTMLDivElement | null>(null)
const settingsStore = useSettingsStore()
let terminal: Terminal | null = null
let fitAddon: FitAddon | null = null
let inputDisposable: { dispose: () => void } | null = null

// Enable/disable direct terminal input based on settings
function updateDirectInput() {
  if (!terminal) return

  // Remove existing handler if any
  if (inputDisposable) {
    inputDisposable.dispose()
    inputDisposable = null
  }

  // Add handler if direct input is enabled
  if (settingsStore.isDirectInputEnabled) {
    inputDisposable = terminal.onData((data) => {
      window.electron.pty.write(data)
    })
  }
}

// Watch for settings changes
watch(() => settingsStore.isDirectInputEnabled, () => {
  updateDirectInput()
})

onMounted(() => {
  if (!terminalContainer.value) return

  // Load settings
  settingsStore.loadSettings()

  // Create terminal
  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    theme: {
      background: '#111827',
      foreground: '#e5e7eb',
      cursor: '#22c55e',
      cursorAccent: '#111827',
      selectionBackground: '#374151'
    }
  })

  // Add fit addon
  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)

  // Open terminal in container
  terminal.open(terminalContainer.value)

  // Fit after layout is complete
  requestAnimationFrame(() => {
    fitAddon?.fit()
    if (terminal) {
      window.electron.pty.resize(terminal.cols, terminal.rows)
    }
  })

  // Set up direct input based on current settings
  updateDirectInput()

  // Listen for PTY data
  window.electron.pty.onData((data) => {
    terminal?.write(data)
    terminal?.scrollToBottom()
  })

  window.electron.pty.onExit((code) => {
    terminal?.write(`\r\n[Process exited with code ${code}]\r\n`)
  })

  // Handle resize
  const resizeObserver = new ResizeObserver(() => {
    fitAddon?.fit()
    if (terminal) {
      window.electron.pty.resize(terminal.cols, terminal.rows)
    }
  })
  resizeObserver.observe(terminalContainer.value)

  // Store resize observer for cleanup
  ;(terminalContainer.value as any)._resizeObserver = resizeObserver
})

onUnmounted(() => {
  window.electron.pty.removeAllListeners()
  inputDisposable?.dispose()
  terminal?.dispose()
  if (terminalContainer.value) {
    const observer = (terminalContainer.value as any)._resizeObserver
    observer?.disconnect()
  }
})

// Expose method to write to terminal
function writeToTerminal(data: string) {
  terminal?.write(data)
}

defineExpose({ writeToTerminal })
</script>

<template>
  <div
    ref="terminalContainer"
    class="terminal-container"
  ></div>
</template>

<style scoped>
.terminal-container {
  height: 100%;
  width: 100%;
  background-color: #111827;
  overflow: hidden;
}

:deep(.xterm) {
  height: 100%;
  padding: 8px;
  box-sizing: border-box;
}

:deep(.xterm-screen) {
  height: 100% !important;
}

:deep(.xterm-viewport) {
  overflow-y: auto !important;
}
</style>
