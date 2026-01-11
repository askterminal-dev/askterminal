<script setup lang="ts">
import TerminalView from './components/TerminalView.vue'
import DraftPanel from './components/DraftPanel.vue'
import { useTerminalStore } from './stores/terminal'

const terminalStore = useTerminalStore()
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Window Title Bar -->
    <div class="h-8 bg-gray-200 flex items-center px-3 drag-region">
      <div class="flex gap-2">
        <div class="w-3 h-3 rounded-full bg-red-500"></div>
        <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div class="w-3 h-3 rounded-full bg-green-500"></div>
      </div>
      <div class="flex-1 text-center text-sm text-gray-600">
        {{ terminalStore.cwd }}
      </div>
    </div>

    <!-- Terminal Region -->
    <div class="flex-1 min-h-0">
      <TerminalView />
    </div>

    <!-- Draft Panel -->
    <DraftPanel />
  </div>
</template>

<style scoped>
.drag-region {
  -webkit-app-region: drag;
}
</style>
