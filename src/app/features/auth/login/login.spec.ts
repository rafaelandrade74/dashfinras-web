import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let router: Router;
  let authServiceMock: {
    login: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    resetPassword: ReturnType<typeof vi.fn>;
    isAuthenticated: boolean;
    waitUntilReady: ReturnType<typeof vi.fn>;
  };

  async function criarComponente(redirectUrl?: string): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterModule.forRoot([])],
      declarations: [Login],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (chave: string) => (chave === 'redirectUrl' ? (redirectUrl ?? null) : null)
              }
            }
          }
        }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn().mockResolvedValue({}),
      signUp: vi.fn().mockResolvedValue({}),
      resetPassword: vi.fn().mockResolvedValue({}),
      isAuthenticated: false,
      waitUntilReady: vi.fn().mockResolvedValue(undefined)
    };

    await criarComponente();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve iniciar na tela de login', () => {
    expect(component.modo()).toBe('login');
  });

  it('não chama authService.login com formulário inválido', () => {
    component.entrar();
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('chama authService.login com e-mail e senha válidos', async () => {
    component.loginForm.setValue({ email: 'rafael@exemplo.com', senha: 'senha123' });
    component.entrar();
    await fixture.whenStable();

    expect(authServiceMock.login).toHaveBeenCalledWith('rafael@exemplo.com', 'senha123');
  });

  it('exibe mensagem de erro quando authService.login falha', async () => {
    authServiceMock.login.mockResolvedValue({ error: 'E-mail ou senha incorretos.' });
    component.loginForm.setValue({ email: 'rafael@exemplo.com', senha: 'senhaerrada' });
    component.entrar();
    await fixture.whenStable();

    expect(component.mensagemErro()).toBe('E-mail ou senha incorretos.');
  });

  it('exibe mensagem de erro e para o carregamento quando authService.login rejeita', async () => {
    authServiceMock.login.mockRejectedValue(new Error('falha de rede'));
    component.loginForm.setValue({ email: 'rafael@exemplo.com', senha: 'senha123' });
    component.entrar();
    expect(component.carregando()).toBe(true);
    await fixture.whenStable();

    expect(component.carregando()).toBe(false);
    expect(component.mensagemErro()).toBe('Não foi possível concluir o login. Tente novamente.');
  });

  it('atualiza os critérios e a força da senha conforme o usuário digita', async () => {
    expect(component.senhaForca()).toBe('vazia');

    component.signupForm.controls['senha'].setValue('abc');
    await fixture.whenStable();
    expect(component.senhaCriterios().minuscula).toBe(true);
    expect(component.senhaCriterios().tamanho).toBe(false);
    expect(component.senhaForca()).toBe('fraca');

    component.signupForm.controls['senha'].setValue('SenhaForte123!');
    await fixture.whenStable();
    expect(component.senhaCriterios()).toEqual({
      tamanho: true,
      minuscula: true,
      maiuscula: true,
      numero: true,
      especial: true
    });
    expect(component.senhaForcaPercentual()).toBe(100);
    expect(component.senhaForca()).toBe('excelente');
  });

  it('muda para a tela de cadastro', () => {
    component.irPara('signup');
    expect(component.modo()).toBe('signup');
  });

  it('mostra erro quando as senhas de cadastro não coincidem', () => {
    component.signupForm.setValue({
      email: 'novo@exemplo.com',
      senha: 'SenhaForte123!',
      confirmarSenha: 'OutraSenhaForte123!'
    });
    component.criarConta();

    expect(component.mensagemErro()).toBe('As senhas informadas não coincidem.');
    expect(authServiceMock.signUp).not.toHaveBeenCalled();
  });

  it('impede o cadastro quando a senha não atende aos critérios de complexidade', () => {
    component.signupForm.setValue({
      email: 'novo@exemplo.com',
      senha: 'senhasimples',
      confirmarSenha: 'senhasimples'
    });
    component.criarConta();

    expect(component.signupForm.controls['senha'].errors?.['passwordComplexity']).toBe(true);
    expect(authServiceMock.signUp).not.toHaveBeenCalled();
  });

  it('navega para completar-cadastro quando o signUp já retorna sessão (login automático)', async () => {
    const router = TestBed.inject(Router);
    component.signupForm.setValue({
      email: 'novo@exemplo.com',
      senha: 'SenhaForte123!',
      confirmarSenha: 'SenhaForte123!'
    });
    component.criarConta();
    await fixture.whenStable();

    expect(authServiceMock.signUp).toHaveBeenCalledWith(
      'novo@exemplo.com',
      'SenhaForte123!',
      '/paineis'
    );
    expect(router.navigate).toHaveBeenCalledWith(['/completar-cadastro'], {
      queryParams: { redirectUrl: '/paineis' }
    });
  });

  it('mostra a tela de confirmação de e-mail quando o signUp exige confirmação', async () => {
    authServiceMock.signUp.mockResolvedValue({ precisaConfirmarEmail: true });
    const router = TestBed.inject(Router);
    component.signupForm.setValue({
      email: 'novo@exemplo.com',
      senha: 'SenhaForte123!',
      confirmarSenha: 'SenhaForte123!'
    });
    component.criarConta();
    await fixture.whenStable();

    expect(component.modo()).toBe('signup-sent');
    expect(component.emailCadastro()).toBe('novo@exemplo.com');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('chama authService.resetPassword e avança para a tela de confirmação', async () => {
    component.irPara('forgot');
    component.forgotForm.setValue({ email: 'rafael@exemplo.com' });
    component.enviarRecuperacao();
    await fixture.whenStable();

    expect(authServiceMock.resetPassword).toHaveBeenCalledWith('rafael@exemplo.com');
    expect(component.modo()).toBe('forgot-sent');
    expect(component.emailRecuperacao()).toBe('rafael@exemplo.com');
  });

  describe('redirecionamento de usuário já autenticado', () => {
    it('redireciona para /paineis quando autenticado e sem redirectUrl', async () => {
      authServiceMock.isAuthenticated = true;
      await criarComponente();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/paineis');
      expect(component.checandoSessao()).toBe(true);
    });

    it('redireciona para o redirectUrl quando é um caminho interno válido', async () => {
      authServiceMock.isAuthenticated = true;
      await criarComponente('/paineis/123');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/paineis/123');
    });

    it('ignora um redirectUrl externo e redireciona para /paineis', async () => {
      authServiceMock.isAuthenticated = true;
      await criarComponente('https://evil.com');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/paineis');
    });

    it('exibe o formulário de login normalmente quando não autenticado', async () => {
      authServiceMock.isAuthenticated = false;
      await criarComponente();

      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(component.checandoSessao()).toBe(false);
    });
  });
});
