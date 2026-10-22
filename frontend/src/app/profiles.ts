import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField, required, applyEach, disabled } from '@angular/forms/signals';
import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Api } from './api';
import { Profile, ProfileInput, Rule, Term } from './analysis/model';

const empty = (): ProfileInput => ({ name: '', version: '', description: '', rules: [] });
@Component({
  selector: 'app-profiles',
  imports: [FormField, TableModule, ButtonModule],
  template: `
    <div class="section-heading">
      <div>
        <h2>Validation profiles</h2>
        <p>Published versions are immutable. Duplicate a version to evolve its rules.</p>
      </div>
      <p-button label="Create profile" (onClick)="create()" />
    </div>
    <label class="search"
      >Find a profile<input
        type="search"
        [formField]="searchForm.text"
        placeholder="Name, version or status"
    /></label>
    <p-table
      [value]="filtered()"
      [paginator]="true"
      [rows]="10"
      [tableStyle]="{ 'min-width': '42rem' }"
    >
      <ng-template #header
        ><tr>
          <th>Profile</th>
          <th>Version</th>
          <th>Status</th>
          <th>Rules</th>
          <th>Actions</th>
        </tr></ng-template
      >
      <ng-template #body let-profile
        ><tr>
          <td>
            <strong>{{ profile.name }}</strong
            ><small>{{ profile.description }}</small>
          </td>
          <td>{{ profile.version }}</td>
          <td>
            <span class="badge" [class.published]="profile.status === 'PUBLISHED'">{{
              profile.status
            }}</span>
          </td>
          <td>{{ profile.rules.length }}</td>
          <td class="actions">
            <button (click)="edit(profile)">
              {{ profile.status === 'DRAFT' ? 'Edit draft' : 'View rules' }}</button
            ><button (click)="duplicate(profile)">Duplicate</button>
            @if (profile.status === 'DRAFT') {
              <button [disabled]="mutation.isPending()" (click)="publish(profile)">Publish</button>
            }
          </td>
        </tr></ng-template
      >
      <ng-template #emptymessage
        ><tr>
          <td colspan="5">No profiles. Create a draft to define collection requirements.</td>
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
                ? 'Duplicate profile'
                : selected()?.status === 'PUBLISHED'
                  ? 'Published profile'
                  : selected()
                    ? 'Edit draft'
                    : 'New profile'
            }}
          </h3>
          <button (click)="open.set(false)">Close editor</button>
        </div>
        @if (mode() === 'duplicate') {
          <p>All rules will be copied to a new draft. Choose its name and version.</p>
        }
        <form (submit)="save(); $event.preventDefault()">
          <div class="form-grid">
            <label>Name<input [formField]="editor.name" /></label
            ><label>Version<input [formField]="editor.version" /></label>
          </div>
          @if (mode() !== 'duplicate') {
            <label>Description<textarea [formField]="editor.description"></textarea></label>
            <h4>Rules</h4>
            <p>
              Required checks column presence and nonempty values. Required column checks only the
              header. Conditions use explicit import context.
            </p>
            <div class="rule-list">
              @for (rule of editor.rules; track $index; let i = $index) {
                <fieldset>
                  <legend>Rule {{ i + 1 }}</legend>
                  <div class="form-grid">
                    <label
                      >Darwin Core field<input [formField]="rule.field" list="dwc-fields"
                    /></label>
                    <label
                      >Check<select [formField]="rule.kind">
                        <option value="required">Required value + column</option>
                        <option value="requiredColumn">Required column only</option>
                        <option value="date">Calendar date</option>
                        <option value="latitude">Latitude</option>
                        <option value="longitude">Longitude</option>
                      </select></label
                    >
                    <label
                      >Condition<select [formField]="rule.condition">
                        @for (condition of conditions; track condition) {
                          <option [value]="condition">{{ condition }}</option>
                        }
                      </select></label
                    >
                    <label
                      >Severity<select [formField]="rule.severity">
                        <option value="ERROR">Error</option>
                        <option value="WARNING">Warning</option>
                      </select></label
                    >
                    <label>Diagnostic message<input [formField]="rule.message" /></label
                    ><label>Evidence / source<input [formField]="rule.source" /></label>
                  </div>
                  @if (!locked()) {
                    <button type="button" (click)="removeRule(i)">Remove rule</button>
                  }
                </fieldset>
              } @empty {
                <p>No rules yet. Add only the fields this profile actually requires.</p>
              }
            </div>
            @if (!locked()) {
              <button type="button" (click)="addRule()">Add rule</button>
            }
          }
          @if (!locked()) {
            <div class="editor-footer">
              <p-button
                type="submit"
                [label]="mode() === 'duplicate' ? 'Create duplicate' : 'Save draft'"
                [disabled]="editor().invalid() || mutation.isPending()"
              /><span>Publishing is a separate action.</span>
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
      `${p.name} ${p.version} ${p.status}`.toLowerCase().includes(this.search().text.toLowerCase()),
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
      this.notice.set('Profile saved on the server.');
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
    if (
      confirm(`Publish ${profile.name} ${profile.version}? This version can no longer be edited.`)
    )
      this.mutation.mutate(() => this.api.publish(profile));
  }
}
