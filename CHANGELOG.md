# Histórico de versões

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
