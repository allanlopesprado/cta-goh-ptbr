# Histórico de versões

## v1.0.25

Revisão textual de 13 de outubro de 2026, com padronização de rótulos,
referências de equipamento e clareza das instruções.
Esta é a versão da tradução, não do jogo.

- 518 ajustes em 49 catálogos: os 487 da padronização de rótulos e 31
  complementares de contexto e clareza. Refinamentos editoriais são
  distinguidos de correções de sentido nas decisões por entrada.
- Scope/Scoped alinhados em Mira Telescópica; mesma forma de Pistola Sinalizadora,
  Engenharia para veículos, Suprimentos e qualificadores de variantes.
- 324 componentes de funções MG uniformizados sem misturar Operador, Auxiliar
  e Guarnição. Modificadores e formações preservados; guarnições de armamentos
  distinguidas dos rótulos de tripulantes de veículos.
- 24 rótulos com polegadas por extenso alinhados em pol., conservando calibre
  nominal, código e modelo. Reforços e doutrinas cruzados com o nome da peça.
- Maiúsculas, espaçamento e ordem de rótulos alinhados. Códigos como 38(t),
  SmK(H), (T), Mk., pdr e valores de bombas permanecem intactos.
- 31 ajustes complementares: referências a guerrilheiros, batedores
  finlandeses, tripulantes de tanque, guarnições de artilharia e unidades
  nominais abreviadas. Partisans/partisano são português válido; a mudança
  para guerrilheiros é editorial nos contextos listados.
- Nomes localizados de Nagant, M1 de 4.5 pol. e Churchill QF 75mm alinhados
  à interface por vínculos explicitamente graduados. Fonte inglesa intacta;
  Cromwell IV/VI, T-34/84 e patente de Urquhart não corrigidos por suposição.
- Três instruções extensas refinadas sem cortar requisitos ou inserir
  quebras. Em seis terminações de rádio de Dyle, Over/Câmbio permanece
  distinto de Out/Encerro; três encerramentos ajustados.
- Validação estrutural dos 121 catálogos de missão contra chamadas dos
  recursos nativos, com ramificações, locutores candidatos e blocos
  explicitamente desativados. Dependências não são ordem de execução.
- 3.702 decisões contextuais protegidas e 1.509 entradas com convenções
  editoriais de rótulos. Novas proteções semânticas conferem modelos,
  variantes, classes, calibres e condições delimitadas de missão.
- 268 testes automatizados aprovados e 2.051 entradas com características
  delimitadas da fonte protegidas. Os novos checks de cenas, objetivos e
  legibilidade também rodam na CI, sem exigir a instalação do jogo.
- Reconstrução do conjunto aprovado contra a v1.0.24: somente os 518
  ajustes, com inglês, campos de origem e demais textos intactos.
- Pacote com 363 arquivos, 3.878.568 bytes, CRC32 e conteúdo conferidos.
  A instalação do jogo permaneceu intacta. Teste no jogo não foi realizado.

[Exemplos de antes/depois](translation/review-v1.0.25.md),
[decisões por fonte e contexto](translation/label-consistency-review-2026-10-13.json)
e [revisão funcional complementar](translation/functional-review-2026-10-13.json),
com [validação final](translation/functional-validation-2026-10-13.json).

SHA-256 do pacote:
`7a3335e24ae37aabe5816a54f03f1b02718a04ffa1c8fcdd59117ccb336b5b61`.
Referência inglesa:
`dc5d9f6c9b3f3d47092802ed69c85e4b0c7f6071e60d552e7c54d8bb64c61dd6`.

## v1.0.24

Segunda revisão textual de 13 de outubro de 2026, com leitura iniciada pelo
inglês, comparação de todas as variantes contextuais e verificação dos membros
dos grupos repetidos. Cobertura: 362 catálogos e 22.030 associações lógicas.
Esta é a versão da tradução, não do jogo.

- 134 ajustes em 41 catálogos, entre correções de sentido, omissões,
  qualificadores, gramática e refinamentos de clareza delimitados.
- Funções com fuzil antitanque, guarnição Flak e metralhador distinguidas;
  rótulos de munição deixam de identificar seus objetos como armas.
- 52 rótulos com inch localizados, conservando calibres nominais, modelos,
  variantes e códigos. Ordens e nomes dos equipamentos relacionados alinhados.
- Alternativas de reforço, origem de coluna inimiga, alvo de clique ferroviário,
  condições, escopo de esquadra e teclas físicas recuperados.
- Transferência de combustível não é embarque/desembarque. Fragmento The Mayo
  preservado sem atribuir patente não demonstrada; inferências e questões do
  próprio inglês registradas separadamente.
- Histórico v1.0.19 a v1.0.23 comparado: 88.040 associações entre versões,
  247 candidatos julgados e nenhuma restauração automática. Leitura manual
  antiga não integral, com limites explícitos no relatório.
- 130 testes automatizados aprovados; 3.243 decisões contextuais e 186 entradas
  com características delimitadas da fonte protegidas. A CI verifica esses casos
  antes de construir ou publicar o pacote, sem certificar toda a semântica.
- Preferência de pontuação mantida: sem U+2014 nos textos PT-BR. Referência
  inglesa e registros das versões anteriores intactos.
- Pacote com 362 catálogos PT-BR e `localization.info`: 363 arquivos,
  3.881.968 bytes, conteúdo e CRC32 conferidos. Teste do pacote novo no jogo
  reservado ao usuário, conforme combinado.

### Exemplos e registros

[Exemplos legíveis de antes/depois](translation/review-v1.0.24.md),
[originais, decisões e cobertura](translation/adversarial-review-2026-10-13.json)
e [validação técnica](translation/adversarial-validation-2026-10-13.json).
O README mantém o foco em download e instalação.

### Integridade do download

SHA-256 de `default.pak`:

```text
ba067bc1f3e640ace7970d3c6bd52d99cc122340a761b2ed8def2e52ae3a9a53
```

Referência inglesa original (SHA-256):

```text
dc5d9f6c9b3f3d47092802ed69c85e4b0c7f6071e60d552e7c54d8bb64c61dd6
```

## v1.0.23

Revisão contextual de 13 de outubro de 2026, comparando os 362 catálogos e
22.030 entradas com a referência inglesa recebida em 7 de outubro.
Esta é a versão da tradução, não do jogo.

- 931 entradas ajustadas em 102 catálogos: 565 correções e padronizações
  selecionadas, com melhorias de pontuação sobrepostas em seis dessas entradas.
- Retiradas as 399 ocorrências de travessão U+2014 dos 372 textos que o usavam.
  A nova regra de estilo protege essa preferência na validação e publicação.
- Distinções entre funções de soldados, radioperadores e observadores;
  qualificadores de fuzil antitanque e tropas de planadores preservados.
- Unidades descritivas em polegadas localizadas sem converter calibres nominais;
  modelos, códigos e hierarquia das patentes estrangeiras preservados.
- Correções de combate a curta distância, percentual, concordância, instruções
  e referentes. Mantidas as formas portuguesas válidas dos compostos militares
  e o uso técnico de lagartas, sem troca indiscriminada por sinônimos.
- 111 testes automatizados aprovados, regressões contextuais, integridade da
  fonte, metadados e pacote com CRC32 e conteúdo exato conferidos.
- Pacote com 362 catálogos PT-BR e `localization.info`: 363 arquivos,
  3.881.125 bytes. README de instalação mantido simples e sem travessões.

### Registros da revisão

Original, antes/depois, decisões e cobertura em
[context-review-2026-10-13.json](translation/context-review-2026-10-13.json).
Evidências complementares em
[context-evidence-2026-10-13.json](translation/context-evidence-2026-10-13.json)
e resultados técnicos em
[context-validation-2026-10-13.json](translation/context-validation-2026-10-13.json).
Os relatórios das versões anteriores permanecem preservados.

### Integridade do download

SHA-256 de `default.pak`:

```text
fa817df326d1b913366186265ed12fc1a62d1e09220c3c7f5352c97876151a08
```

Referência inglesa original (SHA-256):

```text
dc5d9f6c9b3f3d47092802ed69c85e4b0c7f6071e60d552e7c54d8bb64c61dd6
```

## v1.0.22

Validação offline complementar de 8 de outubro de 2026, preservando o pacote
inglês recebido em 7 de outubro. Esta é a versão da tradução, não do jogo.

- Cabeçalhos dos 362 catálogos padronizados para PT-BR e UTF-8, com regra inteira
  de plural brasileira e retirada de `fuzzy` somente dos cabeçalhos revisados.
  Os textos permaneceram intactos nessa subetapa.
- 62 ajustes em 14 catálogos: ortografia de subseção, relações entre cargos e
  formações, clareza de instruções/falas, referência humana a Matilda e quatro
  normalizações Unicode de acentos, conservando nomes, modelos e qualificadores.
- Sinalizadores VT de artilharia: “Air” identificado como explosão aérea pelos
  scripts. “Sharp” do pincel de terreno corrigido pelo manual oficial do editor.
- Segunda leitura independente dirigida de rótulos preservados, cargos,
  patentes, instruções e diálogos, com abrangência e limites registrados.
- Cruzamento estático de referências em mapas, scripts, UI e DLCs instalados;
  nenhuma ausência PT nas referências encontradas também no catálogo inglês.
- Inventário/hash por arquivo inglês, cabeçalhos, formas e Unicode protegidos
  na CI, além das 2.499 decisões contextuais. 105 testes automatizados aprovados.
- Pacote com 362 catálogos PT-BR e `localization.info`: 363 arquivos,
  3.880.211 bytes, inventário, CRC32 e conteúdo conferidos individualmente.

### Registros da verificação

Original, antes/depois, decisões, fontes e limites em
[offline-review-2026-10-08.json](translation/offline-review-2026-10-08.json).
Resultados técnicos em
[offline-validation-2026-10-08.json](translation/offline-validation-2026-10-08.json).
Os relatórios das versões anteriores permanecem preservados.

### Integridade do download

SHA-256 de `default.pak`:

```text
f9776175574741d3c9cb89ffc8a33c6b6001b7dd15e78ab9d0be11732ab06eb8
```

Referência inglesa original (SHA-256):

```text
dc5d9f6c9b3f3d47092802ed69c85e4b0c7f6071e60d552e7c54d8bb64c61dd6
```

## v1.0.21

Revisão proativa de 8 de outubro de 2026, mantendo a referência inglesa
recebida em 7 de outubro. Esta é a versão da tradução, não do jogo.

- Leitura contextual das 22.030 entradas dos 362 catálogos, com registro de
  cobertura também para os arquivos sem alteração.
- 2.414 ajustes em 140 catálogos: correções de sentido, instruções e referentes,
  nomenclatura de armamentos e papéis, gramática e padronizações editoriais.
  Uma padronização editorial não é automaticamente um erro da tradução anterior.
- Consistência entre unidades, reforços, diálogos, objetivos e contadores;
  preservadas diferenças de sentido, nomes próprios, patentes estrangeiras,
  modelos, calibres, títulos comerciais e palavras-código.
- Decisões contextualizadas protegidas por regressões na CI; fontes vazias
  ambíguas e campos de tradução duplicados deixam de passar silenciosamente.
- 84 testes automatizados aprovados, auditoria EN/PT e verificação dos bytes
  contra as propostas exatas. Inglês original preservado sem alterações.
- Pacote com 362 catálogos PT-BR e `localization.info`: 363 arquivos,
  3.883.805 bytes, inventário, CRC32 e conteúdo conferidos individualmente.

### Referência e registros da revisão

Cobertura, original, antes/depois, motivos, fontes e decisões de manutenção em
[proactive-review-2026-10-08.json](translation/proactive-review-2026-10-08.json).
Os casos de regressão estão em
[context-quality.json](translation/context-quality.json); o glossário permanece
contextual, não uma lista de substituições globais.
Os resultados técnicos e a integridade do pacote local estão em
[validation-2026-10-08.json](translation/validation-2026-10-08.json).

### Integridade do download

SHA-256 de `default.pak`:

```text
d11583c149666e433bddc567163c18d6ce972c7a2068e200d49fcbdcf03d7753
```

Referência inglesa original (SHA-256):

```text
dc5d9f6c9b3f3d47092802ed69c85e4b0c7f6071e60d552e7c54d8bb64c61dd6
```

## v1.0.20

Revisão baseada no pacote inglês recebido em 7 de outubro de 2026.
Esta é a versão da tradução, não um número de versão comercial do jogo.

- Atualização da referência inglesa e revisão contextual dos 362 catálogos
  PT-BR, cobrindo 22.030 entradas únicas.
- Primeira passagem com 958 correções em 129 arquivos; fechamento com 1.431
  ajustes adicionais em 67 catálogos. Os conjuntos de arquivos podem se sobrepor.
- As 736 anotações da primeira passagem receberam decisão individual. Nomes,
  modelos, siglas e palavras-código foram avaliados por contexto, sem substituição
  global apenas por igualdade do texto.
- Pacote reconstruído com somente 362 catálogos PT-BR e `localization.info`:
  363 arquivos, estrutura `default/`, 3.876.403 bytes.
- Validação técnica: testes automatizados, correspondência EN/PT, variáveis
  protegidas, inventário do pacote, CRC32 e conteúdo byte a byte.
- Documentação de instalação, backups, restauração, contribuição, suporte,
  segurança e publicação revisada. Publicação automática a cada push na `main`
  removida; lançamentos passam por um fluxo explícito e único.

### Referência e registros da revisão

O pacote inglês de referência e as decisões por contexto estão registrados em
[final-review-2026-10-07.json](translation/final-review-2026-10-07.json) e
[source-manifest.json](translation/source-manifest.json).

### Integridade do download

SHA-256 de `default.pak`:

```text
1b49df2bb3d2480df9ef1aa5864e3c0788dd2b18ef0d99b8cb4d2bf648be1ff2
```

Referência inglesa original (SHA-256):

```text
dc5d9f6c9b3f3d47092802ed69c85e4b0c7f6071e60d552e7c54d8bb64c61dd6
```

## v1.0.19

Publicada em 29 de abril de 2026. Última release anterior à revisão de outubro.
As notas originais registram correções e melhorias gerais, sem identificar uma
versão comercial do jogo. Não atribuímos retroativamente a ela os resultados
da revisão nova. Veja a
[release original](https://github.com/allanlopesprado/cta-goh-ptbr/releases/tag/v1.0.19).

Para versões mais antigas, consulte o
[histórico de releases](https://github.com/allanlopesprado/cta-goh-ptbr/releases).
