import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(frontend, 'src/app');
const read = (path) => readFileSync(path, 'utf8');
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const required = [
  'features/catalog/catalog.ts', 'features/catalog/catalog.html',
  'features/catalog/models/catalog-term.ts',
  'features/profiles/profiles.ts', 'features/profiles/profiles.html',
  'features/profiles/models/profile.ts',
  'features/importer/workbench/import-workbench.ts',
  'features/importer/workbench/import-workbench.html',
  'features/importer/components/column-mapping/column-mapping.ts',
  'features/importer/components/record-context/record-context.ts',
  ...['parser', 'normalizer', 'validator', 'export', 'analysis.worker', 'analysis.spec']
    .map((name) => `features/importer/engine/${name}.ts`),
  ...['dataset', 'context', 'analysis-result', 'normalization', 'worker-protocol']
    .map((name) => `features/importer/models/${name}.ts`),
  'core/api/api.ts', 'core/i18n/localization.ts',
  'shared/ui/dwc-picker/dwc-picker.ts', 'shared/ui/dwc-picker/dwc-picker.spec.ts',
  ...['app', 'layout', 'evolution', 'localization'].map((name) => `testing/${name}.spec.ts`),
];
for (const path of required) assert.ok(existsSync(join(app, path)), `Falta ${path}`);
for (const path of ['catalog.ts', 'profiles.ts', 'api.ts', 'localization.ts',
  'import-workbench.ts', 'import-workbench.html', 'shared/dwc-picker.ts',
  'analysis/model.ts', 'analysis/parser.ts', 'analysis/analysis.worker.ts',
  'import/column-mapping.ts', 'import/record-context.ts', 'shared/models']) {
  assert.ok(!existsSync(join(app, path)), `Ruta antigua o genérica: ${path}`);
}

const sources = walk(join(frontend, 'src')).filter((path) => path.endsWith('.ts'));
const resolveImport = (file, specifier) => {
  const base = resolve(dirname(file), specifier);
  const target = [base + '.ts', join(base, 'index.ts'), base].find(existsSync);
  assert.ok(target, `Importación sin destino: ${relative(app, file)} → ${specifier}`);
  return target;
};
for (const file of sources) {
  const source = read(file);
  const name = relative(app, file).replaceAll('\\', '/');
  // Static imports/re-exports, side-effect imports and lazy imports all resolve locally.
  const imports = /(?:\b(?:import|export)\s+(?:type\s+)?[^;'"`]*?\bfrom\s*|\bimport\s*(?:\(\s*)?)(['"])(\.[^'"]+)\1/g;
  for (const match of source.matchAll(imports)) {
    const target = resolveImport(file, match[2]);
    const destination = relative(app, target).replaceAll('\\', '/');
    if (/^(core|shared)\//.test(name) && destination.startsWith('features/')) {
      assert.ok(destination.includes('/models/'), `Vista de feature importada desde ${name}`);
      assert.match(match[0], /^(?:import|export)\s+type\b/, `Contrato sin import type en ${name}`);
    }
    if (name.startsWith('features/importer/engine/')) {
      assert.ok(!destination.startsWith('core/api/'), `Transporte en motor local: ${name}`);
      assert.ok(!destination.includes('/components/') && !destination.includes('/workbench/'),
        `Vista importada desde motor: ${name}`);
    }
  }
  for (const match of source.matchAll(/(?:templateUrl|styleUrl)\s*:\s*['"]([^'"]+)['"]/g)) {
    assert.ok(existsSync(resolve(dirname(file), match[1])), `Recurso sin destino en ${name}: ${match[1]}`);
  }
}

const workbench = join(app, 'features/importer/workbench/import-workbench.ts');
const worker = read(workbench).match(/new Worker\(new URL\('([^']+)', import\.meta\.url\),\s*\{\s*type: 'module'/);
assert.ok(worker, 'El worker debe conservar la URL relativa analizable por Angular');
assert.equal(resolveImport(workbench, worker[1]), join(app, 'features/importer/engine/analysis.worker.ts'));
for (const name of ['Term', 'Profile', 'Rule', 'Dataset', 'Context', 'Issue',
  'Normalization', 'Change', 'WorkerRequest', 'WorkerResponse']) {
  const declarations = sources.filter((file) => !file.endsWith('.spec.ts') &&
    new RegExp(`export (?:interface|type) ${name}\\b`).test(read(file)));
  assert.equal(declarations.length, 1, `El contrato ${name} debe tener un único propietario`);
}
console.log('Arquitectura correcta: funcionalidades, contratos únicos, imports, recursos y worker local.');
