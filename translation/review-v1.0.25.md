# Revisão contextual da tradução v1.0.25

518 ajustes em 49 catálogos: 487 de padronização de rótulos e 31 complementares
de contexto e clareza. Consulte o [pacote da versão](https://github.com/allanlopesprado/cta-goh-ptbr/releases/tag/v1.0.25)
e o [README de instalação](../README.md). As evidências técnicas ficam nos
relatórios separados abaixo.

## Exemplos dos ajustes

| Antes | Agora |
| --- | --- |
| StG 44 (Com Mira Telescópica) | StG 44 (Mira Telescópica) |
| Operador MG | Operador de MG |
| Auxiliar de Tripulação de Metralhadora | Auxiliar da Guarnição de MG |
| Explorador [Maavoimat] | Batedor [Maavoimat] |
| Tripulação de tanque, em reforço de pessoas | Tripulantes de tanque |
| Obuseiro M1 de 4.5 polegadas, no menu identificado | Canhão M1 de 4.5 pol. |
| Câmbio e encerro, para Out | Encerro |

Nos nomes de armas, Scope/Scoped usam Mira Telescópica. Em uma fala, com mira
ou luneta podem continuar naturais. Guarnição de armamento não é tripulação de
veículo; modelos, variantes, patentes, formações e códigos não recebem
substituições globais. Rótulos nominais usam pol.; na prosa, polegadas continua
válido. A designação composta 3-in SP Mk.I permanece intacta.

## Contexto das falas e objetivos

Os 121 catálogos de missão, com 5.385 associações, foram cruzados com chamadas
dos roteiros nativos. O registro separa ramificações, locutores candidatos e
blocos explicitamente desativados. Cinco cenas prioritárias, com 54 associações,
receberam conferência conversacional dirigida; a indexação dos demais textos
não equivale a uma nova leitura semântica integral.

Objetivos e condições têm decisões graduadas por evidência. Nomes localizados
de Nagant, M1 e Churchill foram alinhados à interface nos casos comprovados ou
explicitamente harmonizados pelo identificador. O menu Airborne do M1 compartilha
identificador, calibre e modelo, mas não teve caller independente comprovado.
Cromwell IV/VI, T-34/84 e patente de Urquhart permaneceram conforme suas fontes,
sem preencher referentes incertos por suposição.

Trinta candidatos de legibilidade foram lidos contra o inglês. Três instruções
extensas ficaram mais claras, conservando requisitos, teclas e destinatários.
Não foram inseridas quebras automáticas nem impostos limites de legendas de
cinema. Encaixe na janela e sincronização com áudio são verificações no jogo.

## Decisões e proteção contra regressões

O glossário distingue sentidos, não apenas grafias. Partisans/partisano são
português válido; guerrilheiros é uma padronização editorial nos contextos
soviéticos listados. Redações de versões anteriores permanecem como histórico,
sem restauração por frequência ou maioria.

As verificações atuais cobrem todos os 362 catálogos e as 22.030 associações.
Proteções específicas conferem nomes de modelos, variantes, classes, calibres,
condições, variáveis e pontuação sem U+2014. Mutações de teste demonstram que os
verificadores detectam exemplos de regressão; isso não certifica todo o sentido
de uma tradução nova. O pacote contém 363 arquivos PT-BR, com bytes e CRC32
conferidos; a referência inglesa permanece intacta.

Os 268 testes passaram. As regras contextuais protegem 3.702 decisões; os
verificadores específicos conferem 2.051 entradas semânticas e 1.509 rótulos
no escopo declarado. A conferência independente reconstruiu os 518 ajustes e
o pacote, com bytes idênticos aos arquivos locais.

Consulte os [31 ajustes complementares](functional-review-2026-10-13.json),
a [padronização anterior de rótulos](label-consistency-review-2026-10-13.json)
e a [validação final desta etapa](functional-validation-2026-10-13.json).
As evidências de [cenas](mission-context-review-2026-10-13.json),
[objetivos](mission-contract-review-2026-10-13.json),
[legibilidade](subtitle-readability-review-2026-10-13.json) e
[decisões históricas](decision-reconciliation-2026-10-13.json) ficam separadas
para consulta técnica.

Os relatórios preservam as etapas da revisão, incluindo a conferência local
anterior à publicação.
