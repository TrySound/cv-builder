export function formatDate(dateString: string | undefined): string {
  if (!dateString) {
    return "";
  }
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(dateString: string | undefined): string {
  if (!dateString) {
    return "";
  }
  // render year as is
  if (dateString.length === 4) {
    return dateString;
  }
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}
