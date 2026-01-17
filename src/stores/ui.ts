import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // State
  const showInfoPanel = ref(true)
  const currentGuideId = ref<string | null>('welcome') // null = show guides index

  // Load UI state from localStorage
  function loadUIState() {
    const saved = localStorage.getItem('askterminal-ui')
    if (saved) {
      try {
        const state = JSON.parse(saved)
        showInfoPanel.value = state.showInfoPanel ?? true
        // Preserve null (guides index) vs undefined (default to welcome)
        currentGuideId.value = 'currentGuideId' in state ? state.currentGuideId : 'welcome'
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  // Save UI state to localStorage
  function saveUIState() {
    localStorage.setItem('askterminal-ui', JSON.stringify({
      showInfoPanel: showInfoPanel.value,
      currentGuideId: currentGuideId.value
    }))
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

  return {
    // State
    showInfoPanel,
    currentGuideId,
    // Methods
    loadUIState,
    saveUIState,
    toggleInfoPanel,
    setInfoPanelVisible,
    setCurrentGuide,
    showGuidesIndex
  }
})
