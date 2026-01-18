<script setup lang="ts">
import { computed } from 'vue'
import { useClaudeStore } from '../stores/claude'
import { useUIStore } from '../stores/ui'
import { useSettingsStore } from '../stores/settings'

const claudeStore = useClaudeStore()
const uiStore = useUIStore()
const settingsStore = useSettingsStore()

// Tool explanations for beginners
const toolDescriptions: Record<string, string> = {
  Read: 'Reading a file to understand its contents',
  Write: 'Creating or replacing a file with new content',
  Edit: 'Making targeted changes to an existing file',
  Bash: 'Running a terminal command',
  Glob: 'Finding files by pattern (like *.ts)',
  Grep: 'Searching file contents for text',
  WebFetch: 'Retrieving content from a URL',
  WebSearch: 'Searching the web for information',
  Task: 'Running a subtask with a specialized agent',
  TodoWrite: 'Tracking task progress'
}

// Tool colors for visual distinction
const toolColors: Record<string, string> = {
  Read: 'tool-read',
  Write: 'tool-write',
  Edit: 'tool-edit',
  Bash: 'tool-bash',
  Glob: 'tool-glob',
  Grep: 'tool-grep',
  WebFetch: 'tool-web',
  WebSearch: 'tool-web',
  Task: 'tool-task',
  TodoWrite: 'tool-task'
}

const currentToolExplanation = computed(() => {
  const tool = claudeStore.currentTool
  return tool ? toolDescriptions[tool] : null
})

const currentToolColor = computed(() => {
  const tool = claudeStore.currentTool
  return tool ? toolColors[tool] || '' : ''
})

// Determine detail level based on skill
const showDetailedExplanations = computed(() => {
  return settingsStore.skillLevel === 'beginner'
})

function openToolsGuide() {
  uiStore.setTrack('claude-code')
  uiStore.setCurrentGuide('claude-3')
}

function openActivityTab() {
  uiStore.setActiveTab('activity')
}
</script>

<template>
  <div v-if="claudeStore.isClaudeSession" class="claude-activity-panel">
    <div class="activity-header">
      <span class="activity-title">Claude is working</span>
      <div class="header-links">
        <button @click="openActivityTab" class="link-btn" title="View full activity history">
          History
        </button>
        <button @click="openToolsGuide" class="link-btn">
          What is this?
        </button>
      </div>
    </div>

    <!-- Current Activity -->
    <div class="current-activity">
      <!-- Thinking State -->
      <div v-if="claudeStore.isThinking" class="thinking-indicator">
        <span class="spinner"></span>
        <span class="thinking-text">Thinking...</span>
      </div>

      <!-- Tool Activity -->
      <div v-else-if="claudeStore.currentTool" class="tool-activity">
        <div class="tool-badge" :class="currentToolColor">
          {{ claudeStore.currentTool }}
        </div>
        <p v-if="showDetailedExplanations" class="tool-explanation">
          {{ currentToolExplanation }}
        </p>
        <p v-if="claudeStore.currentActivity?.description" class="tool-detail">
          {{ claudeStore.currentActivity.description }}
        </p>
      </div>

      <!-- Idle State -->
      <div v-else class="idle-state">
        <span>Waiting for Claude's response...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.claude-activity-panel {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border: 1px solid #ddd6fe;
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 12px;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.activity-title {
  font-size: 12px;
  font-weight: 600;
  color: #5b21b6;
}

.header-links {
  display: flex;
  gap: 12px;
}

.link-btn {
  font-size: 11px;
  color: #7c3aed;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.link-btn:hover {
  color: #5b21b6;
}

.current-activity {
  background: white;
  border-radius: 6px;
  padding: 8px 10px;
  min-height: 32px;
  display: flex;
  align-items: center;
}

/* Thinking State */
.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #ddd6fe;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.thinking-text {
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}

/* Tool Activity */
.tool-activity {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;
}

.tool-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.tool-read {
  background: #dbeafe;
  color: #1d4ed8;
}

.tool-write {
  background: #dcfce7;
  color: #15803d;
}

.tool-edit {
  background: #fef3c7;
  color: #b45309;
}

.tool-bash {
  background: #fce7f3;
  color: #be185d;
}

.tool-glob, .tool-grep {
  background: #e0e7ff;
  color: #4338ca;
}

.tool-web {
  background: #cffafe;
  color: #0e7490;
}

.tool-task {
  background: #f3e8ff;
  color: #7e22ce;
}

.tool-explanation {
  font-size: 11px;
  color: #6b7280;
  margin: 0;
}

.tool-detail {
  font-size: 11px;
  color: #9ca3af;
  margin: 0;
  font-family: 'Menlo', 'Monaco', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

/* Idle State */
.idle-state {
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
}
</style>
