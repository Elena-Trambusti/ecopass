(() => {
  try {
    const badges = document.querySelectorAll(".ecopass-badge");
    badges.forEach((badge) => {
      // Migliora accessibilita': evita layout shift su contenuti lunghi.
      badge.setAttribute("role", "note");
      badge.setAttribute("aria-label", "Informazioni sostenibilita prodotto");
    });
  } catch (error) {
    // Fail-safe: nessun errore JS deve bloccare la pagina prodotto.
    console.error("EcoPass badge init error", error);
  }
})();
