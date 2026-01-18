<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useUIStore } from '../stores/ui'

const uiStore = useUIStore()
const localNotes = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Sync with store on mount
onMounted(() => {
  localNotes.value = uiStore.userNotes
})

// Debounced save to store
let saveTimeout: ReturnType<typeof setTimeout> | null = null

watch(localNotes, (newValue) => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    uiStore.setUserNotes(newValue)
  }, 500)
})

function clearNotes() {
  localNotes.value = ''
  uiStore.setUserNotes('')
  textareaRef.value?.focus()
}
</script>

<template>
  <div class="notes-panel">
    <div class="notes-header">
      <span class="notes-title">Session Notes</span>
      <button
        v-if="localNotes.trim()"
        @click="clearNotes"
        class="clear-btn"
        title="Clear all notes"
      >
        Clear
      </button>
    </div>
    <textarea
      ref="textareaRef"
      v-model="localNotes"
      class="notes-textarea"
      placeholder="Jot down notes during your session...

Ideas:
- Commands you want to remember
- Things you learned
- Questions to explore later"
    ></textarea>
    <div class="notes-footer">
      <span class="char-count">{{ localNotes.length }} characters</span>
      <span v-if="localNotes.trim()" class="auto-saved">Auto-saved</span>
    </div>
  </div>
</template>

<style scoped>
.notes-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.notes-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.clear-btn {
  font-size: 12px;
  color: #6b7280;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.clear-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.notes-textarea {
  flex: 1;
  width: 100%;
  min-height: 200px;
  padding: 12px;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #374151;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  resize: none;
  outline: none;
  transition: border-color 0.15s;
}

.notes-textarea:focus {
  border-color: #9ca3af;
}

.notes-textarea::placeholder {
  color: #9ca3af;
}

.notes-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 11px;
  color: #9ca3af;
}

.auto-saved {
  color: #22c55e;
}
</style>
