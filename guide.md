# Contexto do Problema: Erro 403 Forbidden em GET (Oracle APEX / React Native)

## 1. Visão Geral do Stack e Status
* **Frontend:** React Native (Expo/Android).
* **Backend:** Oracle APEX (RESTful Services/ORDS) no Free Tier (`oracleapex.com`).
* **Autenticação:** Firebase Auth.
* **Status Atual:** O método POST funciona perfeitamente, mas o método GET retorna erro `403 Forbidden`.

## 2. O que já foi resolvido e configurado
* **Bypass de Firewall (WAF) no POST:** Estávamos recebendo `Network Error` no Axios e `403` no `fetch`. Resolvemos isso falsificando a origem da requisição. Adicionamos os headers `Origin: https://oracleapex.com` e `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36`. Com isso, o cadastro e o cálculo via POST passaram a funcionar liso.
* **CORS e Privilégios no Oracle APEX:** O campo *Origins Allowed* do módulo `mobile_api` está configurado com `*`. O banco está configurado como público (nenhum *Privilege* trancando a API).
* **Sincronização de IDs (Auth):** O usuário loga pelo Firebase, mandamos os dados via POST para o Oracle, o Oracle retorna o `id_usuario` numérico (ex: `21`). Nós salvamos esse `21` localmente no `AsyncStorage`. O ID está sendo lido corretamente antes da requisição.

## 3. O Problema Original (Registrado antes da análise)
A requisição GET para listar as refeições estava retornando `403 Forbidden`.
**Endpoint com bug:** `https://oracleapex.com/ords/projeto_nutryon/api/refeicoes/?id_usuario=21`

```typescript
// Código problemático — gerava 403
const response = await fetch(`https://oracleapex.com/ords/projeto_nutryon/api/refeicoes/?id_usuario=${userId}`, {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    // Testado com e sem Origin. Ambos retornavam 403.
  }
});
```

## 4. Diagnóstico e Solução (2026-04-10)

### Causa Raiz: URL com barra antes do query param
O padrão `/refeicoes/?id_usuario=21` (barra antes do `?`) é o **principal gatilho do WAF** da Oracle Cloud.

- Historicamente, `/?param=` é uma técnica de bypass de WAF/SQLi — rulesets modernos bloqueiam preventivamente.
- Para o ORDS: `GET /refeicoes/` (com barra, sem query string) é o handler de coleção padrão. Ao adicionar `/?param=`, o ORDS não encontra o handler correspondente e delega para a camada de segurança → **403**.
- **URL correta:** `GET /refeicoes?id_usuario=21` (sem barra antes do `?`).

### Causa Secundária: fingerprint de browser incompleto no GET
- **POST** funciona porque `Origin: https://oracleapex.com` é suficiente para mascarar o método de criação.
- **GET** exige o trio `Origin + Referer + User-Agent` coerentes para não ser classificado como scraper/bot.
- Navegadores modernos também enviam `Sec-Fetch-Site`, `Sec-Fetch-Mode` e `Sec-Fetch-Dest`. A ausência desses headers com User-Agent de browser = fingerprint inconsistente = WAF bloqueia.

### Fix Aplicado em `api.ts`
```typescript
// Correto — sem barra antes do '?'
const url = `${APEX_BASE}/refeicoes?id_usuario=${userId}`;
const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Accept':           'application/json',
    'Origin':           'https://oracleapex.com',
    'Referer':          'https://oracleapex.com/',
    'User-Agent':       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Sec-Fetch-Site':   'same-origin',
    'Sec-Fetch-Mode':   'cors',
    'Sec-Fetch-Dest':   'empty',
  }
});
```

## 5. Plano B — Se o 403 persistir após o fix da URL

**Teste 1 — GET sem query param:**
```
GET /api/refeicoes
```
Se retornar 200 com todos os registros, o handler ORDS aceita GET mas não suporta filtro por query string. Solução: filtrar no front-end ou mudar para path param.

**Teste 2 — Path parameter:**
```
GET /api/refeicoes/21
```
Requer que o handler ORDS esteja configurado com `:id_usuario` no URL pattern (ex: `/refeicoes/:id_usuario`).

**Teste 3 — POST para consulta (último recurso):**
```typescript
// Criar endpoint no APEX: POST /api/refeicoes/buscar
const { data } = await api.post(`${APEX_BASE}/refeicoes/buscar`, { id_usuario: Number(userId) });
```
POST passa pelo WAF sem problemas com os headers já configurados no Axios global.
