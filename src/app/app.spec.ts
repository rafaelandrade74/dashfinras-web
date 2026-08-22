import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import Keycloak from 'keycloak-js';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([])
      ],
      declarations: [
        App
      ],
      providers: [{ provide: Keycloak, useValue: { authenticated: false } }],
    })
      .compileComponents();
  });

  it('should create the app', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    await fixture.whenStable();
    expect(app).toBeTruthy();
  });

  it('should hide the toolbar when the user is not authenticated', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-toolbar')).toBeNull();
  });
});
