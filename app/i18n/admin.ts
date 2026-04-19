export type AdminLocale = "it" | "en";

export function adminCopy(locale: AdminLocale) {
  const it = {
    pageTitle: "EcoPass — Badge DPP",
    langSwitchEn: "English",
    langSwitchIt: "Italiano",
    billingWarningTitle: "Billing API non disponibile in questo ambiente",
    billingWarningBody:
      "L'app non è ancora in distribuzione pubblica: Shopify blocca i test Billing API in questa fase. App e dashboard restano utilizzabili in sviluppo.",
    billingIssueTitle: "Problema di fatturazione",
    planActive:
      "Piano attivo: EcoPass Pro — {price} EUR ogni {cycle} giorni, prova gratuita di {trial} giorni.",
    billingCardIt: "Termini di fatturazione (IT)",
    billingCardEn: "Billing terms (EN)",
    billingBodyItA: "EcoPass Pro costa {price} EUR ogni {cycle} giorni dopo una prova gratuita di {trial} giorni.",
    billingBodyItB: "Il piano si rinnova automaticamente finché non viene annullato dal merchant tramite Shopify Admin.",
    billingBodyItC:
      "L'annullamento interrompe i rinnovi futuri; eventuali periodi già pagati restano attivi fino a scadenza.",
    billingBodyEnA:
      "EcoPass Pro is billed at EUR {price} every {cycle} days after a {trial}-day free trial.",
    billingBodyEnB: "The subscription renews automatically until canceled by the merchant in Shopify Admin.",
    billingBodyEnC:
      "Cancellation stops future renewals; any already-paid period remains active until its end date.",
    appearance: "Aspetto badge",
    colorBadge: "Colore badge (HEX)",
    colorText: "Colore testo (HEX)",
    radius: "Raggio angoli",
    fontSize: "Dimensione font",
    enableGlobal: "Attiva badge globalmente",
    save: "Salva impostazioni",
    preview: "Anteprima",
    previewOn: "DPP EcoPass pronto",
    previewOff: "Badge disattivato: non verrà visualizzato nello storefront.",
    fallbacksTitle: "Dati mancanti in vetrina",
    fallbacksHelp:
      "Se attivo, EcoPass può mostrare stime quando i metafield prodotto non sono compilati. Se disattivo, niente stime: solo dati reali o messaggio incompleto.",
    fallbacksLabel: "Mostra stime quando mancano i metafield",
    productsTitle: "Prodotti e stato DPP (pagina)",
    productsHelp:
      "La compilazione automatica dei metafield non parte più da sola ad ogni caricamento: usa il pulsante qui sotto per questa pagina.",
    colProduct: "Prodotto",
    colMaterials: "Materiali",
    colCarbon: "CO₂",
    colRecycle: "Ricicl.",
    colStatus: "Stato",
    statusComplete: "Completo",
    statusPartial: "Parziale",
    statusEmpty: "Vuoto",
    syncPage: "Completa dati automatici (questa pagina)",
    paginationNext: "Pagina successiva",
    paginationPrev: "Pagina precedente",
    paginationStart: "Prima pagina",
    syncDone: "Metafield aggiornati per i prodotti di questa pagina.",
    saved: "Impostazioni salvate con successo.",
    errValidation: "Controlla i campi evidenziati.",
    errSave: "Errore di rete o database. Riprova tra pochi secondi.",
  };

  const en = {
    pageTitle: "EcoPass — DPP badge",
    langSwitchEn: "English",
    langSwitchIt: "Italian",
    billingWarningTitle: "Billing API unavailable in this environment",
    billingWarningBody:
      "This app is not on public distribution yet: Shopify restricts Billing API in this phase. The app and dashboard remain usable for development.",
    billingIssueTitle: "Billing issue",
    planActive:
      "Active plan: EcoPass Pro — {price} EUR every {cycle} days, {trial}-day free trial.",
    billingCardIt: "Billing terms (IT)",
    billingCardEn: "Billing terms (EN)",
    billingBodyItA: "EcoPass Pro costs {price} EUR every {cycle} days after a {trial}-day free trial.",
    billingBodyItB: "The plan renews automatically until the merchant cancels it in Shopify Admin.",
    billingBodyItC:
      "Cancellation stops future renewals; any paid period already started stays active until it ends.",
    billingBodyEnA:
      "EcoPass Pro is billed at EUR {price} every {cycle} days after a {trial}-day free trial.",
    billingBodyEnB: "The subscription renews automatically until canceled in Shopify Admin.",
    billingBodyEnC:
      "Cancellation stops future renewals; any already-paid period remains active until its end date.",
    appearance: "Badge appearance",
    colorBadge: "Badge colour (HEX)",
    colorText: "Text colour (HEX)",
    radius: "Corner radius",
    fontSize: "Font size",
    enableGlobal: "Enable badge globally",
    save: "Save settings",
    preview: "Preview",
    previewOn: "EcoPass DPP preview",
    previewOff: "Badge disabled: it will not show on the storefront.",
    fallbacksTitle: "Missing storefront data",
    fallbacksHelp:
      "When enabled, EcoPass may show estimates when product metafields are empty. When disabled, no estimates—only real data or an incomplete notice.",
    fallbacksLabel: "Show estimates when metafields are missing",
    productsTitle: "Products & DPP status (page)",
    productsHelp:
      "Automatic metafields no longer run on every page load—use the button below for the current page.",
    colProduct: "Product",
    colMaterials: "Materials",
    colCarbon: "CO₂",
    colRecycle: "Recycl.",
    colStatus: "Status",
    statusComplete: "Complete",
    statusPartial: "Partial",
    statusEmpty: "Empty",
    syncPage: "Fill missing data automatically (this page)",
    paginationNext: "Next page",
    paginationPrev: "Previous page",
    paginationStart: "First page",
    syncDone: "Metafields updated for products on this page.",
    saved: "Settings saved successfully.",
    errValidation: "Please fix the highlighted fields.",
    errSave: "Network or database error. Try again shortly.",
  };

  return locale === "en" ? en : it;
}

export function interpolate(
  template: string,
  vars: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
