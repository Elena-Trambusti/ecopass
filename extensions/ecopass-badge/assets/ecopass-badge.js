(() => {
  try {
    const badges = document.querySelectorAll(".ecopass-badge");
    badges.forEach((badge) => {
      const aria = badge.getAttribute("data-ecopass-aria");
      if (aria) {
        badge.setAttribute("aria-label", aria);
      }
      badge.setAttribute("role", "region");
    });
  } catch (error) {
    console.error("EcoPass badge init error", error);
  }
})();
