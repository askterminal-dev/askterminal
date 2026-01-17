export interface Guide {
  id: string
  title: string
  subtitle?: string
  content: string
}

import welcome from './welcome.html?raw'
import skill1 from './skill-1-running-a-command.html?raw'
import skill2 from './skill-2-safety-features.html?raw'
import skill3 from './skill-3-simple-commands.html?raw'
import skill4 from './skill-4-arguments.html?raw'
import skill5 from './skill-5-command-flags.html?raw'

export const guides: Guide[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    content: welcome
  },
  {
    id: 'skill-1',
    title: 'Skill 1: Running a Command',
    content: skill1
  },
  {
    id: 'skill-2',
    title: 'Skill 2: Safety Features',
    content: skill2
  },
  {
    id: 'skill-3',
    title: 'Skill 3: Simple Commands',
    subtitle: 'basic usage',
    content: skill3
  },
  {
    id: 'skill-4',
    title: 'Skill 4: Arguments',
    subtitle: 'what commands act on',
    content: skill4
  },
  {
    id: 'skill-5',
    title: 'Skill 5: Flags',
    subtitle: 'modifying behavior',
    content: skill5
  }
]

export function getGuide(id: string): Guide | undefined {
  return guides.find(g => g.id === id)
}

export function getDefaultGuide(): Guide {
  return guides[0]
}
