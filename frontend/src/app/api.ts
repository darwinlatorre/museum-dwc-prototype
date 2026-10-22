import { Injectable } from '@angular/core';
import { Profile, ProfileInput, Term } from './analysis/model';

/** Metadata only: this service deliberately has no upload method. */
@Injectable({ providedIn: 'root' })
export class Api {
  async request<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
    const response = await fetch('/api/' + path, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `API ${response.status}: ${text.slice(0, 500) || response.statusText}. Changes were not saved. Refresh before retrying.`,
      );
    }
    return response.json() as Promise<T>;
  }
  catalog = (signal?: AbortSignal) => this.request<Term[]>('catalog', 'GET', undefined, signal);
  profiles = (signal?: AbortSignal) =>
    this.request<Profile[]>('profiles', 'GET', undefined, signal);
  create = (body: ProfileInput) => this.request<Profile>('profiles', 'POST', body);
  update = (profile: Profile, body: ProfileInput) =>
    this.request<Profile>('profiles/' + encodeURIComponent(profile.id), 'PUT', {
      ...body,
      revision: profile.revision,
    });
  duplicate = (profile: Profile, name: string, version: string) =>
    this.request<Profile>('profiles/' + encodeURIComponent(profile.id) + '/duplicate', 'POST', {
      name,
      version,
    });
  publish = (profile: Profile) =>
    this.request<Profile>('profiles/' + encodeURIComponent(profile.id) + '/publish', 'POST');
}
