import { Component, computed, effect, inject, input, linkedSignal, output, signal, untracked } from '@angular/core';
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
  readonly requirements = computed(() => this.draft()?.contexts.find(item => item.context === this.context()));
  readonly required = computed(() => this.requirements()?.requiredFields ?? []);
  readonly optional = computed(() => this.requirements()?.optionalFields ?? []);
  // Presentation order survives state changes; persisted lists keep their own exact order.
  readonly fields = linkedSignal<{ context: Context; fields: string[] }, string[]>({
    source: () => ({ context: this.context(), fields: [...this.required(), ...this.optional()] }),
    computation: (source, previous) => {
      const retained = previous?.source.context === source.context
        ? previous.value.filter(field => source.fields.includes(field)) : [];
      return [...retained, ...source.fields.filter(field => !retained.includes(field))];
    },
  });
  readonly search = signal('');
  readonly sources = computed(() => this.contexts.map(context => {
    const item = this.draft()?.contexts.find(item => item.context === context);
    const required = item?.requiredFields.length ?? 0;
    const optional = item?.optionalFields?.length ?? 0;
    return { context, count: required + optional, required, optional };
  }));
  // Filtering is presentation-only: mutations always use the complete draft.
  readonly visibleFields = computed(() => this.fields().filter(field =>
    field.toLowerCase().includes(this.search().toLowerCase())));
  readonly fieldError = computed(() => {
    const value = this.field();
    if (!value.trim()) return 'Escriba un campo no vacío.';
    if (value.length > 200) return 'El campo no puede superar 200 caracteres.';
    if (this.fields().includes(value)) return 'Este campo ya está configurado en el contexto.';
    if (this.fields().length >= 500) return 'No se pueden agregar más de 500 campos por contexto.';
    return '';
  });
  readonly mutation = injectMutation(() => ({
    mutationFn: (body: ValidationConfiguration) => this.api.updateValidationConfiguration(body),
    onSuccess: async saved => {
      await this.client.cancelQueries({ queryKey: ['validation-configuration'] });
      this.client.setQueryData(['validation-configuration'], saved);
      this.draft.set(this.normalize(saved));
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
        if (!this.dirty()) this.draft.set(this.normalize(incoming));
      });
    });
  }
  chooseContext(event: Event) {
    this.context.set((event.currentTarget as HTMLButtonElement).value as Context);
    this.field.set('');
    this.search.set('');
  }
  add() {
    if (this.fieldError() || this.mutation.isPending() || this.refreshing()) return;
    this.changeFields([...this.required(), this.field()], this.optional());
    this.field.set('');
  }
  remove(field: string) {
    if (this.mutation.isPending() || this.refreshing()) return;
    this.changeFields(this.required().filter(value => value !== field), this.optional().filter(value => value !== field));
  }
  toggle(field: string) {
    if (this.mutation.isPending() || this.refreshing()) return;
    const required = this.required().includes(field);
    this.changeFields(required ? this.required().filter(value => value !== field) : [...this.required(), field],
      required ? [...this.optional(), field] : this.optional().filter(value => value !== field));
  }
  private normalize(configuration: ValidationConfiguration): ValidationConfiguration {
    const copy = structuredClone(configuration);
    return { ...copy, contexts: copy.contexts.map(item => ({ ...item, optionalFields: item.optionalFields ?? [] })) };
  }
  private changeFields(requiredFields: string[], optionalFields: string[]) {
    this.dirty.set(true);
    this.notice.set('');
    this.draft.update(draft => draft && ({ ...draft, contexts: draft.contexts.map(item =>
      item.context === this.context() ? { ...item, requiredFields, optionalFields } : item) }));
  }
  save() {
    const draft = this.draft();
    if (!draft || !this.dirty() || this.mutation.isPending() || this.refreshing()) return;
    this.notice.set('');
    this.mutation.mutate(this.normalize(draft));
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
      this.draft.set(this.normalize(latest));
      this.dirty.set(false);
      this.field.set('');
      this.mutation.reset();
      this.notice.set('Configuración actualizada desde el servidor.');
    } catch (error) {
      this.refreshError.set(error instanceof Error ? error.message : 'No se pudo actualizar la configuración.');
    } finally { this.refreshing.set(false); }
  }
}
