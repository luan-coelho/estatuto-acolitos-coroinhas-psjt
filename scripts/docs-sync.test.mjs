import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, transformStatute } from './docs-sync.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const source = await readFile(path.join(root, 'estatuto.md'), 'utf8');
const transformed = transformStatute(source);

function nonHeadingLines(value) {
  const lines = value
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .filter((line) => !/^#{1,6}\s+/u.test(line));

  while (lines[0] === '') lines.shift();
  while (lines.at(-1) === '') lines.pop();
  return lines;
}

describe('sincronização do estatuto', () => {
  test('mantém a configuração do documento segura e explícita', async () => {
    const config = await loadConfig(root);
    expect(config.documents).toHaveLength(1);
    expect(config.documents[0]).toMatchObject({
      source: 'estatuto.md',
      destination: 'index.md',
      slug: '',
    });
  });

  test('gera uma hierarquia semântica sem título h1 no corpo', () => {
    expect(transformed).not.toMatch(/^#\s+/mu);
    expect(transformed.match(/^## CAPÍTULO\s+/gmu)).toHaveLength(7);
    expect([...transformed.matchAll(/^### Art\. (\d+)º?$/gmu)].map(([, number]) => Number(number)))
      .toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(transformed).toContain('## CAPÍTULO I — DA FINALIDADE E DA ORGANIZAÇÃO');
    expect(transformed).toContain('## APROVAÇÃO PAROQUIAL');
  });

  test('preserva todas as linhas não estruturais do texto oficial', () => {
    const sourceBeforeSignatures = source.split(/^_{10,}/mu, 1)[0];
    const generatedBeforeSignatures = transformed.split('<div class="approval-fields"', 1)[0];

    expect(nonHeadingLines(generatedBeforeSignatures)).toEqual(nonHeadingLines(sourceBeforeSignatures));
    expect(transformed.match(/class="approval-field(?:\s|"|--)/gu)).toHaveLength(4);
    expect(transformed.match(/Pela Coordenação dos Acólitos e Coroinhas/gu)).toHaveLength(2);
    expect(transformed).toContain('Local e data');
  });
});
