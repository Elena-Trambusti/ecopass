import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader(_args: LoaderFunctionArgs) {
  const html = `<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EcoPass — Informativa privacy / Privacy Policy</title>
    <style>
      body { font-family: system-ui, Arial, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 16px; line-height: 1.6; color: #1f2937; }
      h1, h2 { color: #0f766e; }
      a { color: #0f766e; }
      hr.sep { margin: 3rem 0; border: none; border-top: 2px solid #e5e7eb; }
      nav.lang { margin-bottom: 1.5rem; font-size: 0.95rem; }
      .meta { color: #6b7280; font-size: 0.95rem; }
    </style>
  </head>
  <body>
    <nav class="lang"><a href="#it">Italiano</a> · <a href="#en">English</a></nav>
    <h1>Informativa sulla privacy / Privacy Policy</h1>
    <p class="meta"><strong>Ultimo aggiornamento / Last updated:</strong> 2026-04-19</p>

    <section id="it" lang="it">
      <h2>Italiano</h2>
      <p>EcoPass aiuta i merchant a mostrare informazioni di sostenibilità sui prodotti tramite un'app incorporata nell'admin Shopify e un'estensione tema.</p>

      <h3>Dati che trattiamo</h3>
      <ul>
        <li>Identificativo del negozio e dominio.</li>
        <li>Dati di sessione dell'app necessari all'autenticazione Shopify.</li>
        <li>Impostazioni EcoPass configurate dal merchant (colori badge, dimensioni font, abilitazione badge).</li>
        <li>Metafield di prodotto usati per il Digital Product Passport.</li>
      </ul>

      <h3>Finalità</h3>
      <ul>
        <li>Autenticare i merchant e mantenere sessioni Shopify sicure.</li>
        <li>Salvare le impostazioni dell'app.</li>
        <li>Popolare e mostrare i dati del badge nei temi del negozio.</li>
        <li>Garantire affidabilità operativa e log di sicurezza necessari.</li>
      </ul>

      <h3>Base giuridica</h3>
      <p>Il trattamento è necessario per fornire il servizio EcoPass richiesto dal merchant e per adempiere ai requisiti della piattaforma Shopify.</p>

      <h3>Conservazione</h3>
      <ul>
        <li>I dati di sessione sono conservati solo per il tempo necessario al funzionamento dell'app.</li>
        <li>Impostazioni e record del negozio associati all'app sono rimossi alla disinstallazione (tramite webhook).</li>
        <li>Sono supportati i webhook privacy richiesti da Shopify per richieste e rettifiche dati.</li>
      </ul>

      <h3>Condivisione</h3>
      <p>EcoPass non vende dati di merchant o clienti. I dati sono trattati solo per fornire le funzionalità dell'app e possono essere trattati presso fornitori di infrastruttura strettamente necessari al servizio.</p>

      <h3>Trasferimenti internazionali</h3>
      <p>Se i dati sono trattati fuori dalla giurisdizione del merchant, EcoPass applica misure contrattuali e tecniche adeguate.</p>

      <h3>Sicurezza</h3>
      <ul>
        <li>I segreti non sono nel codice sorgente pubblico.</li>
        <li>L'accesso è limitato a operatori autorizzati.</li>
        <li>I log operativi sono limitati a quanto necessario per affidabilità e diagnosi.</li>
      </ul>

      <h3>Diritti e richieste</h3>
      <p>I merchant possono contattare il supporto per esercitare i diritti in materia di privacy. Sono rispettati i webhook Shopify per richiesta dati cliente, cancellazione/redazione cliente e redazione negozio.</p>

      <h3>Contatto</h3>
      <p>Email: <a href="mailto:support@ecopass.app">support@ecopass.app</a></p>
    </section>

    <hr class="sep" />

    <section id="en" lang="en">
      <h2>English</h2>
      <p>EcoPass helps merchants display product sustainability information through an embedded Shopify admin app and a Theme App Extension.</p>

      <h3>Data we process</h3>
      <ul>
        <li>Shop identifier and domain.</li>
        <li>App session data required for Shopify authentication.</li>
        <li>EcoPass settings configured by the merchant (badge colours, font size, badge enablement).</li>
        <li>Product metafields used for Digital Product Passport display.</li>
      </ul>

      <h3>Purposes</h3>
      <ul>
        <li>Authenticate merchants and maintain secure Shopify sessions.</li>
        <li>Save merchant app settings.</li>
        <li>Populate and render sustainability badge data in storefront themes.</li>
        <li>Maintain operational reliability and necessary security logs.</li>
      </ul>

      <h3>Legal basis</h3>
      <p>Processing is necessary to provide the EcoPass service requested by the merchant and to meet Shopify platform requirements.</p>

      <h3>Retention</h3>
      <ul>
        <li>Session data is kept only as long as needed for active app operation.</li>
        <li>App settings and related shop records are removed when the app is uninstalled (webhook-driven cleanup).</li>
        <li>Shopify mandatory privacy webhooks are supported for data request and redaction workflows.</li>
      </ul>

      <h3>Sharing</h3>
      <p>EcoPass does not sell merchant or customer data. Data is processed solely to deliver app functionality and may be processed by infrastructure providers strictly required to operate the service.</p>

      <h3>International transfers</h3>
      <p>Where data is processed outside the merchant's jurisdiction, EcoPass applies appropriate contractual and technical safeguards.</p>

      <h3>Security</h3>
      <ul>
        <li>Secrets are not stored in public source control.</li>
        <li>Access is limited to authorized operators.</li>
        <li>Operational logging is limited to troubleshooting and reliability needs.</li>
      </ul>

      <h3>Rights and requests</h3>
      <p>Merchants may contact support to exercise privacy rights. Shopify privacy webhooks are honored for customer data request, customer redaction, and shop redaction.</p>

      <h3>Contact</h3>
      <p>Email: <a href="mailto:support@ecopass.app">support@ecopass.app</a></p>
    </section>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
