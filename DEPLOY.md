# SmartSeller — Deploy Guide
## gosmartseller.com · GitHub → Vercel · Supabase

---

## Visão geral do pipeline

```
Você faz push no GitHub (branch main)
         ↓ automático (~30 segundos)
Vercel faz build e deploy
         ↓
gosmartseller.com está no ar com a versão nova
         ↓
Leads salvos no Supabase (PostgreSQL)
+ Email via SMTP
+ Google Sheets via Apps Script
```

---

## PASSO 1 — Supabase (banco de dados)

### 1.1 Criar conta e projeto

1. Acesse [app.supabase.com](https://app.supabase.com)
2. **New project**
   - Name: `smartseller`
   - Database Password: anote em local seguro
   - Region: **US East (N. Virginia)** — mais próximo do seu público
3. Aguarde ~2 minutos para o projeto iniciar

### 1.2 Criar as tabelas

1. No menu esquerdo: **SQL Editor**
2. Clique em **New query**
3. Cole o conteúdo de `supabase-schema.sql`
4. Clique **Run** (Ctrl+Enter)
5. Deve aparecer: `✓ SmartSeller schema created successfully.`

### 1.3 Copiar as credenciais

1. Menu esquerdo: **Settings → API**
2. Copie:
   - **Project URL** → `SUPABASE_URL` (ex: `https://xyzabc.supabase.co`)
   - **service_role** secret key → `SUPABASE_SERVICE_KEY` (em "Project API keys")

> ⚠️ Use `service_role`, NÃO o `anon` key. O service_role ignora o RLS e permite inserções do backend.

---

## PASSO 2 — Vercel (hospedagem + CI/CD)

### 2.1 Criar conta

1. Acesse [vercel.com](https://vercel.com)
2. **Sign up with GitHub** → autorize acesso ao repositório

### 2.2 Importar repositório

1. **Add New → Project**
2. Selecione `smartseller-valuation-optimizer-website`
3. Framework Preset: **Other**
4. Root Directory: `.` (raiz)
5. Build Command: deixe **vazio**
6. Output Directory: `.` (raiz)
7. Clique **Deploy** (vai falhar sem as env vars — isso é esperado)

### 2.3 Configurar variáveis de ambiente

No painel do projeto Vercel: **Settings → Environment Variables**

Adicione cada variável abaixo:

| Nome | Valor |
|---|---|
| `SUPABASE_URL` | `https://SEU-ID.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `eyJhbGc...` (service_role key) |
| `SMTP_HOST` | seu host SMTP |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | seu email remetente |
| `SMTP_PASS` | sua senha SMTP |
| `SMTP_FROM` | `SmartSeller <seu@email.com>` |
| `EMAIL_TO` | `cpiccinini93@gmail.com` |
| `META_PIXEL_ID` | `971637128917888` |
| `META_CAPI_TOKEN` | `EAAbELDHaahQ...` (token completo) |
| `SHEETS_ENDPOINT` | URL do Apps Script (opcional) |

Após adicionar todas: **Settings → Deployments → Redeploy**

### 2.4 Adicionar domínio gosmartseller.com

1. **Settings → Domains**
2. Digite: `gosmartseller.com`
3. Também adicione: `www.gosmartseller.com`
4. Vercel mostrará os registros DNS a configurar (próximo passo)

---

## PASSO 3 — DNS no Hostgator

Após adicionar o domínio na Vercel, ela mostrará os valores exatos. O padrão é:

### Registros a criar no Hostgator
(Painel Hostgator → Domínios → Gerenciar DNS)

| Tipo | Nome | Valor | TTL |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` | 3600 |
| `CNAME` | `www` | `cname.vercel-dns.com` | 3600 |

> ⚠️ Confirme os valores exatos no painel da Vercel — podem variar.
> A propagação DNS leva de 15 minutos a 24 horas.

### Verificar

Após propagação: `https://gosmartseller.com` deve carregar o site com HTTPS automático (certificado SSL gratuito pela Vercel).

---

## PASSO 4 — CI/CD automático (já configurado)

A partir de agora, o fluxo é:

```bash
# Qualquer alteração no site:
git add .
git commit -m "feat: descrição da mudança"
git push origin main
# → Vercel detecta o push e faz deploy automático em ~30s
```

Você recebe um email da Vercel confirmando cada deploy.

### Branches de preview (opcional)

Qualquer branch além de `main` gera um preview URL único:
```bash
git checkout -b feature/nova-secao
git push origin feature/nova-secao
# → Vercel gera https://smartseller-abc123.vercel.app para preview
```

---

## PASSO 5 — Testar as integrações

### Testar salvamento no Supabase

```bash
curl -X POST https://gosmartseller.com/api/save-lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","source":"test","businessType":"SaaS"}'
```

Deve retornar: `{"status":"ok","lead_id":"uuid..."}`

Verificar no Supabase: **Table Editor → leads** → nova linha visível.

### Testar Meta CAPI

```bash
curl -X POST https://gosmartseller.com/api/meta-event \
  -H "Content-Type: application/json" \
  -d '{"event_name":"Lead","event_time":1700000000}'
```

### Verificar Vercel logs

Vercel Dashboard → seu projeto → **Functions** → ver logs em tempo real.

---

## PASSO 6 — Google Sheets (opcional, além do Supabase)

Se quiser manter o Google Sheets como backup:

1. Siga o `SETUP.md` (seção Google Sheets)
2. Após deploy do Apps Script, copie a URL
3. Adicione em Vercel: `SHEETS_ENDPOINT` = URL copiada

---

## Tabelas do Supabase — referência rápida

### `leads` — Ver todos os leads
```sql
SELECT id, created_at, name, email, company, source, status
FROM lead_dashboard
ORDER BY created_at DESC;
```

### `calculator_sessions` — Analytics do simulador
```sql
SELECT mode, COUNT(*) as sessions, AVG(upside_value) as avg_upside
FROM calculator_sessions
GROUP BY mode;
```

### `bookings` — Agendamentos confirmados
```sql
SELECT b.*, l.company, l.source
FROM bookings b
JOIN leads l ON l.id = b.lead_id
WHERE b.confirmed = true
ORDER BY b.created_at DESC;
```

---

## Custo total desta stack

| Serviço | Plano | Custo |
|---|---|---|
| Vercel | Hobby (até 100GB bandwidth) | **Grátis** |
| Supabase | Free tier (500MB, 50K req/mês) | **Grátis** |
| GitHub | Free | **Grátis** |
| Hostgator | Só DNS (domínio que você já tem) | Já pago |

> Quando escalar: Vercel Pro ($20/mês) + Supabase Pro ($25/mês)

---

## Suporte

Qualquer problema no deploy: verifique os logs em:
- Vercel: Dashboard → Functions → Logs
- Supabase: Dashboard → Logs → API
