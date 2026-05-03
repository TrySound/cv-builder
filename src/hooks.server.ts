export const handle = async ({ event, resolve }) => {
  const theme = event.cookies.get("theme");
  // check values to prevent script injection
  if (theme === "light" || theme === "dark") {
    return resolve(event, {
      transformPageChunk({ html }) {
        return html.replace(`data-theme="system"`, `data-theme="${theme}"`);
      },
    });
  }
  return resolve(event);
};
