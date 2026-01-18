<script setup lang="ts">
import { computed } from 'vue'
import { useClaudeStore, type ClaudeActivity, type TodoItem, type ConversationRound } from '../stores/claude'

const claudeStore = useClaudeStore()

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

function getActivityLabel(activity: ClaudeActivity): string {
  if (activity.type === 'thinking') return 'Thinking'
  if (activity.type === 'tool_complete') return 'Done'
  if (activity.type === 'response') return 'Response'
  if (activity.type === 'error') return 'Error'
  if (activity.tool) return activity.tool
  return activity.type
}

function getActivityClass(activity: ClaudeActivity): string {
  if (activity.type === 'thinking') return 'type-thinking'
  if (activity.type === 'tool_complete') return 'type-complete'
  if (activity.type === 'error') return 'type-error'
  if (activity.tool) return toolColors[activity.tool] || ''
  return ''
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

function formatShortTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

const sessionDuration = computed(() => {
  if (!claudeStore.sessionStartTime) return null
  const elapsed = Date.now() - claudeStore.sessionStartTime
  const minutes = Math.floor(elapsed / 60000)
  const seconds = Math.floor((elapsed % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Count total activities in a round
function getRoundActivityCount(round: ConversationRound): number {
  let count = round.activities.length
  round.todos.forEach(todo => {
    count += todo.activities.length
  })
  return count
}

// Get todo status icon
function getTodoStatusIcon(status: TodoItem['status']): string {
  switch (status) {
    case 'completed': return '✓'
    case 'in_progress': return '●'
    default: return '○'
  }
}

function getTodoStatusClass(status: TodoItem['status']): string {
  switch (status) {
    case 'completed': return 'status-completed'
    case 'in_progress': return 'status-in-progress'
    default: return 'status-pending'
  }
}

// Reverse rounds to show most recent first
const rounds = computed(() => {
  return [...(claudeStore.conversationRounds || [])].reverse()
})

// Check if we have hierarchical data or should fall back to flat list
const hasRounds = computed(() => (claudeStore.conversationRounds?.length || 0) > 0)
</script>

<template>
  <div class="activity-history">
    <!-- Active Session -->
    <template v-if="claudeStore.isClaudeSession">
      <div class="session-header">
        <div class="session-status active">
          <span class="status-dot"></span>
          <span>Claude session active</span>
        </div>
        <div class="header-actions">
          <button
            v-if="hasRounds"
            @click="claudeStore.collapseAllRounds"
            class="collapse-btn"
            title="Collapse all"
          >
            Collapse
          </button>
          <span v-if="sessionDuration" class="session-duration">{{ sessionDuration }}</span>
        </div>
      </div>

      <!-- Current Activity -->
      <div v-if="claudeStore.currentActivity" class="current-activity">
        <div class="current-label">Currently</div>
        <div class="current-content">
          <div v-if="claudeStore.isThinking" class="thinking-state">
            <span class="spinner"></span>
            <span>Thinking...</span>
          </div>
          <div v-else-if="claudeStore.currentTool" class="tool-state">
            <span class="tool-badge" :class="toolColors[claudeStore.currentTool]">
              {{ claudeStore.currentTool }}
            </span>
            <span v-if="claudeStore.currentActivity.description" class="tool-detail">
              {{ claudeStore.currentActivity.description }}
            </span>
          </div>
          <div v-else class="idle-state">
            Waiting for response...
          </div>
        </div>
      </div>

      <!-- Hierarchical View (Rounds with Todos) -->
      <div v-if="hasRounds" class="rounds-section">
        <div class="section-header">
          <span>Conversation History</span>
        </div>

        <div class="rounds-list">
          <div
            v-for="round in rounds"
            :key="round.id"
            class="round-item"
          >
            <!-- Round Header -->
            <button
              class="round-header"
              @click="claudeStore.toggleRoundCollapsed(round.id)"
            >
              <span class="collapse-icon">{{ round.collapsed ? '▶' : '▼' }}</span>
              <span class="round-prompt">{{ round.promptSummary }}</span>
              <span class="round-meta">
                <span class="round-time">{{ formatShortTime(round.timestamp) }}</span>
                <span class="round-count">{{ getRoundActivityCount(round) }} activities</span>
              </span>
            </button>

            <!-- Round Content (when expanded) -->
            <div v-if="!round.collapsed" class="round-content">
              <!-- Todos -->
              <div
                v-for="(todo, todoIndex) in round.todos"
                :key="todoIndex"
                class="todo-item"
              >
                <button
                  class="todo-header"
                  @click="claudeStore.toggleTodoCollapsed(round.id, todoIndex)"
                >
                  <span class="todo-status" :class="getTodoStatusClass(todo.status)">
                    {{ getTodoStatusIcon(todo.status) }}
                  </span>
                  <span class="todo-content">{{ todo.content }}</span>
                  <span v-if="todo.activities.length > 0" class="todo-count">
                    {{ todo.activities.length }}
                  </span>
                  <span v-if="todo.activities.length > 0" class="collapse-icon small">
                    {{ todo.collapsed ? '▶' : '▼' }}
                  </span>
                </button>

                <!-- Todo Activities -->
                <ul v-if="!todo.collapsed && todo.activities.length > 0" class="activity-list nested">
                  <li
                    v-for="(activity, i) in todo.activities"
                    :key="i"
                    class="activity-item"
                  >
                    <span class="activity-badge" :class="getActivityClass(activity)">
                      {{ getActivityLabel(activity) }}
                    </span>
                    <span v-if="activity.description" class="activity-desc">
                      {{ activity.description }}
                    </span>
                  </li>
                </ul>
              </div>

              <!-- General Activities (not tied to todos) -->
              <ul v-if="round.activities.length > 0" class="activity-list">
                <li
                  v-for="(activity, i) in round.activities"
                  :key="i"
                  class="activity-item"
                >
                  <span class="activity-badge" :class="getActivityClass(activity)">
                    {{ getActivityLabel(activity) }}
                  </span>
                  <span v-if="activity.description" class="activity-desc">
                    {{ activity.description }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Flat Activity List (fallback when no rounds detected) -->
      <div v-else-if="claudeStore.activityHistory.length > 0" class="flat-section">
        <div class="section-header">Recent activity</div>
        <ul class="activity-list">
          <li
            v-for="(activity, i) in claudeStore.recentActivities"
            :key="i"
            class="activity-item"
          >
            <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
            <span class="activity-badge" :class="getActivityClass(activity)">
              {{ getActivityLabel(activity) }}
            </span>
            <span v-if="activity.description" class="activity-desc">
              {{ activity.description }}
            </span>
          </li>
        </ul>
      </div>
    </template>

    <!-- No Active Session -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <h3>No active Claude session</h3>
      <p>Run <code>claude</code> in the terminal to start a session. Activity will appear here.</p>
    </div>
  </div>
</template>

<style scoped>
.activity-history {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.session-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.session-status.active .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.collapse-btn {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 3px 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.collapse-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.session-duration {
  font-size: 12px;
  color: #6b7280;
  font-family: 'Menlo', 'Monaco', monospace;
}

/* Current Activity */
.current-activity {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border: 1px solid #ddd6fe;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.current-label {
  font-size: 11px;
  font-weight: 600;
  color: #7c3aed;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.current-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.thinking-state {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
  font-style: italic;
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

.tool-state {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tool-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.tool-detail {
  font-size: 12px;
  color: #6b7280;
  font-family: 'Menlo', 'Monaco', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

.idle-state {
  font-size: 13px;
  color: #9ca3af;
  font-style: italic;
}

/* Tool Colors */
.tool-read { background: #dbeafe; color: #1d4ed8; }
.tool-write { background: #dcfce7; color: #15803d; }
.tool-edit { background: #fef3c7; color: #b45309; }
.tool-bash { background: #fce7f3; color: #be185d; }
.tool-glob, .tool-grep { background: #e0e7ff; color: #4338ca; }
.tool-web { background: #cffafe; color: #0e7490; }
.tool-task { background: #f3e8ff; color: #7e22ce; }

/* Section Headers */
.section-header {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

/* Rounds Section */
.rounds-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.rounds-list {
  flex: 1;
  overflow-y: auto;
}

.round-item {
  margin-bottom: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.round-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f9fafb;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.round-header:hover {
  background: #f3f4f6;
}

.collapse-icon {
  font-size: 10px;
  color: #9ca3af;
  width: 12px;
}

.collapse-icon.small {
  font-size: 8px;
  width: 10px;
}

.round-prompt {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.round-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #9ca3af;
}

.round-time {
  font-family: 'Menlo', 'Monaco', monospace;
}

.round-content {
  padding: 8px 12px 12px;
  background: white;
}

/* Todo Items */
.todo-item {
  margin-bottom: 6px;
}

.todo-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #fafafa;
  border: 1px solid #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  font-size: 12px;
  transition: background 0.15s;
}

.todo-header:hover {
  background: #f3f4f6;
}

.todo-status {
  font-size: 12px;
  width: 14px;
  text-align: center;
}

.todo-status.status-completed { color: #22c55e; }
.todo-status.status-in-progress { color: #f59e0b; }
.todo-status.status-pending { color: #d1d5db; }

.todo-content {
  flex: 1;
  color: #4b5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.todo-count {
  font-size: 10px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 1px 5px;
  border-radius: 8px;
}

/* Activity Lists */
.activity-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.activity-list.nested {
  margin-left: 22px;
  margin-top: 4px;
  padding-left: 8px;
  border-left: 2px solid #f3f4f6;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}

.activity-time {
  font-size: 10px;
  color: #9ca3af;
  font-family: 'Menlo', 'Monaco', monospace;
  flex-shrink: 0;
}

.activity-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  background: #f3f4f6;
  color: #6b7280;
  flex-shrink: 0;
}

.activity-badge.type-thinking { background: #ede9fe; color: #7c3aed; }
.activity-badge.type-complete { background: #dcfce7; color: #15803d; }
.activity-badge.type-error { background: #fee2e2; color: #dc2626; }

.activity-desc {
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

/* Flat Section (fallback) */
.flat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.flat-section .activity-list {
  flex: 1;
  overflow-y: auto;
}

.flat-section .activity-item {
  padding: 6px 0;
  border-bottom: 1px solid #f3f4f6;
}

.flat-section .activity-item:last-child {
  border-bottom: none;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.empty-state code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 12px;
  color: #374151;
}
</style>
