const GENERATED_AVATAR_PATTERN = /ui-avatars\.com\/api\//i;

export const isGeneratedAvatar = (url = "") => GENERATED_AVATAR_PATTERN.test(String(url || ""));

export const hasCustomAvatar = (url = "") => Boolean(url) && !isGeneratedAvatar(url);

export const getInitials = (name = "") => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
};
