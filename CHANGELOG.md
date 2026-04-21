# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

## [v1.7] - 2026-04-19

### Corrigido
- `dlg_ingame.pot`: "Engine" traduzido incorretamente como "Motorizado" corrigido para "Motor" em 5 entradas (`engine_toggle`, `engine_broken`, `engine_burn`, `vehicle_view/engine`, `vehicle_view/engine_broken`)
- `1941_12_tikhvin.pot`: "Motorizado a fundo!" corrigido para "Motor a fundo!"
- `dlg_ingame.pot` e `dlg_frontend.pot`: "Marcha à Ré / marcha à ré" padronizado para "Marcha Ré / marcha ré" em 7 entradas

## [v1.6] - 2026-04-19

### Adicionado
- Scripts Python de terminologia: `export_term_inventory.py`, `find_term_inventory.py`, `link_canonical_contexts.py`, `export_canonical_candidates.py`, `report_inconsistencies.py`, `review_candidates.py`, `validate_consistency.py`
- Arquivo `candidatos_canonicos.jsonl` com fila de candidatos sem contexto canônico
- Suporte a filtros de contexto em `contextos_canonicos.yaml`: `match_categories`, `match_msgctxt_prefixes`, `match_file_globs`

### Alterado
- Scripts PowerShell `Export-TermInventory.ps1` e `Find-TermInventory.ps1` substituídos pelos equivalentes em Python
- Fluxo de trabalho terminológico expandido com vinculação automática de contextos canônicos
- Documentação `terminologia/README.md` atualizada com novos comandos e etapas do fluxo

## [v1.062.0-ptbr] - 2026-04-18

### Adicionado
- Tradução PT-BR distribuída no formato `default.pak` compatível com o jogo
- Pipeline de validação automática do pacote (`Validate`)
- Pipeline de release (`Release Pak`) por tag e disparo manual
- Documentação de comunidade em PT-BR (contribuição, conduta, segurança e suporte)
- Templates de Issue/PR em PT-BR
- Checklist operacional de release

### Corrigido
- Estrutura do empacotamento para espelhar o formato original, incluindo entrada raiz `default/`
- Notas da release no GitHub com formatação correta
- Documentação de instalação alinhada ao fluxo de substituição de `default.pak`

### Documentação
- README ampliado com metodologia, auditorias e fontes históricas/técnicas de validação terminológica
- Avisos legais e escopo de licenciamento clarificados
