<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import TerminalView from './components/TerminalView.vue'
import DraftPanel from './components/DraftPanel.vue'
import InfoPanel from './components/InfoPanel.vue'
import AboutModal from './components/AboutModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import { useTerminalStore } from './stores/terminal'
import { useUIStore } from './stores/ui'

const terminalStore = useTerminalStore()
const uiStore = useUIStore()

// Modal visibility state
const showAboutModal = ref(false)
const showSettingsModal = ref(false)

// IPC listener cleanup functions
let removeAboutListener: (() => void) | null = null
let removeSettingsListener: (() => void) | null = null

onMounted(() => {
  // Load UI state from localStorage
  uiStore.loadUIState()

  // Listen for About modal trigger from menu
  if (window.electron?.app?.onShowAboutModal) {
    removeAboutListener = window.electron.app.onShowAboutModal(() => {
      showAboutModal.value = true
    })
  }

  // Listen for Settings modal trigger from menu
  if (window.electron?.app?.onShowSettingsModal) {
    removeSettingsListener = window.electron.app.onShowSettingsModal(() => {
      showSettingsModal.value = true
    })
  }
})

onUnmounted(() => {
  removeAboutListener?.()
  removeSettingsListener?.()
})

function closeAboutModal() {
  showAboutModal.value = false
}

function closeSettingsModal() {
  showSettingsModal.value = false
}
</script>

<template>
  <div class="app-layout">
    <!-- Window Title Bar (drag region for hiddenInset style) -->
    <div class="title-bar drag-region">
      <div class="text-sm text-gray-600">
        {{ terminalStore.cwd }}
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Left Column: Terminal + Draft -->
      <div class="left-column">
        <!-- Terminal Region -->
        <div class="terminal-region">
          <TerminalView />
        </div>

        <!-- Draft Panel -->
        <DraftPanel @open-settings="showSettingsModal = true" />
      </div>

      <!-- Right Column: Info Panel -->
      <InfoPanel @open-settings="showSettingsModal = true" />
    </div>

    <!-- Modals -->
    <AboutModal
      :show="showAboutModal"
      @close="closeAboutModal"
    />
    <SettingsModal
      :show="showSettingsModal"
      @close="closeSettingsModal"
    />
  </div>
</template>

<style scoped>
.app-layout {
  height: 100%;
  display: grid;
  grid-template-rows: 32px 1fr;
  overflow: hidden;
}

.title-bar {
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-content {
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.left-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.terminal-region {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.drag-region {
  -webkit-app-region: drag;
}
</style>
