import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { DwcPicker } from '../../shared/ui/dwc-picker/dwc-picker';
import { Api } from '../../core/api/api';
import { label } from '../../core/i18n/localization';
import type { Term } from '../catalog/models/catalog-term';
import { CONTEXTS, type Context, type ValidationConfiguration } from './models/validation-configuration';

@Component({
  selector: 'app-validation-configuration',
  imports: [DwcPicker],
  templateUrl: './validation-configuration.html',
})
export class ValidationConfigurationEditor {
  readonly configuration = input.required<ValidationConfiguration>();
  readonly terms = input.required<Term[]>();
  readonly client = inject(QueryClient);
  private readonly api = inject(Api);
  readonly label = label;
  readonly contexts = CONTEXTS;
  readonly context = signal<Context>('collection');
  readonly draft = signal<ValidationConfiguration | undefined>(undefined);
  readonly dirty = signal(false);
  readonly dirtyChanged = output<boolean>();
  readonly field = signal('');
  readonly notice = signal('');
  readonly refreshError = signal('');
  readonly refreshing = signal(false);
  readonly fields = computed(() => this.draft()?.contexts.find(item => item.context === this.context())?.requiredFields ?? []);
  readonly fieldError = computed(() => {
    const value = this.field();
    if (!value.trim()) return 'Escriba un campo no vacío.';
    if (value.length > 200) return 'El campo no puede superar 200 caracteres.';
    if (this.fields().includes(value)) return 'Este campo ya es obligatorio en el contexto.';
    if (this.fields().length >= 500) return 'No se pueden agregar más de 500 campos por contexto.';
    return '';
  });
  readonly mutation = injectMutation(() => ({
    mutationFn: (body: ValidationConfiguration) => this.api.updateValidationConfiguration(body),
    onSuccess: async saved => {
      await this.client.cancelQueries({ queryKey: ['validation-configuration'] });
      this.client.setQueryData(['validation-configuration'], saved);
      this.draft.set(structuredClone(saved));
      this.dirty.set(false);
      this.notice.set('Configuración guardada en el servidor.');
      await this.client.invalidateQueries({ queryKey: ['validation-configuration'] });
    },
  }));
  constructor() {
    effect(() => this.dirtyChanged.emit(this.dirty() || !!this.field()));
    effect(() => {
      const incoming = this.configuration();
      // Only a new server input may initialize a clean draft. Local save/refresh
      // transitions must not reapply an older input before Query notifies the shell.
      untracked(() => {
        if (!this.dirty()) this.draft.set(structuredClone(incoming));
      });
    });
  }
  chooseContext(event: Event) {
    this.context.set((event.target as HTMLSelectElement).value as Context);
    this.field.set('');
  }
  add() {
    if (this.fieldError() || this.mutation.isPending() || this.refreshing()) return;
    this.changeFields([...this.fields(), this.field()]);
    this.field.set('');
  }
  remove(field: string) {
    if (this.mutation.isPending() || this.refreshing()) return;
    this.changeFields(this.fields().filter(value => value !== field));
  }
  private changeFields(requiredFields: string[]) {
    this.dirty.set(true);
    this.notice.set('');
    this.draft.update(draft => draft && ({ ...draft, contexts: draft.contexts.map(item =>
      item.context === this.context() ? { ...item, requiredFields } : item) }));
  }
  save() {
    const draft = this.draft();
    if (!draft || !this.dirty() || this.mutation.isPending() || this.refreshing()) return;
    this.notice.set('');
    this.mutation.mutate(structuredClone(draft));
  }
  async refresh() {
    if (this.mutation.isPending() || this.refreshing()) return;
    this.refreshing.set(true);
    this.refreshError.set('');
    this.notice.set('');
    try {
      await this.client.cancelQueries({ queryKey: ['validation-configuration'] });
      const latest = await this.client.fetchQuery({
        queryKey: ['validation-configuration'], staleTime: 0,
        queryFn: ({ signal }) => this.api.validationConfiguration(signal),
      });
      this.draft.set(structuredClone(latest));
      this.dirty.set(false);
      this.field.set('');
      this.mutation.reset();
      this.notice.set('Configuración actualizada desde el servidor.');
    } catch (error) {
      this.refreshError.set(error instanceof Error ? error.message : 'No se pudo actualizar la configuración.');
    } finally { this.refreshing.set(false); }
  }
}
