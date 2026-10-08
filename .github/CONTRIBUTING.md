# Contribuindo

Obrigado por ajudar a melhorar esta tradução PT-BR para Call to Arms - Gates of Hell.

## Antes de começar

- Seja respeitoso nas discussões e prefira um tópico por pull request.
- Trabalhe em uma branch e mantenha mudanças pequenas e focadas.
- Consulte o [README](../README.md), o [glossário contextual](../translation/glossary.json)
  e o [manifesto da fonte](../translation/source-manifest.json).
- Use Node.js 24 LTS para as ferramentas atuais; confira a instalação com
  `node --version`. Execute os comandos abaixo a partir da raiz do repositório.

## O que pode ser contribuído

- melhorias na qualidade da tradução
- correções de termos e consistência
- ajustes na estrutura de localização
- melhorias na documentação

## Como revisar uma tradução

1. Compare o original em `localization/en/` com a tradução em `localization/pt_BR/`.
   Leia também as entradas vizinhas e o contexto da pasta: país, campanha, missão,
   unidade, equipamento ou tela. A pasta ajuda, mas não determina sozinha o sentido
   de todas as entradas.
2. Identifique cada proposta por **arquivo + `msgctxt` + original**. Um contexto
   pode conter originais diferentes. Quando `msgid` está vazio, o inglês pode estar
   em `msgstr` no catálogo EN; não trate essa mensagem como texto vazio.
3. Consulte o glossário e valide termos ambíguos com o contexto e, quando necessário,
   referências confiáveis. Nomes próprios, modelos, siglas, palavras-código e falas
   estrangeiras podem precisar permanecer no original. Evite substituições globais.
4. Altere somente a tradução necessária. Preserve identificadores, nomes de arquivos,
   variáveis (`%1%`, `%s`, etc.), marcações do jogo, plurais e estrutura dos catálogos.
   A referência inglesa deve permanecer byte a byte, inclusive nas quebras de linha;
   não a edite para corrigir uma alegação histórica ou facilitar a tradução.
5. Registre original, antes/depois, motivo, contexto e referências na proposta ou no
   manifesto de revisão. Uma decisão incerta deve continuar explícita, não ser
   apresentada como validada. Para propostas em lote, use o formato de manifesto
   aceito por `tools/apply-context-review.mjs`: ele confere fonte, tradução anterior e
   hashes. Use `--repo` e `--manifest` para validá-lo; só `--apply` autoriza a aplicação.
   Não reaplique um manifesto já aplicado.

## Atualização da referência inglesa

Antes de substituir `localization/en/` por uma versão nova, preserve a referência
anterior em uma pasta separada e registre a origem, a versão conhecida e o hash do
pacote recebido. Compare primeiro a fonte recebida com a referência preservada:

```powershell
node tools/translation-audit.mjs --previous "C:\caminho\referencia-anterior\default" --incoming "C:\caminho\nova-fonte\default" --output relatorio.json
```

As duas pastas devem conter `localization.info` e `interface`. Sem `--previous`, a
ferramenta usa `localization/en/` como referência anterior; sem `--incoming`, usa essa
mesma pasta como fonte atual. Portanto, o `--check` padrão verifica a consistência
da tradução com a fonte versionada, mas não recupera diferenças históricas depois
de sobrescrever a referência. Revise os resultados antes de importar a nova fonte
e de atualizar o manifesto, os catálogos PT-BR e os registros de revisão.

## Validação técnica

```powershell
node --test tools/*.test.mjs
node tools/translation-audit.mjs --check
node tools/pack-translation.mjs --build
node tools/pack-translation.mjs --check
node tools/release-translation.mjs --check
```

A revisão de 7 de outubro de 2026 passou nos 52 testes então existentes. O número
pode crescer com novas contribuições; registre o resultado da execução atual.
O fechamento de publicação acrescenta testes do fluxo de release aos 52 originais.
O build gera `dist/default.pak`, não altera a instalação do jogo e não publica uma
Release. Não inclua arquivos gerados ou não relacionados no pull request.

Se alterar os catálogos ou a referência inglesa, prepare os metadados da próxima
versão em `translation/release.json` e as notas em `CHANGELOG.md`: tag nova,
inventário, tamanho e SHA-256 do pacote reconstruído, referência de origem e
estado real do teste no jogo. O comando `release-translation.mjs --check` compara
esses dados com o pacote e o manifesto. Não troque apenas o hash para ocultar
uma mudança inesperada; confirme a revisão e o conteúdo antes de registrar o
novo valor. Os relatórios históricos de validação devem continuar descrevendo
o marco em que foram produzidos, sem serem reescritos como resultados atuais.

Texto igual ao inglês e peculiaridades herdadas do formato podem aparecer como
candidatos ou diagnósticos; não são automaticamente erros de tradução. A aprovação
técnica não certifica sentido, fatos históricos, largura de texto, telas ou áudio.
Declare separadamente o que foi testado no jogo e o que ainda depende desse teste.

## Checklist de pull request

- Descreva o que mudou e por quê, com original e antes/depois quando aplicável.
- Mantenha a estrutura de `localization/<idioma>/` e preserve a referência EN.
- Indique termos/contextos revisados e as fontes usadas para decisões ambíguas.
- Execute os testes, a auditoria, o build e a conferência do pacote, ou explique
  quais verificações não foram executadas.
- Confira os metadados e as notas da versão com `release-translation.mjs --check`.
- Diferencie validação técnica de teste no jogo e liste pendências conhecidas.
- Consulte no README o fluxo de branches e publicação antes de solicitar o merge;
  aprovar um pull request não deve ser confundido com teste visual concluído.

## Aspectos legais

Ao contribuir, você confirma que sua contribuição pode ser licenciada sob MIT para os arquivos de código e documentação do repositório.

Veja o [aviso legal](LEGAL_NOTICE.md) para informações sobre escopo e propriedade intelectual.
