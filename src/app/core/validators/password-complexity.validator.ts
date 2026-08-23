import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const LOWERCASE = /[a-z]/;
const UPPERCASE = /[A-Z]/;
const DIGIT = /[0-9]/;
const SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"|<>?,./`~]/;

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
