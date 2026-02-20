# Sistema de Checklist Operacional para Loja de Sorvetes (Prototipo sem IA)

## 1. Contexto da avaliacao
Este repositorio foi desenvolvido para a **Avaliacao Intermediaria de IA Generativa**.

Objetivo da etapa:
- usar um agente de codificacao para construir interface e estrutura da aplicacao;
- **nao integrar LLM nesta fase**;
- simular o fluxo real de uso com dados e comportamentos locais.

## 2. Problema e solucao proposta
### Problema
A operacao diaria da loja envolve muitas tarefas repetitivas em momentos criticos (abertura, caixa, limpeza e fechamento). Quando uma tarefa e esquecida, o impacto aparece no atendimento, no controle financeiro e na higiene.

### Solucao proposta
Construir uma aplicacao com 3 telas:
1. Tela de checklists operacionais do dia (implementada nesta entrega).
2. Tela de acompanhamento/controle gerencial (planejada).
3. Tela com apoio de IA para recomendacoes e analise (planejada para fase futura).

Nesta entrega foi implementada a **Tela 1**, com foco em confiabilidade operacional.

## 3. Escopo implementado nesta entrega (Tela 1)
### Funcionalidades
- 4 blocos de checklist:
  - Checkout de abertura da loja
  - Checkout de controle de caixa
  - Checkout de controle de limpeza
  - Checkout de fechamento de caixa
- Marcacao e desmarcacao de cada item com checkbox.
- Indicador de progresso por secao e progresso total.
- Persistencia local com `localStorage` (estado mantido apos refresh).
- Botao para limpar o progresso do dia.
- Animacao final:
  - mensagem **"Dia encerrado com sucesso!"**
  - exibida somente quando **100% dos itens** foram marcados.

## 4. Como a IA sera integrada no futuro
Nesta fase nao ha integracao com IA/LLM por exigencia da avaliacao. A arquitetura foi pensada para permitir evolucao futura:

1. Sugestoes inteligentes por contexto:
   - alertar etapas esquecidas com base no horario e no historico.
2. Analise de risco operacional:
   - identificar padroes de falha recorrente no fechamento.
3. Assistente de suporte:
   - responder "o que fazer agora?" com base no estado atual dos checklists.

## 5. Escolhas de design e arquitetura
### Stack
- Frontend: `React + Vite`
- Persistencia local: `localStorage`
- Sem backend nesta fase

### Decisoes tecnicas
1. `React + Vite` para acelerar iteracao da UI e manter base preparada para escalabilidade.
2. Separacao por componentes:
   - `ProgressHeader`
   - `ChecklistSection`
   - `SuccessOverlay`
3. Dados de checklist centralizados em arquivo dedicado (`src/data/checklists.js`) para facilitar manutencao.
4. Chave versionada no storage (`loja_checklists_v1`) para futuras mudancas de estrutura sem quebrar dados.
5. Layout responsivo para desktop e mobile.

### Estrutura de pastas
```text
.
|-- index.html
|-- package.json
|-- vite.config.js
|-- src
|   |-- App.jsx
|   |-- main.jsx
|   |-- styles.css
|   |-- components
|   |   |-- ChecklistSection.jsx
|   |   |-- ProgressHeader.jsx
|   |   `-- SuccessOverlay.jsx
|   |-- data
|   |   `-- checklists.js
|   `-- utils
|       `-- storage.js
`-- README.md
```

## 6. Experiencia com o agente de codificacao
### O que funcionou bem
1. Geracao rapida da base de projeto e organizacao de componentes.
2. Implementacao do fluxo completo de checklist com persistencia local.
3. Criacao de UI responsiva com animacao condicional de sucesso.
4. Validacao final com build de producao.

### Prompts que trouxeram bons resultados
1. "Implement the plan."  
   Resultado: criacao completa da tela com componentes, dados, estilos e regra de conclusao.
2. "Preciso que me ajude a implementar isso... primeira tela com checklists..."  
   Resultado: definicao clara dos requisitos funcionais de cada bloco.

### O que nao funcionou bem / limitacoes encontradas
1. Execucao inicial de `npm` bloqueada por politica do PowerShell no ambiente.
2. Build inicial com erro de permissao (`EPERM`) no sandbox para processo do `esbuild`.
3. Necessidade de ajuste de permissao para concluir instalacao/build no ambiente de desenvolvimento.

### Intervencoes manuais importantes
1. Definicao dos textos finais dos checklists exatamente conforme operacao da loja.
2. Revisao de IDs unicos para evitar conflito entre itens.
3. Ajustes de copy e organizacao do README para criterios da avaliacao.

## 7. Como executar localmente
### Requisitos
- Node.js 18+ (ou superior)
- npm

### Passos
```bash
npm install
npm run dev
```

Build de producao:
```bash
npm run build
npm run preview
```

## 8. Evidencias de atendimento aos criterios da avaliacao
1. Endpoint funcional (parcial nesta etapa):
   - aplicacao local funcional e build de producao gerada.
2. Complexidade:
   - fluxo operacional dividido em multiplas secoes com 32 tarefas.
3. Repositorio:
   - estrutura organizada por componentes, dados e utilitarios.
4. README:
   - inclui problema, solucao, design, o que funcionou e o que nao funcionou.
5. Uso de agente:
   - desenvolvimento conduzido com prompts iterativos e validacao tecnica.

## 9. Links de entrega
- Endpoint publico: **[PENDENTE PUBLICACAO]**
- Repositorio GitHub: **[PENDENTE CRIACAO REMOTA]**

## 10. Proximos passos
1. Publicar endpoint na Vercel.
2. Implementar Tela 2 e Tela 3 do projeto.
3. Integrar backend/API para evolucao futura com IA.

## 11. Endpoint funcional publicado via internet
Foi adicionado um backend HTTP no projeto para atender o criterio de endpoint funcional.

### Rotas disponiveis
- `GET /api/health`
- `POST /api/assistant/chat`
- `POST /api/reports/cost`

### Estrutura para deploy na Vercel
- Funcoes em `api/health.js`, `api/assistant/chat.js` e `api/reports/cost.js`.
- Frontend React/Vite consumindo `"/api"` no mesmo dominio.

### Como rodar localmente
Em um terminal:
```bash
npm run api
```

Em outro terminal:
```bash
npm run dev
```

### Exemplo de teste local
```bash
curl http://localhost:8787/api/health
```

```bash
curl -X POST http://localhost:8787/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"resuma custos\",\"monthRef\":\"2026-02\"}"
```

### Publicar manualmente na Vercel
1. Suba o repositorio no GitHub.
2. Importe o projeto na Vercel.
3. Configure:
```bash
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```
4. Faca o deploy.
5. Valide em producao:
```bash
curl https://SEU-PROJETO.vercel.app/api/health
curl -X POST https://SEU-PROJETO.vercel.app/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"resuma custos\",\"monthRef\":\"2026-02\"}"
```

### Variavel de ambiente (opcional)
Defina `VITE_ASSISTANT_API_URL` apenas se quiser apontar o frontend para uma API externa.
