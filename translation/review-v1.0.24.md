# Revisão da tradução v1.0.24

Esta revisão compara os textos com o inglês, considerando a função da unidade,
arma, comando e missão. Os exemplos abaixo ajudam a conferir o que mudou sem
precisar ler milhares de linhas. O
[registro completo](adversarial-review-2026-10-13.json) contém originais,
antes/depois, motivos, evidências e cobertura por arquivo.

## Exemplos de correções

Os trechos longos estão abreviados apenas nesta comparação.

| Antes | Agora | Por quê |
| --- | --- | --- |
| Atirador AT Pioneiro | Atirador Pioneiro com Fuzil Antitanque | AT Rifleman identifica o armamento, não qualquer atirador antitanque. |
| Líder de Equipe Flak | Líder de Esquadra da Guarnição Flak | Flak crew Squadleader distingue função e formação. |
| Metralhadora Pesada .50 cal | Munição .50 cal para Metralhadora Pesada | O objeto nativo é munição em fita, não uma arma. |
| Lançamento de Munição | Lançamento Aéreo de Munição | Paradrop explicita entrega pelo ar. |
| INÍCIO na lista de teclas | HOME | Nome de tecla, diferente do botão de início. |
| EXCLUIR na lista de teclas | DELETE | Nome de tecla, diferente da ação de excluir. |
| Embarcar | Adicionar combustível | Pour In é ação de líquido, não de tripulantes. |
| Desembarcar | Despejar combustível | Pour Out é ação de líquido; o rótulo não presume qual veículo ou recipiente é o destino. |
| Selecionar membro 1 | Selecionar membro 1 da esquadra | Select squad member preserva o grupo ao qual o número se refere. |
| tanto no campo de batalha quanto procurando munição | no campo de batalha ou saindo em busca de munição | Either/or oferece alternativas, não as duas ações juntas. |
| clicar com o botão direito sobre ela | clicar com o botão direito sobre a chave | A chave ferroviária recebe o clique, não a unidade selecionada antes. |
| se aproximando de Dochamps em direção a Samrée | vindo de Dochamps em direção a Samrée | From Dochamps indica origem, não destino. |
| Morteiro ML 3-inch | Morteiro ML 3 pol. | Localização da unidade sem converter o calibre nominal. |

## Decisões de contexto mantidas

- **Fuzileiro, atirador de precisão e franco-atirador:** funções distintas quando
  Rifleman, Marksman e Sniper são distinguidos pelo jogo. Não são trocadas por uma
  única palavra só porque todos usam armas de fogo.
- **Auxiliar e subcomandante:** Assistant e 2IC não viram o mesmo cargo nem uma
  patente brasileira inventada.
- **Modelos e códigos:** Mk., pdr, cwt, nomes de veículos e calibres nominais
  permanecem identificáveis. Ford de caminhão não é ford de travessia a vau.
- **Classificações:** Leve em Light Mk.VII Tetrarch pertence à fonte. A revisão
  não apaga qualificadores legítimos nem acrescenta classe a todo veículo.
- **Condições:** veterania de nível 1 ou superior e restrições como “veículo com
  essa habilidade” precisam continuar explícitas. “Pode” e “deve” não são
  automaticamente transformados em certeza.
- **Botões e teclas:** INÍCIO, VOLTAR e EXCLUIR continuam válidos como ações de
  menu. HOME, BACK e DELETE são preservados nos contextos de teclas físicas.

## Limites da própria fonte

O fragmento **The Mayo** não comprova a patente major. A tradução “O major” foi
retirada e o fragmento original foi conservado, sem afirmar que seja nome próprio
ou frase plenamente esclarecida.

No M114, **important shallow objectives** continua ambíguo. Não foi substituído
por “alvos próximos” ou outro sentido não demonstrado. Questões desse tipo ficam
separadas das correções aprovadas no registro completo.

As verificações automáticas protegem características delimitadas, fontes,
marcadores, formas e conteúdo do pacote. Não certificam toda interpretação
histórica nem a largura de todos os textos na tela. O teste do pacote novo no
jogo será feito pelo usuário, conforme combinado.
