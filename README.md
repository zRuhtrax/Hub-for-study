# NEXO · versão universal

Projeto em React + Vite preparado para GitHub Pages.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

O projeto já está configurado para o repositório `nexo`:

- Vite usa `base: '/nexo/'`.
- O workflow em `.github/workflows/deploy.yml` instala as dependências, cria o build e publica a pasta `dist`.
- No GitHub, em **Settings → Pages**, selecione **GitHub Actions** como fonte de publicação.

Depois de um push na branch `main`, o site será publicado em:

`https://SEU_USUARIO.github.io/nexo/`

## Arquitetura

- `src/content.js`: conteúdo da base de estudos.
- `src/main.jsx`: estado, navegação, estudo, prática, revisão e configurações.
- `src/styles.css`: sistema visual, modo computador/celular e tema claro/escuro.
- `vite.config.js`: configuração do Vite para o subcaminho do GitHub Pages.
- `.github/workflows/deploy.yml`: build e publicação automáticos.

## Observação sobre login

A autenticação desta versão é apenas local e funciona neste dispositivo por meio de `localStorage`. Ela não é uma autenticação de produção nem sincroniza contas entre dispositivos.


## v6.0 - arquitetura de estudo

A interface de Aprender foi reorganizada como uma superfície editorial de estudo, com segmentação, sinalização e maior proximidade entre texto e representação visual. A proposta segue princípios de design multimídia associados à redução de carga extrínseca e à segmentação do conteúdo.

A revisão usa uma fila adaptativa baseada em domínio, dificuldade, estabilidade e atraso, em vez de depender apenas de uma alternância binária entre lembrar e esquecer. As perguntas de múltipla escolha passam por uma auditoria local para detectar alternativas duplicadas e formulações potencialmente entregadoras.

Use `npm run audit` para executar a auditoria de conteúdo antes de publicar.


## Pesquisa de referência
A estrutura visual dos esquemas de atmosfera e ENSO foi redesenhada a partir de referências educacionais da NOAA/PMEL. O NEXO mantém as representações como SVG local para funcionar de forma estável no GitHub Pages.

A lógica pedagógica de recuperação ativa e espaçamento segue princípios consolidados da literatura de aprendizagem; o calendário foi desenhado para transformar intenção de estudo em blocos executáveis.
