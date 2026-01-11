<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// Settings state (simple local storage for now)
const theme = ref<'light' | 'dark'>('light')
const terminalFontSize = ref<'small' | 'medium' | 'large'>('medium')
const autoFocusInput = ref(true)

// Load settings from localStorage
onMounted(() => {
  const saved = localStorage.getItem('askterminal-settings')
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      theme.value = settings.theme || 'light'
      terminalFontSize.value = settings.terminalFontSize || 'medium'
      autoFocusInput.value = settings.autoFocusInput ?? true
    } catch (e) {
      // Ignore parse errors
    }
  }
})

function saveSettings() {
  localStorage.setItem('askterminal-settings', JSON.stringify({
    theme: theme.value,
    terminalFontSize: terminalFontSize.value,
    autoFocusInput: autoFocusInput.value
  }))
}

function setTheme(newTheme: 'light' | 'dark') {
  theme.value = newTheme
  document.documentElement.setAttribute('data-theme', newTheme)
  saveSettings()
}

function setFontSize(size: 'small' | 'medium' | 'large') {
  terminalFontSize.value = size
  document.documentElement.setAttribute('data-terminal-font', size)
  saveSettings()
}

function toggleAutoFocus() {
  autoFocusInput.value = !autoFocusInput.value
  saveSettings()
}

function close() {
  emit('close')
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    close()
  }
}
</script>

<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="modal-overlay"
      @click="handleOverlayClick"
    >
      <div class="modal-content" @click.stop>
        <!-- Header -->
        <div class="modal-header">
          <h1>Settings</h1>
          <button
            class="close-button"
            @click="close"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Settings Body -->
        <div class="modal-body">
          <!-- Theme Setting -->
          <div class="setting-group">
            <label class="setting-label">Theme</label>
            <div class="theme-options">
              <button
                :class="['theme-option', { active: theme === 'light' }]"
                @click="setTheme('light')"
              >
                <span class="theme-icon">☀️</span>
                <span>Light</span>
              </button>
              <button
                :class="['theme-option', { active: theme === 'dark' }]"
                @click="setTheme('dark')"
              >
                <span class="theme-icon">🌙</span>
                <span>Dark</span>
              </button>
            </div>
          </div>

          <!-- Terminal Font Size -->
          <div class="setting-group">
            <label class="setting-label">Terminal Font Size</label>
            <div class="font-options">
              <button
                :class="['font-option', { active: terminalFontSize === 'small' }]"
                @click="setFontSize('small')"
              >
                Small
              </button>
              <button
                :class="['font-option', { active: terminalFontSize === 'medium' }]"
                @click="setFontSize('medium')"
              >
                Medium
              </button>
              <button
                :class="['font-option', { active: terminalFontSize === 'large' }]"
                @click="setFontSize('large')"
              >
                Large
              </button>
            </div>
          </div>

          <!-- Auto Focus Toggle -->
          <div class="setting-group">
            <div class="toggle-row">
              <div>
                <label class="setting-label">Auto-focus Command Input</label>
                <p class="setting-description">Return focus to input after running a command</p>
              </div>
              <button
                :class="['toggle-switch', { active: autoFocusInput }]"
                @click="toggleAutoFocus"
                role="switch"
                :aria-checked="autoFocusInput"
              >
                <span class="toggle-knob"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h1 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-button:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.setting-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

/* Theme Options */
.theme-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #374151;
}

.theme-option:hover {
  border-color: #d1d5db;
}

.theme-option.active {
  border-color: #111827;
  background: #f9fafb;
}

.theme-icon {
  font-size: 24px;
}

/* Font Size Options */
.font-options {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.font-option {
  padding: 10px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #374151;
}

.font-option:hover {
  border-color: #d1d5db;
}

.font-option.active {
  border-color: #111827;
  background: #f9fafb;
  font-weight: 600;
}

/* Toggle Switch */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toggle-switch {
  position: relative;
  width: 51px;
  height: 31px;
  border-radius: 31px;
  border: none;
  background: #e5e7eb;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle-switch.active {
  background: #22c55e;
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 27px;
  height: 27px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.toggle-switch.active .toggle-knob {
  transform: translateX(20px);
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: translateY(20px);
}
</style>
