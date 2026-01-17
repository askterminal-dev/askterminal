import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // State
  const showInfoPanel = ref(true)

  // Load UI state from localStorage
  function loadUIState() {
    const saved = localStorage.getItem('askterminal-ui')
    if (saved) {
      try {
        const state = JSON.parse(saved)
        showInfoPanel.value = state.showInfoPanel ?? true
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  // Save UI state to localStorage
  function saveUIState() {
    localStorage.setItem('askterminal-ui', JSON.stringify({
      showInfoPanel: showInfoPanel.value
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

  return {
    // State
    showInfoPanel,
    // Methods
    loadUIState,
    saveUIState,
    toggleInfoPanel,
    setInfoPanelVisible
  }
})
