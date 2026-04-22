# Sugestões de Melhoria de Tradução - Missão 041-usa_airborne
### ⚠️ Revisão Crítica Aplicada (segunda passagem humana)

Este arquivo passou por uma segunda revisão crítica das sugestões geradas por IA.
Entradas marcadas com `[CORRIGIDO]` foram alteradas com justificativa ao final de cada bloco.
Entradas marcadas com `[MANTIDO ORIGINAL]` tiveram a sugestão da IA revertida.

---

## Validação com traduções em espanhol (aplicado)

Realizei uma checagem cruzada com as traduções em [localization/es/.../041-usa_airborne](localization/es/interface/text/mission/single/041-usa_airborne) e apliquei as seguintes decisões nas sugestões abaixo:

- **Termos técnicos:** manter nomes originais (`Panther`, `Flak 88`, `MG42`, `StuG`) sem traduzir.
- **Gírias/epítetos:** usar "os alemães" em UI/objetivos e manter "Jerry" apenas em falas informais quando apropriado.
- **"Artillery barrage":** ~~padronizado para **"Salva de artilharia"**~~ → **revertido para "Barragem de artilharia"** (ver justificativa abaixo).
- **Rodovia / Autoestrada:** padronizado para **"Autoestrada"** (ex.: "Autoestrada 69").
- **Imperativo:** recomenda-se o **imperativo plural** em instruções/UI; falas pessoais podem manter variação singular.
- **Observação:** mantive alternativas nas motivações quando o contexto do jogo puder justificar outra escolha.

---

## 1944_06_01_pathfinders.pot

**msgid:** "Get ready for the arrival of German reinforcements!"
**msgstr atual:** "Preparem-se para a chegada dos reforços alemães!"
**Sugestão:** "Preparem-se para a chegada dos reforços alemães!"
**Motivo:** [MANTIDO ORIGINAL] — A IA sugeriu regredir para o singular "Prepare-se", alegando que é "mais comum em comandos militares". Isso está incorreto: comandos dados a uma unidade/grupo usam imperativo plural em PT-BR. "Preparem-se" é a forma correta aqui.

---

**msgid:** "The Pathfinders"
**msgstr atual:** "Os Batedores"
**Sugestão:** "Os Batedores"
**Motivo:** Manter como está, pois está correto e natural.

---

**msgid:** "Come on. We're at war, after all. At least you're still alive!"
**msgstr atual:** "Vamos. Estamos em guerra, afinal. Pelo menos você ainda está vivo!"
**Sugestão:** "Vamos lá. Estamos em guerra, afinal. Pelo menos você está vivo!"
**Motivo:** "Vamos lá" é mais natural e direto. Aceito.

---

**msgid:** "Hey, my American friends! Sorry for the harsh welcome. Life here has become tough for all of us under German occupation, but most of us are glad you are finally here. However, I fear my friend intends to inform the Germans of your position."
**msgstr atual:** "Ei, meus amigos americanos! Desculpe a recepção difícil. A vida aqui ficou dura para todos nós sob a ocupação alemã, mas a maioria está feliz que vocês finalmente chegaram. No entanto, temo que meu amigo pretenda informar os alemães sobre a posição de vocês."
**Sugestão:** "Ei, amigos americanos! Desculpem a recepção difícil. A vida aqui ficou dura para todos sob a ocupação alemã, mas a maioria está feliz que vocês finalmente chegaram. Porém, temo que meu amigo queira informar os alemães sobre a posição de vocês."
**Motivo:** Ajuste de naturalidade e concisão. Aceito.

---

## 1944_06_02_sainte_mere_eglise.pot (revisado)

**msgid:** "You wandered off and failed to find your Commander. You have been captured - Mission failure!"
**msgstr atual:** "Você se perdeu e não encontrou seu Comandante. Você foi capturado — Missão fracassada!"
**Sugestão:** "Você se perdeu e não encontrou o Comandante. Você foi capturado — Missão fracassada!"
**Motivo:** Manter "Comandante" com maiúscula para consistência narrativa e padrão militar. Aceito.

---

**msgid:** "To recruit landing paratroopers, approach close to one, and they will automatically be assigned to your team!"
**msgstr atual:** "Para recrutar paraquedistas que pousaram, aproxime-se de um deles e ele será automaticamente adicionado à sua equipe!"
**Sugestão:** "Para recrutar paraquedistas recém-chegados, aproxime-se de um deles e ele será automaticamente adicionado à sua unidade!"
**Motivo:** "Unidade" é o termo mais estável e militar para o contexto do jogo. Aceito.

---

**msgid:** "Alternatively, move one of your units near the friendly unit you wish to recruit, hover your cursor over the allied unit, and a grabbing icon will appear."
**msgstr atual:** "Alternativamente, mova uma de suas unidades perto da unidade aliada que deseja recrutar, passe o cursor sobre ela e um ícone de pegar aparecerá."
**Sugestão:** "Alternativamente, mova uma de suas unidades para perto da unidade aliada que deseja recrutar, passe o cursor sobre ela e um ícone de mão aparecerá."
**Motivo:** "Unidade" para consistência militar, "ícone de mão" para clareza. Aceito.

---

**msgid:** "Check your map and follow the alternating pointers to reach your objective. Avoid German patrols if you can. Above all, stay away from the southwest part of town (red zone) to avoid being captured!"
**msgstr atual:** "Verifique o mapa e siga os ponteiros alternados para alcançar seu objetivo. Evite patrulhas alemãs se possível. Acima de tudo, fique longe da parte sudoeste da cidade (zona vermelha) para não ser capturado!"
**Sugestão:** "Verifique o mapa e siga os marcadores alternados para alcançar seu objetivo. Evite patrulhas alemãs sempre que possível. Acima de tudo, mantenha-se longe da parte sudoeste da cidade (zona vermelha) para evitar ser capturado!"
**Motivo:** "Marcadores" é mais comum em jogos, e o restante mantém o tom militar e instrucional. Aceito.

---

## 1944_06_03_brecourt_manor.pot

**msgid:** "June 6th, 1944 · Brécourt Manor, Normandy, France."
**msgstr atual:** "6 de junho de 1944 · Mansão Brécourt, Normandia, França."
**Sugestão:** "6 de junho de 1944 · Mansão Brécourt, Normandia, França."
**Motivo:** Tradução correta e natural, mantendo o nome próprio e padrão de datas.

---

**msgid:** "The successful assault at Brécourt Manor, in part, gave the troops at Utah Beach a relatively easy landing. This assault has become a classic case study in military training for engaging a superior enemy force. Colonel Robert Sink, who commanded the 506th Parachute Infantry Regiment, put forward Dick Winters for the Medal of Honor. Still, it was downgraded to the Distinguished Service Cross due to a policy allowing only one Medal of Honor per division. Despite this, both Winters and Lieutenant Speirs would later gain global recognition for their actions at Brécourt Manor and in subsequent battles."
**msgstr atual:** "O bem-sucedido assalto à Mansão Brécourt, em parte, proporcionou às tropas na Praia Utah um desembarque relativamente tranquilo. Este assalto tornou-se um estudo de caso clássico em treinamento militar para combater uma força inimiga superior. O Coronel Robert Sink, que comandava o 506º Regimento de Infantaria Paraquedista, indicou Dick Winters para a Medalha de Honra. No entanto, foi rebaixada para a Cruz de Serviço Distinto devido à política de apenas uma Medalha de Honra por divisão. Ainda assim, tanto Winters quanto o Tenente Speirs ganhariam reconhecimento mundial por suas ações em Brécourt e em batalhas posteriores."
**Sugestão:** "O assalto bem-sucedido à Mansão Brécourt, em parte, proporcionou às tropas em Utah Beach um desembarque relativamente tranquilo. Essa ação tornou-se um estudo de caso clássico no treinamento militar para enfrentar forças inimigas superiores. O Coronel Robert Sink, comandante do 506º Regimento de Infantaria Paraquedista, indicou Dick Winters para a Medalha de Honra, mas ela foi rebaixada para a Cruz de Serviço Distinto devido à política de apenas uma Medalha de Honra por divisão. Ainda assim, tanto Winters quanto o Tenente Speirs ganhariam reconhecimento mundial por suas ações em Brécourt e em batalhas posteriores."
**Motivo:** Ajuste de fluidez, clareza e padronização de termos militares. "Utah Beach" mantido como nome próprio histórico (código de operação, não traduzir). Aceito.

---

**msgid:** "Hold Fast!"
**msgstr atual:** "Aguentar Firme!"
**Sugestão:** "Aguentem Firme!"
**Motivo:** [CORRIGIDO] — A IA sugeriu "Aguente Firme!" (singular), mas o padrão adotado no projeto é imperativo plural para comandos militares. "Aguentem Firme!" está alinhado com esse padrão. "Aguentar Firme!" (infinitivo do original) é também válido como forma de comando impessoal em PT-BR militar, mas o plural é preferível para consistência com o restante do arquivo.

---

**msgid:** "Easy Company, Listen Up! Our boys on Utah Beach are getting hammered by that Kraut artillery. Drop everything except weapons and ammo!"
**msgstr atual:** "Easy Company, atenção! Nossos rapazes na Praia Utah estão sendo massacrados por aquela artilharia alemã. Largue tudo exceto armas e munição!"
**Sugestão:** "Easy Company, atenção! Nossos rapazes em Utah Beach estão sob fogo pesado da artilharia alemã. Larguem tudo, exceto armas e munição!"
**Motivo:** "Sob fogo pesado" é mais militar, padronização de plural e clareza. "Utah Beach" mantido como nome próprio. Aceito.

---

**msgid:** "Our main objective is to destroy the enemy howitzer battery. Use TNT or satchel charges!"
**msgstr atual:** "Nosso objetivo principal é destruir a bateria de obuseiros inimiga. Use TNT ou cargas explosivas!"
**Sugestão:** "Nosso objetivo principal é destruir a bateria de obuseiros inimiga. Usem TNT ou cargas de demolição!"
**Motivo:** "Cargas de demolição" é mais preciso no contexto militar. Plural adicionado. Aceito.

---

**msgid:** "After we're done with the howitzers, we'll need to clear the Germans from the nearby manor."
**msgstr atual:** "Depois de terminarmos com os obuses, precisaremos limpar os alemães da mansão próxima."
**Sugestão:** "Depois de lidarmos com os obuseiros, precisamos eliminar os alemães da mansão próxima."
**Motivo:** "Eliminar" é mais militar e direto. "Obuseiros" é mais correto que "obuses". Aceito.

---

**msgid:** "We'll use the .30 cal machine guns to set a base of fire and assault the enemy artillery from the flank. We'll get in close, then hit them hard and fast."
**msgstr atual:** "Usaremos as metralhadoras calibre .30 para estabelecer uma base de fogo e assaltar a artilharia inimiga pelo flanco. Chegaremos perto, depois golpeamos forte e rápido."
**Sugestão:** "Vamos usar as metralhadoras calibre .30 para estabelecer uma base de fogo e atacar a artilharia inimiga pelo flanco. Aproximem-se e ataquem com força e rapidez."
**Motivo:** Imperativo direto e padronização do tom de comando. Aceito.

---

**msgid:** "Avoid the open field to the east, or they'll spot us!"
**msgstr atual:** "Evite o campo aberto a leste, ou eles nos verão!"
**Sugestão:** "Evitem o campo aberto a leste, ou seremos avistados!"
**Motivo:** Plural para comando e tom militar. Aceito.

---

## 1944_06_04_la-fiere_bridge.pot

**msgid:** "Bazooka team, awaiting orders!"
**msgstr atual:** "Equipe de bazuca, aguardando ordens!"
**Sugestão:** "Equipe de bazuca, aguardando ordens!"
**Motivo:** Tradução correta e natural, mantendo o termo militar.

---

**msgid:** "Sniper team, ready for action!"
**msgstr atual:** "Equipe de atiradores, pronta para ação!"
**Sugestão:** "Equipe de atiradores, pronta para ação!"
**Motivo:** Tradução adequada, termo militar preservado.

---

**msgid:** "June 6th, 1944 · La Fière, Normandy, France."
**msgstr atual:** "6 de junho de 1944 · La Fière, Normandia, França."
**Sugestão:** "6 de junho de 1944 · La Fière, Normandia, França."
**Motivo:** Tradução correta, mantendo nomes próprios e padrão de datas.

---

**msgid:** "Stand at La Fière"
**msgstr atual:** "A Batalha de La Fière"
**Sugestão:** "A Batalha de La Fière"
**Motivo:** Tradução adequada para contexto histórico e militar.

---

**msgid:** "The Germans have flooded the fields around the Merderet river because they anticipated the invasion..."
**msgstr atual:** "Os alemães inundaram os campos ao redor do rio Merderet porque anteciparam a invasão..."
**Sugestão:** "Os alemães inundaram os campos ao redor do rio Merderet porque anteciparam a invasão..."
**Motivo:** Tradução correta e natural.

---

**msgid:** "We need to secure the bridge to prevent German reserves from counterattacking Sainte-Mere-Eglise or reinforcing the Utah Beach defenses!"
**msgstr atual:** "Precisamos assegurar a ponte para impedir que reservas alemãs contra-ataquem Sainte-Mère-Église ou reforcem as defesas da Praia Utah!"
**Sugestão:** "Precisamos assegurar a ponte para impedir que reservas alemãs contra-ataquem Sainte-Mère-Église ou reforcem as defesas de Utah Beach!"
**Motivo:** Padronização do nome "Utah Beach" conforme uso militar histórico (nome de código, não traduzir). Aceito.

---

**msgid:** "There is a small garrison in a nearby manor. We need to capture the manor to secure and hold the bridge."
**msgstr atual:** "Há uma pequena guarnição numa mansão próxima. Precisamos capturar a mansão para assegurar e manter a ponte."
**Sugestão:** "Há uma pequena guarnição em uma mansão próxima. Precisamos capturar a mansão para assegurar e manter a ponte."
**Motivo:** Pequeno ajuste de naturalidade. Aceito.

---

**msgid:** "There's no time to waste! Let's push the Germans out of there!"
**msgstr atual:** "Não há tempo a perder! Vamos expulsar os alemães de lá!"
**Sugestão:** "Sem tempo a perder! Expulsem os alemães dali!"
**Motivo:** Imperativo direto, tom de comando militar. Aceito.

---

**msgid:** "We cleared out the Krauts! Search for additional equipment and prepare for the inevitable counterattack. This bridge is as important to them as it is to us."
**msgstr atual:** "Limpamos os alemães! Procure equipamentos adicionais e prepare-se para o inevitável contra-ataque. Esta ponte é tão importante para eles quanto para nós."
**Sugestão:** "Eliminamos os alemães! Procurem equipamentos adicionais e preparem-se para o inevitável contra-ataque. Esta ponte é tão importante para eles quanto para nós."
**Motivo:** "Eliminamos" e imperativo plural reforçam o tom militar. Aceito.

---

**msgid:** "Jerry left some explosives in this crate. Let's mine the approach to the bridge with anti-tank mines."
**msgstr atual:** "O Jerry deixou alguns explosivos nesta caixa. Vamos minar a aproximação da ponte com minas antitanque."
**Sugestão:** "Os alemães deixaram explosivos nesta caixa. Minem a aproximação da ponte com minas antitanque."
**Motivo:** "Jerry" adaptado para "os alemães" (uso comum em PT-BR), imperativo plural. Aceito.

---

**msgid:** "Jerry has the frontal approaches covered. Let's push farther south along the path and hit them from the flank!"
**msgstr atual:** "O Jerry tem as abordagens frontais cobertas. Vamos avançar mais ao sul pelo caminho e atacá-los pelo flanco!"
**Sugestão:** "Os alemães cobrem as abordagens frontais. Avancem mais ao sul pelo caminho e ataquem pelo flanco!"
**Motivo:** Plural e tom de comando militar. Aceito.

---

**msgid:** "We now have a 57mm AT-Gun. Let's position it with a good view of the road."
**msgstr atual:** "Temos agora um canhão AT de 57mm. Vamos posicioná-lo com boa visão da estrada."
**Sugestão:** "Agora temos um canhão antitanque de 57mm. Posicionem-no com boa visão da estrada."
**Motivo:** "Antitanque" é mais claro, imperativo plural. Aceito.

---

**msgid:** "A medic team is at your disposal!"
**msgstr atual:** "Uma equipe médica está à sua disposição!"
**Sugestão:** "Equipe médica à disposição!"
**Motivo:** Mais direto, padrão de interface militar. Aceito.

---

**msgid:** "Search the boxes and vehicles around the manor. Gather as much ammo and weapons as you can find!"
**msgstr atual:** "Procure nas caixas e veículos ao redor da mansão. Reúna o máximo de munição e armas que encontrar!"
**Sugestão:** "Revistem as caixas e veículos ao redor da mansão. Reúnam o máximo de munição e armas que encontrarem!"
**Motivo:** Plural e tom de comando militar. Aceito.

---

**msgid:** "Here they come!"
**msgstr atual:** "Lá vêm eles!"
**Sugestão:** "Lá vêm eles!"
**Motivo:** [MANTIDO ORIGINAL] — A IA sugeriu "Eles estão vindo!", que é mais plano e menos urgente. "Lá vêm eles!" é a exclamação natural em PT-BR para esse momento de alerta em combate, com muito mais impacto dramático.

---

**msgid:** "Enemy artillery incoming! Take cover!"
**msgstr atual:** "Artilharia inimiga chegando! Cubra-se!"
**Sugestão:** "Artilharia inimiga! Abriguem-se!"
**Motivo:** Imperativo plural, mais direto e militar. Aceito.

---

**msgid:** "They've got us zeroed! Spread it out!"
**msgstr atual:** "Eles nos têm como alvo! Espalhem!"
**Sugestão:** "Estamos na mira! Dispersem-se!"
**Motivo:** "Dispersem-se" é mais natural e militar. Aceito.

---

**msgid:** "They're retreating!"
**msgstr atual:** "Eles estão recuando!"
**Sugestão:** "Estão recuando!"
**Motivo:** Mais direto, padrão de interface militar. Aceito.

---

**msgid:** "There's something wrong with the AT-gun's breech. Don't fire it too much, or it'll break!"
**msgstr atual:** "Há algo errado com o obturador do canhão AT. Não atire demais, ou vai quebrar!"
**Sugestão:** "Há algo errado com o obturador do canhão antitanque. Não atirem demais, ou vai quebrar!"
**Motivo:** "Antitanque" para clareza, plural para comando. Aceito.

---

**msgid:** "Shit! The AT gun's breech broke! Someone grab a repair kit!"
**msgstr atual:** "Merda! O obturador do canhão AT quebrou! Alguém pegue um kit de reparo!"
**Sugestão:** "Merda! O obturador do canhão antitanque quebrou! Alguém pegue um kit de reparo!"
**Motivo:** [CORRIGIDO] — A IA substituiu "Merda!" por "Droga!" alegando neutralidade. Em um jogo de guerra realista com esse nível de imersão, "Merda!" é a tradução correta e autêntica de "Shit!" — mantém o impacto emocional e o tom dos personagens. "Droga!" dilui desnecessariamente. Apenas a sigla "AT" foi corrigida para "antitanque".

---

**msgid:** "The AT-gun patched up! We're back in business!"
**msgstr atual:** "O canhão AT foi reparado! Estamos de volta!"
**Sugestão:** "O canhão antitanque foi reparado! Estamos prontos novamente!"
**Motivo:** "Antitanque" para clareza, expressão mais natural. Aceito.

---

**msgid:** "We need to defend both the manor and the bridge! Hold the line!"
**msgstr atual:** "Precisamos defender tanto a mansão quanto a ponte! Segurem a linha!"
**Sugestão:** "Precisamos defender a mansão e a ponte! Segurem a linha!"
**Motivo:** Simplificação e clareza. Aceito.

---

**msgid:** "He's not going anywhere!"
**msgstr atual:** "Ele não vai a lugar nenhum!"
**Sugestão:** "Ele não vai escapar!"
**Motivo:** Mais direto e militar. Aceito.

---

**msgid:** "Look what we found, Jerry's radio! Time to call for some backup!"
**msgstr atual:** "Olhem o que encontramos, o rádio do Jerry! Hora de pedir alguns reforços!"
**Sugestão:** "Olhem o que encontramos, o rádio dos alemães! Hora de pedir reforços!"
**Motivo:** "Jerry" adaptado para "os alemães", expressão mais direta. Aceito.

---

**msgid:** "About time you showed up! We're in the thick of it!"
**msgstr atual:** "Já estava na hora de vocês aparecerem! Estamos no meio da batalha!"
**Sugestão:** "Já era hora de aparecerem! Estamos no meio do combate!"
**Motivo:** "Combate" é mais militar. Aceito.

---

**msgid:** "Hey! A bike messenger is making a break for it! Stop him before he can alert another German garrison!"
**msgstr atual:** "Ei! Um mensageiro de bicicleta está fugindo! Parem-no antes que possa alertar outra guarnição alemã!"
**Sugestão:** "Ei! Um mensageiro de bicicleta está fugindo! Parem-no antes que alerte outra guarnição alemã!"
**Motivo:** Ajuste de clareza e concisão. Aceito.

---

**msgid:** "Excellent work! We have successfully secured one of the most important bridges in the area. This position will allow us to build a strong defensive line against any possible German counterattack from the west."
**msgstr atual:** "Excelente trabalho! Asseguramos com sucesso uma das pontes mais importantes da área. Esta posição nos permitirá construir uma forte linha defensiva contra qualquer possível contra-ataque alemão pelo oeste."
**Sugestão:** "Excelente trabalho! Garantimos uma das pontes mais importantes da região. Esta posição nos permitirá construir uma linha defensiva forte contra qualquer possível contra-ataque alemão vindo do oeste."
**Motivo:** Ajuste de naturalidade e clareza. Aceito.

---

**msgid:** "We've lost control of the bridge! With the causeway open, the Germans can advance toward St Mere-Eglise and threaten the invasion. You must try again!"
**msgstr atual:** "Perdemos o controle da ponte! Com a passagem aberta, os alemães podem avançar em direção a St. Mère-Église e ameaçar a invasão. Tente novamente!"
**Sugestão:** "Perdemos o controle da ponte! Com a passagem aberta, os alemães podem avançar para St. Mère-Église e ameaçar a invasão. Tente novamente!"
**Motivo:** Pequeno ajuste de clareza. Aceito.

---

**msgid:** "82nd Airborne Division \"All American\""
**msgstr atual:** "82ª Divisão Aerotransportada \"All American\""
**Sugestão:** "82ª Divisão Aerotransportada \"All American\""
**Motivo:** Tradução correta, mantendo o nome histórico.

---

**msgid:** "(Secret objective #1)"
**msgstr atual:** "(Objetivo Secreto nº 1)"
**Sugestão:** "(Objetivo Secreto nº 1)"
**Motivo:** Tradução correta e padrão.

---

**msgid:** "(Secret objective #2)"
**msgstr atual:** "(Objetivo Secreto nº 2)"
**Sugestão:** "(Objetivo Secreto nº 2)"
**Motivo:** Tradução correta e padrão.

---

**msgid:** "Daybreak on D-Day. The 82nd Airborne is on the ground in Normandy. Not everything went right; the cloud base over the drop zone and the German Flak was dense. You have spent hours of darkness trying to find your comrades, and after a short headcount, it's clear that this will be one hell of a day.\n\n  Your group is tasked to take the bridge at La Fière and hold it until the US Army arrives from Utah Beach. \n\n  Your task is vital; once you take the bridge, the enemy can no longer approach St. Mère-Église from the west, or reach the roads to the invasion beaches.\n\n Good luck!"
**msgstr atual:** "Amanhecer do Dia D. A 82ª Aerotransportada está em solo na Normandia. Nem tudo correu bem; a base das nuvens sobre a zona de lançamento e a Flak alemã eram densas. Você passou horas na escuridão tentando encontrar seus camaradas e, após uma rápida contagem, está claro que este será um dia e tanto.\n\n  Seu grupo tem a missão de tomar a ponte em La Fière e mantê-la até que o Exército dos EUA chegue de Utah Beach.\n\n  Sua missão é vital: uma vez que você tome a ponte, o inimigo não poderá mais se aproximar de St. Mère-Église pelo oeste, nem alcançar as estradas para as praias de invasão.\n\n Boa sorte!"
**Sugestão:** "Amanhecer do Dia D. A 82ª Aerotransportada está em solo na Normandia. Nem tudo saiu como planejado; a base das nuvens sobre a zona de lançamento e a Flak alemã eram densas. Você passou horas na escuridão tentando encontrar seus camaradas e, após uma rápida contagem, está claro que este será um dia e tanto.\n\n  Seu grupo tem a missão de tomar a ponte em La Fière e mantê-la até que o Exército dos EUA chegue de Utah Beach.\n\n  Sua missão é vital: uma vez que você tome a ponte, o inimigo não poderá mais se aproximar de St. Mère-Église pelo oeste, nem alcançar as estradas para as praias de invasão.\n\n Boa sorte!"
**Motivo:** "Nem tudo saiu como planejado" flui melhor que "Nem tudo correu bem". Aceito.

---

**msgid:** "Capture the manor and secure the bridge!"
**msgstr atual:** "Capture a mansão e assegure a ponte!"
**Sugestão:** "Capturem a mansão e assegurem a ponte!"
**Motivo:** Imperativo plural, padrão de comando militar. Aceito.

---

**msgid:** "Prepare for a counterattack."
**msgstr atual:** "Prepare-se para um contra-ataque."
**Sugestão:** "Preparem-se para um contra-ataque."
**Motivo:** Imperativo plural, padrão de comando militar. Aceito.

---

**msgid:** "Defend the bridge and the manor!"
**msgstr atual:** "Defenda a ponte e a mansão!"
**Sugestão:** "Defendam a ponte e a mansão!"
**Motivo:** Imperativo plural, padrão de comando militar. Aceito.

---

**msgid:** "Place at least four anti-tank mines on the road."
**msgstr atual:** "Coloque pelo menos quatro minas antitanque na estrada."
**Sugestão:** "Coloquem pelo menos quatro minas antitanque na estrada."
**Motivo:** Imperativo plural, padrão de comando militar. Aceito.

---

**msgid:** "(Secret objective) Stop the enemy soldier on a bike before he alarms a nearby garrison."
**msgstr atual:** "(Objetivo Secreto) Pare o soldado inimigo de bicicleta antes que ele alarme uma guarnição próxima."
**Sugestão:** "(Objetivo Secreto) Impeça o soldado inimigo de bicicleta antes que ele alerte uma guarnição próxima."
**Motivo:** "Impeça" é mais direto e militar. Aceito.

---

**msgid:** "(Secret objective) Use the radio to call in reinforcements."
**msgstr atual:** "(Objetivo Secreto) Use o rádio para chamar reforços."
**Sugestão:** "(Objetivo Secreto) Use o rádio para pedir reforços."
**Motivo:** "Pedir reforços" é mais natural no contexto militar. Aceito.

---

**msgid:** "Time before the German counterattack:"
**msgstr atual:** "Tempo antes do contra-ataque alemão:"
**Sugestão:** "Tempo até o contra-ataque alemão:"
**Motivo:** "Até" é mais natural e direto. Aceito.

---

## 1944_06_05_carentan.pot

**msgid:** "June 12th, 1944 · Carentan, Normandy, France."
**msgstr atual:** "12 de junho de 1944 · Carentan, Normandia, França."
**Sugestão:** "12 de junho de 1944 · Carentan, Normandia, França."
**Motivo:** Tradução correta, mantendo nomes próprios e padrão de datas.

---

**msgid:** "Lt. Winters is dead!"
**msgstr atual:** "O Ten. Winters está morto!"
**Sugestão:** "O Tenente Winters está morto!"
**Motivo:** Escrever o cargo por extenso para clareza e padrão militar. Aceito.

---

**msgid:** "The Eagles and the Devils"
**msgstr atual:** "As Águias e os Diabos"
**Sugestão:** "As Águias e os Diabos"
**Motivo:** Tradução correta, mantendo o sentido original.

---

**msgid:** "Move men! Get out of the ditch! Go!"
**msgstr atual:** "Movam-se, homens! Saiam da vala! Vamos!"
**Sugestão:** "Movam-se, homens! Fora da vala! Avancem!"
**Motivo:** Imperativo direto, tom de comando militar. Aceito.

---

**msgid:** "The crossroads are secure! Move north along the road to the center of town. Let's move out!"
**msgstr atual:** "O cruzamento está seguro! Movam ao norte pela estrada até o centro da cidade. Vamos partir!"
**Sugestão:** "O cruzamento está seguro! Avancem ao norte pela estrada até o centro da cidade. Vamos partir!"
**Motivo:** [CORRIGIDO] — A IA sugeriu encerrar com "Avançar!" (infinitivo impessoal), mas o original "Let's move out!" tem um "Let's" que inclui o falante — "Vamos partir!" captura isso melhor e soa mais natural. Apenas "Movam" foi corrigido para "Avancem" (mais preciso para movimento ordenado ao norte).

---

**msgid:** "We've got no cover here! Move! Move!"
**msgstr atual:** "Não temos cobertura aqui! Movam! Movam!"
**Sugestão:** "Sem cobertura aqui! Movam-se! Movam-se!"
**Motivo:** [CORRIGIDO] — A IA sugeriu "Avancem! Avancem!", mas "Move! Move!" no original não significa "avançar" — significa "se mexam/saiam daqui". "Avancem" implica progressão para frente específica; "Movam-se!" ou "Mexam-se!" são semanticamente mais precisos. "Sem cobertura aqui!" foi mantido por ser mais direto.

---

**msgid:** "We need to hit those mortars fast, or they'll rip us apart!"
**msgstr atual:** "Precisamos atacar esses morteiros rapidamente, ou eles nos destroçarão!"
**Sugestão:** "Precisamos neutralizar esses morteiros rápido, ou seremos destroçados!"
**Motivo:** "Neutralizar" é mais militar, frase mais direta. Aceito.

---

**msgid:** "Look alive! A fresh squad here to join the fight."
**msgstr atual:** "Atenção! Uma esquadra fresca aqui para se juntar à luta."
**Sugestão:** "Atenção! Uma esquadra recém-chegada para reforçar o combate."
**Motivo:** [CORRIGIDO] — A IA substituiu "esquadra" por "unidade". "Esquadra" é a tradução correta de "squad" no vocabulário militar português. "Unidade" é genérico demais e perde especificidade. Apenas "fresca" foi melhorado para "recém-chegada" e "luta" para "combate" (mais militar).

---

## 1944_06_06_bloody_gulch.pot

**msgid:** "Artillery barrage"
**msgstr atual:** "Barragem de artilharia"
**Sugestão:** "Barragem de artilharia"
**Motivo:** [MANTIDO ORIGINAL] — A IA sugeriu "Salva de artilharia" por alinhamento com o espanhol "salva de artillería". Isso está tecnicamente incorreto em PT-BR: "salva" refere-se a uma descarga simultânea de honra ou saudação (ex.: "salva de 21 tiros"), enquanto "barragem de artilharia" é o termo técnico correto para "artillery barrage" — fogo concentrado e sustentado sobre uma área. O alinhamento com a versão em espanhol não justifica um erro semântico.

---

**msgid:** "June 13th, 1944 · near Carentan, Normandy, France."
**msgstr atual:** "13 de junho de 1944 · próximo a Carentan, Normandia, França."
**Sugestão:** "13 de junho de 1944 · próximo a Carentan, Normandia, França."
**Motivo:** Tradução correta, mantendo nomes próprios e padrão de datas.

---

**msgid:** "Battle of Bloody Gulch"
**msgstr atual:** "Batalha de Bloody Gulch"
**Sugestão:** "Batalha de Bloody Gulch"
**Motivo:** Nome próprio de batalha, manter original.

---

**msgid:** "Easy Company! Our scouts reported that an enemy formation is coming our way and will be here soon!"
**msgstr atual:** "Easy Company! Nossos batedores relataram que uma formação inimiga está a caminho e chegará em breve!"
**Sugestão:** "Easy Company! Nossos batedores relataram que uma formação inimiga está vindo em nossa direção e chegará em breve!"
**Motivo:** Ajuste de clareza e naturalidade. Aceito.

---

**msgid:** "Take up defensive positions along these hedgerows. Reinforce them if you need to. Use the mines to cover possible enemy approaches."
**msgstr atual:** "Assumam posições defensivas ao longo desses bocages. Reforce-os se necessário. Use as minas para cobrir possíveis abordagens inimigas."
**Sugestão:** "Assumam posições defensivas ao longo desses bocages. Reforcem se necessário. Usem minas para cobrir possíveis abordagens inimigas."
**Motivo:** Plural para comandos e consistência militar. Aceito.

---

**msgid:** "Hold your ground and let them come to us. Hang tough, men!"
**msgstr atual:** "Segurem o terreno e deixem-nos vir até nós. Aguentem firme, homens!"
**Sugestão:** "Mantenham a posição e deixem que venham até nós. Aguentem firme, homens!"
**Motivo:** "Mantenham a posição" é mais militar. Aceito.

---

**msgid:** "The enemy has trapped our scout team behind their lines. They've held up in this compound!"
**msgstr atual:** "O inimigo encurralou nossa equipe de batedores por trás das linhas deles. Eles se refugiaram neste complexo!"
**Sugestão:** "O inimigo encurralou nossa equipe de batedores atrás das linhas deles. Eles se refugiaram neste complexo!"
**Motivo:** Ajuste de clareza. "Atrás" em vez de "por trás". Aceito.

---

**msgid:** "Third squad! Break through the German line, link up with the scout team, and fall back before the enemy attack arrives."
**msgstr atual:** "Terceira esquadra! Rompa a linha alemã, una-se à equipe de batedores e recue antes que o ataque inimigo chegue."
**Sugestão:** "Terceira esquadra! Rompam a linha alemã, unam-se à equipe de batedores e recuem antes que o ataque inimigo chegue."
**Motivo:** [CORRIGIDO] — A IA sugeriu "Terceira unidade!" mas "squad" = "esquadra" em português militar. O termo específico deve ser mantido. Apenas os verbos foram corrigidos para o plural.

---

## 1944_09_01_nijmegen.pot

**msgid:** "September 20th, 1944 · Nijmegen, Netherlands."
**msgstr atual:** "20 de setembro de 1944 · Nijmegen, Países Baixos."
**Sugestão:** "20 de setembro de 1944 · Nijmegen, Países Baixos."
**Motivo:** Tradução correta, mantendo nomes próprios e padrão de datas.

---

**msgid:** "The Waal Bridge"
**msgstr atual:** "A Ponte do Waal"
**Sugestão:** "A Ponte do Waal"
**Motivo:** [MANTIDO ORIGINAL] — A IA sugeriu remover o artigo "A" para "padronização". Em português, pontes conservam o artigo definido ("A Ponte do Waal", "A Ponte do Brooklin"). Remover o artigo soa truncado e não é padrão na língua. A sugestão da IA carece de justificativa consistente.

---

**msgid:** "82nd Airborne Division \"All American\""
**msgstr atual:** "82ª Divisão Aerotransportada \"All American\""
**Sugestão:** "82ª Divisão Aerotransportada \"All American\""
**Motivo:** Tradução correta, mantendo o nome histórico.

---

**msgid (trecho):** "Operation Market Garden, a daring combined attack by the 1st Allied Airborne Army and 30 Corps, starts today. Allied Airborne troops are to be dropped at the main objectives; they must secure multiple bridges and hold them until the ground forces arrive."

**msgstr atual:** "  A Operação Market Garden, um audacioso ataque combinado do 1º Exército Aerotransportado Aliado e do XXX Corpo, começa hoje. As tropas aerotransportadas aliadas serão lançadas nos principais objetivos; elas devem assegurar múltiplas pontes e segurá-las até a chegada das forças terrestres."

**Sugestão:** "  A Operação Market Garden, um audacioso ataque combinado do 1º Exército Aerotransportado Aliado e do XXX Corpo, começa hoje. As tropas aerotransportadas aliadas serão lançadas nos objetivos principais; elas devem assegurar múltiplas pontes e mantê-las até a chegada das forças terrestres."

**Motivo:** "objetivos principais" tem ritmo mais natural em PT-BR formal; "mantê-las" é verbo mais direto e fluido que "segurá-las". Aceito.

---

**Sugestões para `1944_09_02_veghel.pot`**

**msgid (trecho):** referências a "Highway 69" / "Rodovia 69" no texto narrativo e na linha sobre avanço das forças terrestres.

**msgstr atual:** utiliza "Rodovia 69" em alguns trechos.

**Sugestão:** substituir "Rodovia 69" por "Autoestrada 69" em todas as ocorrências do projeto para manter consistência com o termo "autoestrada" já utilizado em outros arquivos.

**Motivo:** consistência terminológica entre arquivos da mesma campanha melhora a coesão das traduções e evita variação desnecessária. Aceito.

---

## Resumo das correções aplicadas nesta revisão

| # | Entrada | Problema na sugestão da IA | Correção aplicada |
|---|---------|---------------------------|-------------------|
| 1 | "Get ready for the arrival..." | IA regrediu para singular "Prepare-se" | Mantido "Preparem-se" (plural correto para comandos a grupo) |
| 2 | "Artillery barrage" | "Salva" é semanticamente errado (≠ barragem) | Revertido para "Barragem de artilharia" |
| 3 | "Hold Fast!" | IA sugeriu singular "Aguente Firme!" | Corrigido para "Aguentem Firme!" (plural, consistente com o padrão) |
| 4 | "Here they come!" | "Eles estão vindo!" é plano e sem impacto | Mantido "Lá vêm eles!" (mais natural e urgente) |
| 5 | "Third squad!" / "Terceira esquadra" | IA substituiu por "Terceira unidade" (genérico demais) | Mantido "Terceira esquadra" (tradução correta de "squad") |
| 6 | "Look alive! A fresh squad..." | IA substituiu "esquadra" por "unidade" | Mantido "esquadra", melhorado apenas "fresca" → "recém-chegada" |
| 7 | "Move! Move!" | "Avancem!" implica progressão à frente; "Move!" = se mexam | Corrigido para "Movam-se! Movam-se!" |
| 8 | "Let's move out!" | IA sugeriu "Avançar!" (impessoal), perdendo o "Let's" | Mantido "Vamos partir!" que inclui o falante |
| 9 | "Shit!" → "Droga!" | Dilui o impacto em jogo de guerra realista | Mantido "Merda!" (tradução direta e autêntica) |
| 10 | "The Waal Bridge" → sem artigo | Remoção sem justificativa sólida; pontes têm artigo em PT | Mantido "A Ponte do Waal" |
