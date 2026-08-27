import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, RouterModule, convertToParamMap } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { StatusConvite } from '../../../core/models/convite.model';
import { PainelDetalhe } from './painel-detalhe';

describe('PainelDetalhe', () => {
  let component: PainelDetalhe;
  let fixture: ComponentFixture<PainelDetalhe>;
  let authServiceMock: { logout: ReturnType<typeof vi.fn>; nomeUsuario?: string };

  beforeEach(async () => {
    authServiceMock = { logout: vi.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterModule.forRoot([])],
      declarations: [PainelDetalhe],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } }
        }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PainelDetalhe);
    component = fixture.componentInstance;
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await fixture.whenStable();
  });

  describe('statusInfo', () => {
    it.each([
      [StatusConvite.Pendente, 'Pendente', 'status-pendente'],
      [StatusConvite.Aprovado, 'Aprovado', 'status-aceito'],
      [StatusConvite.Recusado, 'Recusado', 'status-recusado'],
      [StatusConvite.Expirado, 'Expirado', 'status-expirado'],
    ] as const)('mapeia status "%s" para rótulo "%s" e classe "%s"', (status, label, classe) => {
      expect(component.statusInfo(status)).toEqual({ label, classe });
    });

    it('retorna um rótulo neutro para um status desconhecido', () => {
      expect(component.statusInfo(99 as StatusConvite)).toEqual({
        label: 'Status desconhecido',
        classe: 'status-desconhecido'
      });
    });
  });

  describe('podeReenviar', () => {
    it.each([
      [StatusConvite.Recusado, true],
      [StatusConvite.Expirado, true],
      [StatusConvite.Pendente, false],
      [StatusConvite.Aprovado, false],
    ] as const)('para status "%s" retorna %s', (status, esperado) => {
      expect(component.podeReenviar(status)).toBe(esperado);
    });
  });
});
