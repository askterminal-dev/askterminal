export interface ClaudeGuide {
  id: string
  title: string
  subtitle?: string
  content: string
}

import claude1 from './claude-1-intro.html?raw'
import claude2 from './claude-2-conversations.html?raw'
import claude3 from './claude-3-tools.html?raw'
import claude4 from './claude-4-workflows.html?raw'
import claude5 from './claude-5-permissions.html?raw'
import claude6 from './claude-6-best-practices.html?raw'

export const claudeGuides: ClaudeGuide[] = [
  {
    id: 'claude-1',
    title: 'Getting Started',
    subtitle: 'your AI coding partner',
    content: claude1
  },
  {
    id: 'claude-2',
    title: 'Conversations',
    subtitle: 'interactive mode',
    content: claude2
  },
  {
    id: 'claude-3',
    title: 'Understanding Tools',
    subtitle: 'how Claude works',
    content: claude3
  },
  {
    id: 'claude-4',
    title: 'Common Workflows',
    subtitle: 'practical patterns',
    content: claude4
  },
  {
    id: 'claude-5',
    title: 'Permissions',
    subtitle: 'staying in control',
    content: claude5
  },
  {
    id: 'claude-6',
    title: 'Best Practices',
    subtitle: 'getting great results',
    content: claude6
  }
]

export function getClaudeGuide(id: string): ClaudeGuide | undefined {
  return claudeGuides.find(g => g.id === id)
}

export function getDefaultClaudeGuide(): ClaudeGuide {
  return claudeGuides[0]
}
