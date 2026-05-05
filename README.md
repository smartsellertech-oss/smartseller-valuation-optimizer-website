# SmartSeller — Valuation Optimizer Website

Landing page completa para o **SmartSeller Valuation Optimizer** — consultoria de otimização de valuation para founders de SaaS e e-commerce nos mercados dos EUA e UK.

## Arquivos

| Arquivo | Descrição |
|---|---|
| `index.html` | Site completo (4 páginas + página de agendamento + página de agradecimento) |
| `backend.js` | Backend Node.js para envio de e-mail via SMTP |
| `package.json` | Dependências do backend |
| `google-apps-script.js` | Script para Google Sheets (Apps Script Web App) |
| `.env.example` | Variáveis de ambiente necessárias para o backend |
| `SETUP.md` | Guia completo de configuração das integrações |

## Páginas do site

- `/` — Home (Valuation Optimizer)
- `/saas` — SaaS Valuation Optimization
- `/ecommerce` — E-commerce Valuation Optimization
- `/calculator` — Simulador interativo de valuation
- `/book` — Agendamento de Discovery Call (Google Calendar integrado)
- `/thanks` — Página de agradecimento pós-agendamento

## Integrações

- **Google Sheets** via Apps Script Web App
- **E-mail** via SMTP próprio (backend Node.js)
- **Google Calendar** — agendamento integrado
- **LinkedIn Insight Tag** — tracking de conversões (Partner ID: 9239641)
- **Meta Pixel + Conversions API** — Pixel ID: 971637128917888
- **Google Ads** — Conversion ID: AW-16510702125

## Configuração rápida

Ver `SETUP.md` para instruções detalhadas.

### Backend (email)
```bash
npm install
cp .env.example .env
# Editar .env com credenciais SMTP
node backend.js
```

## Schema Markup

O site inclui JSON-LD `@graph` completo com:
- `Organization`, `Person`, `WebSite`, `ProfessionalService`
- `Service` × 2 (SaaS + E-commerce)
- `SoftwareApplication` (calculadora)
- `FAQPage` com 8 perguntas otimizadas para US/UK

---

© 2026 SmartSeller. All rights reserved.
