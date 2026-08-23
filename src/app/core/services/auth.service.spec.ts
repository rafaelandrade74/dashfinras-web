import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

const signInWithPassword = vi.fn();
const signUp = vi.fn();
const signOut = vi.fn();
const resetPasswordForEmail = vi.fn();
const getSession = vi.fn().mockResolvedValue({ data: { session: null } });
const onAuthStateChange = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
      signUp: (...args: unknown[]) => signUp(...args),
      signOut: (...args: unknown[]) => signOut(...args),
      resetPasswordForEmail: (...args: unknown[]) => resetPasswordForEmail(...args),
      getSession: (...args: unknown[]) => getSession(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChange(...args)
    }
  })
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    signInWithPassword.mockReset();
    signUp.mockReset();
    resetPasswordForEmail.mockReset();
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: () => {} } } });

    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('retorna erro amigável quando a API do Supabase rejeita a promise (ex.: falha de rede)', async () => {
    signInWithPassword.mockRejectedValue(new Error('fetch failed'));

    const resultado = await service.login('rafael@exemplo.com', 'senha123');

    expect(resultado.error).toBe(
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    );
  });

  it('traduz credenciais inválidas para mensagem em português', async () => {
    signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' }
    });

    const resultado = await service.login('rafael@exemplo.com', 'senhaerrada');

    expect(resultado.error).toBe('E-mail ou senha incorretos. Verifique os dados e tente novamente.');
  });

  it('não deixa a promise de login rejeitar em caso de falha de rede', async () => {
    signInWithPassword.mockRejectedValue(new Error('network error'));

    await expect(service.login('rafael@exemplo.com', 'senha123')).resolves.toEqual({
      error: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    });
  });
});
