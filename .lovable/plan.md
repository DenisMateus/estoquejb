

## Plano: Gráfico de uso mensal + Modo escuro/claro

### 1. Adicionar modo escuro/claro
- Adicionar variáveis CSS dark mode em `src/index.css` (dentro de `.dark { }`)
- Criar um botão toggle (sol/lua) no header do `AppLayout.tsx` usando `next-themes` (já instalado) para alternar entre claro e escuro
- Envolver o app com `ThemeProvider` em `src/App.tsx`

### 2. Gráfico de uso mensal no Painel
- No `Dashboard.tsx`, adicionar um gráfico de barras (usando `recharts`, já instalado) que mostra o consumo (saídas) de materiais no mês atual
- Agrupar movimentações do tipo "saida" do mês corrente por produto
- Usar `ChartContainer` + `BarChart` do componente `chart.tsx` já existente
- Exibir abaixo dos cards de estatísticas

### Detalhes técnicos

**index.css** — adicionar bloco `.dark` com cores invertidas (fundo escuro, texto claro, cards escuros)

**App.tsx** — envolver com `ThemeProvider` do `next-themes` com `attribute="class"` e `defaultTheme="light"`

**AppLayout.tsx** — adicionar botão Sun/Moon no header para toggle de tema

**Dashboard.tsx** — filtrar movimentações de saída do mês atual, agrupar por `productDescription`, renderizar `BarChart` com `ChartContainer`

