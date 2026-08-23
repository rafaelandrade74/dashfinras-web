import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authServiceMock: {
    login: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    resetPassword: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn().mockResolvedValue({}),
      signUp: vi.fn().mockResolvedValue({}),
      resetPassword: vi.fn().mockResolvedValue({})
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterModule.forRoot([])],
      declarations: [Login],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
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

  it('chama authService.resetPassword e avança para a tela de confirmação', async () => {
    component.irPara('forgot');
    component.forgotForm.setValue({ email: 'rafael@exemplo.com' });
    component.enviarRecuperacao();
    await fixture.whenStable();

    expect(authServiceMock.resetPassword).toHaveBeenCalledWith('rafael@exemplo.com');
    expect(component.modo()).toBe('forgot-sent');
    expect(component.emailRecuperacao()).toBe('rafael@exemplo.com');
  });
});
