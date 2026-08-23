import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../../core/services/auth.service';
import { PainelList } from './painel-list';

describe('PainelList', () => {
  let component: PainelList;
  let fixture: ComponentFixture<PainelList>;
  let httpMock: HttpTestingController;
  let authServiceMock: { logout: ReturnType<typeof vi.fn>; nomeUsuario?: string };

  beforeEach(async () => {
    authServiceMock = { logout: vi.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [MatProgressSpinnerModule, MatTableModule, RouterModule.forRoot([])],
      declarations: [PainelList],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PainelList);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await fixture.whenStable();
    httpMock.expectOne((req) => req.url.endsWith('/painel')).flush({ paineis: [], page: 1, pageSize: 10 });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate an empty panel list once the request resolves', () => {
    expect(component.carregando()).toBe(false);
    expect(component.paineis()).toEqual([]);
  });

  it('faz logout e redireciona para /login ao sair', async () => {
    const router = TestBed.inject(Router);
    component.sair();
    await fixture.whenStable();

    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
