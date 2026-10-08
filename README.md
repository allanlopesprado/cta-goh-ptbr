# Tradução PT-BR - Call to Arms - Gates of Hell: Ostfront

### Instalação rápida

1. Baixe o `default.pak` na página de Releases.
2. Faça backup do arquivo original do jogo.
3. Copie o novo `default.pak` para a pasta `localizations`.
4. Abra o jogo.

```powershell
cd "C:\Program Files (x86)\Steam\steamapps\common\Call to Arms - Gates of Hell\localizations"
Copy-Item default.pak default-original.pak
Copy-Item "C:\Users\SEU_USUARIO\Downloads\default.pak" ".\default.pak"
```

## Download

- Release mais recente: https://github.com/allanlopesprado/cta-goh-ptbr/releases/latest

## O que este projeto entrega

- Tradução PT-BR da interface e conteúdo textual do jogo
- Pacote pronto para uso em `default.pak`
- Fluxo de validação automatizado para garantir estrutura correta do pacote

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
e pendências. Arquivos sem alteração também têm registro de leitura.
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

Para executar a validação técnica (Node.js 18.13 ou superior; execução local em 24.15):

```powershell
node --test tools/translation-audit.test.mjs tools/apply-context-review.test.mjs tools/final-review-audit.test.mjs tools/pack-translation.test.mjs
node tools/translation-audit.mjs --check
node tools/pack-translation.mjs --build
node tools/pack-translation.mjs --check
```

Para comparar outra versão inglesa já descompactada, aponte para a pasta que
contém `localization.info` e `interface`:

```powershell
node tools/translation-audit.mjs --incoming "C:\caminho\extraido\default" --output relatorio.json
```

Texto igual ao original é um candidato à revisão, não um erro automático:
modelos, versões, siglas e linhas sem texto fixo podem ser idênticos.
O relatório também identifica peculiaridades herdadas do formato do jogo,
como nomes com barras literais e textos fisicamente multilinha.
A validação técnica não substitui revisão linguística nem teste visual no jogo.
Todos os arquivos tiveram leitura contextual e as anotações receberam uma
segunda avaliação. Isso não certifica todos os fatos históricos do original nem
garante ausência absoluta de erros. Restam cinco registros dependentes de uso,
tela ou áudio: quatro rótulos legados Home Guard, controles especializados do
editor e as falas Gav-gav, Astoveri e o fragmento The Mayo. Os rótulos não foram
alterados por suposição. Outros 34 registros de alegações/atribuições da fonte
estão separados das correções linguísticas. O usuário escolheu testar o jogo
depois; largura, quebra de linha, entidades e sincronização não foram validadas.

`tools/apply-context-review.mjs` aplica somente propostas exatas de um manifesto
novo, com hash do catálogo, fonte e tradução anterior conferidos. Ele preserva
os demais campos, variáveis e formatação e recusa reaplicação sobre um catálogo
já alterado. Os catálogos revisados não significam que uma nova Release ou um
pacote atualizado já foi publicado/testado no jogo. O pacote local reconstruído
contém somente `default/localization.info` e os 362 catálogos PT-BR, com inventário,
CRC32 e conteúdo byte a byte conferidos. Relatórios, inglês e ferramentas não
entram no pacote. O empacotador recusa links simbólicos, caminhos fora de `dist/`
e arquivos inesperados; as rotinas de CI usam a mesma validação. Os relatórios
registram a validação anterior ao commit. Publicação de Release e instalação no
jogo são etapas separadas e não foram realizadas nesta revisão.

## Comunidade e colaboração

- [Grupo no Telegram — CTA GoH Brasil](https://t.me/cta_goh_brasil)
- [Guia de contribuição](.github/CONTRIBUTING.md)
- [Código de conduta](.github/CODE_OF_CONDUCT.md)
- [Central de suporte](.github/SUPPORT.md)
- [Política de segurança](.github/SECURITY.md)

## Aviso importante

- Projeto não oficial, sem vínculo com os desenvolvedores do jogo.
- Conteúdo original do jogo permanece sob direitos de seus titulares.
- O jogo está com PT-BR oficialmente indisponível; este projeto preenche essa lacuna para uso comunitário.
