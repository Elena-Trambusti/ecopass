# EcoPass Privacy Policy (Draft)

Last updated: 2026-04-18

EcoPass helps merchants display product sustainability information through an embedded Shopify admin app and a theme app extension.

## Data We Process

- Shop identifier and domain.
- App session data needed for Shopify authentication.
- EcoPass settings configured by the merchant (badge color, text color, font settings, badge enablement).
- Product metafields used for Digital Product Passport display (`custom.materiali`, `custom.carbon_footprint`, `custom.riciclabilit` and legacy `ecopass.*` keys).

## Purpose of Processing

- Authenticate merchants and keep secure Shopify sessions.
- Save merchant app settings.
- Populate and render sustainability badge data in storefront themes.
- Maintain operational reliability and security logs.

## Legal Basis

Processing is necessary to provide the EcoPass service requested by the merchant and to comply with Shopify platform requirements.

## Data Retention

- Session data is retained only as long as needed for active app operation.
- App settings and related shop records are removed when the app is uninstalled (via webhook-driven cleanup).
- Shopify-required privacy webhooks are supported for data request/redaction workflows.

## Data Sharing

EcoPass does not sell merchant or customer data. Data is only processed to provide app functionality and may be shared with infrastructure providers strictly required to operate the service.

## International Transfers

If data is processed outside the merchant jurisdiction, EcoPass applies appropriate contractual and technical safeguards.

## Security Measures

- Environment secrets are stored outside source control.
- Access is restricted to authorized operators.
- Error and operational logging is limited to what is required for troubleshooting and reliability.

## Merchant Rights and Requests

Merchants can contact support to exercise privacy rights. Shopify privacy webhooks are honored for:

- Customer data request
- Customer redaction
- Shop redaction

## Contact

Support email: support@ecopass.app

