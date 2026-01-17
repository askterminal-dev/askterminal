import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // State
  const showInfoPanel = ref(true)
  const currentGuideId = ref('welcome')

  // Load UI state from localStorage
  function loadUIState() {
    const saved = localStorage.getItem('askterminal-ui')
    if (saved) {
      try {
        const state = JSON.parse(saved)
        showInfoPanel.value = state.showInfoPanel ?? true
        currentGuideId.value = state.currentGuideId ?? 'welcome'
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

  // Set current guide
  function setCurrentGuide(guideId: string) {
    currentGuideId.value = guideId
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
    setCurrentGuide
  }
})
