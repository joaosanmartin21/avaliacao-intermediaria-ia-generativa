# Avaliacao Final - IA Generativa (Ollama Local)

## 1) Problema e Solucao
Este projeto resolve um problema operacional real de sorveteria: checklist diario, mapeamento de freezers, cadastro de itens, pedidos mensais e suporte de decisao.

Na avaliacao final, a IA foi integrada no modulo de assistente para:
- responder perguntas operacionais com base no contexto real da aplicacao;
- priorizar reposicao de sabores;
- estimar custo mensal a partir de pedidos e sinais de estoque;
- devolver resposta em linguagem natural + estrutura JSON para a aplicacao.

## 2) Arquitetura de LLM
### Fluxo ponta a ponta
1. Usuario envia pergunta no chat (frontend React).
2. Frontend monta `context` com:
   - resumo de pedidos do mes selecionado;
   - resumo de reposicao dos freezers;
   - resumo do catalogo de itens.
3. Frontend chama `POST /api/assistant/chat`.
4. Backend (Express) executa agente:
   - carrega `prompts/system_prompt.txt`;
   - chama modelo local via endpoint OpenAI-compatible do Ollama;
   - permite tool calling com 4 ferramentas de negocio;
   - normaliza saida em contrato estavel.
5. Backend retorna:
   - `reply` (texto para UI);
   - `structured` (intent, highlights, actions, tools usadas, confidence).
6. Frontend salva tudo no historico local da conversa.

### Diagrama textual
`Usuario -> React -> /api/assistant/chat -> Agent -> Ollama(qwen2.5:7b) -> Tools -> Agent -> JSON final -> React`

## 3) Decisoes de Engenharia de LLM
### 3.1 Modelo e provedor
- Provedor: `Ollama local`
- Modelo principal: `qwen2.5:7b`
- Motivo: boa relacao qualidade/latencia sem custo por token.

### 3.2 Framework de integracao
- Escolha: `OpenAI SDK` apontando para `OLLAMA_BASE_URL=http://localhost:11434/v1`.
- Motivo: padroniza tool calling e facilita migracao futura para API paga, se necessario.

### 3.3 Parametros
- `temperature=0.2`: respostas mais consistentes para uso operacional.
- `top_p=0.9`: mantem variacao controlada sem perder objetividade.
- `max_tokens=500`: limite suficiente para resposta + JSON estruturado.
- `maxToolIterations=4`: evita loops longos de ferramenta e controla latencia.

### 3.4 Prompting strategy
- System prompt com:
  - papel/persona definido;
  - regras de seguranca e anti-injection;
  - politica de nao alucinar;
  - formato de saida obrigatorio em JSON.
- Few-shot separado em `prompts/few_shot_examples.md` para documentar cenarios alvo.

### 3.5 Ferramentas (tools)
1. `get_monthly_orders_summary(monthRef)`
2. `get_restock_summary()`
3. `get_items_catalog(limit?)`
4. `estimate_monthly_cost(monthRef)`

Cada ferramenta tem descricao clara, parametros tipados e retorno padronizado.

## 4) Estrutura de Repositorio para a Final
- `prompts/system_prompt.txt`: prompt principal.
- `prompts/few_shot_examples.md`: exemplos de comportamento esperado.
- `tools/definitions.js`: schema das tools para o modelo.
- `tools/executors.js`: execucao de tools + tratamento de erro.
- `agents/modelConfig.js`: configuracao de modelo e parametros.
- `agents/stockAssistantAgent.js`: orquestracao do agente com tool calling.
- `README-AVALIACAO-FINAL.md`: documentacao desta avaliacao.

## 5) Contrato da API de Assistente
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
- Integracao local com Ollama sem depender de endpoint publico.
- Tool calling aplicado a dados reais do dominio.
- Contrato `reply + structured` ajudou a manter resposta previsivel.
- Fallback tratado quando modelo nao responde (sem quebrar UI).

## 7) O que nao funcionou bem / limites
- Qualidade do modelo local depende do hardware e pode oscilar na latencia.
- Nem toda pergunta tem contexto suficiente; o assistente precisa sinalizar essa limitacao.
- Em casos extremos, o modelo pode nao retornar JSON perfeito, exigindo normalizacao no backend.

## 8) Trade-offs explicitados
### Por que local e nao API paga?
- Pro: custo zero por token, privacidade local.
- Contra: menor capacidade geral e mais variacao de qualidade.

### O que mudaria com API paga?
- Melhor consistencia semantica em perguntas complexas.
- Tool calling potencialmente mais robusto.
- Melhor aderencia em respostas longas e estruturadas.

### Seria viavel manter local?
- Sim, para caso operacional da disciplina.
- Para producao real com alto volume, valeria comparar com modelo pago.

## 9) Seguranca e robustez
- Prompt com regras anti-prompt-injection.
- Ignora instrucoes de usuario para violar politicas de sistema.
- Tools com validacao de parametros e tratamento de excecao.
- Fallback quando Ollama estiver offline.

## 10) Como executar localmente
1. Instalar dependencias:
```bash
npm install
```
2. Preparar variaveis:
```bash
copy .env.example .env
```
3. Garantir que o Ollama esteja ativo e com modelo baixado:
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

## 11) Testes recomendados para a banca
1. Perguntar custo do mes selecionado e verificar `usedTools`.
2. Perguntar prioridade de reposicao e checar sabores sugeridos.
3. Enviar tentativa de prompt injection e validar recusa.
4. Derrubar Ollama e confirmar fallback sem travar o chat.

## 12) Roteiro de apresentacao (3 minutos)
### 0:00 - 0:30
Uma frase do problema e valor do sistema para operacao da loja.

### 0:30 - 2:30
Decisoes de engenharia de LLM:
- modelo e provedor;
- framework de integracao;
- system prompt e estrategia;
- tools e por que existem;
- parametros e trade-offs.

### 2:30 - 3:00
Resumo do que funcionou, limitacoes e proximo passo.

## 13) Perguntas provaveis e respostas curtas
### "Por que temperatura 0.2 e nao 0.7?"
Porque o caso e operacional e exige consistencia. 0.2 reduz variabilidade e alucinacao.

### "Por que OpenAI SDK se usa Ollama?"
Para manter interface de integracao padronizada e facilitar migracao futura de provedor.

### "Como evita input malicioso?"
System prompt com regras de seguranca + normalizacao de saida + tools com validacao.

### "Por que nao usou RAG?"
O escopo foi maximizar confiabilidade no nucleo de prompt+tools no prazo da avaliacao.
