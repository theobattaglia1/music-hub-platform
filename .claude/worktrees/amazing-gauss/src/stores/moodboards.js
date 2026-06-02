import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'mh_moodboards_v1'

const makeDefaultBoards = () => [
  {
    id: 'mood-1',
    title: 'Album Aesthetic',
    item_count: 3,
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    collaborators: [
      { id: 'u1', name: 'Alex Smith', avatar: 'https://ui-avatars.com/api/?name=Alex+Smith&background=6366f1&color=fff&size=32' }
    ],
    preview_items: [
      { type: 'color', color: '#a855f7', x: 5, y: 5, width: 25, height: 40 },
      { type: 'text', content: 'NEON VIBES', color: '#22c55e', x: 35, y: 15, width: 55, height: 20 },
      { type: 'color', color: '#1e1b4b', x: 35, y: 55, width: 55, height: 35 }
    ],
    items: [
      { id: 'i1', type: 'color', color: '#a855f7', x: 40, y: 40, w: 200, h: 240, z: 1 },
      { id: 'i2', type: 'text', content: 'NEON VIBES', color: '#22c55e', fontSize: 32, x: 280, y: 90, w: 340, h: 100, z: 2 },
      { id: 'i3', type: 'color', color: '#1e1b4b', x: 280, y: 220, w: 340, h: 210, z: 3 }
    ]
  },
  {
    id: 'mood-2',
    title: 'Tour Concepts',
    item_count: 2,
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
    collaborators: [
      { id: 'u2', name: 'Jordan Lee', avatar: 'https://ui-avatars.com/api/?name=Jordan+Lee&background=ef4444&color=fff&size=32' }
    ],
    preview_items: [
      { type: 'color', color: '#ef4444', x: 5, y: 5, width: 40, height: 90 },
      { type: 'color', color: '#1f2937', x: 50, y: 5, width: 45, height: 90 }
    ],
    items: [
      { id: 'i4', type: 'color', color: '#ef4444', x: 40, y: 40, w: 260, h: 380, z: 1 },
      { id: 'i5', type: 'color', color: '#1f2937', x: 340, y: 40, w: 280, h: 380, z: 2 }
    ]
  },
  {
    id: 'mood-3',
    title: 'Brand Identity',
    item_count: 2,
    updated_at: new Date(Date.now() - 14400000).toISOString(),
    created_at: new Date(Date.now() - 259200000).toISOString(),
    collaborators: [],
    preview_items: [
      { type: 'color', color: '#f59e0b', x: 5, y: 5, width: 90, height: 45 },
      { type: 'text', content: 'BRAND', color: '#000', x: 15, y: 60, width: 70, height: 30 }
    ],
    items: [
      { id: 'i6', type: 'color', color: '#f59e0b', x: 40, y: 40, w: 560, h: 200, z: 1 },
      { id: 'i7', type: 'text', content: 'BRAND', color: '#000000', fontSize: 48, x: 100, y: 280, w: 440, h: 130, z: 2 }
    ]
  }
]

export const useMoodboardStore = defineStore('moodboards', () => {
  const boards = ref([])

  const _save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(boards.value)) } catch { /* quota */ }
  }

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      boards.value = raw ? JSON.parse(raw) : makeDefaultBoards()
    } catch {
      boards.value = makeDefaultBoards()
    }
  }

  const getBoard = (id) => boards.value.find(b => b.id === id) || null

  const createBoard = (title) => {
    const board = {
      id: `mood-${Date.now()}`,
      title: title.trim(),
      item_count: 0,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      collaborators: [],
      preview_items: [],
      items: []
    }
    boards.value.unshift(board)
    _save()
    return board
  }

  const renameBoard = (id, title) => {
    const b = getBoard(id)
    if (b) { b.title = title.trim(); b.updated_at = new Date().toISOString(); _save() }
  }

  const deleteBoard = (id) => {
    const idx = boards.value.findIndex(b => b.id === id)
    if (idx > -1) { boards.value.splice(idx, 1); _save() }
  }

  const duplicateBoard = (id) => {
    const b = getBoard(id)
    if (!b) return null
    const copy = {
      ...JSON.parse(JSON.stringify(b)),
      id: `mood-${Date.now()}`,
      title: `${b.title} (Copy)`,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
    const idx = boards.value.findIndex(b2 => b2.id === id)
    boards.value.splice(idx + 1, 0, copy)
    _save()
    return copy
  }

  const _updatePreview = (b) => {
    b.item_count = (b.items || []).length
    b.preview_items = (b.items || []).slice(0, 5).map(it => ({
      type: it.type,
      src: it.src || null,
      color: it.color || null,
      content: it.content || null,
      x: Math.max(0, (it.x / 1200) * 100),
      y: Math.max(0, (it.y / 800) * 100),
      width: Math.min(100, (it.w / 1200) * 100),
      height: Math.min(100, (it.h / 800) * 100)
    }))
    b.updated_at = new Date().toISOString()
  }

  const addItem = (boardId, itemData) => {
    const b = getBoard(boardId)
    if (!b) return
    if (!b.items) b.items = []
    const item = { id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`, z: b.items.length + 1, ...itemData }
    b.items.push(item)
    _updatePreview(b)
    _save()
    return item
  }

  const removeItem = (boardId, itemId) => {
    const b = getBoard(boardId)
    if (!b?.items) return
    b.items = b.items.filter(it => it.id !== itemId)
    _updatePreview(b)
    _save()
  }

  const updateItems = (boardId, items) => {
    const b = getBoard(boardId)
    if (!b) return
    b.items = items
    _updatePreview(b)
    _save()
  }

  // Initialize
  load()

  return { boards, load, getBoard, createBoard, renameBoard, deleteBoard, duplicateBoard, addItem, removeItem, updateItems }
})
