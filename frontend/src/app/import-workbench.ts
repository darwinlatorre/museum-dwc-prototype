import { Component, computed, effect, input, OnDestroy, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import {
  Change,
  Context,
  Dataset,
  Issue,
  LIMITS,
  Profile,
  Term,
  WorkerRequest,
  WorkerResponse,
} from './analysis/model';
import { normalize } from './analysis/normalizer';
import { suggestions } from './analysis/validator';
import { csvReport, jsonReport } from './analysis/export';
import { label, profileDescription } from './localization';

@Component({
  selector: 'app-import',
  imports: [FormField, TableModule, ButtonModule],
  templateUrl: './import-workbench.html',
})
export class ImportWorkbench implements OnDestroy {
  label = label;
  profileDescription = profileDescription;
  profiles = input.required<Profile[]>();
  terms = input.required<Term[]>();
  published = computed(() => this.profiles().filter((p) => p.status === 'PUBLISHED'));
  stages = [
    'Seleccionar archivo',
    'Elegir perfiles',
    'Mapear columnas',
    'Normalizar',
    'Contexto y validación',
    'Diagnóstico',
  ];
  step = signal(0);
  file = signal<File | undefined>(undefined);
  sheets = signal<string[]>([]);
  sheet = signal({ name: '' });
  sheetForm = form(this.sheet);
  data = signal<Dataset | undefined>(undefined);
  selected = signal<string[]>([]);
  mapping = signal<Record<string, string>>({});
  options = signal({ trim: false, emptyMarkers: false });
  optionForm = form(this.options);
  context = signal<Context>({ collection: false, permit: false, marine: false, sampling: false });
  contextForm = form(this.context);
  busy = signal(false);
  error = signal('');
  issues = signal<Issue[] | undefined>(undefined);
  changes = signal<Change[]>([]);
  filter = signal({ text: '', severity: '', profile: '' });
  filterForm = form(this.filter);
  filtered = computed(() =>
    (this.issues() ?? []).filter(
      (i) =>
        (!this.filter().severity || i.severity === this.filter().severity) &&
        (!this.filter().profile || `${i.profile} ${i.version}` === this.filter().profile) &&
        `${i.field} ${i.row ?? ''} ${i.description} ${i.profile} ${i.version}`
          .toLowerCase()
          .includes(this.filter().text.toLowerCase()),
    ),
  );
  issueProfiles = computed(() => [
    ...new Set((this.issues() ?? []).map((i) => `${i.profile} ${i.version}`)),
  ]);
  errors = computed(() => (this.issues() ?? []).filter((i) => i.severity === 'ERROR').length);
  warnings = computed(() => (this.issues() ?? []).filter((i) => i.severity === 'WARNING').length);
  preview = computed(() => {
    const data = this.data();
    return data
      ? normalize({ headers: data.headers, rows: data.rows.slice(0, 20) }, this.options()).changes
      : [];
  });
  mappedHeaders = computed(() => this.data()?.headers.map((h) => this.mapping()[h] || h) ?? []);
  mappingValid = computed(() => new Set(this.mappedHeaders()).size === this.mappedHeaders().length);
  private worker?: Worker;
  private generation = 0;
  constructor() {
    effect(() => {
      this.options();
      this.context();
      this.profiles();
      this.terms();
      this.invalidate();
    });
  }
  ngOnDestroy() {
    this.worker?.terminate();
  }
  invalidate() {
    this.generation++;
    this.worker?.terminate();
    this.worker = undefined;
    this.busy.set(false);
    this.issues.set(undefined);
    this.changes.set([]);
  }
  cancel() {
    this.invalidate();
    this.error.set('Procesamiento cancelado. No se enviaron datos al servidor.');
  }
  private dispatch(request: WorkerRequest) {
    this.worker?.terminate();
    this.error.set('');
    this.busy.set(true);
    const worker = new Worker(new URL('./analysis/analysis.worker', import.meta.url), {
      type: 'module',
    });
    this.worker = worker;
    worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      if (data.id !== this.generation) return;
      this.busy.set(false);
      worker.terminate();
      this.worker = undefined;
      if (data.kind === 'error') this.error.set(data.message);
      else if (data.kind === 'sheets') {
        this.sheets.set(data.sheets);
        this.sheet.set({ name: data.sheets[0] ?? '' });
      } else if (data.kind === 'parsed') {
        this.data.set(data.data);
        this.step.set(1);
      } else {
        this.issues.set(data.issues);
        this.changes.set(data.changes);
        this.step.set(5);
      }
    };
    worker.onerror = () => {
      if (request.id === this.generation) {
        this.busy.set(false);
        this.error.set(
          'El proceso local no pudo analizar este archivo. Pruebe con un CSV más pequeño.',
        );
        worker.terminate();
      }
    };
    worker.postMessage(request);
  }
  chooseFile(event: Event) {
    this.invalidate();
    this.data.set(undefined);
    this.sheets.set([]);
    this.mapping.set({});
    this.step.set(0);
    this.error.set('');
    const file = (event.target as HTMLInputElement).files?.[0];
    this.file.set(file);
    if (!file) return;
    if (file.size > LIMITS.bytes) {
      this.error.set('Se superó el límite del archivo (10 MiB).');
      return;
    }
    // Defer until reactive invalidation of previous inputs is complete.
    queueMicrotask(() => this.dispatch({ id: ++this.generation, kind: 'parse', file }));
  }
  loadSheet() {
    const file = this.file();
    if (file)
      this.dispatch({ id: ++this.generation, kind: 'parse', file, sheet: this.sheet().name });
  }
  toggleProfile(id: string, checked: boolean) {
    this.invalidate();
    this.selected.update((ids) =>
      checked ? [...new Set([...ids, id])] : ids.filter((i) => i !== id),
    );
  }
  map(header: string, value: string) {
    this.invalidate();
    this.mapping.update((m) => ({ ...m, [header]: value }));
  }
  suggest(header: string) {
    return suggestions(header, this.terms());
  }
  value(event: Event) {
    return (event.target as HTMLInputElement).value;
  }
  checked(event: Event) {
    return (event.target as HTMLInputElement).checked;
  }
  validate() {
    const data = this.data();
    const profiles = this.published().filter((p) => this.selected().includes(p.id));
    if (!data || !profiles.length || !this.mappingValid()) return;
    this.dispatch({
      id: ++this.generation,
      kind: 'validate',
      data,
      mapping: this.mapping(),
      profiles,
      terms: this.terms(),
      context: this.context(),
      options: this.options(),
    });
  }
  download(kind: 'json' | 'csv') {
    const issues = this.issues();
    if (!issues) return;
    const blob = new Blob([kind === 'json' ? jsonReport(issues) : csvReport(issues)], {
      type: kind === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostico-museo.${kind}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
