/** Dimension presets shared by the Image Resizer and Social Media Image Resizer. */

export interface SizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  note?: string;
}

export interface PlatformPresets {
  id: string;
  label: string;
  presets: SizePreset[];
}

/** General-purpose presets for the plain Image Resizer. */
export const generalPresets: SizePreset[] = [
  { id: "profile", label: "Profile picture", width: 400, height: 400, note: "Square avatar" },
  { id: "thumb", label: "Thumbnail", width: 300, height: 300 },
  { id: "web-small", label: "Website image (small)", width: 800, height: 600 },
  { id: "web-large", label: "Website image (large)", width: 1600, height: 900 },
  { id: "hd", label: "HD 1080p", width: 1920, height: 1080 },
  { id: "4k", label: "4K UHD", width: 3840, height: 2160 },
  { id: "ig-square", label: "Instagram post", width: 1080, height: 1080 },
  { id: "fb-post", label: "Facebook post", width: 1200, height: 630 },
  { id: "li-post", label: "LinkedIn post", width: 1200, height: 627 },
  { id: "yt-thumb", label: "YouTube thumbnail", width: 1280, height: 720 },
  { id: "x-post", label: "X post image", width: 1600, height: 900 },
];

/**
 * Platform presets follow each network's currently published recommendations.
 * Specs change occasionally — the dimensions are shown in the UI so people can
 * see exactly what they are exporting.
 */
export const platformPresets: PlatformPresets[] = [
  {
    id: "instagram",
    label: "Instagram",
    presets: [
      { id: "ig-profile", label: "Profile picture", width: 320, height: 320, note: "1:1" },
      { id: "ig-square", label: "Square post", width: 1080, height: 1080, note: "1:1" },
      { id: "ig-portrait", label: "Portrait post", width: 1080, height: 1350, note: "4:5" },
      { id: "ig-landscape", label: "Landscape post", width: 1080, height: 566, note: "1.91:1" },
      { id: "ig-story", label: "Story", width: 1080, height: 1920, note: "9:16" },
      { id: "ig-reel", label: "Reel", width: 1080, height: 1920, note: "9:16" },
    ],
  },
  {
    id: "facebook",
    label: "Facebook",
    presets: [
      { id: "fb-profile", label: "Profile picture", width: 320, height: 320, note: "1:1" },
      { id: "fb-cover", label: "Page cover", width: 1640, height: 856, note: "1.91:1" },
      { id: "fb-post", label: "Shared post", width: 1200, height: 630, note: "1.91:1" },
      { id: "fb-story", label: "Story", width: 1080, height: 1920, note: "9:16" },
      { id: "fb-event", label: "Event cover", width: 1920, height: 1005, note: "1.91:1" },
    ],
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    presets: [
      { id: "li-profile", label: "Profile picture", width: 400, height: 400, note: "1:1" },
      { id: "li-banner", label: "Personal banner", width: 1584, height: 396, note: "4:1" },
      { id: "li-company", label: "Company cover", width: 1128, height: 191, note: "5.9:1" },
      { id: "li-post", label: "Post image", width: 1200, height: 627, note: "1.91:1" },
      { id: "li-logo", label: "Company logo", width: 300, height: 300, note: "1:1" },
    ],
  },
  {
    id: "youtube",
    label: "YouTube",
    presets: [
      { id: "yt-thumb", label: "Video thumbnail", width: 1280, height: 720, note: "16:9" },
      { id: "yt-channel", label: "Channel art", width: 2560, height: 1440, note: "16:9" },
      { id: "yt-profile", label: "Profile picture", width: 800, height: 800, note: "1:1" },
      { id: "yt-short", label: "Shorts cover", width: 1080, height: 1920, note: "9:16" },
    ],
  },
  {
    id: "x",
    label: "X / Twitter",
    presets: [
      { id: "x-profile", label: "Profile picture", width: 400, height: 400, note: "1:1" },
      { id: "x-header", label: "Header", width: 1500, height: 500, note: "3:1" },
      { id: "x-post", label: "Post image", width: 1600, height: 900, note: "16:9" },
    ],
  },
  {
    id: "tiktok",
    label: "TikTok",
    presets: [
      { id: "tt-profile", label: "Profile picture", width: 200, height: 200, note: "1:1" },
      { id: "tt-video", label: "Video / cover", width: 1080, height: 1920, note: "9:16" },
    ],
  },
  {
    id: "pinterest",
    label: "Pinterest",
    presets: [
      { id: "pin-profile", label: "Profile picture", width: 280, height: 280, note: "1:1" },
      { id: "pin-standard", label: "Standard pin", width: 1000, height: 1500, note: "2:3" },
      { id: "pin-square", label: "Square pin", width: 1000, height: 1000, note: "1:1" },
      { id: "pin-long", label: "Long pin", width: 1000, height: 2100, note: "1:2.1" },
    ],
  },
];
