import { defineStore } from "pinia";
import { ref, computed } from "vue";

const STORAGE_KEY = "musicHub.moodboards.v2";
const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 900;

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;
const clone = (value) => JSON.parse(JSON.stringify(value));
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeItem = (item = {}, zIndex = 1) => ({
  id: item.id || makeId("mood-item"),
  type: item.type || "color",
  x: Number(item.x) || 80,
  y: Number(item.y) || 80,
  width: Math.max(80, Number(item.width) || 220),
  height: Math.max(60, Number(item.height) || 160),
  zIndex: Number(item.zIndex) || zIndex,
  content: item.content || "",
  color: item.color || "#e85a19",
  src: item.src || "",
  alt: item.alt || item.content || "Moodboard item",
  link: item.link || "",
  assetType: item.assetType || "",
  assetId: item.assetId || "",
  assetTitle: item.assetTitle || "",
  assetSubtitle: item.assetSubtitle || "",
  assetMeta: item.assetMeta || "",
  assetImage: item.assetImage || "",
  assetPath: item.assetPath || "",
  assetBadge: item.assetBadge || "",
});

const normalizeBoard = (board = {}) => {
  const items = (board.items || []).map((item, index) => normalizeItem(item, index + 1));
  return {
    id: board.id || makeId("moodboard"),
    artist_id: board.artist_id || null,
    title: board.title || "Untitled Moodboard",
    description: board.description || "Visual working board",
    created_at: board.created_at || new Date().toISOString(),
    updated_at: board.updated_at || new Date().toISOString(),
    collaborators: board.collaborators || [],
    items,
  };
};

const previewItemsForBoard = (board) =>
  board.items.slice(0, 5).map((item) => ({
    type: item.type,
    content: item.content || item.assetTitle,
    src: item.src || item.assetImage,
    alt: item.alt || item.assetTitle,
    color: item.color || "#e85a19",
    x: Math.max(0, Math.min(100, (item.x / CANVAS_WIDTH) * 100)),
    y: Math.max(0, Math.min(100, (item.y / CANVAS_HEIGHT) * 100)),
    width: Math.max(10, Math.min(70, (item.width / CANVAS_WIDTH) * 100)),
    height: Math.max(8, Math.min(60, (item.height / CANVAS_HEIGHT) * 100)),
  }));

const seedBoards = [
  {
    id: "mood-1",
    artist_id: "artist-1",
    title: "Album Aesthetic",
    description: "Palette, reference typography, and key visual directions.",
    collaborators: [
      { id: "user-1", name: "Alex Smith", avatar: null },
      { id: "user-2", name: "Sam Johnson", avatar: null },
    ],
    items: [
      { type: "color", color: "#e85a19", x: 90, y: 120, width: 180, height: 180 },
      {
        type: "text",
        content: "Neon romanticism",
        color: "#ffffff",
        x: 320,
        y: 150,
        width: 300,
        height: 80,
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
        x: 700,
        y: 120,
        width: 380,
        height: 260,
      },
      { type: "color", color: "#0f172a", x: 220, y: 420, width: 220, height: 220 },
      {
        type: "text",
        content: "Gloss black + signal orange accents",
        color: "#e85a19",
        x: 520,
        y: 470,
        width: 360,
        height: 72,
      },
    ],
  },
  {
    id: "mood-2",
    artist_id: "artist-2",
    title: "Tour Concepts",
    description: "Stage, wardrobe, and merch references for the live campaign.",
    collaborators: [{ id: "user-3", name: "Jordan Lee", avatar: null }],
    items: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80",
        x: 120,
        y: 100,
        width: 440,
        height: 280,
      },
      {
        type: "text",
        content: "Wide LED horizon lines",
        color: "#f8fafc",
        x: 650,
        y: 120,
        width: 340,
        height: 70,
      },
      { type: "color", color: "#d64032", x: 670, y: 250, width: 180, height: 180 },
      { type: "color", color: "#11100f", x: 900, y: 250, width: 180, height: 180 },
    ],
  },
].map((board) => normalizeBoard(board));

export const useMoodboardsStore = defineStore("moodboards", () => {
  const boards = ref([]);
  const loading = ref(false);
  const initialized = ref(false);

  const persist = () => {
    if (!canUseStorage()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards.value));
  };

  const hydrate = () => {
    if (initialized.value) return;
    initialized.value = true;

    try {
      if (canUseStorage()) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            boards.value = parsed.map((board) => normalizeBoard(board));
            return;
          }
        }
      }
    } catch (error) {
      console.error("Failed to load moodboards cache:", error);
    }

    boards.value = seedBoards.map((board) => normalizeBoard(board));
    persist();
  };

  const touchBoard = (board, updates = {}) => {
    Object.assign(board, updates);
    board.updated_at = new Date().toISOString();
    board.items = board.items.map((item, index) => normalizeItem(item, index + 1));
    return board;
  };

  const moodboards = computed(() => {
    hydrate();
    return boards.value.map((board) => ({
      ...clone(board),
      item_count: board.items.length,
      preview_items: previewItemsForBoard(board),
    }));
  });

  const loadMoodboards = async () => {
    loading.value = true;
    hydrate();
    loading.value = false;
    return moodboards.value;
  };

  const getMoodboardById = (id) => {
    hydrate();
    return boards.value.find((board) => String(board.id) === String(id)) || null;
  };

  const createMoodboard = async ({ title, description } = {}) => {
    hydrate();
    const board = normalizeBoard({
      id: makeId("moodboard"),
      title: title || "Untitled Moodboard",
      description: description || "Visual working board",
      collaborators: [],
    });

    boards.value.unshift(board);
    persist();
    return clone(board);
  };

  const updateMoodboard = async (id, updates = {}) => {
    hydrate();
    const board = getMoodboardById(id);
    if (!board) throw new Error("Moodboard not found");
    touchBoard(board, updates);
    persist();
    return clone(board);
  };

  const renameMoodboard = async (id, title) => updateMoodboard(id, { title });

  const duplicateMoodboard = async (id) => {
    hydrate();
    const source = getMoodboardById(id);
    if (!source) throw new Error("Moodboard not found");

    const duplicate = normalizeBoard({
      ...clone(source),
      id: makeId("moodboard"),
      title: `${source.title} Copy`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: source.items.map((item) => ({
        ...clone(item),
        id: makeId("mood-item"),
        x: item.x + 24,
        y: item.y + 24,
      })),
    });

    boards.value.unshift(duplicate);
    persist();
    return clone(duplicate);
  };

  const deleteMoodboard = async (id) => {
    hydrate();
    boards.value = boards.value.filter((board) => String(board.id) !== String(id));
    persist();
    return id;
  };

  const addItem = async (boardId, itemData = {}) => {
    const board = getMoodboardById(boardId);
    if (!board) throw new Error("Moodboard not found");

    const item = normalizeItem(itemData, board.items.length + 1);
    board.items.push(item);
    touchBoard(board);
    persist();
    return clone(item);
  };

  const updateItem = async (boardId, itemId, updates = {}) => {
    const board = getMoodboardById(boardId);
    if (!board) throw new Error("Moodboard not found");

    const item = board.items.find((entry) => String(entry.id) === String(itemId));
    if (!item) throw new Error("Item not found");

    Object.assign(item, updates);
    touchBoard(board);
    persist();
    return clone(item);
  };

  const deleteItem = async (boardId, itemId) => {
    const board = getMoodboardById(boardId);
    if (!board) throw new Error("Moodboard not found");

    board.items = board.items.filter((item) => String(item.id) !== String(itemId));
    touchBoard(board);
    persist();
    return itemId;
  };

  const duplicateItem = async (boardId, itemId) => {
    const board = getMoodboardById(boardId);
    if (!board) throw new Error("Moodboard not found");

    const source = board.items.find((item) => String(item.id) === String(itemId));
    if (!source) throw new Error("Item not found");

    const duplicate = normalizeItem({
      ...clone(source),
      id: makeId("mood-item"),
      x: source.x + 28,
      y: source.y + 28,
      zIndex: Math.max(...board.items.map((item) => item.zIndex), 0) + 1,
    });

    board.items.push(duplicate);
    touchBoard(board);
    persist();
    return clone(duplicate);
  };

  const bringForward = async (boardId, itemId) => {
    const board = getMoodboardById(boardId);
    if (!board) throw new Error("Moodboard not found");
    const item = board.items.find((entry) => String(entry.id) === String(itemId));
    if (!item) throw new Error("Item not found");

    item.zIndex = Math.max(...board.items.map((entry) => entry.zIndex), 0) + 1;
    touchBoard(board);
    persist();
    return clone(item);
  };

  const sendBackward = async (boardId, itemId) => {
    const board = getMoodboardById(boardId);
    if (!board) throw new Error("Moodboard not found");
    const item = board.items.find((entry) => String(entry.id) === String(itemId));
    if (!item) throw new Error("Item not found");

    item.zIndex = Math.min(...board.items.map((entry) => entry.zIndex), 0) - 1;
    touchBoard(board);
    persist();
    return clone(item);
  };

  const clearBoard = async (boardId) => {
    const board = getMoodboardById(boardId);
    if (!board) throw new Error("Moodboard not found");
    board.items = [];
    touchBoard(board);
    persist();
    return clone(board);
  };

  return {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    boards: moodboards,
    loading,
    loadMoodboards,
    getMoodboardById,
    createMoodboard,
    updateMoodboard,
    renameMoodboard,
    duplicateMoodboard,
    deleteMoodboard,
    addItem,
    updateItem,
    deleteItem,
    duplicateItem,
    bringForward,
    sendBackward,
    clearBoard,
  };
});
