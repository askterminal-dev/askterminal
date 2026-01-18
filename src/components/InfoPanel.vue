<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore, type InfoPanelTab } from '../stores/ui'
import { useSettingsStore } from '../stores/settings'
import { useClaudeStore } from '../stores/claude'
import { guides, getGuide } from '../guides'
import { claudeGuides, getClaudeGuide } from '../guides/claude-code'
import ActivityHistoryView from './ActivityHistoryView.vue'
import NotesPanel from './NotesPanel.vue'

const uiStore = useUIStore()
const settingsStore = useSettingsStore()
const claudeStore = useClaudeStore()

// Check if user can access Claude Code guides (intermediate or advanced)
const canAccessClaudeGuides = computed(() => {
  return settingsStore.skillLevel !== 'beginner'
})

// Get current guide based on active track
const currentGuide = computed(() => {
  if (!uiStore.currentGuideId) return null
  if (uiStore.currentTrack === 'claude-code') {
    return getClaudeGuide(uiStore.currentGuideId) || null
  }
  return getGuide(uiStore.currentGuideId) || null
})

// Get guides list based on active track
const activeGuides = computed(() => {
  return uiStore.currentTrack === 'claude-code' ? claudeGuides : guides
})

// Show activity indicator when Claude is running
const showActivityIndicator = computed(() => {
  return claudeStore.isClaudeSession && uiStore.activeTab !== 'activity'
})

function selectGuide(guideId: string) {
  uiStore.setCurrentGuide(guideId)
}

function goToIndex() {
  uiStore.showGuidesIndex()
}

function switchTrack(track: 'terminal' | 'claude-code') {
  if (track === 'claude-code' && !canAccessClaudeGuides.value) return
  uiStore.setTrack(track)
}

function switchTab(tab: InfoPanelTab) {
  uiStore.setActiveTab(tab)
}

// Tab configuration
const tabs: Array<{ id: InfoPanelTab; label: string; icon: string }> = [
  { id: 'guides', label: 'Guides', icon: 'book' },
  { id: 'activity', label: 'Activity', icon: 'activity' },
  { id: 'notes', label: 'Notes', icon: 'edit' }
]
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
      <!-- Top-Level Tabs -->
      <div class="top-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="top-tab"
          :class="{
            active: uiStore.activeTab === tab.id,
            'has-indicator': tab.id === 'activity' && showActivityIndicator
          }"
          @click="switchTab(tab.id)"
        >
          <span class="tab-label">{{ tab.label }}</span>
          <span v-if="tab.id === 'activity' && showActivityIndicator" class="activity-dot"></span>
        </button>
      </div>

      <!-- Guides Tab Content -->
      <div v-if="uiStore.activeTab === 'guides'" class="tab-content guides-tab">
        <!-- Guide Content View -->
        <template v-if="currentGuide">
          <div class="panel-header">
            <button class="back-btn" @click="goToIndex" title="Back to guides">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div class="panel-title-group">
              <span class="panel-title">{{ currentGuide.title }}</span>
              <span v-if="currentGuide.subtitle" class="panel-subtitle">{{ currentGuide.subtitle }}</span>
            </div>
            <button class="menu-btn" @click="goToIndex" title="All guides">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="guide-content" v-html="currentGuide.content"></div>
        </template>

        <!-- Guides Index View -->
        <template v-else>
          <div class="panel-header">
            <span class="panel-title">Guides</span>
          </div>

          <!-- Track Tabs -->
          <div class="track-tabs">
            <button
              class="track-tab"
              :class="{ active: uiStore.currentTrack === 'terminal' }"
              @click="switchTrack('terminal')"
            >
              Terminal Basics
            </button>
            <button
              class="track-tab"
              :class="{
                active: uiStore.currentTrack === 'claude-code',
                locked: !canAccessClaudeGuides
              }"
              @click="switchTrack('claude-code')"
              :title="!canAccessClaudeGuides ? 'Unlock by changing to Intermediate or Advanced in Settings' : ''"
            >
              <span>Claude Code</span>
              <svg v-if="!canAccessClaudeGuides" class="lock-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </button>
          </div>

          <div class="guides-index">
            <p class="index-intro">
              {{ uiStore.currentTrack === 'claude-code'
                 ? 'Learn to use Claude Code, your AI coding partner.'
                 : 'Learn the command line step by step.' }}
            </p>
            <div class="guide-list">
              <button
                v-for="guide in activeGuides"
                :key="guide.id"
                class="guide-card"
                @click="selectGuide(guide.id)"
              >
                <div class="guide-card-text">
                  <span class="guide-card-title">{{ guide.title }}</span>
                  <span v-if="guide.subtitle" class="guide-card-subtitle">{{ guide.subtitle }}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- Activity Tab Content -->
      <div v-else-if="uiStore.activeTab === 'activity'" class="tab-content activity-tab">
        <ActivityHistoryView />
      </div>

      <!-- Notes Tab Content -->
      <div v-else-if="uiStore.activeTab === 'notes'" class="tab-content notes-tab">
        <NotesPanel />
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
  width: 400px;
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
  padding: 12px 16px 16px 32px;
  overflow-y: auto;
  scrollbar-width: thin;
  display: flex;
  flex-direction: column;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

/* Top-Level Tabs */
.top-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 16px;
  background: #e5e7eb;
  border-radius: 8px;
  padding: 3px;
}

.top-tab {
  flex: 1;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;
}

.top-tab:hover {
  color: #374151;
}

.top-tab.active {
  background: white;
  color: #111827;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.activity-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Tab Content */
.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.guides-tab {
  overflow-y: auto;
}

.activity-tab {
  overflow: hidden;
}

.notes-tab {
  overflow: hidden;
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-title-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.panel-subtitle {
  font-size: 12px;
  color: #6b7280;
}

.back-btn {
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.back-btn:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
  color: #374151;
}

.menu-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.menu-btn:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
  color: #374151;
}

/* Track Tabs */
.track-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 4px;
}

.track-tab {
  flex: 1;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.track-tab:hover:not(.locked) {
  color: #374151;
}

.track-tab.active {
  background: white;
  color: #111827;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.track-tab.locked {
  color: #9ca3af;
  cursor: not-allowed;
}

.track-tab .lock-icon {
  opacity: 0.6;
}

/* Guides Index */
.guides-index {
  flex: 1;
}

.index-intro {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.guide-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.guide-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.guide-card:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.guide-card-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.guide-card-title {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.guide-card-subtitle {
  font-size: 12px;
  color: #9ca3af;
}

.guide-card svg {
  color: #9ca3af;
  transition: transform 0.15s;
}

.guide-card:hover svg {
  color: #6b7280;
  transform: translateX(2px);
}

/* Guide content styles */
.guide-content {
  flex: 1;
}
</style>

<!-- Unscoped styles for HTML content -->
<style>
.guide-content h2 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.guide-content h3 {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin: 16px 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.guide-content section:first-child h3 {
  margin-top: 0;
}

.guide-content p {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.guide-content section {
  margin-bottom: 16px;
}

.guide-content ul,
.guide-content ol {
  margin: 0 0 12px 0;
  padding-left: 18px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
}

.guide-content li {
  margin-bottom: 4px;
}

.guide-content .safety-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.4;
}

.guide-content .safety-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.guide-content .safety-dot.safe {
  background: #22c55e;
}

.guide-content .safety-dot.moderate {
  background: #f59e0b;
}

.guide-content .safety-dot.dangerous {
  background: #ef4444;
}

.guide-content kbd {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 1px 5px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 11px;
}

.guide-content code {
  background: #f3f4f6;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #1f2937;
}

.guide-content .command-example {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

.guide-content .command-example code {
  display: block;
  background: transparent;
  padding: 0;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.guide-content .command-example p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.guide-content strong {
  font-weight: 600;
  color: #374151;
}
</style>
