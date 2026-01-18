import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ClaudeToolType =
  | 'Read' | 'Write' | 'Edit' | 'Bash'
  | 'Glob' | 'Grep' | 'WebFetch' | 'WebSearch'
  | 'Task' | 'TodoWrite' | null

export interface ClaudeActivity {
  type: 'thinking' | 'tool_start' | 'tool_complete' | 'response' | 'error'
  tool?: ClaudeToolType
  description?: string
  timestamp: number
}

export interface TodoItem {
  content: string
  status: 'pending' | 'in_progress' | 'completed'
  activities: ClaudeActivity[]
  collapsed: boolean
}

export interface ConversationRound {
  id: string
  promptSummary: string
  timestamp: number
  todos: TodoItem[]
  activities: ClaudeActivity[] // Activities not tied to a specific todo
  collapsed: boolean
}

export const useClaudeStore = defineStore('claude', () => {
  // State
  const isClaudeSession = ref(false)
  const currentActivity = ref<ClaudeActivity | null>(null)
  const sessionStartTime = ref<number | null>(null)

  // Hierarchical activity tracking
  const conversationRounds = ref<ConversationRound[]>([])
  const currentRoundId = ref<string | null>(null)
  const currentTodos = ref<TodoItem[]>([])

  // Legacy flat history (for compatibility)
  const activityHistory = ref<ClaudeActivity[]>([])

  // Computed
  const isThinking = computed(() =>
    currentActivity.value?.type === 'thinking'
  )

  const currentTool = computed(() =>
    currentActivity.value?.tool || null
  )

  const currentRound = computed(() =>
    conversationRounds.value.find(r => r.id === currentRoundId.value) || null
  )

  const recentActivities = computed(() =>
    activityHistory.value.slice(-10).reverse()
  )

  // Get active todo (the one marked in_progress)
  const activeTodo = computed(() =>
    currentTodos.value.find(t => t.status === 'in_progress') || null
  )

  // Actions
  function startSession() {
    isClaudeSession.value = true
    sessionStartTime.value = Date.now()
    activityHistory.value = []
    conversationRounds.value = []
    currentRoundId.value = null
    currentTodos.value = []
    currentActivity.value = null
  }

  function endSession() {
    isClaudeSession.value = false
    currentActivity.value = null
    sessionStartTime.value = null
    currentRoundId.value = null
    currentTodos.value = []
  }

  function startNewRound(promptSummary: string = 'User prompt') {
    const round: ConversationRound = {
      id: `round-${Date.now()}`,
      promptSummary,
      timestamp: Date.now(),
      todos: [],
      activities: [],
      collapsed: false
    }
    conversationRounds.value.push(round)
    currentRoundId.value = round.id
    currentTodos.value = []
  }

  function updateTodos(todos: TodoItem[]) {
    currentTodos.value = todos
    // Also update the current round's todos
    if (currentRound.value) {
      currentRound.value.todos = todos
    }
  }

  function setActivity(activity: ClaudeActivity) {
    currentActivity.value = activity
    activityHistory.value.push(activity)

    // Keep last 100 activities in flat list
    if (activityHistory.value.length > 100) {
      activityHistory.value.shift()
    }

    // Add to hierarchical structure
    if (currentRound.value) {
      // If there's an active todo, add to that todo's activities
      const activeTodoItem = currentTodos.value.find(t => t.status === 'in_progress')
      if (activeTodoItem) {
        activeTodoItem.activities.push(activity)
      } else {
        // Add to round's general activities
        currentRound.value.activities.push(activity)
      }
    }
  }

  function clearActivity() {
    currentActivity.value = null
  }

  function toggleRoundCollapsed(roundId: string) {
    const round = conversationRounds.value.find(r => r.id === roundId)
    if (round) {
      round.collapsed = !round.collapsed
    }
  }

  function toggleTodoCollapsed(roundId: string, todoIndex: number) {
    const round = conversationRounds.value.find(r => r.id === roundId)
    if (round && round.todos[todoIndex]) {
      round.todos[todoIndex].collapsed = !round.todos[todoIndex].collapsed
    }
  }

  function collapseAllRounds() {
    conversationRounds.value.forEach(r => {
      r.collapsed = true
      r.todos.forEach(t => t.collapsed = true)
    })
  }

  function expandAllRounds() {
    conversationRounds.value.forEach(r => {
      r.collapsed = false
      r.todos.forEach(t => t.collapsed = false)
    })
  }

  /**
   * Process PTY output to detect Claude session and activity
   */
  function processClaudeOutput(data: string) {
    // Strip ANSI escape codes for pattern matching
    const clean = data.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')

    // Detect session start - Claude's welcome box or prompt
    if (!isClaudeSession.value) {
      if (clean.includes('╭─') || clean.includes('Claude Code')) {
        startSession()
        return
      }
    }

    // If not in a Claude session, nothing more to do
    if (!isClaudeSession.value) return

    // Detect session end - return to shell prompt or explicit exit
    if (clean.includes('Goodbye!')) {
      endSession()
      return
    }

    // Shell prompt detection (indicates Claude exited)
    const shellPromptPatterns = [
      /\n[^\n]*\$\s*$/,  // bash: $ at end
      /\n[^\n]*%\s*$/,   // zsh: % at end
      /→\s+[^\n]*[~\/]\s*$/, // oh-my-zsh
    ]
    for (const pattern of shellPromptPatterns) {
      if (pattern.test(clean) && !clean.includes('Claude')) {
        if (activityHistory.value.length > 0) {
          endSession()
          return
        }
      }
    }

    // Detect new user prompt (the > prompt followed by text)
    // This indicates a new conversation round
    const promptMatch = clean.match(/^>\s+(.{1,50})/)
    if (promptMatch) {
      const summary = promptMatch[1].trim()
      startNewRound(summary.length > 40 ? summary.substring(0, 40) + '...' : summary)
      return
    }

    // Detect TodoWrite updates - parse the todo list
    if (clean.includes('TodoWrite') || clean.includes('todo') && clean.includes('status')) {
      // Try to parse todo items from the output
      const todoPattern = /\[?(pending|in_progress|completed)\]?\s*(.+)/gi
      const matches = [...clean.matchAll(todoPattern)]
      if (matches.length > 0) {
        const parsedTodos: TodoItem[] = matches.map(m => {
          const rawContent = m[2].trim()
          return {
            content: rawContent.length > 60 ? rawContent.substring(0, 60) + '...' : rawContent,
            status: m[1].toLowerCase() as TodoItem['status'],
            activities: [],
            collapsed: false
          }
        })
        updateTodos(parsedTodos)
      }
    }

    // Detect thinking/processing (spinner characters)
    const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    if (spinnerChars.some(c => clean.includes(c)) || clean.includes('Thinking')) {
      setActivity({ type: 'thinking', timestamp: Date.now() })
      return
    }

    // Detect tool calls - patterns must match file paths or specific formats
    // For Read/Write/Edit: only match paths starting with /, ./, or ~
    // This prevents matching status lines like "Read 138 lines"

    // Check for Read with a file path (not "Read 138 lines" status)
    const readMatch = clean.match(/Read\s+(\/[^\n\s]+|\.\/[^\n\s]+|~[^\n\s]+)/)
    if (readMatch) {
      const path = readMatch[1].substring(0, 60)
      setActivity({
        type: 'tool_start',
        tool: 'Read',
        description: `Reading: ${path}`,
        timestamp: Date.now()
      })
      return
    }

    // Check for Write with a file path
    const writeMatch = clean.match(/Write\s+(\/[^\n\s]+|\.\/[^\n\s]+|~[^\n\s]+)/)
    if (writeMatch) {
      const path = writeMatch[1].substring(0, 60)
      setActivity({
        type: 'tool_start',
        tool: 'Write',
        description: `Writing: ${path}`,
        timestamp: Date.now()
      })
      return
    }

    // Check for Edit with a file path
    const editMatch = clean.match(/Edit\s+(\/[^\n\s]+|\.\/[^\n\s]+|~[^\n\s]+)/)
    if (editMatch) {
      const path = editMatch[1].substring(0, 60)
      setActivity({
        type: 'tool_start',
        tool: 'Edit',
        description: `Editing: ${path}`,
        timestamp: Date.now()
      })
      return
    }

    // Other tool patterns (less ambiguous)
    const toolPatterns: Array<{ pattern: RegExp; tool: ClaudeToolType; desc: string }> = [
      { pattern: /Bash:\s*([^\n]+)/, tool: 'Bash', desc: 'Running' },
      { pattern: /Glob\s+([^\n]+)/, tool: 'Glob', desc: 'Finding' },
      { pattern: /Grep\s+([^\n]+)/, tool: 'Grep', desc: 'Searching' },
      { pattern: /WebFetch\s+(https?:\/\/[^\n\s]+)/, tool: 'WebFetch', desc: 'Fetching' },
      { pattern: /WebSearch\s+([^\n]+)/, tool: 'WebSearch', desc: 'Searching' },
      { pattern: /Task\s+([^\n]+)/, tool: 'Task', desc: 'Subtask' },
    ]

    for (const { pattern, tool, desc } of toolPatterns) {
      const match = clean.match(pattern)
      if (match) {
        const detail = match[1]?.trim().substring(0, 50) || ''
        setActivity({
          type: 'tool_start',
          tool,
          description: detail ? `${desc}: ${detail}` : desc,
          timestamp: Date.now()
        })
        return
      }
    }

    // Detect tool completion (checkmarks)
    if (clean.includes('✓') || clean.includes('✔')) {
      if (currentActivity.value?.type === 'tool_start') {
        setActivity({
          type: 'tool_complete',
          tool: currentActivity.value.tool,
          description: 'Completed',
          timestamp: Date.now()
        })
      }
    }
  }

  return {
    // State
    isClaudeSession,
    currentActivity,
    activityHistory,
    sessionStartTime,
    conversationRounds,
    currentRoundId,
    currentTodos,
    // Computed
    isThinking,
    currentTool,
    currentRound,
    recentActivities,
    activeTodo,
    // Actions
    startSession,
    endSession,
    startNewRound,
    updateTodos,
    setActivity,
    clearActivity,
    toggleRoundCollapsed,
    toggleTodoCollapsed,
    collapseAllRounds,
    expandAllRounds,
    processClaudeOutput
  }
})
