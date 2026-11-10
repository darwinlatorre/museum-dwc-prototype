import { TestBed } from '@angular/core/testing';
import { RouterOutlet, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { App } from './app';

describe('App', () => {
  it('delega toda la composición al outlet', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.debugElement.query(By.directive(RouterOutlet))).toBeTruthy();
    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
  });
});
