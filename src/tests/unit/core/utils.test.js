import { describe, it, expect } from 'vitest'
import { 
  formatDuration, 
  formatFileSize, 
  slugify, 
  truncate, 
  debounce,
  groupBy,
  sortBy,
  unique
} from '@/core/utils'

describe('Core Utils', () => {
  describe('formatDuration', () => {
    it('should format seconds to MM:SS format', () => {
      expect(formatDuration(90)).toBe('1:30')
      expect(formatDuration(125)).toBe('2:05')
      expect(formatDuration(0)).toBe('0:00')
    })

    it('should format long durations to HH:MM:SS format', () => {
      expect(formatDuration(3661)).toBe('1:01:01')
      expect(formatDuration(7200)).toBe('2:00:00')
    })

    it('should handle edge cases', () => {
      expect(formatDuration(null)).toBe('0:00')
      expect(formatDuration(undefined)).toBe('0:00')
      expect(formatDuration(-10)).toBe('0:00')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes to human readable sizes', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })

    it('should handle small sizes', () => {
      expect(formatFileSize(500)).toBe('500 B')
      expect(formatFileSize(0)).toBe('0 B')
    })

    it('should format decimal places correctly', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(2621440)).toBe('2.5 MB')
    })
  })

  describe('slugify', () => {
    it('should convert strings to URL-friendly slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('The Beatles - Hey Jude')).toBe('the-beatles-hey-jude')
      expect(slugify('Björk & Radiohead')).toBe('bjrk-radiohead')
    })

    it('should handle special characters', () => {
      expect(slugify('Test!@#$%^&*()')).toBe('test')
      expect(slugify('Multiple   Spaces')).toBe('multiple-spaces')
      expect(slugify('--Leading--And--Trailing--')).toBe('leading-and-trailing')
    })
  })

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const longString = 'This is a very long string that should be truncated'
      expect(truncate(longString, 20)).toBe('This is a very long ...')
    })

    it('should not truncate short strings', () => {
      expect(truncate('Short', 20)).toBe('Short')
    })

    it('should handle custom suffix', () => {
      expect(truncate('Long string here', 8, '...')).toBe('Long str...')
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0
      const debouncedFn = debounce(() => callCount++, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(callCount).toBe(0)

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(callCount).toBe(1)
    })
  })

  describe('groupBy', () => {
    it('should group array items by key', () => {
      const items = [
        { category: 'rock', name: 'Song 1' },
        { category: 'pop', name: 'Song 2' },
        { category: 'rock', name: 'Song 3' }
      ]

      const grouped = groupBy(items, 'category')
      
      expect(grouped.rock).toHaveLength(2)
      expect(grouped.pop).toHaveLength(1)
      expect(grouped.rock[0].name).toBe('Song 1')
    })
  })

  describe('sortBy', () => {
    it('should sort array by key', () => {
      const items = [
        { name: 'Charlie', age: 30 },
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 35 }
      ]

      const sortedByName = sortBy(items, 'name')
      expect(sortedByName[0].name).toBe('Alice')
      expect(sortedByName[2].name).toBe('Charlie')

      const sortedByAge = sortBy(items, 'age', 'desc')
      expect(sortedByAge[0].age).toBe(35)
      expect(sortedByAge[2].age).toBe(25)
    })
  })

  describe('unique', () => {
    it('should remove duplicates from array', () => {
      const numbers = [1, 2, 2, 3, 3, 3, 4]
      expect(unique(numbers)).toEqual([1, 2, 3, 4])
    })

    it('should remove duplicates by key', () => {
      const items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 1, name: 'Item 1 Duplicate' }
      ]

      const uniqueItems = unique(items, 'id')
      expect(uniqueItems).toHaveLength(2)
      expect(uniqueItems[0].id).toBe(1)
      expect(uniqueItems[1].id).toBe(2)
    })
  })
})