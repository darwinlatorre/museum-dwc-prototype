import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField, required, applyEach, disabled } from '@angular/forms/signals';
import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Api } from './api';
import { Profile, ProfileInput, Rule, Term } from './analysis/model';
import { label, profileDescription, ruleMessage } from './localization';

const empty = (): ProfileInput => ({ name: '', version: '', description: '', rules: [] });
@Component({
  selector: 'app-profiles',
  imports: [FormField, TableModule, ButtonModule],
  template: `
    <div class="section-heading">
      <div>
        <h2>Perfiles de validación</h2>
        <p>
          Las versiones publicadas son inmutables. Duplique una versión para modificar sus reglas.
        </p>
      </div>
      <p-button label="Crear perfil" (onClick)="create()" />
    </div>
    <label class="search"
      >Buscar un perfil<input
        type="search"
        [formField]="searchForm.text"
        placeholder="Nombre, versión o estado"
    /></label>
    <p-table
      [value]="filtered()"
      [paginator]="true"
      [rows]="10"
      [tableStyle]="{ 'min-width': '42rem' }"
    >
      <ng-template #header
        ><tr>
          <th>Perfil</th>
          <th>Versión</th>
          <th>Estado</th>
          <th>Reglas</th>
          <th>Acciones</th>
        </tr></ng-template
      >
      <ng-template #body let-profile
        ><tr>
          <td>
            <strong>{{ profile.name }}</strong
            ><small>{{ profileDescription(profile) }}</small>
          </td>
          <td>{{ profile.version }}</td>
          <td>
            <span class="badge" [class.published]="profile.status === 'PUBLISHED'">{{
              label(profile.status)
            }}</span>
          </td>
          <td>{{ profile.rules.length }}</td>
          <td class="actions">
            <button (click)="edit(profile)">
              {{ profile.status === 'DRAFT' ? 'Editar borrador' : 'Ver reglas' }}</button
            ><button (click)="duplicate(profile)">Duplicar</button>
            @if (profile.status === 'DRAFT') {
              <button [disabled]="mutation.isPending()" (click)="publish(profile)">Publicar</button>
            }
          </td>
        </tr></ng-template
      >
      <ng-template #emptymessage
        ><tr>
          <td colspan="5">
            No hay perfiles. Cree un borrador para definir los requisitos de la colección.
          </td>
        </tr></ng-template
      ></p-table
    >
    @if (mutation.error()) {
      <p role="alert" class="error">{{ mutation.error()?.message }}</p>
    }
    @if (notice()) {
      <p role="status" class="notice">{{ notice() }}</p>
    }
    @if (open()) {
      <section class="editor" aria-labelledby="editor-title">
        <div class="section-heading">
          <h3 id="editor-title">
            {{
              mode() === 'duplicate'
                ? 'Duplicar perfil'
                : selected()?.status === 'PUBLISHED'
                  ? 'Perfil publicado'
                  : selected()
                    ? 'Editar borrador'
                    : 'Nuevo perfil'
            }}
          </h3>
          <button (click)="open.set(false)">Cerrar editor</button>
        </div>
        @if (mode() === 'duplicate') {
          <p>Todas las reglas se copiarán a un nuevo borrador. Elija su nombre y versión.</p>
        }
        <form (submit)="save(); $event.preventDefault()">
          <div class="form-grid">
            <label>Nombre<input [formField]="editor.name" /></label
            ><label>Versión<input [formField]="editor.version" /></label>
          </div>
          @if (mode() !== 'duplicate') {
            <label
              >Descripción
              @if (locked()) {
                <textarea [value]="profileDescription(selected()!)" disabled></textarea>
              } @else {
                <textarea [formField]="editor.description"></textarea>
              }
            </label>
            <h4>Reglas</h4>
            <p>
              La regla de valor obligatorio comprueba la presencia de la columna y los valores no
              vacíos. La regla de columna obligatoria comprueba solo el encabezado. Las condiciones
              usan el contexto declarado al importar.
            </p>
            <div class="rule-list">
              @for (rule of editor.rules; track $index; let i = $index) {
                <fieldset>
                  <legend>Regla {{ i + 1 }}</legend>
                  <div class="form-grid">
                    <label
                      >Campo Darwin Core<input [formField]="rule.field" list="dwc-fields"
                    /></label>
                    <label
                      >Validación<select [formField]="rule.kind">
                        <option value="required">Valor y columna obligatorios</option>
                        <option value="requiredColumn">Solo columna obligatoria</option>
                        <option value="date">Fecha del calendario</option>
                        <option value="latitude">Latitud</option>
                        <option value="longitude">Longitud</option>
                      </select></label
                    >
                    <label
                      >Condición<select [formField]="rule.condition">
                        @for (condition of conditions; track condition) {
                          <option [value]="condition">{{ label(condition) }}</option>
                        }
                      </select></label
                    >
                    <label
                      >Severidad<select [formField]="rule.severity">
                        <option value="ERROR">Error</option>
                        <option value="WARNING">Advertencia</option>
                      </select></label
                    >
                    <label
                      >Mensaje de diagnóstico
                      @if (locked()) {
                        <input [value]="ruleMessage(selected()!, model().rules[i])" disabled />
                      } @else {
                        <input [formField]="rule.message" />
                      }</label
                    ><label
                      >Evidencia / fuente (texto original)<input [formField]="rule.source"
                    /></label>
                  </div>
                  @if (!locked()) {
                    <button type="button" (click)="removeRule(i)">Eliminar regla</button>
                  }
                </fieldset>
              } @empty {
                <p>
                  Aún no hay reglas. Agregue solo los campos que este perfil realmente requiere.
                </p>
              }
            </div>
            @if (!locked()) {
              <button type="button" (click)="addRule()">Agregar regla</button>
            }
          }
          @if (!locked()) {
            <div class="editor-footer">
              <p-button
                type="submit"
                [label]="mode() === 'duplicate' ? 'Crear duplicado' : 'Guardar borrador'"
                [disabled]="editor().invalid() || mutation.isPending()"
              /><span>La publicación es una acción independiente.</span>
            </div>
          }
        </form>
        <datalist id="dwc-fields">
          @for (term of terms(); track term.name) {
            <option [value]="term.name"></option>
          }
        </datalist>
      </section>
    }
  `,
})
export class Profiles {
  label = label;
  profileDescription = profileDescription;
  ruleMessage = ruleMessage;
  profiles = input.required<Profile[]>();
  terms = input.required<Term[]>();
  api = inject(Api);
  client = injectQueryClient();
  selected = signal<Profile | undefined>(undefined);
  mode = signal<'edit' | 'duplicate'>('edit');
  open = signal(false);
  notice = signal('');
  search = signal({ text: '' });
  searchForm = form(this.search);
  filtered = computed(() =>
    this.profiles().filter((p) =>
      `${p.name} ${p.version} ${label(p.status)}`
        .toLowerCase()
        .includes(this.search().text.toLowerCase()),
    ),
  );
  model = signal<ProfileInput>(empty());
  locked = computed(() => this.mode() === 'edit' && this.selected()?.status === 'PUBLISHED');
  editor = form(this.model, (s) => {
    disabled(s, () => this.locked());
    required(s.name);
    required(s.version);
    applyEach(s.rules, (r) => {
      required(r.field);
      required(r.message);
    });
  });
  conditions = ['always', 'collection', 'permit', 'marine', 'sampling', 'permitAndCollection'];
  mutation = injectMutation(() => ({
    mutationFn: (action: () => Promise<Profile>) => action(),
    onSuccess: () => {
      this.open.set(false);
      this.notice.set('Perfil guardado en el servidor.');
      void this.client.invalidateQueries({ queryKey: ['profiles'] });
    },
  }));
  create() {
    this.selected.set(undefined);
    this.mode.set('edit');
    this.model.set(empty());
    this.open.set(true);
    this.notice.set('');
    this.mutation.reset();
  }
  edit(profile: Profile) {
    this.selected.set(profile);
    this.mode.set('edit');
    this.model.set(
      structuredClone({
        name: profile.name,
        version: profile.version,
        description: profile.description,
        rules: profile.rules,
      }),
    );
    this.open.set(true);
    this.notice.set('');
    this.mutation.reset();
  }
  duplicate(profile: Profile) {
    this.edit(profile);
    this.mode.set('duplicate');
    this.model.update((m) => ({ ...m, version: '' }));
  }
  addRule() {
    this.model.update((m) => ({
      ...m,
      rules: [
        ...m.rules,
        {
          field: '',
          kind: 'required',
          condition: 'always',
          severity: 'ERROR',
          message: '',
          source: '',
        },
      ],
    }));
  }
  removeRule(index: number) {
    this.model.update((m) => ({ ...m, rules: m.rules.filter((_, i) => i !== index) }));
  }
  save() {
    if (this.locked() || this.editor().invalid()) return;
    const selected = this.selected();
    const body = structuredClone(this.model());
    this.mutation.mutate(() =>
      this.mode() === 'duplicate' && selected
        ? this.api.duplicate(selected, body.name, body.version)
        : selected
          ? this.api.update(selected, body)
          : this.api.create(body),
    );
  }
  publish(profile: Profile) {
    if (confirm(`¿Publicar ${profile.name} ${profile.version}? Esta versión ya no podrá editarse.`))
      this.mutation.mutate(() => this.api.publish(profile));
  }
}
