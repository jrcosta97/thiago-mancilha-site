# Redesenho do painel administrativo

**Objetivo:** implementar o protótipo aprovado, priorizando pessoas e separando financeiro e agenda.

**Referência:** protótipo aprovado `painel-crm-prototipo.html` nesta conversa. O painel usa dados reais existentes e mantém ações e regras atuais.

**Arquitetura:** reorganizar `src/pages/AdminDashboard.tsx` sem alterar esquema ou integrações. A lista de pessoas apresenta ficha e ações por status; financeiro apresenta alunos ativos, situação e baixa; agenda mantém os controles existentes.

## Verificações essenciais

- Navegação entre áreas preserva acesso a cadastro, busca, atualização, exportação e saída.
- Lista responsiva permite abrir ficha e executar ações de leads, ativos e inativos.
- Financeiro distingue previsto, recebido e atraso e usa a baixa existente; erros e estados de carregamento continuam visíveis.
- Filtros e busca não escondem acidentalmente pessoas ao alternar áreas.
- Agenda, detalhes, paginação e diálogos existentes permanecem funcionais.

## Tarefas

- [ ] Reorganizar navegação, títulos e indicadores.
- [ ] Substituir tabela larga por lista responsiva com ações claras.
- [ ] Criar área financeira com informações e ações existentes.
- [ ] Conferir build, lint e testes existentes; inspecionar visualmente quando possível.
