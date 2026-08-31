import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ConviteResponder } from './convite-responder';
import { ConviteService } from '../../../core/services/convite.service';
import { PainelPermissao } from '../../../core/models/painel.model';
import { StatusConvite, ResponseConviteDto } from '../../../core/models/convite.model';

describe('ConviteResponder', () => {
  let conviteService: {
    obterConvitePorToken: ReturnType<typeof vi.fn>;
    aprovarConvite: ReturnType<typeof vi.fn>;
    recusarConvite: ReturnType<typeof vi.fn>;
  };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  const convite: ResponseConviteDto = {
    id: '1',
    idPainel: 'painel-1',
    nomePainel: 'Painel de Teste',
    permissao: PainelPermissao.Membro,
    status: StatusConvite.Pendente,
    dataCriacao: '2026-08-01T00:00:00Z',
    dataExpiracao: '2026-09-01T00:00:00Z'
  };

  function criarComponente(token: string | null = 'token-123'): ConviteResponder {
    conviteService = {
      obterConvitePorToken: vi.fn().mockReturnValue(of(convite)),
      aprovarConvite: vi.fn().mockReturnValue(of({ ...convite, status: StatusConvite.Aprovado })),
      recusarConvite: vi.fn().mockReturnValue(of({ ...convite, status: StatusConvite.Recusado }))
    };
    router = { navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        ConviteResponder,
        { provide: ConviteService, useValue: conviteService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => token } } }
        }
      ]
    });

    return TestBed.inject(ConviteResponder);
  }

  it('carrega o convite pelo token assumindo sessão já válida, sem checar autenticação', () => {
    const componente = criarComponente();

    componente.ngOnInit();

    expect(conviteService.obterConvitePorToken).toHaveBeenCalledWith('token-123');
    expect(componente.convite()).toEqual(convite);
    expect(componente.carregando()).toBe(false);
  });

  it('mapeia os códigos de erro conhecidos ao carregar o convite', () => {
    conviteService = {
      obterConvitePorToken: vi.fn().mockReturnValue(
        throwError(() => ({ error: [{ codigo: 'CONVITE_EXPIRED' }] }))
      ),
      aprovarConvite: vi.fn(),
      recusarConvite: vi.fn()
    };
    router = { navigateByUrl: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        ConviteResponder,
        { provide: ConviteService, useValue: conviteService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'token-123' } } }
        }
      ]
    });
    const componente = TestBed.inject(ConviteResponder);

    componente.ngOnInit();

    expect(componente.erroTitulo()).toBe('Convite expirado');
    expect(componente.erro()).toContain('expirou');
  });

  it('aprova o convite ao chamar aceitar()', () => {
    const componente = criarComponente();
    componente.ngOnInit();

    componente.aceitar();

    expect(conviteService.aprovarConvite).toHaveBeenCalledWith('token-123');
    expect(componente.decisao()).toBe('aceito');
    expect(componente.respondendo()).toBe(false);
  });

  it('recusa o convite ao chamar recusar()', () => {
    const componente = criarComponente();
    componente.ngOnInit();

    componente.recusar();

    expect(conviteService.recusarConvite).toHaveBeenCalledWith('token-123');
    expect(componente.decisao()).toBe('recusado');
  });

  it('exibe erro de resposta quando aprovar/recusar falha, sem redirecionar para login', () => {
    const componente = criarComponente();
    conviteService.aprovarConvite.mockReturnValue(
      throwError(() => ({ error: [{ descricao: 'Falha ao registrar resposta.' }] }))
    );
    componente.ngOnInit();

    componente.aceitar();

    expect(componente.erroResposta()).toBe('Falha ao registrar resposta.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
