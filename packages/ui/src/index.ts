export interface TabOptions {
  buttons: HTMLButtonElement[];
  panels: HTMLElement[];
  selectedId: string;
  onSelect?: (id: string) => void;
}

export function activateTabs(options: TabOptions): (id: string, focus?: boolean) => void {
  const select = (id: string, focus = false) => {
    const selectedIndex = options.buttons.findIndex((button) => button.dataset.target === id);
    if (selectedIndex < 0) return;
    options.buttons.forEach((button, index) => {
      const active = index === selectedIndex;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    });
    options.panels.forEach((panel) => {
      panel.hidden = panel.id !== id;
    });
    options.onSelect?.(id);
  };

  options.buttons.forEach((button, index) => {
    button.addEventListener("click", () => select(button.dataset.target ?? ""));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const last = options.buttons.length - 1;
      const next = event.key === "Home" ? 0 : event.key === "End" ? last : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (index - 1 + options.buttons.length) % options.buttons.length : (index + 1) % options.buttons.length;
      const targetId = options.buttons[next]?.dataset.target;
      if (targetId) select(targetId, true);
    });
  });

  select(options.selectedId);
  return select;
}
