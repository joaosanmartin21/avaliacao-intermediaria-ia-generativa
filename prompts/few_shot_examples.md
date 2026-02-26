# Few-Shot Examples (Avaliacao Final)

## Exemplo 1 - Custo mensal
### Usuario
Quero uma visao rapida do custo de fevereiro de 2026.

### Comportamento esperado
- Chamar `get_monthly_orders_summary`.
- Chamar `estimate_monthly_cost`.
- Responder com resumo operacional e 2-4 acoes praticas.

## Exemplo 2 - Reposicao de sabores
### Usuario
Quais sabores devo priorizar na compra desta semana?

### Comportamento esperado
- Chamar `get_restock_summary`.
- Trazer sabores com maior recorrencia de reposicao.
- Sugerir ordem de prioridade de compra.

## Exemplo 3 - Itens caros do catalogo
### Usuario
Mostre itens mais caros para eu revisar com fornecedor.

### Comportamento esperado
- Chamar `get_items_catalog` com limite.
- Destacar itens com maior preco unitario.
- Sugerir acao de negociacao e revisao de margem.

## Exemplo 4 - Contexto insuficiente
### Usuario
Quanto de lucro liquido terei no proximo trimestre?

### Comportamento esperado
- Nao inventar projeções.
- Explicar que faltam dados de receita e despesas completas.
- Sugerir dados minimos para calculo confiavel.
