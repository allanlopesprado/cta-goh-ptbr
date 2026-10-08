# Tradução PT-BR - Call to Arms - Gates of Hell: Ostfront

## Download

- [Baixar o `default.pak` mais recente](https://github.com/allanlopesprado/cta-goh-ptbr/releases/latest/download/default.pak)
- [Notas e arquivos da release mais recente](https://github.com/allanlopesprado/cta-goh-ptbr/releases/latest)
- [Histórico de versões](CHANGELOG.md)

A **v1.0.20** corresponde à revisão dos 362 catálogos PT-BR, usando o pacote
inglês recebido em **7 de outubro de 2026**. O número da tradução não é o número
da versão do jogo. A versão comercial desse pacote não foi identificada;
a referência exata está em [`translation/source-manifest.json`](translation/source-manifest.json).
Não presumimos compatibilidade com qualquer atualização anterior ou posterior.

Os arquivos e o empacotamento passaram pela validação técnica de catálogos,
estrutura, integridade e conteúdo do pacote.
O link de download aponta somente para uma release publicada, não para uma
branch em desenvolvimento. Os metadados do próximo/atual lançamento estão em
[`translation/release.json`](translation/release.json).

## Instalação e atualização

1. Feche o jogo. Na Steam, use **Propriedades > Arquivos instalados > Explorar**
   para localizar a instalação e entre na pasta `localizations`. Uma biblioteca
   Steam pode estar em outro disco; não presuma o caminho padrão.
2. Baixe `default.pak` e `default.pak.sha256` nos arquivos da release. Não use o
   botão **Code > Download ZIP**: ele baixa o repositório, não o pacote instalável.
3. Antes da primeira instalação, guarde o `default.pak` inglês fora da pasta do
   jogo. Se já usa uma tradução, conserve o backup inglês da primeira instalação;
   uma cópia do arquivo atualmente instalado pode já estar traduzida. Se não
   tiver o original, restaure-o pela verificação dos arquivos na Steam primeiro.
4. Confira o SHA-256, faça um novo backup do estado atual e substitua apenas
   `localizations/default.pak`. Não extraia o pacote dentro da pasta do jogo.
5. Abra o jogo. Se os textos continuarem em inglês ou houver outro problema,
   siga o [guia de suporte](.github/SUPPORT.md).

Exemplo em PowerShell para a **v1.0.20**; os caminhos são solicitados para
funcionar também com bibliotecas Steam personalizadas. O backup usa uma pasta
exclusiva e fica fora da instalação, sem sobrescrever backups anteriores:

```powershell
$pastaLocalizations = Read-Host 'Caminho completo da pasta localizations do jogo'
$pacoteBaixado = Read-Host 'Caminho completo do default.pak baixado'
$arquivoInstalado = Join-Path $pastaLocalizations 'default.pak'
if (!(Test-Path -LiteralPath $arquivoInstalado -PathType Leaf)) { throw 'Original instalado não encontrado; confira a pasta.' }
if (!(Test-Path -LiteralPath $pacoteBaixado -PathType Leaf)) { throw 'Pacote baixado não encontrado.' }
$hashEsperado = '1b49df2bb3d2480df9ef1aa5864e3c0788dd2b18ef0d99b8cb4d2bf648be1ff2'
if ((Get-FileHash -LiteralPath $pacoteBaixado -Algorithm SHA256).Hash -ne $hashEsperado) { throw 'SHA-256 diferente da v1.0.20; não instale esse arquivo.' }
$documentosUsuario = [Environment]::GetFolderPath('MyDocuments')
$pastaBackup = Join-Path $documentosUsuario ('cta-goh-ptbr-backups\' + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $pastaBackup -ErrorAction Stop | Out-Null
Copy-Item -LiteralPath $arquivoInstalado -Destination (Join-Path $pastaBackup 'default.pak') -ErrorAction Stop
Copy-Item -LiteralPath $pacoteBaixado -Destination $arquivoInstalado -Force -ErrorAction Stop
Write-Host "Backup do estado anterior: $pastaBackup"
```

Não execute o exemplo para outra release sem atualizar o hash esperado a partir
das notas daquela versão. O checksum detecta alteração ou download incorreto;
não comprova compatibilidade com a sua versão do jogo.

### Desinstalação, restauração e atualização do jogo

Com o jogo fechado, copie o **backup inglês correspondente à versão atualmente
instalada** de volta para
`localizations/default.pak`, substituindo somente esse arquivo. Alternativamente,
use a opção **Verificar integridade dos arquivos** na Steam; ela também pode
restaurar outros arquivos modificados da instalação. Não é necessário excluir
pastas do jogo ou arquivos pessoais. Se o jogo foi atualizado ou houver dúvida
sobre a versão do backup, prefira a verificação pela Steam: não restaure um
pacote inglês de uma versão antiga sobre uma instalação mais recente.

Uma atualização/verificação da Steam pode substituir a tradução pelo inglês.
Confira as notas da release e a referência inglesa antes de reinstalar. Guarde
o backup da nova versão original separadamente, sem substituir o anterior.

## O que este projeto entrega

- Tradução PT-BR da interface e conteúdo textual do jogo
- Pacote pronto para uso em `default.pak`
- Fluxo de validação automatizado para garantir estrutura correta do pacote

Esta validação verifica os arquivos; não certifica a apresentação no jogo.

## Este projeto é para quem?

- Jogadores que só querem instalar e jogar
- Comunidade brasileira que quer contribuir com melhorias

## Revisão da tradução

A referência inglesa do pacote recebido em 7 de outubro de 2026 está em
`localization/en/`. A identificação e o hash do pacote estão em
`translation/source-manifest.json`. O glossário contextual está em
`translation/glossary.json`. O histórico do primeiro lote está em
`translation/reviewed-2026-10-07.json`; a passagem contextual dos **362 arquivos**
está em [`translation/full-review-2026-10-07.json`](translation/full-review-2026-10-07.json),
com cobertura por arquivo, original, tradução anterior/nova, motivo, referências
e decisões por contexto. Arquivos sem alteração também têm registro de leitura.
A referência inglesa é versionada sem conversão de quebras de linha pelo Git,
para preservar os bytes do pacote e os hashes registrados na revisão.
O fechamento documental está em
[`translation/final-review-2026-10-07.json`](translation/final-review-2026-10-07.json):
as 736 anotações da primeira passagem têm decisão individual, com 1.431 ajustes
adicionais em 67 catálogos. O resultado técnico e o hash do pacote local estão em
[`translation/validation-2026-10-07.json`](translation/validation-2026-10-07.json).

Relacionamos entradas por arquivo, `msgctxt` e original: um mesmo contexto pode
aparecer com originais diferentes. Nunca basta casar só o contexto.
Algumas mensagens do jogo usam `msgid` vazio e guardam o inglês em `msgstr`;
elas também precisam ser comparadas e traduzidas. Nomes próprios, modelos e
palavras-código não devem receber substituições globais.

Para executar a validação técnica, use **Node.js 24 LTS** (execução local em
24.15). Não há dependências npm a instalar. A CI configura explicitamente Node 24:

```powershell
node --test tools/*.test.mjs
node tools/translation-audit.mjs --check
node tools/pack-translation.mjs --build
node tools/pack-translation.mjs --check
node tools/release-translation.mjs --check
```

Para comparar outra versão inglesa já descompactada, aponte para a pasta que
contém `localization.info` e `interface`:

```powershell
node tools/translation-audit.mjs --previous "C:\referencia-inglesa-anterior\default" --incoming "C:\novo-pacote-extraido\default" --output relatorio.json
```

Preserve a referência inglesa anterior **antes** de atualizar `localization/en/`.
Sem `--previous`, a ferramenta usa `localization/en/` como baseline. O comando
`--check` compara os catálogos atuais com a referência atual; ele não reconstrói
as diferenças entre versões inglesas se a referência anterior já foi perdida.
`tools/analyze_pot.py` é uma análise legada restrita à campanha Airborne e não
substitui a auditoria contextual nem participa da CI atual.

Texto igual ao original é um candidato à revisão, não um erro automático:
modelos, versões, siglas e linhas sem texto fixo podem ser idênticos.
O relatório também identifica peculiaridades herdadas do formato do jogo,
como nomes com barras literais e textos fisicamente multilinha.
A validação técnica não substitui revisão linguística nem teste visual no jogo.
Todos os arquivos tiveram leitura contextual e as anotações receberam uma
segunda avaliação. As decisões linguísticas, as referências consultadas e os
registros de avaliação da fonte estão preservados nos relatórios da revisão.

`tools/apply-context-review.mjs` aplica somente propostas exatas de um manifesto
novo, com hash do catálogo, fonte e tradução anterior conferidos. Ele preserva
os demais campos, variáveis e formatação e recusa reaplicação sobre um catálogo
já alterado. Catálogos em uma branch não são automaticamente uma release, e a
publicação não equivale a teste no jogo. O pacote reconstruído
contém somente `default/localization.info` e os 362 catálogos PT-BR, com inventário,
CRC32 e conteúdo byte a byte conferidos. Relatórios, inglês e ferramentas não
entram no pacote. O empacotador recusa links simbólicos, caminhos fora de `dist/`
e arquivos inesperados; as rotinas de CI usam a mesma validação. Os relatórios
registram a validação anterior ao commit e preservam esse histórico; não são
registro do estado posterior da publicação. Publicação e instalação no jogo
são etapas separadas.

## Validação e publicação no GitHub

O workflow **Validate** executa em pushes de branches e pull requests: testes,
auditoria, construção e conferência do pacote. Um merge na `main`, inclusive de
documentação, **não publica uma release**.

O workflow **Release Pak** publica somente com uma tag de versão `vX.Y.Z` ou
uma execução manual explícita na `main`. A tag precisa corresponder a
`translation/release.json`, apontar para um commit integrado à `main` e ainda
não ter release existente, nem mesmo em rascunho. A execução manual exige uma
tag nova. Há uma única
etapa de publicação, executada depois dos testes, da auditoria e da comparação
do SHA-256 esperado. O pacote e seu checksum são anexados primeiro a um rascunho;
somente após conferir os anexos a versão passa a estar publicada como latest.

Antes de um lançamento, atualize os metadados e o [changelog](CHANGELOG.md),
registre o resultado e o escopo dos testes realizados. As notas da release são
a referência para o arquivo distribuído; anuncie somente verificações realmente
executadas.

## Comunidade e colaboração

- [Grupo no Telegram — CTA GoH Brasil](https://t.me/cta_goh_brasil)
- [Guia de contribuição](.github/CONTRIBUTING.md)
- [Código de conduta](.github/CODE_OF_CONDUCT.md)
- [Central de suporte](.github/SUPPORT.md)
- [Política de segurança](.github/SECURITY.md)
- [Aviso legal e escopo da licença](.github/LEGAL_NOTICE.md)

## Aviso importante

- Projeto não oficial, sem vínculo com os desenvolvedores do jogo.
- Conteúdo original do jogo permanece sob direitos de seus titulares.
- O jogo está com PT-BR oficialmente indisponível; este projeto preenche essa lacuna para uso comunitário.
