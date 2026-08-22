import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of, throwError } from 'rxjs';
import { CompletarCadastro } from './completar-cadastro';
import { AccountService } from '../../../core/services/account.service';
import { GetUserDto } from '../../../core/models/usuario.model';

describe('CompletarCadastro', () => {
  let component: CompletarCadastro;
  let fixture: ComponentFixture<CompletarCadastro>;
  let accountService: { adicionarUsuario: ReturnType<typeof vi.fn> };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    accountService = { adicionarUsuario: vi.fn() };
    router = { navigateByUrl: vi.fn() };

    await TestBed.configureTestingModule({
      declarations: [CompletarCadastro],
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
      ],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({}) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CompletarCadastro);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('não chama a API quando o formulário é inválido', () => {
    component.salvar();

    expect(accountService.adicionarUsuario).not.toHaveBeenCalled();
    expect(component.form.controls['firstName'].touched).toBe(true);
  });

  it('cadastra o usuário e navega para o redirectUrl ao concluir com sucesso', () => {
    accountService.adicionarUsuario.mockReturnValue(of({} as GetUserDto));
    component.form.setValue({ firstName: 'Rafael', lastName: 'Andrade' });

    component.salvar();

    expect(accountService.adicionarUsuario).toHaveBeenCalledWith({ firstName: 'Rafael', lastName: 'Andrade' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/paineis');
    expect(component.salvando).toBe(false);
  });

  it('exibe mensagem de erro retornada pela API quando o cadastro falha', () => {
    accountService.adicionarUsuario.mockReturnValue(
      throwError(() => ({ error: [{ codigo: 'USER_ALREADY_EXISTS', descricao: 'Usuário já possui cadastro.' }] }))
    );
    component.form.setValue({ firstName: 'Rafael', lastName: 'Andrade' });

    component.salvar();

    expect(component.salvando).toBe(false);
    expect(component.mensagemErro).toBe('Usuário já possui cadastro.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
