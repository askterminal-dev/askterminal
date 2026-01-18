import { defineStore } from 'pinia'
import { ref } from 'vue'

export type GuideTrack = 'terminal' | 'claude-code'
export type InfoPanelTab = 'guides' | 'activity' | 'notes'

export const useUIStore = defineStore('ui', () => {
  // State
  const showInfoPanel = ref(true)
  const currentGuideId = ref<string | null>('welcome') // null = show guides index
  const currentTrack = ref<GuideTrack>('terminal') // which guide track is active
  const activeTab = ref<InfoPanelTab>('guides') // top-level tab in InfoPanel
  const userNotes = ref('') // user's session notes

  // Load UI state from localStorage
  function loadUIState() {
    const saved = localStorage.getItem('askterminal-ui')
    if (saved) {
      try {
        const state = JSON.parse(saved)
        showInfoPanel.value = state.showInfoPanel ?? true
        // Preserve null (guides index) vs undefined (default to welcome)
        currentGuideId.value = 'currentGuideId' in state ? state.currentGuideId : 'welcome'
        currentTrack.value = state.currentTrack || 'terminal'
        activeTab.value = state.activeTab || 'guides'
        userNotes.value = state.userNotes || ''
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  // Save UI state to localStorage
  function saveUIState() {
    localStorage.setItem('askterminal-ui', JSON.stringify({
      showInfoPanel: showInfoPanel.value,
      currentGuideId: currentGuideId.value,
      currentTrack: currentTrack.value,
      activeTab: activeTab.value,
      userNotes: userNotes.value
    }))
  }

  // Set which guide track is active (terminal or claude-code)
  function setTrack(track: GuideTrack) {
    currentTrack.value = track
    // Reset to index when switching tracks
    currentGuideId.value = null
    saveUIState()
  }

  // Toggle info panel visibility
  function toggleInfoPanel() {
    showInfoPanel.value = !showInfoPanel.value
    saveUIState()
  }

  // Set info panel visibility directly
  function setInfoPanelVisible(visible: boolean) {
    showInfoPanel.value = visible
    saveUIState()
  }

  // Set current guide (null = show guides index)
  function setCurrentGuide(guideId: string | null) {
    currentGuideId.value = guideId
    saveUIState()
  }

  // Go to guides index
  function showGuidesIndex() {
    currentGuideId.value = null
    saveUIState()
  }

  // Set active top-level tab
  function setActiveTab(tab: InfoPanelTab) {
    activeTab.value = tab
    saveUIState()
  }

  // Update user notes
  function setUserNotes(notes: string) {
    userNotes.value = notes
    saveUIState()
  }

  return {
    // State
    showInfoPanel,
    currentGuideId,
    currentTrack,
    activeTab,
    userNotes,
    // Methods
    loadUIState,
    saveUIState,
    toggleInfoPanel,
    setInfoPanelVisible,
    setCurrentGuide,
    showGuidesIndex,
    setTrack,
    setActiveTab,
    setUserNotes
  }
})
