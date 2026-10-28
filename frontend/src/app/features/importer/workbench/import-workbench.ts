import { afterRenderEffect, Component, computed, effect, ElementRef, inject, input, OnDestroy, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import type { Change } from '../models/normalization';
import type { Context } from '../models/context';
import { type Dataset, LIMITS } from '../models/dataset';
import type { Issue } from '../models/analysis-result';
import type { Profile } from '../../profiles/models/profile';
import type { Term } from '../../catalog/models/catalog-term';
import type { WorkerRequest, WorkerResponse } from '../models/worker-protocol';
import { normalize } from '../engine/normalizer';
import { missingCells, missingFields, requiredFields } from '../engine/required-fields';
import { ColumnMapping } from '../components/column-mapping/column-mapping';
import { RecordContext } from '../components/record-context/record-context';
import { csvReport, jsonReport } from '../engine/export';
import { label, profileDescription } from '../../../core/i18n/localization';

@Component({
  selector: 'app-import',
  imports: [FormField, TableModule, ButtonModule, ColumnMapping, RecordContext],
  templateUrl: './import-workbench.html',
  host: { '(window:resize)': 'scrollActiveStep()' },
})
export class ImportWorkbench implements OnDestroy {
  label = label;
  profileDescription = profileDescription;
  profiles = input.required<Profile[]>();
  terms = input.required<Term[]>();
  published = computed(() => this.profiles().filter((p) => p.status === 'PUBLISHED'));
  stages = [
    'Seleccionar archivo',
    'Contexto y validación',
    'Elegir perfiles',
    'Mapear columnas',
    'Diagnóstico',
    'Normalizar',
    'Finalizar',
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
  otherContext = signal(false);
  setContext(context: Context) {
    this.otherContext.set(false);
    this.context.set(context);
  }
  setOtherContext(other: boolean) {
    this.otherContext.set(other);
    if (other) this.context.set({ collection: false, permit: false, marine: false, sampling: false });
    this.invalidate();
  }
  busy = signal(false);
  error = signal('');
  issues = signal<Issue[] | undefined>(undefined);
  changes = signal<Change[]>([]);
  private diagnosticOptions = signal({ trim: false, emptyMarkers: false });
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
  selectedProfiles = computed(() => this.published().filter(p => this.selected().includes(p.id)));
  hasProfiles = computed(() => this.selectedProfiles().length > 0);
  missingHeaders = computed(() => requiredFields(this.selectedProfiles(), this.context(), true)
    .filter(field => !this.data()?.headers.includes(field)));
  missingSummary = computed(() => {
    const data = this.data();
    return data ? missingFields(data, this.mapping(), this.selectedProfiles(), this.context(), this.diagnosticOptions()) : [];
  });
  missingField = signal<string | undefined>(undefined);
  missingDetail = computed(() => {
    const data = this.data();
    const field = this.missingField();
    return data && field && this.issues() !== undefined &&
      this.missingSummary().some(item => item.field === field && !item.columnAbsent)
      ? missingCells(data, this.mapping(), field, this.diagnosticOptions()) : [];
  });
  showAllIssues = signal(false);
  detailHasChanges = computed(() => this.missingDetail().some(cell => cell.before !== cell.after));
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detailOpener?: HTMLButtonElement;
  private focusDetail = signal(false);
  openMissing(field: string, event: Event) {
    if (this.missingField() === field) {
      this.closeDetail();
      return;
    }
    this.detailOpener = event.currentTarget as HTMLButtonElement;
    this.showAllIssues.set(false);
    this.missingField.set(field);
    this.focusDetail.set(true);
  }
  openAllIssues(event: Event) {
    this.detailOpener = event.currentTarget as HTMLButtonElement;
    this.missingField.set(undefined);
    this.showAllIssues.set(true);
    this.focusDetail.set(true);
  }
  closeDetail() {
    this.missingField.set(undefined);
    this.showAllIssues.set(false);
    this.focusDetail.set(false);
    this.detailOpener?.focus({ preventScroll: true });
  }
  private resultStep = 4;
  canVisit(index: number) {
    if (index < 0 || index >= this.stages.length) return false;
    if (index === 0) return true;
    if (!this.data()) return false;
    if (index <= 2) return true;
    if (!this.hasProfiles() || this.missingHeaders().length) return false;
    if (index === 3) return true;
    if (!this.mappingValid()) return false;
    return this.issues() !== undefined;
  }
  visit(index: number) {
    if (this.canVisit(index)) this.step.set(index);
  }
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
    effect(() => {
      this.data();
      this.selected();
      this.mapping();
      this.missingField.set(undefined);
      this.showAllIssues.set(false);
    });
    afterRenderEffect(() => this.scrollActiveStep());
    afterRenderEffect(() => {
      const focus = this.focusDetail();
      const field = this.missingField();
      const all = this.showAllIssues();
      if (focus && this.step() === 4 && (field || all)) {
        this.host.nativeElement.querySelector<HTMLElement>(all ? '#all-issues-title' : '#missing-cell-title')
          ?.focus({ preventScroll: true });
      }
    });
  }
  protected scrollActiveStep() {
    const index = this.step();
    const strip = this.host.nativeElement.querySelector<HTMLElement>('.steps');
    const active = strip?.children[index] as HTMLElement | undefined;
    if (strip && active) {
      const bounds = strip.getBoundingClientRect();
      const item = active.getBoundingClientRect();
      const delta = item.left < bounds.left ? item.left - bounds.left
        : item.right > bounds.right ? item.right - bounds.right : 0;
      // Move only the horizontal strip, never the document or its vertical position.
      strip.scrollTo?.({ left: strip.scrollLeft + delta, behavior: 'instant' });
    }
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
    this.missingField.set(undefined);
    this.showAllIssues.set(false);
    this.focusDetail.set(false);
    this.detailOpener = undefined;
  }
  cancel() {
    this.invalidate();
    this.error.set('Procesamiento cancelado. No se enviaron datos al servidor.');
  }
  private dispatch(request: WorkerRequest) {
    this.worker?.terminate();
    this.error.set('');
    this.busy.set(true);
    const worker = new Worker(new URL('../engine/analysis.worker', import.meta.url), {
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
        this.step.set(this.resultStep);
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
    if (file) {
      this.invalidate();
      this.dispatch({ id: ++this.generation, kind: 'parse', file, sheet: this.sheet().name });
    }
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
  checked(event: Event) {
    return (event.target as HTMLInputElement).checked;
  }
  validate(normalizing = false) {
    const data = this.data();
    const profiles = this.selectedProfiles();
    if (!data || !profiles.length || this.missingHeaders().length || !this.mappingValid()) return;
    this.missingField.set(undefined);
    this.showAllIssues.set(false);
    this.focusDetail.set(false);
    this.resultStep = normalizing ? 5 : 4;
    this.diagnosticOptions.set(normalizing ? { ...this.options() } : { trim: false, emptyMarkers: false });
    this.dispatch({
      id: ++this.generation,
      kind: 'validate',
      data,
      mapping: this.mapping(),
      profiles,
      terms: this.terms(),
      context: this.context(),
      options: this.diagnosticOptions(),
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
