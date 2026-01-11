<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import TerminalView from './components/TerminalView.vue'
import DraftPanel from './components/DraftPanel.vue'
import AboutModal from './components/AboutModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import { useTerminalStore } from './stores/terminal'

const terminalStore = useTerminalStore()

// Modal visibility state
const showAboutModal = ref(false)
const showSettingsModal = ref(false)

// IPC listener cleanup functions
let removeAboutListener: (() => void) | null = null
let removeSettingsListener: (() => void) | null = null

onMounted(() => {
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
  <div class="h-full flex flex-col">
    <!-- Window Title Bar (drag region for hiddenInset style) -->
    <div class="h-8 bg-gray-200 flex items-center justify-center drag-region">
      <div class="text-sm text-gray-600">
        {{ terminalStore.cwd }}
      </div>
    </div>

    <!-- Terminal Region -->
    <div class="flex-1 min-h-0">
      <TerminalView />
    </div>

    <!-- Draft Panel -->
    <DraftPanel />

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
.drag-region {
  -webkit-app-region: drag;
}
</style>
