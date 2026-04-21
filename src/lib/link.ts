export function getLinkDisplayName(url: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("github.com")) {
    return "GitHub";
  }
  if (lowerUrl.includes("linkedin.com")) {
    return "LinkedIn";
  }
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
    return "Twitter";
  }
  if (lowerUrl.includes("facebook.com")) {
    return "Facebook";
  }
  if (lowerUrl.includes("instagram.com")) {
    return "Instagram";
  }
  if (lowerUrl.includes("t.me") || lowerUrl.includes("telegram.me")) {
    return "Telegram";
  }
  if (lowerUrl.includes("bsky.app")) {
    return "Bluesky";
  }
  try {
    const hostname = new URL(url.startsWith("http") ? url : `https://${url}`)
      .hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function getLinkIcon(url: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("github.com")) {
    return "github";
  }
  if (lowerUrl.includes("linkedin.com")) {
    return "linkedin";
  }
  if (lowerUrl.includes("bsky.app")) {
    return "bluesky";
  }
  if (lowerUrl.includes("t.me") || lowerUrl.includes("telegram.me")) {
    return "telegram";
  }
  return "website";
}

export const normalizeUrl = (url: string) => {
  url = url.trim();
  if (url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
};
