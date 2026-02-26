# Avaliacao Final - IA Generativa (Ollama Local)

## 1) Problema e solucao
Este projeto atende uma operacao real de sorveteria com foco em:
- checklist diario;
- mapeamento de freezers e reposicao;
- cadastro de itens;
- pedidos mensais;
- assistente com IA para apoio operacional.

A IA foi integrada para responder perguntas com base em dados reais do app, usando tool calling e saida estruturada.

## 2) Arquitetura de LLM
Fluxo principal:
1. Usuario envia mensagem no chat.
2. Frontend detecta `monthRef` pela propria mensagem (ex.: `03/2026`, `marco 2026`, `mes passado`).
3. Frontend monta contexto (`ordersSummary`, `freezerSummary`, `itemsSummary`).
4. Frontend chama `POST /api/assistant/chat`.
5. Backend executa agente com:
   - `prompts/system_prompt.txt`;
   - `prompts/few_shot_examples.md` (carregado no runtime);
   - modelo local via OpenAI SDK em endpoint do Ollama;
   - ferramentas tipadas.
6. Backend retorna:
   - `reply` (texto para UI);
   - `structured` (intent, monthRef, highlights, recommendedActions, usedTools, confidence).

Diagrama textual:
`Usuario -> React -> /api/assistant/chat -> stockAssistantAgent -> Ollama(qwen2.5:7b) + tools -> JSON final -> React`

## 3) Decisoes de engenharia de LLM
### 3.1 Modelo e provedor
- Provedor: `ollama-local`
- Modelo padrao: `qwen2.5:7b`
- Motivo: custo zero por token, privacidade local e boa qualidade para o dominio.

### 3.2 Framework
- Escolha: OpenAI SDK com `baseURL` do Ollama (`OLLAMA_BASE_URL`).
- Motivo: manter interface padrao de chat completion + tool calling e facilitar migracao futura para provedor pago.

### 3.3 Parametros
Configuracao em `agents/modelConfig.js`:
- `temperature=0.2`
- `top_p=0.9`
- `max_tokens=500`
- `ASSISTANT_MAX_TOOL_ITERATIONS=4`

Evidencia de experimentacao:
- `temperature=0.0`: respostas muito secas e com menor cobertura em sugestoes operacionais.
- `temperature=0.2` (escolhido): melhor equilibrio entre consistencia e utilidade pratica.
- `temperature>=0.6`: maior variacao de texto e menor previsibilidade no formato.

### 3.4 Prompting strategy
- System prompt em `prompts/system_prompt.txt` com:
  - papel e objetivo;
  - regras obrigatorias;
  - politica anti-injection;
  - formato JSON obrigatorio.
- Few-shot em `prompts/few_shot_examples.md` e carregado no runtime para guiar comportamento em cenarios alvo.

### 3.5 Tools
Definidas em `tools/definitions.js` e executadas por `tools/executors.js`:
1. `get_monthly_orders_summary(monthRef)`
2. `get_restock_summary()`
3. `get_items_catalog(limit?)`
4. `estimate_monthly_cost(monthRef)`

Cada tool possui descricao para o modelo, schema de parametros, validacao e tratamento de erro.

## 4) Estrutura do repositorio (foco avaliacao final)
- `prompts/system_prompt.txt`
- `prompts/few_shot_examples.md`
- `tools/definitions.js`
- `tools/executors.js`
- `agents/modelConfig.js`
- `agents/stockAssistantAgent.js`
- `agents/shoppingReportAgent.js`
- `api/assistant/chat.js`
- `api/reports/shopping.js`
- `README.md`

## 5) Contrato de API do assistente
### Request
```json
{
  "message": "texto do usuario",
  "monthRef": "2026-02",
  "context": {
    "ordersSummary": {},
    "freezerSummary": {},
    "itemsSummary": {}
  }
}
```

### Response
```json
{
  "reply": "texto final para o usuario",
  "structured": {
    "intent": "cost_estimation|restock|operational_help|other",
    "monthRef": "2026-02",
    "highlights": ["..."],
    "recommendedActions": ["..."],
    "usedTools": ["get_monthly_orders_summary"],
    "confidence": 0.74
  },
  "provider": "ollama-local",
  "model": "qwen2.5:7b",
  "generatedAt": "2026-02-26T00:00:00.000Z"
}
```

## 6) O que funcionou bem
- Tool calling com dados do proprio app.
- Resposta combinando texto natural + bloco estruturado.
- Fallback consistente quando modelo local falha.
- Regras de output para reduzir variacao de formato.

## 7) O que nao funcionou bem / limites
- Qualidade depende do hardware local e da carga do Ollama.
- Perguntas sem dados suficientes exigem resposta de limitacao (sem inventar).
- Mesmo com prompt forte, alguns casos exigem normalizacao defensiva no backend.

## 8) Trade-offs (local vs pago)
### Por que local
- Pro: custo, privacidade, independencia de API paga.
- Contra: menor robustez geral em casos complexos.

### Se trocar por modelo pago
- Ganho esperado: maior consistencia semantica e aderencia ao formato em casos dificeis.
- Perda: custo por uso e menor controle de dados locais.

## 9) Seguranca e robustez
- Regras anti-injection no system prompt.
- Validacao de schemas das tools.
- Normalizacao de saida JSON no agente.
- Fallback de resposta quando o modelo nao retorna formato valido.

## 10) Como executar localmente
1. Instalar dependencias:
```bash
npm install
```
2. Criar `.env` com base em `.env.example`.
3. Garantir Ollama ativo com modelo:
```bash
ollama run qwen2.5:7b
```
4. Rodar API local:
```bash
npm run api
```
5. Rodar frontend:
```bash
npm run dev
```

## 11) Testes recomendados para banca
1. Perguntar custo de um mes especifico (`03/2026`) e validar `usedTools`.
2. Perguntar reposicao semanal e validar sabores priorizados.
3. Perguntar com tentativa de injection e validar que regras sao mantidas.
4. Derrubar Ollama e validar fallback sem quebrar a UI.

## 12) Roteiro curto de apresentacao (3 min)
- 0:00-0:30: problema e valor.
- 0:30-2:30: modelo, framework, prompt, tools, parametros, trade-offs.
- 2:30-3:00: o que funcionou, limites, proximo passo.
