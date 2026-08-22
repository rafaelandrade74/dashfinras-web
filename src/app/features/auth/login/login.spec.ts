import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Keycloak from 'keycloak-js';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let loginMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loginMock = vi.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([]),
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
      ],
      declarations: [Login],
      providers: [{ provide: Keycloak, useValue: { login: loginMock } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect straight to Keycloak on init', () => {
    expect(loginMock).toHaveBeenCalledOnce();
    expect(component.carregando).toBe(true);
  });
});
