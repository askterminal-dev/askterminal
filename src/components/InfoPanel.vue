<script setup lang="ts">
import { useUIStore } from '../stores/ui'

const uiStore = useUIStore()

const emit = defineEmits<{
  openSettings: []
}>()
</script>

<template>
  <div class="info-panel" :class="{ collapsed: !uiStore.showInfoPanel }">
    <button
      class="toggle-btn"
      @click="uiStore.toggleInfoPanel"
      :title="uiStore.showInfoPanel ? 'Collapse panel' : 'Expand panel'"
    >
      {{ uiStore.showInfoPanel ? '›' : '‹' }}
    </button>
    <div class="panel-content" v-show="uiStore.showInfoPanel">
      <h2 class="panel-title">Welcome to Ask Terminal</h2>

      <section class="tutorial-section">
        <h3>Getting Started</h3>
        <p>Ask Terminal helps you learn the command line safely. Type commands in the input below and see explanations before running them.</p>
      </section>

      <section class="tutorial-section">
        <h3>How It Works</h3>
        <ol>
          <li>Type a command in the input field</li>
          <li>See a plain-English explanation</li>
          <li>Check the safety indicator</li>
          <li>Press Enter or click Run to execute</li>
        </ol>
      </section>

      <section class="tutorial-section">
        <h3>Safety Indicators</h3>
        <div class="safety-item">
          <span class="safety-dot safe"></span>
          <span><strong>Green (Safe)</strong> - Read-only commands that don't modify anything</span>
        </div>
        <div class="safety-item">
          <span class="safety-dot moderate"></span>
          <span><strong>Yellow (Caution)</strong> - Commands that modify files or settings</span>
        </div>
        <div class="safety-item">
          <span class="safety-dot dangerous"></span>
          <span><strong>Red (Dangerous)</strong> - Commands that can delete or cause permanent changes</span>
        </div>
      </section>

      <section class="tutorial-section">
        <h3>Tips</h3>
        <ul>
          <li>Press <kbd>Tab</kbd> to autocomplete commands</li>
          <li>Use the Stop button or <kbd>Ctrl+C</kbd> to interrupt running commands</li>
          <li>Adjust your skill level in settings for more or fewer restrictions</li>
        </ul>
      </section>

      <div class="settings-link">
        <button @click="$emit('openSettings')" class="settings-btn">
          Open Settings
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-panel {
  background: #fafafa;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: row;
  position: relative;
  width: 300px;
  transition: width 0.2s ease-in-out;
  overflow: hidden;
}

.info-panel.collapsed {
  width: 24px;
}

.toggle-btn {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  background: #f3f4f6;
  border: none;
  border-right: 1px solid #e5e7eb;
  cursor: pointer;
  font-size: 16px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  z-index: 10;
}

.toggle-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.panel-content {
  flex: 1;
  padding: 16px 16px 16px 32px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.tutorial-section {
  margin-bottom: 16px;
}

.tutorial-section h3 {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tutorial-section p {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
  margin: 0;
}

.tutorial-section ol,
.tutorial-section ul {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
}

.tutorial-section li {
  margin-bottom: 4px;
}

.safety-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #4b5563;
  line-height: 1.4;
}

.safety-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.safety-dot.safe {
  background: #22c55e;
}

.safety-dot.moderate {
  background: #f59e0b;
}

.safety-dot.dangerous {
  background: #ef4444;
}

kbd {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 1px 5px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 11px;
}

.settings-link {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.settings-btn {
  width: 100%;
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}

.settings-btn:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}
</style>
