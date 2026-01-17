<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '../stores/ui'
import { guides, getGuide } from '../guides'

const uiStore = useUIStore()

const currentGuide = computed(() => {
  if (!uiStore.currentGuideId) return null
  return getGuide(uiStore.currentGuideId) || null
})

function selectGuide(guideId: string) {
  uiStore.setCurrentGuide(guideId)
}

function goToIndex() {
  uiStore.showGuidesIndex()
}
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
      <!-- Guide Content View -->
      <template v-if="currentGuide">
        <div class="panel-header">
          <button class="back-btn" @click="goToIndex" title="Back to guides">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <span class="panel-title">{{ currentGuide.title }}</span>
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
        <div class="guides-index">
          <p class="index-intro">Learn the command line step by step.</p>
          <div class="guide-list">
            <button
              v-for="guide in guides"
              :key="guide.id"
              class="guide-card"
              @click="selectGuide(guide.id)"
            >
              <span class="guide-card-title">{{ guide.title }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </template>
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
  padding: 16px 16px 16px 32px;
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

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
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

.guide-card-title {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
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
