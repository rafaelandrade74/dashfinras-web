import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PASSWORD_MIN_LENGTH = 8;
export const LOWERCASE = /[a-z]/;
export const UPPERCASE = /[A-Z]/;
export const DIGIT = /[0-9]/;
export const SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"|<>?,./`~]/;

export interface PasswordCriterios {
  tamanho: boolean;
  minuscula: boolean;
  maiuscula: boolean;
  numero: boolean;
  especial: boolean;
}

export function avaliarCriteriosSenha(value: string): PasswordCriterios {
  return {
    tamanho: value.length >= PASSWORD_MIN_LENGTH,
    minuscula: LOWERCASE.test(value),
    maiuscula: UPPERCASE.test(value),
    numero: DIGIT.test(value),
    especial: SPECIAL.test(value)
  };
}

export const passwordComplexityValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value as string | null;
  if (!value) {
    return null;
  }

  const valido =
    LOWERCASE.test(value) && UPPERCASE.test(value) && DIGIT.test(value) && SPECIAL.test(value);

  return valido ? null : { passwordComplexity: true };
};
