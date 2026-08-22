import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { accountGuard } from './account.guard';
import { AccountService } from '../services/account.service';
import { GetUserDto } from '../models/usuario.model';

describe('accountGuard', () => {
  let accountService: { obterUsuario: ReturnType<typeof vi.fn> };
  let router: { parseUrl: ReturnType<typeof vi.fn> };
  const fakeUrlTree = {} as never;

  beforeEach(() => {
    accountService = { obterUsuario: vi.fn() };
    router = { parseUrl: vi.fn().mockReturnValue(fakeUrlTree) };

    TestBed.configureTestingModule({
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: Router, useValue: router }
      ]
    });
  });

  function runGuard(state: { url: string } = { url: '/paineis' }) {
    return TestBed.runInInjectionContext(() =>
      firstValueFrom(accountGuard({} as never, state as never) as ReturnType<typeof of>)
    );
  }

  it('permite acesso quando o usuário já está cadastrado', async () => {
    accountService.obterUsuario.mockReturnValue(of({} as GetUserDto));

    const result = await runGuard();

    expect(result).toBe(true);
  });

  it('redireciona para completar-cadastro quando a conta não está cadastrada', async () => {
    accountService.obterUsuario.mockReturnValue(
      throwError(() => ({ error: [{ codigo: 'USER_NOT_FOUND', descricao: 'Usuário não encontrado.' }] }))
    );

    const result = await runGuard({ url: '/paineis' });

    expect(router.parseUrl).toHaveBeenCalledWith('/completar-cadastro?redirectUrl=%2Fpaineis');
    expect(result).toBe(fakeUrlTree);
  });

  it('permite acesso quando a falha não é de usuário não cadastrado', async () => {
    accountService.obterUsuario.mockReturnValue(
      throwError(() => ({ error: [{ codigo: 'ALGUM_OUTRO_ERRO', descricao: 'Falha inesperada.' }] }))
    );

    const result = await runGuard();

    expect(result).toBe(true);
    expect(router.parseUrl).not.toHaveBeenCalled();
  });
});
