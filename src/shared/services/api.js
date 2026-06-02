/**
 * Core API service with real Supabase integration
 */

import { supabase } from "@/lib/supabase";
import { API_CONFIG } from "@/core/constants";

const MOCK_STORAGE_PREFIX = "music-hub:mock:";

const cloneMockValue = (value) => JSON.parse(JSON.stringify(value));

const createMockTimestamp = (offsetMs = 0) => new Date(Date.now() + offsetMs).toISOString();

const createMockSeeds = () => ({
  artists: [
    {
      id: "1",
      name: "Taylor Swift",
      slug: "taylor-swift",
      genre: "Pop",
      location: "Nashville, TN",
      avatar_url:
        "https://ui-avatars.com/api/?name=Taylor+Swift&background=FF6B6B&color=fff&size=256",
      created_at: createMockTimestamp(-86400000),
      updated_at: createMockTimestamp(-3600000),
    },
    {
      id: "2",
      name: "The Weeknd",
      slug: "the-weeknd",
      genre: "R&B",
      location: "Toronto, Canada",
      avatar_url:
        "https://ui-avatars.com/api/?name=The+Weeknd&background=4ECDC4&color=fff&size=256",
      created_at: createMockTimestamp(-172800000),
      updated_at: createMockTimestamp(-7200000),
    },
    {
      id: "3",
      name: "Billie Eilish",
      slug: "billie-eilish",
      genre: "Alternative",
      location: "Los Angeles, CA",
      avatar_url:
        "https://ui-avatars.com/api/?name=Billie+Eilish&background=95E1D3&color=fff&size=256",
      created_at: createMockTimestamp(-259200000),
      updated_at: createMockTimestamp(-10800000),
    },
  ],
  artist_team: [
    {
      id: "team-1",
      artist_id: "1",
      user_id: "mock-user-123",
      role: "owner",
      created_at: createMockTimestamp(-86400000),
    },
    {
      id: "team-2",
      artist_id: "2",
      user_id: "mock-user-123",
      role: "owner",
      created_at: createMockTimestamp(-86400000),
    },
    {
      id: "team-3",
      artist_id: "3",
      user_id: "mock-user-123",
      role: "owner",
      created_at: createMockTimestamp(-86400000),
    },
  ],
  events: [
    {
      id: "event-1",
      artist_id: "1",
      title: "Approve final master",
      description: "Final approval on the single master before distribution.",
      start_time: "2026-02-27T10:00:00.000Z",
      end_time: "2026-02-27T11:00:00.000Z",
      created_at: createMockTimestamp(-172800000),
    },
    {
      id: "event-2",
      artist_id: "2",
      title: "Review distribution deal",
      description: "Confirm split points and rollout obligations.",
      start_time: "2026-03-03T15:00:00.000Z",
      end_time: "2026-03-03T16:00:00.000Z",
      created_at: createMockTimestamp(-86400000),
    },
    {
      id: "event-3",
      artist_id: "3",
      title: "Social media campaign",
      description: "Lock the short-form creative calendar.",
      start_time: "2026-03-05T18:00:00.000Z",
      end_time: "2026-03-05T19:00:00.000Z",
      created_at: createMockTimestamp(-43200000),
    },
  ],
  notes: [
    {
      id: "note-1",
      artist_id: "1",
      title: "Record new single",
      content: "Book studio time for next week. Need to prepare lyrics and demo track.",
      category: "task",
      status: "todo",
      priority: "high",
      due_date: "2026-03-07T00:00:00.000Z",
      tags: ["recording", "music"],
      created_at: createMockTimestamp(-14400000),
    },
    {
      id: "note-2",
      artist_id: "1",
      title: "Album artwork concept",
      content:
        "Explore vintage aesthetic with neon accents. Consider photographer recommendations.",
      category: "idea",
      status: "in_progress",
      priority: "medium",
      due_date: null,
      tags: ["artwork", "design", "album"],
      created_at: createMockTimestamp(-28800000),
    },
  ],
  media_files: [
    {
      id: "media-file-1",
      name: "Demo Track.mp3",
      type: "audio",
      size: 4300000,
      url: "https://mock-storage.example.com/demo-track.mp3",
      created_at: createMockTimestamp(-86400000),
    },
    {
      id: "media-file-2",
      name: "Cover Art.jpg",
      type: "image",
      size: 1100000,
      url: "https://ui-avatars.com/api/?name=Cover+Art&background=E5B7A5&color=fff&size=800",
      thumbnail: "https://ui-avatars.com/api/?name=Cover+Art&background=E5B7A5&color=fff&size=300",
      created_at: createMockTimestamp(-43200000),
    },
  ],
  media: [
    {
      id: "media-1",
      artist_id: "1",
      title: "Midnight Dreams",
      description: "Single master",
      media_type: "audio",
      file_name: "midnight-dreams.wav",
      file_size: 8123456,
      mime_type: "audio/wav",
      created_at: createMockTimestamp(-36000000),
    },
    {
      id: "media-2",
      artist_id: "2",
      title: "Studio Session",
      description: "Behind the scenes photo",
      media_type: "image",
      file_name: "studio-session.jpg",
      file_size: 1222333,
      mime_type: "image/jpeg",
      created_at: createMockTimestamp(-18000000),
    },
  ],
  playlists: [],
  timeline_events: [],
  user_preferences: [],
  user_profiles: [],
});

const getMockStorage = () => {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (typeof globalThis !== "undefined" && globalThis.localStorage) return globalThis.localStorage;
  return null;
};

const getMockTable = (table) => {
  const storage = getMockStorage();
  const key = `${MOCK_STORAGE_PREFIX}${table}`;
  const seeds = createMockSeeds();
  const seedValue = cloneMockValue(seeds[table] || []);

  if (!storage) return seedValue;

  const existing = storage.getItem(key);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      storage.removeItem(key);
    }
  }

  storage.setItem(key, JSON.stringify(seedValue));
  return seedValue;
};

const setMockTable = (table, rows) => {
  const storage = getMockStorage();
  if (storage) {
    storage.setItem(`${MOCK_STORAGE_PREFIX}${table}`, JSON.stringify(rows));
  }
  return rows;
};

const applyMockFilters = (rows, filters = {}) => {
  return rows.filter((row) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === "") return true;
      const rowValue = row[key];

      if (Array.isArray(value)) {
        return value.includes(rowValue);
      }

      if (typeof value === "string") {
        const prefixedOperator = value.match(/^(eq|neq|gt|gte|lt|lte|like|ilike|is|in)\.(.+)$/);
        if (prefixedOperator) {
          const [, operator, rawValue] = prefixedOperator;
          switch (operator) {
            case "eq":
              return String(rowValue) === rawValue;
            case "neq":
              return String(rowValue) !== rawValue;
            case "gt":
              return rowValue > rawValue;
            case "gte":
              return rowValue >= rawValue;
            case "lt":
              return rowValue < rawValue;
            case "lte":
              return rowValue <= rawValue;
            case "like":
            case "ilike": {
              const haystack = String(rowValue || "").toLowerCase();
              const needle = rawValue.replace(/%/g, "").toLowerCase();
              return haystack.includes(needle);
            }
            case "is":
              return rawValue === "null" ? rowValue == null : String(rowValue) === rawValue;
            case "in":
              return rawValue
                .replace(/^\(|\)$/g, "")
                .split(",")
                .map((item) => item.trim())
                .includes(String(rowValue));
            default:
              return true;
          }
        }

        if (value.includes("*")) {
          return String(rowValue || "")
            .toLowerCase()
            .includes(value.replace(/\*/g, "").toLowerCase());
        }
      }

      return rowValue === value;
    });
  });
};

const applyMockSearchAndSort = (rows, options = {}) => {
  let result = [...rows];

  if (options.search && options.searchFields?.length) {
    const fields = Array.isArray(options.searchFields)
      ? options.searchFields
      : [options.searchFields];
    const query = options.search.toLowerCase();
    result = result.filter((row) =>
      fields.some((field) =>
        String(row[field] || "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }

  if (options.sortBy) {
    const direction = options.sortOrder === "desc" ? -1 : 1;
    result.sort((a, b) => {
      const left = a[options.sortBy];
      const right = b[options.sortBy];
      if (left == null && right == null) return 0;
      if (left == null) return 1;
      if (right == null) return -1;
      if (left > right) return direction;
      if (left < right) return -direction;
      return 0;
    });
  }

  if (options.page && options.pageSize) {
    const from = (options.page - 1) * options.pageSize;
    const to = from + options.pageSize;
    return result.slice(from, to);
  }

  if (options.limit) {
    return result.slice(0, options.limit);
  }

  return result;
};

const createMockRecord = (table, data) => {
  const rows = getMockTable(table);
  const id = data.id || `${table}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    ...data,
    id,
    created_at: data.created_at || createMockTimestamp(),
    updated_at: createMockTimestamp(),
  };
  setMockTable(table, [record, ...rows]);
  return record;
};

const updateMockRecord = (table, id, data, onConflict = "id") => {
  const rows = getMockTable(table);
  let matchIndex = rows.findIndex((row) => row.id === id);

  if (matchIndex === -1 && !id && data?.[onConflict] !== undefined) {
    matchIndex = rows.findIndex((row) => row[onConflict] === data[onConflict]);
  }

  if (matchIndex === -1 && !id && table === "artist_team" && data?.artist_id && data?.user_id) {
    matchIndex = rows.findIndex(
      (row) => row.artist_id === data.artist_id && row.user_id === data.user_id,
    );
  }

  if (matchIndex === -1) {
    return createMockRecord(table, data);
  }

  const updated = {
    ...rows[matchIndex],
    ...data,
    updated_at: createMockTimestamp(),
  };
  rows.splice(matchIndex, 1, updated);
  setMockTable(table, rows);
  return updated;
};

const deleteMockRecord = (table, id) => {
  const rows = getMockTable(table).filter((row) => row.id !== id);
  setMockTable(table, rows);
};

class ApiService {
  constructor() {
    this.timeout = 30000; // 30 second timeout
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  // Generic request handler with retry logic
  async request(operation, retryCount = 0) {
    try {
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), this.timeout),
        ),
      ]);

      if (result.error) {
        throw this.handleSupabaseError(result.error);
      }

      return result;
    } catch (error) {
      if (retryCount < this.retryAttempts && this.shouldRetry(error)) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.request(operation, retryCount + 1);
      }

      throw error;
    }
  }

  // Handle Supabase errors
  handleSupabaseError(error) {
    const errorMap = {
      PGRST301: "Resource not found",
      PGRST116: "Unauthorized access",
      "22P02": "Invalid data format",
      23505: "Resource already exists",
      42501: "Insufficient permissions",
    };

    const message = errorMap[error.code] || error.message || "Database error";

    return {
      code: error.code || "UNKNOWN_ERROR",
      message,
      details: error,
      timestamp: new Date().toISOString(),
    };
  }

  // Determine if an error should trigger a retry
  shouldRetry(error) {
    const retryableCodes = ["NETWORK_ERROR", "TIMEOUT", "SERVICE_UNAVAILABLE"];
    return (
      retryableCodes.includes(error.code) ||
      error.message?.includes("timeout") ||
      error.message?.includes("network")
    );
  }

  // Delay utility for retries
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Query builder for Supabase
  buildQuery(table, options = {}) {
    let query = supabase.from(table);

    // Select columns
    if (options.select) {
      query = query.select(options.select);
    } else {
      query = query.select("*");
    }

    // Apply filters (supports eq/neq/gt/gte/lt/lte/like/ilike/is/in prefixes)
    if (options.filters) {
      const applyOperator = (currentQuery, key, operator, value) => {
        switch (operator) {
          case "eq":
            return currentQuery.eq(key, value);
          case "neq":
            return currentQuery.neq(key, value);
          case "gt":
            return currentQuery.gt(key, value);
          case "gte":
            return currentQuery.gte(key, value);
          case "lt":
            return currentQuery.lt(key, value);
          case "lte":
            return currentQuery.lte(key, value);
          case "like":
            return currentQuery.like(key, value);
          case "ilike":
            return currentQuery.ilike(key, value);
          case "is":
            return currentQuery.is(key, value === "null" ? null : value);
          case "in": {
            const parsed =
              typeof value === "string"
                ? value
                    .replace(/^\(|\)$/g, "")
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean)
                : Array.isArray(value)
                  ? value
                  : [value];
            return currentQuery.in(key, parsed);
          }
          default:
            return currentQuery.eq(key, value);
        }
      };

      query = Object.entries(options.filters).reduce((currentQuery, [key, value]) => {
        if (value === undefined || value === null || value === "") {
          return currentQuery;
        }

        if (Array.isArray(value)) {
          return currentQuery.in(key, value);
        }

        if (typeof value === "object") {
          return Object.entries(value).reduce((nestedQuery, [op, nestedValue]) => {
            if (nestedValue === undefined || nestedValue === null || nestedValue === "") {
              return nestedQuery;
            }
            return applyOperator(nestedQuery, key, op, nestedValue);
          }, currentQuery);
        }

        if (typeof value === "string") {
          if (value.includes("*")) {
            const searchValue = value.replace(/\*/g, "%");
            return currentQuery.like(key, searchValue);
          }

          const prefixedOperator = value.match(/^(eq|neq|gt|gte|lt|lte|like|ilike|is|in)\.(.+)$/);
          if (prefixedOperator) {
            const [, op, rawValue] = prefixedOperator;
            return applyOperator(currentQuery, key, op, rawValue);
          }
        }

        return currentQuery.eq(key, value);
      }, query);
    }

    // Apply search
    if (options.search && options.searchFields) {
      const searchFields = Array.isArray(options.searchFields)
        ? options.searchFields
        : [options.searchFields];

      // Use textSearch for full-text search or ilike for pattern matching
      if (searchFields.length === 1) {
        query = query.ilike(searchFields[0], `%${options.search}%`);
      } else {
        // For multiple fields, we need to use or() with multiple conditions
        const orConditions = searchFields
          .map((field) => `${field}.ilike.%${options.search}%`)
          .join(",");
        query = query.or(orConditions);
      }
    }

    // Apply sorting
    if (options.sortBy) {
      const ascending = options.sortOrder !== "desc";
      query = query.order(options.sortBy, { ascending });
    }

    // Apply pagination
    if (options.page && options.pageSize) {
      const from = (options.page - 1) * options.pageSize;
      const to = from + options.pageSize - 1;
      query = query.range(from, to);
    } else if (options.limit) {
      query = query.limit(options.limit);
    }

    return query;
  }

  // Generic CRUD operations

  // Get all records with optional filtering/sorting/pagination
  async getAll(table, options = {}) {
    if (API_CONFIG.MOCK_MODE) {
      const rows = getMockTable(table);
      const filtered = applyMockFilters(rows, options.filters);
      return { data: applyMockSearchAndSort(filtered, options), error: null };
    }

    return this.request(async () => {
      const query = this.buildQuery(table, options);
      return await query;
    });
  }

  // Get a single record by ID
  async getById(table, id, select = "*") {
    if (API_CONFIG.MOCK_MODE) {
      const rows = getMockTable(table);
      const record = rows.find((row) => row.id === id) || null;
      return { data: record, error: null };
    }

    return this.request(async () => {
      return await supabase.from(table).select(select).eq("id", id).single();
    });
  }

  // Create a new record
  async create(table, data) {
    if (API_CONFIG.MOCK_MODE) {
      return { data: createMockRecord(table, data), error: null };
    }

    return this.request(async () => {
      return await supabase.from(table).insert(data).select().single();
    });
  }

  // Update a record by ID
  async update(table, id, data) {
    if (API_CONFIG.MOCK_MODE) {
      return { data: updateMockRecord(table, id, data), error: null };
    }

    return this.request(async () => {
      return await supabase.from(table).update(data).eq("id", id).select().single();
    });
  }

  // Delete a record by ID
  async delete(table, id) {
    if (API_CONFIG.MOCK_MODE) {
      deleteMockRecord(table, id);
      return { data: null, error: null };
    }

    return this.request(async () => {
      return await supabase.from(table).delete().eq("id", id);
    });
  }

  // Upsert (insert or update) a record
  async upsert(table, data, onConflict = "id") {
    if (API_CONFIG.MOCK_MODE) {
      return { data: updateMockRecord(table, data?.[onConflict], data, onConflict), error: null };
    }

    return this.request(async () => {
      return await supabase.from(table).upsert(data, { onConflict }).select().single();
    });
  }

  // Get count of records
  async getCount(table, options = {}) {
    return this.request(async () => {
      let query = supabase.from(table).select("id", { count: "exact", head: true });

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      return await query;
    });
  }

  // Real-time subscriptions
  createSubscription(table, callback, filter = null) {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          filter: filter,
        },
        callback,
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  }

  // Storage operations
  async uploadFile(bucket, file, path = null, options = {}) {
    const resolvedOptions = {
      cacheControl: "3600",
      upsert: false,
      publicUrl: true,
      signedUrlExpires: 60 * 60,
      ...options,
    };

    if (API_CONFIG.MOCK_MODE) {
      const fileExt = file.name.split(".").pop();
      const fileName =
        path || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const publicUrl =
        typeof URL !== "undefined" && URL.createObjectURL
          ? URL.createObjectURL(file)
          : `https://mock-storage.example.com/${encodeURIComponent(fileName)}`;
      return {
        data: { path: fileName },
        publicUrl,
        signedUrl: publicUrl,
        url: publicUrl,
        error: null,
      };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = path || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    return this.request(async () => {
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: resolvedOptions.cacheControl,
        upsert: resolvedOptions.upsert,
      });

      if (error) throw error;

      let publicUrl = null;
      let signedUrl = null;

      if (resolvedOptions.publicUrl) {
        const {
          data: { publicUrl: nextPublicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(fileName);
        publicUrl = nextPublicUrl;
      } else {
        const { data: signedData, error: signedError } = await supabase
          .storage
          .from(bucket)
          .createSignedUrl(fileName, resolvedOptions.signedUrlExpires);

        if (signedError) throw signedError;
        signedUrl = signedData?.signedUrl || null;
      }

      return {
        ...data,
        path: fileName,
        publicUrl,
        signedUrl,
        url: signedUrl || publicUrl,
      };
    });
  }

  async deleteFile(bucket, path) {
    if (API_CONFIG.MOCK_MODE) {
      return { data: null, error: null };
    }

    return this.request(async () => {
      return await supabase.storage.from(bucket).remove([path]);
    });
  }

  getFileUrl(bucket, path) {
    if (API_CONFIG.MOCK_MODE) {
      return `https://mock-storage.example.com/${encodeURIComponent(path)}`;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    return publicUrl;
  }

  // Domain-specific API methods

  // Profile methods
  async getProfile(userId = null) {
    if (API_CONFIG.MOCK_MODE) {
      const { data } = await this.getById("user_profiles", userId || "mock-user-123");
      return { data, error: null };
    }

    const targetUserId = userId || (await this.getCurrentUser())?.id;
    if (!targetUserId) return { data: null, error: { message: "No user found" } };

    return this.getById("profiles", targetUserId);
  }

  async updateProfile(userId, data) {
    return this.update("profiles", userId, data);
  }

  // Artist methods
  async getArtistsByUser(userId = null) {
    if (API_CONFIG.MOCK_MODE) {
      return { data: getMockTable("artists"), error: null };
    }

    const targetUserId = userId || (await this.getCurrentUser())?.id;
    if (!targetUserId) return { data: [], error: null };

    return this.request(async () => {
      return await supabase
        .from("artists")
        .select(
          `
          *,
          artist_team!inner(role)
        `,
        )
        .eq("artist_team.user_id", targetUserId);
    });
  }

  async getArtistTeam(artistId) {
    if (API_CONFIG.MOCK_MODE) {
      return {
        data: getMockTable("artist_team").filter((member) => member.artist_id === artistId),
        error: null,
      };
    }

    return this.request(async () => {
      return await supabase
        .from("artist_team")
        .select(
          `
          *,
          profiles(id, full_name, email, avatar_url)
        `,
        )
        .eq("artist_id", artistId);
    });
  }

  // Media methods
  async getArtistMedia(artistId, options = {}) {
    return this.getAll("media", {
      ...options,
      filters: { artist_id: artistId, ...options.filters },
    });
  }

  async uploadArtistMedia(artistId, file, metadata = {}) {
    try {
      const scopedPath = this.createMediaStoragePath({
        artistId,
        fileName: file.name,
        destination: metadata.destination || metadata.folder || "library",
      });

      // Upload file to storage
      const { data: uploadData, publicUrl, signedUrl, url } = await this.uploadFile(
        "media",
        file,
        scopedPath,
        {
          publicUrl: false,
          signedUrlExpires: metadata.signedUrlExpires || 60 * 60 * 24 * 7,
        },
      );

      // Create media record in database
      const mediaData = {
        artist_id: artistId,
        title: metadata.title || file.name,
        description: metadata.description || "",
        file_path: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
        media_type: this.getMediaType(file.type || ""),
        metadata: {
          ...metadata.audioMetadata,
          destination: metadata.destination || metadata.folder || "library",
          source: metadata.source || "web",
        },
        tags: Array.isArray(metadata.tags) ? metadata.tags : undefined,
        is_public: Boolean(metadata.isPublic),
        uploaded_by: (await this.getCurrentUser())?.id,
      };

      if (mediaData.tags === undefined) {
        delete mediaData.tags;
      }

      const { data: media, error } = await this.create("media", mediaData);

      if (error) throw error;

      return {
        data: {
          ...media,
          publicUrl: publicUrl || null,
          signedUrl: signedUrl || null,
          url: url || publicUrl || null,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  createMediaStoragePath({ artistId, fileName, destination = "library" }) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const ext = fileName.includes(".") ? fileName.split(".").pop() : "bin";
    const baseName = fileName.replace(/\.[^.]+$/, "");
    const safeName = baseName
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "upload";
    const safeDestination = String(destination)
      .toLowerCase()
      .replace(/[^a-z0-9/_-]+/g, "-")
      .replace(/\/+/g, "/")
      .replace(/-+/g, "-")
      .replace(/^\/|\/$/g, "") || "library";

    return `${String(artistId).toLowerCase()}/${year}/${month}/${safeDestination}/${Date.now()}-${safeName}.${ext}`;
  }

  // Calendar methods
  async getArtistEvents(artistId, options = {}) {
    return this.getAll("events", {
      ...options,
      filters: { artist_id: artistId, ...options.filters },
    });
  }

  // Notes methods
  async getArtistNotes(artistId, options = {}) {
    return this.getAll("notes", {
      ...options,
      filters: { artist_id: artistId, ...options.filters },
      sortBy: options.sortBy || "position",
    });
  }

  async updateNotePosition(noteId, position) {
    return this.update("notes", noteId, { position });
  }

  // Moodboard methods
  async getArtistMoodboardItems(artistId, options = {}) {
    return this.getAll("moodboard_items", {
      ...options,
      filters: { artist_id: artistId, ...options.filters },
      sortBy: options.sortBy || "z_index",
    });
  }

  // Timeline methods
  async getArtistTimelineEvents(artistId, options = {}) {
    return this.getAll("timeline_events", {
      ...options,
      filters: { artist_id: artistId, ...options.filters },
      sortBy: options.sortBy || "event_date",
    });
  }

  // Playlist methods
  async getArtistPlaylists(artistId, options = {}) {
    return this.getAll("playlists", {
      ...options,
      filters: { artist_id: artistId, ...options.filters },
    });
  }

  // Team management methods
  async inviteTeamMember(artistId, email, role = "viewer") {
    if (API_CONFIG.MOCK_MODE) {
      return this.create("artist_team", {
        artist_id: artistId,
        user_id: `${email}-${Date.now()}`,
        email,
        role,
        invited_by: "mock-user-123",
        accepted_at: createMockTimestamp(),
      });
    }

    try {
      // First check if user exists
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id, user_id")
        .eq("email", email)
        .single();

      if (existingUser) {
        // Add to team directly
        return await this.create("artist_team", {
          artist_id: artistId,
          user_id: existingUser.user_id,
          role,
          invited_by: (await this.getCurrentUser())?.id,
          accepted_at: new Date().toISOString(),
        });
      } else {
        // Create invitation record (to be implemented with email service)
        return {
          data: null,
          error: { message: "User not found. Email invitation not yet implemented." },
        };
      }
    } catch (error) {
      return { data: null, error };
    }
  }

  async removeTeamMember(artistId, userId) {
    if (API_CONFIG.MOCK_MODE) {
      const rows = getMockTable("artist_team").filter(
        (row) => !(row.artist_id === artistId && row.user_id === userId),
      );
      setMockTable("artist_team", rows);
      return { data: null, error: null };
    }

    return this.request(async () => {
      return await supabase
        .from("artist_team")
        .delete()
        .eq("artist_id", artistId)
        .eq("user_id", userId);
    });
  }

  async updateTeamMemberRole(artistId, userId, role) {
    if (API_CONFIG.MOCK_MODE) {
      const record = updateMockRecord("artist_team", null, {
        artist_id: artistId,
        user_id: userId,
        role,
      });
      return { data: record, error: null };
    }

    return this.request(async () => {
      return await supabase
        .from("artist_team")
        .update({ role })
        .eq("artist_id", artistId)
        .eq("user_id", userId)
        .select()
        .single();
    });
  }

  // Utility methods
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      // Mock/demo mode often runs without a persisted Supabase session.
      if (
        error.name === "AuthSessionMissingError" ||
        error.message?.includes("Auth session missing")
      ) {
        return null;
      }
      throw error;
    }
    return user;
  }

  getMediaType(mimeType) {
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("image/")) return "image";
    return "document";
  }

  // Activity logging
  async logActivity(artistId, action, metadata = {}) {
    try {
      // This could be implemented with a separate activity table
      console.log("Activity logged:", { artistId, action, metadata });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }
}

export const apiService = new ApiService();
export default apiService;
