export function isInternalRedirectUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  if (!url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) {
    return false;
  }

  const semBarraInicial = url.slice(1);
  const indiceBarra = semBarraInicial.indexOf('/');
  const primeiroSegmento = indiceBarra === -1 ? semBarraInicial : semBarraInicial.slice(0, indiceBarra);

  return !primeiroSegmento.includes(':');
}
