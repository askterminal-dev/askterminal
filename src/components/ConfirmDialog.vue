<script setup lang="ts">
const props = defineProps<{
  show: boolean
  command: string
  message: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('cancel')
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
        <!-- Warning Icon -->
        <div class="warning-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>

        <!-- Title -->
        <h2 class="title">Dangerous Command</h2>

        <!-- Command Display -->
        <div class="command-box">
          <code>{{ command }}</code>
        </div>

        <!-- Warning Message -->
        <p class="message">{{ message }}</p>

        <!-- Buttons -->
        <div class="buttons">
          <button class="btn btn-cancel" @click="emit('cancel')">
            Cancel
          </button>
          <button class="btn btn-confirm" @click="emit('confirm')">
            Run Anyway
          </button>
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
  z-index: 1100;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.warning-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: #fef3c7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d97706;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.command-box {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.command-box code {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  color: #dc2626;
  word-break: break-all;
}

.message {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.buttons {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-confirm {
  background: #dc2626;
  color: white;
}

.btn-confirm:hover {
  background: #b91c1c;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
