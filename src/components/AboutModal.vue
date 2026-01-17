<script setup lang="ts">
import { version } from '../../package.json'
import logoSvg from '../assets/logo.svg'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const APP_NAME = 'Ask Terminal'
const APP_VERSION = version
const APP_TAGLINE = 'a command line with training wheels'

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
        <!-- Close Button -->
        <button
          class="close-button"
          @click="close"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- Logo -->
        <div class="logo-container">
          <img :src="logoSvg" alt="Ask Terminal" class="logo" />
        </div>

        <!-- App Info -->
        <h1 class="app-name">{{ APP_NAME }}</h1>
        <p class="version">Version {{ APP_VERSION }}</p>
        <p class="tagline">{{ APP_TAGLINE }}</p>

        <!-- Description -->
        <div class="about-section">
          <h2>About</h2>
          <p>
            AskTerminal helps newcomers learn the command line by providing
            real-time explanations of commands before you run them. See what
            each part does, understand safety levels, and learn as you go.
          </p>
        </div>

        <!-- Features -->
        <div class="features-section">
          <h2>Features</h2>
          <ul>
            <li>Real shell with full terminal capabilities</li>
            <li>Command explanations in plain English</li>
            <li>Safety indicators (safe/moderate/dangerous)</li>
            <li>Tab autocomplete with suggestions</li>
            <li>Typo detection with "Did you mean?"</li>
          </ul>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>&copy; 2026 AskTerminal</p>
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
  padding: 32px;
  max-width: 480px;
  width: 90%;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
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

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.logo {
  width: 80px;
  height: 80px;
}

.app-name {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.version {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.tagline {
  text-align: center;
  font-size: 16px;
  color: #374151;
  margin: 0 0 24px 0;
}

.about-section,
.features-section {
  margin-bottom: 20px;
}

.about-section h2,
.features-section h2 {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 8px 0;
}

.about-section p {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.features-section ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.features-section li {
  font-size: 14px;
  color: #374151;
  padding: 6px 0;
  padding-left: 24px;
  position: relative;
}

.features-section li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #22c55e;
  font-weight: bold;
}

.footer {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.footer p {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
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
