import { FormControl } from '@angular/forms';
import { passwordComplexityValidator } from './password-complexity.validator';

describe('passwordComplexityValidator', () => {
  it('não retorna erro quando o campo está vazio (deixa o required cuidar disso)', () => {
    expect(passwordComplexityValidator(new FormControl(''))).toBeNull();
  });

  it('retorna erro quando falta letra maiúscula', () => {
    const resultado = passwordComplexityValidator(new FormControl('senha123!'));
    expect(resultado).toEqual({ passwordComplexity: true });
  });

  it('retorna erro quando falta letra minúscula', () => {
    const resultado = passwordComplexityValidator(new FormControl('SENHA123!'));
    expect(resultado).toEqual({ passwordComplexity: true });
  });

  it('retorna erro quando falta número', () => {
    const resultado = passwordComplexityValidator(new FormControl('SenhaForte!'));
    expect(resultado).toEqual({ passwordComplexity: true });
  });

  it('retorna erro quando falta caractere especial', () => {
    const resultado = passwordComplexityValidator(new FormControl('SenhaForte123'));
    expect(resultado).toEqual({ passwordComplexity: true });
  });

  it('não retorna erro quando a senha atende todos os critérios', () => {
    expect(passwordComplexityValidator(new FormControl('SenhaForte123!'))).toBeNull();
  });
});
