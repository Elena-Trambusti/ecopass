import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader(_args: LoaderFunctionArgs) {
  const html = `<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EcoPass — Termini di servizio / Terms of Service</title>
    <style>
      body { font-family: system-ui, Arial, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 16px; line-height: 1.6; color: #1f2937; }
      h1, h2 { color: #0f766e; }
      a { color: #0f766e; }
      hr.sep { margin: 3rem 0; border: none; border-top: 2px solid #e5e7eb; }
      .meta { color: #6b7280; font-size: 0.95rem; }
    </style>
  </head>
  <body>
    <nav><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a></nav>
    <h1>Termini di servizio / Terms of Service</h1>
    <p class="meta"><strong>Ultimo aggiornamento / Last updated:</strong> 2026-04-19</p>

    <section id="it" lang="it">
      <h2>Italiano</h2>
      <h3>1. Servizio</h3>
      <p>EcoPass è un'app Shopify che consente ai merchant di configurare e mostrare un badge Digital Product Passport sulle pagine prodotto.</p>
      <h3>2. Requisiti</h3>
      <p>Devi avere autorità per vincolare la tua attività e un negozio Shopify valido.</p>
      <h3>3. Fatturazione</h3>
      <ul>
        <li>Piano: EcoPass Pro — EUR 14,99 ogni 30 giorni</li>
        <li>Piano annuale: EcoPass Pro Annual — EUR 179,00/anno</li>
        <li>Prova: 7 giorni</li>
        <li>Rinnovo: automatico fino a disinstallazione o annullamento nell'Admin Shopify</li>
      </ul>
      <p>L'annullamento ferma i rinnovi futuri. L'accesso resta disponibile fino alla fine del periodo già pagato.</p>
      <h3>4. Obblighi del merchant</h3>
      <ul>
        <li>Fornire dati di negozio e prodotto accurati.</li>
        <li>Usare l'app nel rispetto delle leggi applicabili e delle policy Shopify.</li>
        <li>Mantenere sicure credenziali e accessi interni.</li>
      </ul>
      <h3>5. Uso consentito</h3>
      <p>Non devi usare EcoPass per distribuire contenuti illeciti, fuorvianti o dannosi.</p>
      <h3>6. Disponibilità e modifiche</h3>
      <p>EcoPass può evolvere nel tempo. Funzioni, prezzi o documentazione possono essere modificati con preavviso ragionevole.</p>
      <h3>7. Esclusioni di garanzia</h3>
      <p>EcoPass è fornita «così com'è» e «secondo disponibilità», nei limiti consentiti dalla legge.</p>
      <h3>8. Limitazione di responsabilità</h3>
      <p>Nei limiti consentiti dalla legge, EcoPass non è responsabile per danni indiretti, incidentali o consequenziali.</p>
      <h3>9. Risoluzione</h3>
      <p>Puoi interrompere l'uso disinstallando l'app. Possiamo sospendere l'accesso in caso di frode, abuso o obbligo di legge.</p>
      <h3>10. Contatto</h3>
      <p>Email: <a href="mailto:support@ecopass.app">support@ecopass.app</a></p>
    </section>

    <hr class="sep" />

    <section id="en" lang="en">
      <h2>English</h2>
      <h3>1. Service</h3>
      <p>EcoPass is a Shopify app that lets merchants configure and display a Digital Product Passport badge on product pages.</p>
      <h3>2. Eligibility</h3>
      <p>You must have authority to bind your business and operate a valid Shopify store.</p>
      <h3>3. Billing</h3>
      <ul>
        <li>Plan: EcoPass Pro — EUR 14.99 every 30 days</li>
        <li>Annual plan: EcoPass Pro Annual — EUR 179.00/year</li>
        <li>Trial: 7 days</li>
        <li>Renewal: automatic until canceled in Shopify Admin</li>
      </ul>
      <p>Cancellation stops future renewals. Access continues until the end of the current paid period.</p>
      <h3>4. Merchant responsibilities</h3>
      <ul>
        <li>Provide accurate store and product data.</li>
        <li>Use the app in compliance with applicable laws and Shopify policies.</li>
        <li>Keep store credentials and internal access secure.</li>
      </ul>
      <h3>5. Acceptable use</h3>
      <p>You must not use EcoPass to distribute unlawful, misleading, or malicious content.</p>
      <h3>6. Availability and changes</h3>
      <p>EcoPass may evolve. Features, pricing, or documentation may change with reasonable notice where required.</p>
      <h3>7. Disclaimer</h3>
      <p>EcoPass is provided on an "as is" and "as available" basis, to the maximum extent permitted by law.</p>
      <h3>8. Limitation of liability</h3>
      <p>To the maximum extent permitted by law, EcoPass is not liable for indirect, incidental, or consequential damages.</p>
      <h3>9. Termination</h3>
      <p>You may stop using EcoPass by uninstalling the app. We may suspend access for fraud, abuse, or legal necessity.</p>
      <h3>10. Contact</h3>
      <p>Email: <a href="mailto:support@ecopass.app">support@ecopass.app</a></p>
    </section>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
