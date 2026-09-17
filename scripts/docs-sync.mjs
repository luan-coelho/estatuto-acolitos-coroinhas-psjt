import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const generatedRoot = path.join(repositoryRoot, 'src/content/docs');

function fail(message) {
  throw new Error(message);
}

function safeRelativePath(value, label) {
  if (
    typeof value !== 'string'
    || !value
    || path.isAbsolute(value)
    || value.split(/[\\/]/u).includes('..')
  ) {
    fail(`${label} inválido: ${JSON.stringify(value)}.`);
  }

  return value;
}

export async function loadConfig(root = repositoryRoot) {
  const raw = await readFile(path.join(root, 'portal.config.json'), 'utf8');
  const config = JSON.parse(raw);

  if (
    config.version !== 1
    || typeof config.title !== 'string'
    || typeof config.description !== 'string'
    || !config.locale
    || typeof config.locale.label !== 'string'
    || typeof config.locale.lang !== 'string'
    || !Array.isArray(config.documents)
    || config.documents.length === 0
  ) {
    fail('Configuração do portal inválida.');
  }

  for (const document of config.documents) {
    safeRelativePath(document.source, 'Documento de origem');
    safeRelativePath(document.destination, 'Destino gerado');
    if (
      typeof document.slug !== 'string'
      || typeof document.title !== 'string'
      || typeof document.sidebarLabel !== 'string'
    ) {
      fail(`Metadados inválidos para ${document.source}.`);
    }
  }

  return config;
}

export function transformStatute(source) {
  const lines = source.replace(/\r\n?/gu, '\n').split('\n');

  if (!/^#\s+ESTATUTO E REGIMENTO INTERNO\s*$/u.test(lines[0] ?? '')) {
    fail('O estatuto deve começar com o título principal esperado.');
  }
  if (!/^##\s+DOS ACÓLITOS E COROINHAS/u.test(lines[1] ?? '')) {
    fail('O estatuto deve conter o subtítulo institucional esperado.');
  }

  const output = [];
  for (let index = 2; index < lines.length; index += 1) {
    const line = lines[index];
    const chapter = line.match(/^#\s+(CAPÍTULO\s+.+?)\s*$/u);
    const chapterTitle = lines[index + 1]?.match(/^##\s+(.+?)\s*$/u);

    if (chapter && chapterTitle) {
      output.push(`## ${chapter[1]} — ${chapterTitle[1]}`);
      index += 1;
      continue;
    }

    if (/^#\s+(?:PREÂMBULO|REFERÊNCIAS NORMATIVAS|APROVAÇÃO PAROQUIAL)\s*$/u.test(line)) {
      output.push(line.replace(/^#\s+/u, '## '));
      continue;
    }

    if (/^#\s+/u.test(line)) {
      fail(`Título de primeiro nível inesperado: ${line}`);
    }

    output.push(line);
  }

  const signaturePattern = /^_{10,}[ \t]*\n\*\*Pe\. _{10,}\*\*[ \t]*\nPároco\n\n_{10,}[ \t]*\n\*\*_{10,}\*\*[ \t]*\nCoordenador dos Acólitos e Coroinhas\n\n_{10,}[ \t]*\n\*\*_{10,}\*\*[ \t]*\nCoordenadora dos Acólitos e Coroinhas\n\n_{10,}[ \t]*\n\*\*Local e data\*\*[ \t]*$/mu;
  const signatureFields = `<div class="approval-fields" aria-label="Campos de aprovação">
  <div class="approval-field">
    <span class="approval-field__signature" aria-hidden="true"></span>
    <span><strong>Pe.</strong> — Pároco</span>
  </div>
  <div class="approval-field">
    <span class="approval-field__signature" aria-hidden="true"></span>
    <span>Coordenador dos Acólitos e Coroinhas</span>
  </div>
  <div class="approval-field">
    <span class="approval-field__signature" aria-hidden="true"></span>
    <span>Coordenadora dos Acólitos e Coroinhas</span>
  </div>
  <div class="approval-field approval-field--date">
    <span class="approval-field__signature" aria-hidden="true"></span>
    <strong>Local e data</strong>
  </div>
</div>`;
  const body = output.join('\n').replace(/^\n+/u, '').replace(/\n*$/u, '\n');

  if (!signaturePattern.test(body)) {
    fail('O bloco de aprovação do estatuto não está no formato esperado.');
  }

  return body.replace(signaturePattern, `${signatureFields}\n`);
}

function frontmatter(document, portal) {
  return [
    '---',
    `title: ${JSON.stringify(document.title)}`,
    `description: ${JSON.stringify(portal.description)}`,
    'sidebar:',
    `  label: ${JSON.stringify(document.sidebarLabel)}`,
    '  order: 1',
    '---',
    '',
  ].join('\n');
}

export async function syncDocs(root = repositoryRoot) {
  const portal = await loadConfig(root);
  const targetRoot = path.join(root, 'src/content/docs');

  await rm(targetRoot, { recursive: true, force: true });
  await mkdir(targetRoot, { recursive: true });

  for (const document of portal.documents) {
    const sourcePath = path.join(root, document.source);
    const destinationPath = path.join(targetRoot, document.destination);
    const source = await readFile(sourcePath, 'utf8');
    const body = document.source === 'estatuto.md' ? transformStatute(source) : source;

    await mkdir(path.dirname(destinationPath), { recursive: true });
    await writeFile(destinationPath, `${frontmatter(document, portal)}${body}`, 'utf8');
  }

}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  await syncDocs();
  console.log(`Conteúdo sincronizado em ${path.relative(repositoryRoot, generatedRoot)}.`);
}
