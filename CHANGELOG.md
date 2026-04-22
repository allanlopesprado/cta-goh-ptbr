# CHANGELOG

Alterações validadas desde v1.0.1

## v1.1.3
- Atualizações de tradução: ajustes em `localization/default/interface/text/dlg_ingame.pot`, além de atualizações em `localization/default/interface/text/announcements/finesthour.pot` e `localization/default/interface/text/tips.pot`.
- Removido o arquivo `CHANGELOG.md` anterior em um commit de limpeza (reorganização de histórico).

## v1.1.2
- Melhoria na automação de releases: o workflow de release passou a usar `github-script` para auto-incremento de tags e geração de notas; correção na interpolação das notas de release.
- Arquivo afetado: `.github/workflows/release.yml`.

## v1.1.1
- Correção no workflow de release: tratamento de quebras de linha e checkout de tags (fix em `.github/workflows/release.yml`).

## v1.1.0
- Consolidação e reorganização do repositório: adição/atualização massiva de arquivos `.pot` em `localization/default` (várias missões e diálogos), inclusão de templates e arquivos de configuração em `.github/`, remoção do script legado `criar_pak.ps1` e limpeza/renomeação de documentação (`docs/`).
- Melhorias no workflow de release e validação (`.github/workflows/release.yml`, `.github/workflows/validate.yml`).

## v1.0.7
- Ajustes pontuais na tradução da missão `041-usa_airborne` (arquivo `localization/pt_BR/interface/text/mission/single/041-usa_airborne/1944_09_01_nijmegen.pot`).

## v1.0.6
- Removido o arquivo de sugestões de tradução `localization/pt_BR/interface/text/mission/single/041-usa_airborne/sugestoes_traducao.md` (limpeza de arquivo auxiliar).

## v1.0.5
- Revisão de tradução da missão `041-usa_airborne`: ajustes de texto em vários arquivos (`pathfinders`, `sainte_mere_eglise`, `brecourt_manor`, `la-fiere_bridge`, `carentan`, `bloody_gulch`, entre outros).

## v1.0.4
- Melhorias de naturalidade, clareza e consistência nas traduções da missão `051-ger_finesthour` (vários arquivos: `1940_05_arras`, `1940_06_st_valery_en_caux`, `1944_06_swordbeach`, `1944_06_tilly_sur_seulles`, `1944_09_koevering`, `1944_10_woensdrecht`).

## v1.0.3
- Correções de traduções em missões diversas e em `info.pot` (entre outros arquivos de localização). Arquivos afetados incluem missões como `1944_06_saint_lo_hills`, `1939_12_kollaa`, `1944_12_01_noville`, `1944_09_20_oosterbeek` e `1945_03_24_varsity`.

## v1.0.2
- Atualizações nas traduções PT-BR: ajustes em `dlg_frontend.pot`, `dlg_ingame.pot`, `dlg_mp.pot`, `info.pot` e `desc_weapon_ger.pot`.

---

Notas:
- Cada item foi extraído e validado a partir dos commits entre as tags (`v1.0.1` → `v1.1.3`). Se desejar, posso:
  - gerar entradas mais detalhadas por arquivo/linha; ou
  - atualizar diretamente os corpos das Releases no GitHub; ou
  - abrir um PR com este arquivo (posso criar e mesclar automaticamente se preferir).
