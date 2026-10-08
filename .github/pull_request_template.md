## Resumo

Descreva o que foi alterado.

Branch/commit de referência e, se aplicável, versão/build do jogo e pacote fonte:

## Tipo de mudança

- [ ] Correção de tradução
- [ ] Consistência terminológica
- [ ] Melhoria de script/automação
- [ ] Documentação
- [ ] Outro


## Contexto e evidências

Para traduções, inclua arquivo + `msgctxt` + original, texto anterior e proposta,
país/missão/unidade/tela e motivo. Se o `msgid` EN estiver vazio, use o original
guardado no `msgstr` EN. Relacione referências e decisões do glossário quando
aplicável. Informe se atualiza a fonte inglesa e qual baseline anterior preservou.

## Validação técnica

- [ ] Revisei para evitar mudanças não intencionais e substituições globais
- [ ] Preservei identificadores, variáveis, marcações e estrutura dos catálogos
- [ ] Preservei os bytes da referência EN, ou documentei uma importação de fonte nova
- [ ] Executei `node --test tools/*.test.mjs` com Node.js 24 LTS
- [ ] Executei `node tools/translation-audit.mjs --check`
- [ ] Executei `node tools/pack-translation.mjs --build` e `--check`
- [ ] Executei `node tools/release-translation.mjs --check` e conferi metadados/notas

Resultados, versão do Node.js e verificações não executadas ou não aplicáveis:

## Teste no jogo

- [ ] Testei no jogo as telas/cenas afetadas

Informe versão/build, telas/cenas, legibilidade e áudio verificados, ou diga
explicitamente que o teste no jogo está pendente. Aprovação técnica não equivale
a aprovação visual ou linguística completa.

## Observações

Liste pendências, riscos e dúvidas que precisam de decisão antes do merge ou da
publicação. Não inclua o pacote gerado nem arquivos não relacionados no PR.
