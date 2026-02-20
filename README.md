# Avaliacao Intermediaria - IA Generativa

## Projeto
Sistema para organizar a operacao de uma sorveteria, com foco em checklist diario, controle de estoque, pedidos e preparacao para analises com IA no futuro.

## Links da entrega
- Endpoint web: https://avaliacao-intermediaria-ia-generati.vercel.app/
- Repositorio GitHub: https://github.com/joaosanmartin21/avaliacao-intermediaria-ia-generativa

## O problema que o sistema resolve
A loja tem tarefas operacionais e de estoque que ficam espalhadas (anotacoes manuais, memoria da equipe e conferencias repetitivas). Isso gera:
- esquecimento de rotinas diarias;
- dificuldade para visualizar rapidamente o estado dos freezers;
- pouca previsibilidade de compra semanal;
- falta de base consolidada para calcular custo real do buffet e lucro.

A solucao proposta foi montar uma aplicacao com fluxo completo da operacao, sem integrar LLM real nesta etapa da avaliacao.

## O que o sistema faz hoje (5 telas)
1. Checklist diario de rotinas
- Tela operacional para abertura, caixa, limpeza e fechamento.
- Nao usa IA nesta etapa.
- Objetivo: reduzir falhas no dia a dia do funcionario.

2. Mapeamento de freezers
- Cadastro visual dos freezers e sabores por caixa.
- Controle de nivel dos sabores para identificar falta de reposicao.
- Estrutura pronta para gerar relatorio inteligente de compra.

3. Cadastro de itens
- Cadastro e edicao de itens de estoque (caldas, frutas, coberturas e outros).
- Registro de nome e preco unitario para servir de base aos pedidos e custos.

4. Pedidos por mes
- Tela para registrar pedidos semanais.
- Vincula os pedidos ao mes de referencia.
- Permite acompanhar historico e status dos pedidos.

5. Assistente (estrutura pronta)
- Chat para duvidas de fluxo geral da sorveteria.
- Area de relatorio de custo mensal simulada.
- Atualmente responde com mock/placeholder, sem LLM real.

## Como a IA sera integrada no futuro
Nesta entrega, a IA foi mantida em modo mock para atender o enunciado da avaliacao. Na evolucao do projeto, a integracao prevista e:
- gerar media de custo do buffet para a loja;
- estimar lucro com base em custo, pedidos e consumo;
- manter uma lista de sabores com preco por sabor;
- no fim do mes, gerar relatorio com quantidade vendida por sabor;
- responder perguntas operacionais e financeiras no assistente com contexto real da base.

Em resumo: o sistema atual ja coleta e organiza os dados que vao alimentar a LLM depois.

## Escolhas de design
### Arquitetura e stack
- Frontend: React + Vite.
- Persistencia local: `localStorage` (checklist e mapeamento) e IndexedDB via Dexie (itens, pedidos e assistente).
- API mock para deploy: rotas em `api/*` (Vercel serverless) e servidor local em `server/index.js`.

### Por que essa arquitetura
- React + Vite acelerou iteracao de telas e componentes.
- Dexie facilitou manter dados estruturados no browser sem depender de banco externo agora.
- Endpoints mock permitiram validar o fluxo da UI sem quebrar a regra de "sem LLM real".
- Separacao por telas/componentes deixou a base preparada para integrar IA sem reescrever a interface.

### Alternativas consideradas
- Fazer tudo em uma tela unica: descartado por dificultar uso diario e manutencao.
- Integrar backend + banco remoto ja nesta fase: descartado para priorizar entrega funcional da interface no prazo da avaliacao.

## Experiencia com o agente de codificacao
### O que funcionou bem
- O agente gerou bem a estrutura inicial do projeto e a divisao de componentes.
- O frontend ficou estavel, sem bugs criticos durante os ajustes principais.
- Foi possivel evoluir em ciclos curtos com testes e refinos de layout.

### Prompt que teve bom resultado
- "Preciso ajustar duas coisas. A estrutura inicial, na verdade deve ter 7 freezer de 12 sabores tendo um deles o titulo "Zeros" e 1 freezer de 8 sabores com o titulo "Acai". O restante dos freezer nao precisa de titulo, pode remover alias essa frase "Freezer em formato real: 2 fileiras x 6 caixas." Utilize o mcp sequential-thinking para fazer isso."

Resultado: a estrutura dos freezers foi ajustada rapidamente e com boa aderencia ao que era esperado.

### O que nao funcionou bem
- Em um prompt pedindo implementacao de 2 telas ao mesmo tempo, o resultado perdeu qualidade em uma das telas.
- Um grid ficou ruim e precisou de ajuste manual com novos prompts de refinamento.
- Na parte de deploy, a orientacao com ngrok nao foi simples de executar no meu ambiente.

### Intervencao manual e limitacoes
- Precisei quebrar tarefas grandes em prompts menores para manter qualidade.
- Precisei revisar layout manualmente quando o grid saiu fora do esperado.
- Para publicar, optei por deploy manual na Vercel (em vez de ngrok).

### O que faria diferente
- Separaria todas as telas em tarefas menores desde o inicio.
- Definiria criterios visuais de grid mais detalhados antes de pedir implementacao.
- Escolheria Vercel como caminho principal de deploy desde o primeiro dia.

## Evidencia de uso de agente de codificacao
- Desenvolvimento feito com iteracoes de prompt para estrutura, telas e ajustes finos.
- Uso de prompts especificos para regras de negocio dos freezers.
- Refinos de UI e fluxo feitos por ciclos curtos de gerar, testar, corrigir.

## Como executar localmente
```bash
npm install
npm run dev
```

Para rodar a API local mock:
```bash
npm run api
```

Build de producao:
```bash
npm run build
npm run preview
```

## Rotas mock disponiveis
- `GET /api/health`
- `POST /api/assistant/chat`
- `POST /api/reports/cost`
