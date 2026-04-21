# Metodologia de Traducao PT-BR
### Call to Arms - Gates of Hell: Ostfront

Este documento define apenas a metodologia de traducao e revisao adotada no projeto. O objetivo e manter a localizacao PT-BR coerente, verificavel e consistente em todo o corpus.

---

## Objetivo

A traducao deve:

- preservar o sentido original do jogo
- usar terminologia consistente entre interface, descricoes, missoes e reforcos
- respeitar nomes tecnicos, designacoes oficiais e contexto historico
- produzir texto natural em PT-BR sem romper o padrao ja consolidado no corpus

---

## Unidade de trabalho

A unidade real de traducao do projeto e o arquivo `.pot`.

Regras centrais:

1. `msgid` nunca e alterado.
2. Apenas `msgstr` pode ser traduzido ou revisado.
3. Placeholders, tags, markup, aspas e quebras de linha devem ser preservados exatamente.

Exemplos de elementos que nao podem ser quebrados:

- `%1%`
- `\n`
- `<c(...)>...</c>`
- `<f(...)>...</f>`

---

## Hierarquia de fontes canonicas

Toda decisao terminologica deve seguir o proprio corpus do jogo antes de qualquer preferencia estilistica isolada.

### Ordem de prioridade

1. **Interface do jogo**
   - `dlg_frontend.pot`
   - `dlg_ingame.pot`
   - `dlg_mp.pot`

2. **Descricoes tecnicas**
   - `desc_ammo_*.pot`
   - `desc_weapon_*.pot`
   - `desc_vehicles_*.pot`
   - `desc_squad_*.pot`

3. **Contexto narrativo e operacional**
   - arquivos de `mission/single/`
   - arquivos de reforcos

4. **Glossario do projeto**
   - `docs/glossario_ptbr_validado.md`

### Regra pratica

Se a interface ja fixou um termo, a missao nao deve inventar outro para o mesmo conceito. Se uma descricao tecnica ja fixou o nome de uma arma, municao ou peca, esse nome deve ser mantido nos demais arquivos.

---

## Principios de traducao

### 1. Consistencia de corpus

A traducao correta nao e a mais bonita isoladamente. E a que permanece coerente com o restante do jogo.

Antes de mudar qualquer termo:

1. pesquise no corpus
2. verifique se ja existe forma dominante
3. confira se ha rotulo canonico na interface
4. confirme se o contexto tecnico pede preservacao do nome original

### 2. Preservacao de designacoes oficiais

Nomes historicos, codigos, siglas e designacoes oficiais devem ser preservados quando identificam diretamente o objeto do jogo.

Exemplos tipicos:

- `5cm PaK 38`
- `RP-3`
- `HEAT`
- `APCR`
- `Mk.IV`
- `M26 Pershing`

### 3. Naturalidade em PT-BR

Quando o texto for instrucional, descritivo ou narrativo, a frase deve ser reorganizada para soar natural em portugues, desde que isso nao destrua a nomenclatura tecnica.

Exemplos:

- `Heavy Squad` -> `Esquadra Pesada`
- `Armor Piercing` -> `Perfurante de Blindagem`
- `High Explosive Anti-Tank` -> `Alto Explosivo Antitanque`

### 4. Reaproveitamento de terminologia de interface

Termos de UI devem ser replicados literalmente quando o sentido for o mesmo.

Exemplos canonicos do corpus:

- `Hold fire` -> `Cessar fogo`
- `Return fire` -> `Contra-atacar`
- `Fire at will` -> `Atirar a vontade`

### 5. Contexto acima de traducao literal

Nem toda traducao palavra por palavra produz bom PT-BR. A formulacao final deve respeitar:

- funcao do texto no jogo
- limite semantico do termo tecnico
- contexto militar e historico
- uso consolidado em outros arquivos

---

## Regras de revisao terminologica

### Interface

- labels, botoes, modos de fogo e acoes devem seguir a forma canonica da UI
- qualquer hint ou tutorial que cite um comando deve espelhar a nomenclatura da interface

### Descricoes tecnicas

- municoes, armas, veiculos e pecas devem usar a nomenclatura dominante das descricoes tecnicas
- traduz-se a categoria quando apropriado, mas preserva-se a designacao oficial do item

### Missoes e narracao

- objetivos e falas devem soar naturais em PT-BR
- termos tecnicos ja estabelecidos pela UI ou por descricoes nao devem ser substituidos por sinonimos livres
- instrucoes operacionais precisam ser claras e imediatamente compreensiveis em jogo

### Reforcos e listas de unidades

- a estrutura nominal deve seguir o padrao dominante do corpus
- a ordem de palavras deve ser adaptada para PT-BR quando necessario
- nomes de unidades devem manter coerencia entre arquivos equivalentes

---

## Fluxo de traducao e revisao

### 1. Identificar o contexto

Antes de traduzir, determine em qual categoria a string se encaixa:

- interface
- descricao tecnica
- missao
- narracao
- reforco
- nome de unidade

### 2. Procurar ocorrencias no corpus

Pesquise o termo ou conceito em arquivos equivalentes para descobrir:

- forma dominante
- variacoes ja existentes
- possiveis divergencias antigas

### 3. Validar contra fonte canonica interna

Confirme o termo no arquivo mais forte para aquele contexto:

- UI em `dlg_frontend.pot`, `dlg_ingame.pot` e `dlg_mp.pot`
- termos tecnicos em `desc/`
- contexto de campanha em `mission/single/`

### 4. Traduzir o `msgstr`

Ao editar:

- preserve marcacao e formato
- mantenha designacoes oficiais
- ajuste a ordem da frase para PT-BR natural
- evite sinonimos livres quando o corpus ja tiver padrao consolidado

### 5. Revisar consistencia cruzada

Depois da traducao, confira se o mesmo conceito:

- aparece igual em outros arquivos
- nao conflita com a interface
- nao conflita com descricoes tecnicas
- nao cria duplicidade terminologica desnecessaria

### 6. Validar em contexto

A revisao final deve responder:

- a frase esta natural?
- o termo tecnico continua correto?
- o texto continua alinhado com o restante do jogo?
- a instrucao ficaria clara para o jogador sem precisar reinterpretar?

---

## Criterios para decidir entre manter e traduzir

### Deve ser mantido

- designacao oficial da arma, veiculo, municao ou equipamento
- sigla militar consolidada
- codigo tecnico ou modelo historico
- nome proprio militar reconhecivel

### Deve ser traduzido

- instrucao ao jogador
- texto de interface
- descricao funcional
- narracao, objetivo ou briefing
- categoria generica quando nao for parte inseparavel do nome oficial

### Requer avaliacao contextual

- termos hibridos entre nome oficial e classe de item
- abreviacoes com uso variavel no corpus
- palavras tecnicas que aparecem tanto como nome quanto como descricao

---

## Checklist de revisao

Cada alteracao deve passar por esta verificacao:

- o `msgid` permaneceu intacto?
- o `msgstr` preservou placeholders, tags e quebras de linha?
- a traducao segue o termo dominante do corpus?
- ha compatibilidade com a interface do jogo?
- ha compatibilidade com descricoes tecnicas equivalentes?
- o nome oficial foi preservado quando necessario?
- a frase esta natural em PT-BR?
- o contexto militar e historico foi respeitado?
- o texto ficou claro para uso in-game?

---

## Regra de ouro

Toda traducao deve ser decidida a partir de tres perguntas:

1. **Como o proprio jogo ja nomeia isso?**
2. **Esse termo e nome oficial ou texto descritivo?**
3. **A frase final soa natural em PT-BR sem quebrar o padrao do corpus?**

Se essas tres respostas estiverem alinhadas, a traducao tende a estar correta.