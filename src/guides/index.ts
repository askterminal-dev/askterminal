export interface Guide {
  id: string
  title: string
  content: string
}

import welcome from './welcome.html?raw'
import lesson1 from './lesson-1-running-a-command.html?raw'
import lesson2 from './lesson-2-simple-commands.html?raw'

export const guides: Guide[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    content: welcome
  },
  {
    id: 'lesson-1',
    title: 'Lesson 1: Running a Command',
    content: lesson1
  },
  {
    id: 'lesson-2',
    title: 'Lesson 2: Simple Commands',
    content: lesson2
  }
]

export function getGuide(id: string): Guide | undefined {
  return guides.find(g => g.id === id)
}

export function getDefaultGuide(): Guide {
  return guides[0]
}
