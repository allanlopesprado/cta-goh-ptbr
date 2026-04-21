# Checklist de Release

Use este checklist antes de publicar um novo `default.pak`.

## 1. Escopo e versionamento

- Confirmar versão/update alvo do jogo
- Atualizar a linha de versão no README, se necessário
- Confirmar resumo no changelog para as notas da release

## 2. Build e empacotamento

```powershell
.\criar_pak.ps1
```

- Confirmar que o arquivo existe: `dist/default.pak`
- Confirmar estrutura do pacote:
  - `default/`
  - `default/localization.info`
  - `default/interface/text/...`

## 3. Validação

- Executar validação local (script/workflow)
- Garantir que não há tags de formatação quebradas nos arquivos traduzidos
- Garantir que não há mudanças acidentais fora do escopo

## 4. Release no GitHub

Recomendado (workflow manual no Actions):
- Executar workflow `Release Pak`
- Preencher `tag` (exemplo: `v1.062.1-ptbr`)
- Preencher `title`
- Preencher `notes`

Alternativa (CLI):

```powershell
$notes = @"
Arquivo pronto para instalar: default.pak

Instalacao:
1) Backup: default.pak -> default-original.pak
2) Copiar este default.pak para:
   C:\Program Files (x86)\Steam\steamapps\common\Call to Arms - Gates of Hell\localizations\default.pak
3) Iniciar o jogo (Steam em ingles).
"@

gh release create <tag> dist/default.pak --title "<titulo>" --notes "$notes"
```

## 5. Verificações pós-release

- Verificar se a release contém o asset `default.pak`
- Verificar formatação das notas da release
- Verificar se `releases/latest` aponta para a versão nova
- Fazer teste de instalação em uma cópia local do jogo
