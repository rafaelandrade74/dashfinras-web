import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, RouterModule, convertToParamMap } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AccountService } from '../../../core/services/account.service';
import { StatusConvite } from '../../../core/models/convite.model';
import { PainelPermissao, ResponsePainelDto } from '../../../core/models/painel.model';
import { PainelDetalhe } from './painel-detalhe';

describe('PainelDetalhe', () => {
  let component: PainelDetalhe;
  let fixture: ComponentFixture<PainelDetalhe>;
  let httpMock: HttpTestingController;
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
    httpMock = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await fixture.whenStable();
    httpMock.match(() => true).forEach((req) => req.flush(null));
  });

  function definirPainel(usuarios: ResponsePainelDto['usuarios']): ResponsePainelDto {
    const painel: ResponsePainelDto = { id: 'painel-1', nome: 'Painel Teste', usuarios };
    component.painel.set(painel);
    return painel;
  }

  function logarComo(usuarioId: string): void {
    TestBed.inject(AccountService)['usuarioAtualSubject'].next({ id: usuarioId } as any);
  }

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

  describe('ehDono', () => {
    it('retorna true apenas para PainelPermissao.Dono', () => {
      expect(component.ehDono(PainelPermissao.Dono)).toBe(true);
      expect(component.ehDono(PainelPermissao.Administrador)).toBe(false);
      expect(component.ehDono(undefined)).toBe(false);
    });
  });

  describe('remover usuário', () => {
    it('remove um membro com sucesso e atualiza a lista sem navegar', () => {
      logarComo('dono-1');
      const painel = definirPainel([
        { id: 'dono-1', firstName: 'Dono', idPermissao: PainelPermissao.Dono },
        { id: 'membro-1', firstName: 'Membro', idPermissao: PainelPermissao.Membro }
      ]);
      const alvo = painel.usuarios![1];

      component.abrirRemoverUsuario(alvo);
      expect(component.usuarioParaRemover()).toEqual(alvo);

      component.confirmarRemoverUsuario();
      const req = httpMock.expectOne(`/api/painel/${painel.id}/usuario/${alvo.id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ id: painel.id, nome: painel.nome, usuarios: [painel.usuarios![0]] });

      expect(component.painel()?.usuarios).toEqual([painel.usuarios![0]]);
      expect(component.usuarioParaRemover()).toBeUndefined();
      expect(component.usuariosAberto()).toBe(false);
    });

    it('ao remover a si mesmo, fecha o modal de usuários e navega para /paineis', () => {
      logarComo('membro-1');
      const painel = definirPainel([
        { id: 'dono-1', firstName: 'Dono', idPermissao: PainelPermissao.Dono },
        { id: 'membro-1', firstName: 'Membro', idPermissao: PainelPermissao.Membro }
      ]);
      component.usuariosAberto.set(true);

      component.abrirRemoverUsuario(painel.usuarios![1]);
      component.confirmarRemoverUsuario();

      const req = httpMock.expectOne(`/api/painel/${painel.id}/usuario/membro-1`);
      req.flush({ id: painel.id, nome: painel.nome, usuarios: [painel.usuarios![0]] });

      expect(component.usuariosAberto()).toBe(false);
      expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/paineis');
    });

    it('em caso de erro, mantém o usuário na lista e exibe mensagem amigável', () => {
      logarComo('dono-1');
      const painel = definirPainel([
        { id: 'dono-1', firstName: 'Dono', idPermissao: PainelPermissao.Dono },
        { id: 'membro-1', firstName: 'Membro', idPermissao: PainelPermissao.Membro }
      ]);

      component.abrirRemoverUsuario(painel.usuarios![1]);
      component.confirmarRemoverUsuario();

      const req = httpMock.expectOne(`/api/painel/${painel.id}/usuario/membro-1`);
      req.flush([{ codigo: 'PAINEL_NO_PERMISSION_REMOVE_USER', descricao: 'Sem permissão.' }], {
        status: 400,
        statusText: 'Bad Request'
      });

      expect(component.painel()?.usuarios).toHaveLength(2);
      expect(component.erroRemoverUsuario()).toBe('Sem permissão.');
    });

    it('não fecha o modal de confirmação enquanto a remoção estiver em andamento', () => {
      const painel = definirPainel([
        { id: 'dono-1', firstName: 'Dono', idPermissao: PainelPermissao.Dono },
        { id: 'membro-1', firstName: 'Membro', idPermissao: PainelPermissao.Membro }
      ]);

      component.abrirRemoverUsuario(painel.usuarios![1]);
      component.confirmarRemoverUsuario();
      component.fecharRemoverUsuario();

      expect(component.usuarioParaRemover()).toBeDefined();
      httpMock.expectOne(`/api/painel/${painel.id}/usuario/membro-1`).flush({ id: painel.id, usuarios: [] });
    });
  });

  describe('definirPapelPendente / papelExibido', () => {
    it('não chama a API imediatamente; apenas registra a alteração pendente', () => {
      const painel = definirPainel([
        { id: 'membro-1', firstName: 'Membro', idPermissao: PainelPermissao.Membro }
      ]);
      const alvo = painel.usuarios![0];

      component.definirPapelPendente(alvo, PainelPermissao.Administrador);

      httpMock.expectNone(`/api/painel/${painel.id}/usuario/${alvo.id}/permissao`);
      expect(component.papelExibido(alvo)).toBe(PainelPermissao.Administrador);
      expect(component.painel()?.usuarios?.[0].idPermissao).toBe(PainelPermissao.Membro);
    });

    it('remove a pendência ao selecionar de volta o papel original', () => {
      const painel = definirPainel([
        { id: 'membro-1', firstName: 'Membro', idPermissao: PainelPermissao.Membro }
      ]);
      const alvo = painel.usuarios![0];

      component.definirPapelPendente(alvo, PainelPermissao.Administrador);
      component.definirPapelPendente(alvo, PainelPermissao.Membro);

      expect(component.papeisPendentes()).toEqual({});
      expect(component.papelExibido(alvo)).toBe(PainelPermissao.Membro);
    });
  });

  describe('concluirUsuarios', () => {
    it('sem alterações pendentes, apenas fecha o modal sem chamar a API', () => {
      definirPainel([{ id: 'membro-1', firstName: 'Membro', idPermissao: PainelPermissao.Membro }]);
      component.usuariosAberto.set(true);

      component.concluirUsuarios();

      expect(component.usuariosAberto()).toBe(false);
      httpMock.verify();
    });

    it('salva as alterações pendentes e só fecha o modal quando tudo dá certo', () => {
      const painel = definirPainel([
        { id: 'membro-1', firstName: 'Membro', idPermissao: PainelPermissao.Membro },
        { id: 'membro-2', firstName: 'Membro2', idPermissao: PainelPermissao.Visualizador }
      ]);
      component.usuariosAberto.set(true);
      component.definirPapelPendente(painel.usuarios![0], PainelPermissao.Administrador);
      component.definirPapelPendente(painel.usuarios![1], PainelPermissao.Membro);

      component.concluirUsuarios();
      expect(component.salvandoAlteracoes()).toBe(true);

      httpMock.expectOne(`/api/painel/${painel.id}/usuario/membro-1/permissao`).flush({
        id: painel.id,
        usuarios: [
          { ...painel.usuarios![0], idPermissao: PainelPermissao.Administrador },
          painel.usuarios![1]
        ]
      });
      httpMock.expectOne(`/api/painel/${painel.id}/usuario/membro-2/permissao`).flush({
        id: painel.id,
        usuarios: [
          { ...painel.usuarios![0], idPermissao: PainelPermissao.Administrador },
          { ...painel.usuarios![1], idPermissao: PainelPermissao.Membro }
        ]
      });

      expect(component.salvandoAlteracoes()).toBe(false);
      expect(component.usuariosAberto()).toBe(false);
      expect(component.painel()?.usuarios?.[0].idPermissao).toBe(PainelPermissao.Administrador);
      expect(component.painel()?.usuarios?.[1].idPermissao).toBe(PainelPermissao.Membro);
    });

    it('mantém o modal aberto e exibe erro por usuário quando uma alteração falha', () => {
      const painel = definirPainel([
        { id: 'membro-1', firstName: 'Membro', idPermissao: PainelPermissao.Membro }
      ]);
      component.usuariosAberto.set(true);
      component.definirPapelPendente(painel.usuarios![0], PainelPermissao.Administrador);

      component.concluirUsuarios();

      httpMock.expectOne(`/api/painel/${painel.id}/usuario/membro-1/permissao`).flush(
        [{ codigo: 'PAINEL_NO_PERMISSION_EDIT_USER_PERMISSION', descricao: 'Sem permissão.' }],
        { status: 400, statusText: 'Bad Request' }
      );

      expect(component.usuariosAberto()).toBe(true);
      expect(component.errosAlterarPapel()['membro-1']).toBe('Sem permissão.');
      expect(component.papeisPendentes()['membro-1']).toBe(PainelPermissao.Administrador);
    });

    it('não permite fechar/concluir enquanto já está salvando alterações', () => {
      const painel = definirPainel([
        { id: 'membro-1', firstName: 'Membro', idPermissao: PainelPermissao.Membro }
      ]);
      component.usuariosAberto.set(true);
      component.definirPapelPendente(painel.usuarios![0], PainelPermissao.Administrador);

      component.concluirUsuarios();
      component.fecharUsuarios();
      component.concluirUsuarios();

      expect(component.usuariosAberto()).toBe(true);
      httpMock.expectOne(`/api/painel/${painel.id}/usuario/membro-1/permissao`).flush({
        id: painel.id,
        usuarios: [{ ...painel.usuarios![0], idPermissao: PainelPermissao.Administrador }]
      });
    });
  });
});
