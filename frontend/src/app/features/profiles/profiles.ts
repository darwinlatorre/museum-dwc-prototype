import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField, required, applyEach, disabled } from '@angular/forms/signals';
import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DwcPicker } from '../../shared/ui/dwc-picker/dwc-picker';
import { Api } from '../../core/api/api';
import type { Profile, ProfileInput, Rule } from './models/profile';
import type { Term } from '../catalog/models/catalog-term';
import { label, profileDescription, ruleMessage } from '../../core/i18n/localization';

const empty = (): ProfileInput => ({ name: '', version: '', description: '', rules: [] });
@Component({
  selector: 'app-profiles',
  imports: [FormField, TableModule, ButtonModule, DialogModule, DwcPicker],
  templateUrl: './profiles.html',
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
  private opener?: HTMLElement;
  readonly editorTitle = computed(() => this.mode() === 'duplicate'
    ? 'Duplicar perfil'
    : this.locked() ? 'Perfil publicado' : this.selected() ? 'Editar borrador' : 'Nuevo perfil');
  restoreFocus() {
    if (this.opener?.isConnected) this.opener.focus();
  }
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
    this.opener = document.activeElement as HTMLElement;
    this.selected.set(undefined);
    this.mode.set('edit');
    this.model.set(empty());
    this.open.set(true);
    this.notice.set('');
    this.mutation.reset();
  }
  edit(profile: Profile) {
    this.opener = document.activeElement as HTMLElement;
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
