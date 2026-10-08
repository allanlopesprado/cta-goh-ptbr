# Suporte

## Como obter ajuda

Consulte primeiro o [README](../README.md), especialmente as instruções de
instalação, atualização, restauração e download. Use as
[Issues do GitHub](https://github.com/allanlopesprado/cta-goh-ptbr/issues) para dúvidas
de instalação, empacotamento e tradução. Pesquise relatos existentes antes de abrir
um novo.

Use o modelo de bug para problemas reproduzíveis e o modelo de melhoria para
propostas. Para vulnerabilidades e questões legais, siga as respectivas
[políticas de segurança](SECURITY.md) e [orientações legais](LEGAL_NOTICE.md).

## O que incluir

- Versão/build do jogo e DLCs ou mods relevantes. Se não souber a versão, informe
  isso em vez de estimá-la.
- Tag/link da Release da tradução ou branch e commit utilizados. Se possível,
  inclua o SHA-256 do `default.pak` instalado; a tag da tradução não é a versão do
  jogo.
- País, campanha/missão, unidade/equipamento ou tela, além de passos para reproduzir.
- Texto exibido, original em inglês e tradução esperada. Quando disponível, inclua
  o arquivo relativo e o `msgctxt`; um mesmo contexto pode ter originais diferentes.
- Resultado esperado e obtido, capturas ou trechos de áudio relevantes.
- Para ferramentas: sistema operacional, versão do Node.js, comando executado e
  logs/erros. Remova dados pessoais ou segredos antes de compartilhar logs.
- Indicação de quais verificações foram técnicas e quais ocorreram no jogo.

Para obter o hash no PowerShell:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath "C:\caminho\default.pak"
```

Os testes automatizados verificam catálogos e pacote; não substituem a conferência
de contexto, legibilidade, entidades e sincronização de áudio no jogo. Não é
necessário ter todos os dados para reportar: identifique o que ainda não foi obtido.
