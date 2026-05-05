# SmartSeller — Integration Setup Guide

## Arquivos entregues

| Arquivo | O que é |
|---|---|
| `smartseller_v3.html` | Site completo com lógica de integração embutida |
| `google-apps-script.js` | Script para colar no Google Apps Script (Sheets) |
| `backend.js` | Servidor Node.js para envio de e-mail via SMTP |
| `package.json` | Dependências do backend |
| `.env.example` | Exemplo de variáveis de ambiente |

---

## 1. Google Sheets (gratuito, 5 minutos)

1. Abra o Google Sheets onde quer receber os leads
2. **Extensions → Apps Script**
3. Apague tudo e cole o conteúdo de `google-apps-script.js`
4. Salve (Ctrl+S)
5. Clique **Run → testWrite** para verificar se cria a aba "Leads" corretamente
6. **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Clique **Deploy** → autorize → copie a URL (começa com `https://script.google.com/macros/s/...`)
8. No arquivo `smartseller_v3.html`, substitua:
   ```js
   SHEETS_ENDPOINT: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
   ```
   pela URL copiada.

**Nota:** Toda vez que alterar o script, crie um **novo deployment** — o URL muda.

---

## 2. E-mail via SMTP (seu servidor)

### Opção A: Rodar localmente (teste)

```bash
# Na pasta dos arquivos:
npm install

# O arquivo .env.example já vem com EMAIL_TO preenchido
# Você só precisa adicionar SMTP_HOST, SMTP_USER e SMTP_PASS
cp .env.example .env
# Edite o .env com suas credenciais
node backend.js
```

### Opção B: Deploy gratuito no Render.com (produção)

1. Crie uma conta em [render.com](https://render.com)
2. **New → Web Service**
3. Conecte seu GitHub (faça upload dos arquivos `backend.js`, `package.json`)
4. Environment: **Node**
5. Build command: `npm install`
6. Start command: `node backend.js`
7. Adicione as variáveis de ambiente na interface do Render
8. Copie a URL pública gerada (ex: `https://smartseller-backend.onrender.com`)
9. No HTML, substitua:
   ```js
   EMAIL_ENDPOINT: 'https://YOUR-BACKEND-URL/send-email',
   ```

### Variáveis de ambiente necessárias

```env
SMTP_HOST=smtp.seudominio.com.br
SMTP_PORT=587
SMTP_USER=cassio@smartseller.com
SMTP_PASS=sua_senha
SMTP_FROM=SmartSeller <cassio@smartseller.com>
EMAIL_TO=cpiccinini93@gmail.com  # já preenchido
PORT=3000
ALLOWED_ORIGIN=*
```

**Para Gmail:** gere uma "App Password" em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) e use no lugar da senha normal.

---

## 3. Google Calendar (link customizado)

Já está funcionando no site — nenhuma configuração adicional necessária.

No arquivo HTML, customize apenas:

```js
GCAL_EVENT_TITLE: 'SmartSeller — Exit Feasibility Call',
GCAL_LOCATION: 'https://zoom.us/j/SEU_MEETING_ID',
GCAL_DURATION: 30,
GCAL_YOUR_EMAIL: 'cassio@smartseller.com',
GCAL_DESCRIPTION: 'Pre-call analysis...'
```

O link gerado abre o Google Calendar do visitante com o evento já preenchido, com **seu e-mail como convidado** — quando ele confirmar, você recebe o convite automaticamente no seu Google Agenda.

---

## Fluxo completo após um lead preencher o formulário

```
Visitante clica "Book My Assessment →"
        │
        ├── POST → Google Sheets (Apps Script)
        │         → Nova linha na aba "Leads"
        │
        ├── POST → Backend Node.js (seu servidor)
        │         → E-mail plain text para cassio@smartseller.com
        │         → reply-to = e-mail do lead (responder direto)
        │
        └── Tela de confirmação aparece com:
              ✓ Mensagem personalizada com nome do lead
              ✓ Calendário customizado mostrando próximos dias úteis
              ✓ Ao clicar em qualquer slot → abre Google Calendar
                pré-preenchido com título, duração, Zoom link
                e seu e-mail como convidado automático
```

---

## Testar sem backend

Se ainda não tem o backend configurado, o site funciona normalmente — apenas loga um aviso no console do browser e exibe o calendário assim mesmo. Você pode começar só com o Sheets e adicionar o e-mail depois.
