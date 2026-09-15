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
