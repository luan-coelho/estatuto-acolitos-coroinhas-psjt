# Estatuto da Pastoral dos Acólitos e Coroinhas

Este repositório reúne o Estatuto e Regimento Interno da Pastoral dos Acólitos e Coroinhas da Paróquia São Judas Tadeu, da Arquidiocese de Palmas, e o portal público construído com Astro Starlight.

## Documentos

- [`estatuto.md`](estatuto.md): fonte oficial do texto exibido no portal.
- [`resumo-para-os-servidores.md`](resumo-para-os-servidores.md): resumo destinado às crianças e aos jovens.
- [`termo-de-compromisso.md`](termo-de-compromisso.md): formulário individual de compromisso.

Nesta primeira versão, somente o Estatuto é publicado no portal. O resumo e o termo permanecem como documentos separados.

## Desenvolvimento local

É necessário ter o [Bun](https://bun.sh/) instalado.

```bash
bun install --frozen-lockfile
bun run dev
```

O servidor local informa no terminal o endereço de acesso. Antes de iniciar, o comando gera a página do Starlight a partir do `estatuto.md`.

## Validação

```bash
bun run test
bun run check
bun run build
```

O build completo confirma a estrutura do documento, executa a verificação do Astro e gera o site estático em `dist/`.

Para revisar o resultado de produção localmente:

```bash
bun run preview
```

## Atualização do conteúdo

Edite sempre o arquivo `estatuto.md` da raiz. A pasta `src/content/docs/` é gerada automaticamente e não deve ser editada ou versionada.

O sincronizador conserva o texto normativo e adapta somente a hierarquia dos títulos para que capítulos e artigos funcionem corretamente no sumário e nos links do site.

## Impressão

Na página do Estatuto, use **Imprimir documento** ou **Ctrl+P** (Windows/Linux) / **Cmd+P** (macOS). O botão abre a impressão nativa do navegador.

Para o formato preparado, selecione papel **A4**, orientação **retrato** e escala **100%**. Mantenha as margens definidas pela página e desative os cabeçalhos e rodapés automáticos do navegador. Não é necessário imprimir gráficos de fundo.

A impressão usa texto de 12 pt, fundo branco e margens de 20 mm. A navegação fica oculta, e a aprovação paroquial começa em página própria, com as assinaturas e a data preenchida.

## Publicação no Cloudflare Workers

O portal é totalmente estático. O arquivo `wrangler.jsonc` orienta o Wrangler a publicar o conteúdo de `dist/`, sem servidor ou adaptador SSR.

Para validar o pacote sem publicar:

```bash
bun run deploy:dry-run
```

Para autenticar e publicar:

```bash
bunx wrangler login
bun run deploy
```

No Cloudflare Workers Builds, conecte este repositório e use:

- branch de produção: `main`;
- comando de build: `bun run build`;
- comando de deploy: `bunx wrangler deploy`.
- variável de ambiente `SITE_URL`: endereço público completo do portal, sem barra final.

`SITE_URL` permite que o Astro gere o sitemap e as URLs canônicas com o endereço definitivo. Um domínio personalizado pode ser associado posteriormente no painel da Cloudflare; nesse caso, atualize a variável para o novo endereço.
