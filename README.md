# VÉSPERA v6.3.0

**Tem prova. Dá tempo.**

Aplicação de estudos em React + Vite, publicada no GitHub Pages. A proposta é transformar conteúdo de prova em estudo organizado: matérias por disciplina, aprendizagem guiada, recuperação ativa, questões, flashcards, revisão e calendário.

## Estrutura

- `src/main.jsx` — interface, navegação e estado local
- `src/content.js` — conteúdos, questões, flashcards e mapas de síntese
- `src/styles.css` — sistema visual responsivo
- `scripts/audit-content.mjs` — auditoria de conteúdo
- `scripts/qa-layout.mjs` — QA estrutural

## Projeto local

```bash
npm install
npm run dev
```

## GitHub Pages

O projeto usa `base: '/nexo/'` em `vite.config.js`. O workflow de `.github/workflows/deploy.yml` constrói e publica o diretório `dist`.

A autenticação desta versão é local, no navegador. Não é autenticação de produção.

## Estado atual

A versão 6.3.0 expande Europa Medieval, amplia questões e flashcards, adiciona a central de Questões, organiza a Home por disciplina e matéria e adiciona mapas de síntese para as matérias ativas.
