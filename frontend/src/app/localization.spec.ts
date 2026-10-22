import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { Profiles } from './profiles';
import { Catalog } from './catalog';
import { Api } from './api';
import { Profile } from './analysis/model';
import { profileDescription, ruleMessage, spanish } from './localization';

const published = (): Profile => ({
  id: 'ea25b7e8-9d05-5427-8e0d-c0200785fb2d',
  name: 'Museo',
  version: '1.0',
  status: 'PUBLISHED',
  revision: 0,
  description:
    'Museum-specific mandatory fields, independently versioned; these are not universal Darwin Core requirements.',
  rules: [
    {
      field: 'catalogNumber',
      kind: 'required',
      condition: 'always',
      severity: 'ERROR',
      message: 'catalogNumber is required for this context.',
      source: 'Original evidence',
    },
  ],
});

describe('Spanish profile presentation', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [Profiles, Catalog],
      providers: [provideTanStackQuery(new QueryClient())],
    });
    await TestBed.compileComponents();
  });
  it('renders published seed translations without changing the profile or the editable duplicate', async () => {
    const original = published();
    const before = structuredClone(original);
    const fixture = TestBed.createComponent(Profiles);
    fixture.componentRef.setInput('profiles', [original]);
    fixture.componentRef.setInput('terms', []);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Publicado');
    expect(root.textContent).toContain('Campos obligatorios propios del museo');
    fixture.componentInstance.edit(original);
    await fixture.whenStable();
    expect(root.querySelector('textarea')?.value).toBe(profileDescription(original));
    expect(
      [...root.querySelectorAll('input')].some(
        (el) => el.value === 'catalogNumber es obligatorio en este contexto.' && el.disabled,
      ),
    ).toBe(true);
    expect([...root.querySelectorAll('select')].every((el) => el.disabled)).toBe(true);
    expect(root.textContent).toContain('Siempre');
    expect(root.textContent).toContain('Advertencia');
    expect(root.textContent).toContain('Valor y columna obligatorios');
    // Signal Forms adds an internal symbol to array entries; compare the public JSON contract.
    expect(JSON.parse(JSON.stringify(fixture.componentInstance.model().rules[0]))).toEqual(
      original.rules[0],
    );
    fixture.componentInstance.duplicate(original);
    await fixture.whenStable();
    expect(fixture.componentInstance.locked()).toBe(false);
    expect(JSON.parse(JSON.stringify(fixture.componentInstance.model().rules))).toEqual(
      original.rules,
    );
    expect(fixture.componentInstance.model().description).toBe(original.description);
    expect(fixture.componentInstance.model().version).toBe('');
    expect(original).toEqual(before);
    fixture.componentInstance.create();
    await fixture.whenStable();
    expect(root.textContent).toContain('Nuevo perfil');
    expect(fixture.componentInstance.model()).toEqual({
      name: '',
      version: '',
      description: '',
      rules: [],
    });
  });
  it('leaves arbitrary names, descriptions, rule text, and catalog quotations intact', async () => {
    const custom = {
      ...published(),
      id: 'custom',
      name: 'My collection',
      description: 'My description',
    };
    expect(profileDescription(custom)).toBe('My description');
    expect(ruleMessage(custom, custom.rules[0])).toBe(
      'catalogNumber is required for this context.',
    );
    const fixture = TestBed.createComponent(Catalog);
    const term = {
      name: 'scientificName',
      uri: 'http://rs.tdwg.org/dwc/terms/scientificName',
      definition: 'The full scientific name.',
      category: 'Taxon',
      status: 'recommended',
    };
    fixture.componentRef.setInput('terms', [term]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('inglés');
    expect(root.querySelector('[lang=en]')?.textContent).toBe(term.definition);
    expect(root.textContent).toContain('scientificName');
    expect(term.definition).toBe('The full scientific name.');
    expect(spanish.aria.nextPageLabel).toBe('Página siguiente');
    expect(spanish.accept).toBe('Aceptar');
  });
});

describe('API localization preserves request contracts', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('still publishes with zero bytes and edits with original enums and revision', async () => {
    const profile = published();
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => profile });
    vi.stubGlobal('fetch', fetch);
    const api = new Api();
    await api.publish(profile);
    expect(fetch).toHaveBeenLastCalledWith('/api/profiles/' + profile.id + '/publish', {
      method: 'POST',
      signal: undefined,
      headers: undefined,
      body: undefined,
    });
    await api.update(profile, profile);
    const body = JSON.parse(fetch.mock.lastCall![1].body);
    expect(body.revision).toBe(0);
    expect(body.status).toBe('PUBLISHED');
    expect(body.rules).toEqual(profile.rules);
  });
  it('shows Spanish failure guidance without changing server data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        text: async () => 'La versión ya está publicada',
      }),
    );
    await expect(new Api().publish(published())).rejects.toThrow(
      'API 409: La versión ya está publicada. No se guardaron los cambios. Actualice los datos antes de volver a intentarlo.',
    );
  });
});
