// ── Types ──────────────────────────────────────────────────────────────

export interface Phrase {
  spanish: string
  english: string
  pronunciation: string
  isTemplate?: boolean
  tags?: string[]
}

export type SpeechMode = "street" | "neutral" | "formal"
export type IntentKey = "order" | "react" | "ask" | "finish" | "social"

export interface IntentPhrases {
  street: Phrase[]
  neutral: Phrase[]
  formal: Phrase[]
}

export interface FlowStage {
  key: string
  name: string
  phrases: Phrase[]
}

export interface Scenario {
  key: string
  name: string
  emoji: string
  color: string
  intents: Record<IntentKey, IntentPhrases>
  flowStages?: FlowStage[]
}

export type ScenarioKey = Scenario["key"]

// ── Intent labels (shared across all scenarios) ────────────────────────

export const intentMeta: Record<IntentKey, { label: string; icon: string }> = {
  order:  { label: "Order",  icon: "ShoppingCart" },
  react:  { label: "React",  icon: "ThumbsUp"     },
  ask:    { label: "Ask",    icon: "HelpCircle"    },
  finish: { label: "Finish", icon: "CheckCircle"   },
  social: { label: "Social", icon: "MessageCircle" },
}

// ── Rescue phrases (global) ────────────────────────────────────────────

export const rescuePhrases: Phrase[] = [
  { spanish: "Mas despacio, por favor.", english: "Slower, please.", pronunciation: "mahs dehs-PAH-see-oh, por fah-VOR" },
  { spanish: "Puede repetir?", english: "Can you repeat?", pronunciation: "PWEH-deh reh-peh-TEER" },
  { spanish: "No entendi.", english: "I didn't understand.", pronunciation: "noh ehn-tehn-DEE" },
  { spanish: "Que significa?", english: "What does it mean?", pronunciation: "keh seeg-NEE-fee-kah" },
  { spanish: "Como?", english: "Sorry? / What?", pronunciation: "KOH-moh" },
  { spanish: "Me lo puede escribir?", english: "Can you write it down?", pronunciation: "meh loh PWEH-deh ehs-kree-BEER" },
  { spanish: "Un segundo.", english: "One second.", pronunciation: "oon seh-GOON-doh" },
  { spanish: "Estoy aprendiendo espanol.", english: "I'm learning Spanish.", pronunciation: "ehs-TOY ah-prehn-dee-EHN-doh ehs-pah-NYOL" },
]

// ── Scenarios ──────────────────────────────────────────────────────────

export const scenarios: Scenario[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ BAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: "bar",
    name: "Bar",
    emoji: "\uD83C\uDF7A",
    color: "amber",
    intents: {
      order: {
        street: [
          { spanish: "Una chela.", english: "A beer.", pronunciation: "OO-nah CHEH-lah", tags: ["beer"] },
          { spanish: "Ponme otra.", english: "Hit me again.", pronunciation: "POHN-meh OH-trah" },
          { spanish: "Otra ronda.", english: "Another round.", pronunciation: "OH-trah ROHN-dah" },
          { spanish: "Un mezcal derecho.", english: "A neat mezcal.", pronunciation: "oon mehs-KAHL deh-REH-choh", tags: ["mezcal"] },
          { spanish: "Dame un trago de ___.", english: "Give me a shot of ___.", pronunciation: "DAH-meh oon TRAH-goh deh ___", isTemplate: true },
          { spanish: "Lo mismo.", english: "Same thing.", pronunciation: "loh MEES-moh" },
          { spanish: "Algo con poca azucar.", english: "Something low-sugar.", pronunciation: "AHL-goh kohn POH-kah ah-SOO-kar" },
          { spanish: "Sin hielo.", english: "No ice.", pronunciation: "seen YEH-loh" },
          { spanish: "Con limon.", english: "With lime.", pronunciation: "kohn lee-MOHN" },
          { spanish: "Un shot de tequila.", english: "A tequila shot.", pronunciation: "oon shot deh teh-KEE-lah", tags: ["tequila"] },
        ],
        neutral: [
          { spanish: "Una cerveza, por favor.", english: "A beer, please.", pronunciation: "OO-nah ser-VEH-sah, por fah-VOR", tags: ["beer"] },
          { spanish: "Otra ronda, por favor.", english: "Another round, please.", pronunciation: "OH-trah ROHN-dah, por fah-VOR" },
          { spanish: "Un mezcal solo, por favor.", english: "A neat mezcal, please.", pronunciation: "oon mehs-KAHL SOH-loh, por fah-VOR", tags: ["mezcal"] },
          { spanish: "Quisiera un/una ___.", english: "I'd like a ___.", pronunciation: "kee-see-EH-rah oon/OO-nah ___", isTemplate: true },
          { spanish: "Lo mismo otra vez.", english: "The same again.", pronunciation: "loh MEES-moh OH-trah vehs" },
          { spanish: "Algo dulce, por favor.", english: "Something sweet, please.", pronunciation: "AHL-goh DOOL-seh, por fah-VOR" },
          { spanish: "Sin hielo, por favor.", english: "Without ice, please.", pronunciation: "seen YEH-loh, por fah-VOR" },
          { spanish: "Con limon, por favor.", english: "With lime, please.", pronunciation: "kohn lee-MOHN, por fah-VOR" },
          { spanish: "Puedo probar ese?", english: "Can I try that one?", pronunciation: "PWEH-doh proh-BAR EH-seh" },
          { spanish: "Solo agua, gracias.", english: "Just water, thanks.", pronunciation: "SOH-loh AH-gwah, GRAH-see-ahs" },
        ],
        formal: [
          { spanish: "Me podria traer una cerveza, por favor?", english: "Could you bring me a beer, please?", pronunciation: "meh poh-DREE-ah trah-EHR OO-nah ser-VEH-sah, por fah-VOR", tags: ["beer"] },
          { spanish: "Quisiera otra ronda, por favor.", english: "I'd like another round, please.", pronunciation: "kee-see-EH-rah OH-trah ROHN-dah, por fah-VOR" },
          { spanish: "Podria recomendarme un coctel?", english: "Could you recommend a cocktail?", pronunciation: "poh-DREE-ah reh-koh-mehn-DAR-meh oon KOK-tel" },
          { spanish: "Me gustaria ordenar un ___.", english: "I'd like to order a ___.", pronunciation: "meh goos-tah-REE-ah or-deh-NAR oon ___", isTemplate: true },
          { spanish: "Podria traerme lo mismo, por favor?", english: "Could you bring me the same, please?", pronunciation: "poh-DREE-ah trah-EHR-meh loh MEES-moh, por fah-VOR" },
          { spanish: "Sin hielo, si es tan amable.", english: "Without ice, if you would be so kind.", pronunciation: "seen YEH-loh, see ehs tahn ah-MAH-bleh" },
          { spanish: "Pudiera ver la carta de bebidas?", english: "Could I see the drinks menu?", pronunciation: "poo-dee-EH-rah vehr lah KAR-tah deh beh-BEE-dahs" },
          { spanish: "Me gustaria sentarme en la barra, por favor.", english: "I'd like to sit at the bar, please.", pronunciation: "meh goos-tah-REE-ah sehn-TAR-meh en lah BAH-rah, por fah-VOR" },
        ],
      },
      react: {
        street: [
          { spanish: "Esta bien bueno.", english: "This is really good.", pronunciation: "ehs-TAH bee-EHN BWEH-noh" },
          { spanish: "Esta muy fuerte!", english: "This is strong!", pronunciation: "ehs-TAH mooy FWEHR-teh" },
          { spanish: "Me encanto.", english: "Loved it.", pronunciation: "meh ehn-kahn-TOH" },
          { spanish: "Sabe raro.", english: "Tastes weird.", pronunciation: "SAH-beh RAH-roh" },
          { spanish: "Esta aguado.", english: "It's watered down.", pronunciation: "ehs-TAH ah-GWAH-doh" },
          { spanish: "Justo lo que queria.", english: "Just what I wanted.", pronunciation: "HOOS-toh loh keh keh-REE-ah" },
          { spanish: "No mames, que rico!", english: "Damn, that's good!", pronunciation: "noh MAH-mehs, keh REE-koh" },
          { spanish: "Esta tibio.", english: "It's warm / not cold.", pronunciation: "ehs-TAH TEE-bee-oh" },
        ],
        neutral: [
          { spanish: "Esta muy rico.", english: "It's really good.", pronunciation: "ehs-TAH mooy REE-koh" },
          { spanish: "Esta demasiado fuerte.", english: "It's too strong.", pronunciation: "ehs-TAH deh-mah-see-AH-doh FWEHR-teh" },
          { spanish: "Me gusto mucho.", english: "I liked it a lot.", pronunciation: "meh goos-TOH MOO-choh" },
          { spanish: "No me gusto tanto.", english: "I didn't like it much.", pronunciation: "noh meh goos-TOH TAHN-toh" },
          { spanish: "Esta un poco dulce.", english: "It's a bit sweet.", pronunciation: "ehs-TAH oon POH-koh DOOL-seh" },
          { spanish: "Prefiero algo mas amargo.", english: "I prefer something more bitter.", pronunciation: "preh-fee-EH-roh AHL-goh mahs ah-MAR-goh" },
          { spanish: "Esta perfecto.", english: "It's perfect.", pronunciation: "ehs-TAH per-FEHK-toh" },
          { spanish: "Podria estar mas frio.", english: "It could be colder.", pronunciation: "poh-DREE-ah ehs-TAR mahs FREE-oh" },
        ],
        formal: [
          { spanish: "Esta excelente, muchas gracias.", english: "It's excellent, thank you.", pronunciation: "ehs-TAH ehk-seh-LEHN-teh, MOO-chahs GRAH-see-ahs" },
          { spanish: "Quedo perfecto.", english: "It turned out perfect.", pronunciation: "keh-DOH per-FEHK-toh" },
          { spanish: "Me temo que esta un poco fuerte.", english: "I'm afraid it's a bit strong.", pronunciation: "meh TEH-moh keh ehs-TAH oon POH-koh FWEHR-teh" },
          { spanish: "Estaria mejor un poco mas frio.", english: "It would be better a little colder.", pronunciation: "ehs-tah-REE-ah meh-HOR oon POH-koh mahs FREE-oh" },
          { spanish: "Muy buena seleccion.", english: "Very good selection.", pronunciation: "mooy BWEH-nah seh-lehk-see-OHN" },
          { spanish: "Mis felicitaciones al barman.", english: "My compliments to the bartender.", pronunciation: "mees feh-lee-see-tah-see-OH-nehs ahl bar-MAHN" },
        ],
      },
      ask: {
        street: [
          { spanish: "Que tienen?", english: "What do you have?", pronunciation: "keh tee-EH-nen" },
          { spanish: "Que trae ese?", english: "What's in that one?", pronunciation: "keh TRAH-eh EH-seh" },
          { spanish: "Cual es la de la casa?", english: "What's the house special?", pronunciation: "kwahl ehs lah deh lah KAH-sah" },
          { spanish: "Tienen algo sin alcohol?", english: "Got anything non-alcoholic?", pronunciation: "tee-EH-nen AHL-go seen ahl-koh-OL" },
          { spanish: "Donde esta el bano?", english: "Where's the bathroom?", pronunciation: "DOHN-deh ehs-TAH el BAH-nyoh" },
          { spanish: "A que hora cierran?", english: "What time do you close?", pronunciation: "ah keh OH-rah see-EH-rahn" },
          { spanish: "Cuanto cuesta?", english: "How much?", pronunciation: "KWAHN-toh KWEHS-tah" },
          { spanish: "Hay musica en vivo?", english: "Is there live music?", pronunciation: "eye MOO-see-kah en VEE-voh" },
        ],
        neutral: [
          { spanish: "Que cervezas tienen?", english: "What beers do you have?", pronunciation: "keh ser-VEH-sahs tee-EH-nen" },
          { spanish: "Que lleva este coctel?", english: "What's in this cocktail?", pronunciation: "keh YEH-vah EHS-teh KOK-tel" },
          { spanish: "Cual es la especialidad de la casa?", english: "What's the house specialty?", pronunciation: "kwahl ehs lah ehs-peh-see-ah-lee-DAHD deh lah KAH-sah" },
          { spanish: "Tienen opciones sin alcohol?", english: "Do you have non-alcoholic options?", pronunciation: "tee-EH-nen op-see-OH-nehs seen ahl-koh-OL" },
          { spanish: "Donde esta el bano?", english: "Where is the bathroom?", pronunciation: "DOHN-deh ehs-TAH el BAH-nyoh" },
          { spanish: "A que hora cierran?", english: "What time do you close?", pronunciation: "ah keh OH-rah see-EH-rahn" },
          { spanish: "Cuanto cuesta esto?", english: "How much is this?", pronunciation: "KWAHN-toh KWEHS-tah EHS-toh" },
          { spanish: "Puedo ver la carta de bebidas?", english: "Can I see the drinks menu?", pronunciation: "PWEH-doh vehr lah KAR-tah deh beh-BEE-dahs" },
        ],
        formal: [
          { spanish: "Podria decirme que cervezas manejan?", english: "Could you tell me what beers you carry?", pronunciation: "poh-DREE-ah deh-SEER-meh keh ser-VEH-sahs mah-NEH-hahn" },
          { spanish: "Que me recomienda?", english: "What do you recommend?", pronunciation: "keh meh reh-koh-mee-EHN-dah" },
          { spanish: "Disculpe, donde se encuentran los banos?", english: "Excuse me, where are the restrooms?", pronunciation: "dees-KOOL-peh, DOHN-deh seh ehn-KWEHN-trahn lohs BAH-nyohs" },
          { spanish: "Podria indicarme su horario?", english: "Could you tell me your hours?", pronunciation: "poh-DREE-ah een-dee-KAR-meh soo oh-RAH-ree-oh" },
          { spanish: "Me permitiria ver la carta, por favor?", english: "May I see the menu, please?", pronunciation: "meh per-mee-tee-REE-ah vehr lah KAR-tah, por fah-VOR" },
          { spanish: "Tendria alguna opcion sin alcohol?", english: "Would you have any non-alcoholic options?", pronunciation: "tehn-DREE-ah ahl-GOO-nah op-see-OHN seen ahl-koh-OL" },
        ],
      },
      finish: {
        street: [
          { spanish: "La cuenta.", english: "The check.", pronunciation: "lah KWEHN-tah" },
          { spanish: "Cuanto es?", english: "How much?", pronunciation: "KWAHN-toh ehs" },
          { spanish: "Aceptan tarjeta?", english: "Take cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "Cuentas separadas.", english: "Separate checks.", pronunciation: "KWEHN-tahs seh-pah-RAH-dahs" },
          { spanish: "Quedese el cambio.", english: "Keep the change.", pronunciation: "KEH-deh-seh el KAHM-bee-oh" },
          { spanish: "Ya estamos.", english: "We're done.", pronunciation: "yah ehs-TAH-mohs" },
          { spanish: "Hay un error aqui.", english: "There's a mistake here.", pronunciation: "eye oon eh-ROHR ah-KEE" },
          { spanish: "En efectivo.", english: "Cash.", pronunciation: "en eh-fehk-TEE-voh" },
        ],
        neutral: [
          { spanish: "La cuenta, por favor.", english: "The check, please.", pronunciation: "lah KWEHN-tah, por fah-VOR" },
          { spanish: "Cuanto es en total?", english: "How much total?", pronunciation: "KWAHN-toh ehs en toh-TAHL" },
          { spanish: "Aceptan tarjeta?", english: "Do you accept cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "Cuentas separadas, por favor.", english: "Separate checks, please.", pronunciation: "KWEHN-tahs seh-pah-RAH-dahs, por fah-VOR" },
          { spanish: "Quedese con el cambio.", english: "Keep the change.", pronunciation: "KEH-deh-seh kohn el KAHM-bee-oh" },
          { spanish: "Quiero pagar en efectivo.", english: "I want to pay in cash.", pronunciation: "kee-EH-roh pah-GAR en eh-fehk-TEE-voh" },
          { spanish: "Esta incluida la propina?", english: "Is the tip included?", pronunciation: "ehs-TAH een-kloo-EE-dah lah proh-PEE-nah" },
          { spanish: "Hay un error en la cuenta.", english: "There's an error on the bill.", pronunciation: "eye oon eh-ROHR en lah KWEHN-tah" },
        ],
        formal: [
          { spanish: "Podria traerme la cuenta, por favor?", english: "Could you bring me the check, please?", pronunciation: "poh-DREE-ah trah-EHR-meh lah KWEHN-tah, por fah-VOR" },
          { spanish: "Seria posible pagar con tarjeta?", english: "Would it be possible to pay by card?", pronunciation: "seh-REE-ah poh-SEE-bleh pah-GAR kohn tar-HEH-tah" },
          { spanish: "Deseamos cuentas por separado, por favor.", english: "We'd like separate checks, please.", pronunciation: "deh-seh-AH-mohs KWEHN-tahs por seh-pah-RAH-doh, por fah-VOR" },
          { spanish: "Conserve el cambio, por favor.", english: "Please keep the change.", pronunciation: "kohn-SEHR-veh el KAHM-bee-oh, por fah-VOR" },
          { spanish: "Disculpe, creo que hay un error en la cuenta.", english: "Excuse me, I think there's an error on the bill.", pronunciation: "dees-KOOL-peh, KREH-oh keh eye oon eh-ROHR en lah KWEHN-tah" },
          { spanish: "Puedo pagar con el telefono?", english: "May I pay with my phone?", pronunciation: "PWEH-doh pah-GAR kohn el teh-LEH-foh-noh" },
        ],
      },
      social: {
        street: [
          { spanish: "Salud!", english: "Cheers!", pronunciation: "sah-LOOD" },
          { spanish: "De donde eres?", english: "Where are you from?", pronunciation: "deh DOHN-deh EH-rehs" },
          { spanish: "Que chido este lugar.", english: "This place is sick.", pronunciation: "keh CHEE-doh EHS-teh loo-GAR" },
          { spanish: "Que estas tomando?", english: "What are you drinking?", pronunciation: "keh ehs-TAHS toh-MAHN-doh" },
          { spanish: "Ando de vacaciones.", english: "I'm on vacation.", pronunciation: "AHN-doh deh vah-kah-see-OH-nehs" },
          { spanish: "Quieres una?", english: "Want one?", pronunciation: "kee-EH-rehs OO-nah" },
          { spanish: "La pase chido.", english: "I had a great time.", pronunciation: "lah PAH-seh CHEE-doh" },
          { spanish: "Vienes seguido?", english: "Come here a lot?", pronunciation: "vee-EH-nehs seh-GEE-doh" },
        ],
        neutral: [
          { spanish: "Salud!", english: "Cheers!", pronunciation: "sah-LOOD" },
          { spanish: "De donde eres?", english: "Where are you from?", pronunciation: "deh DOHN-deh EH-rehs" },
          { spanish: "Este lugar es genial.", english: "This place is great.", pronunciation: "EHS-teh loo-GAR ehs heh-nee-AHL" },
          { spanish: "Que estas tomando?", english: "What are you drinking?", pronunciation: "keh ehs-TAHS toh-MAHN-doh" },
          { spanish: "Estoy de vacaciones.", english: "I'm on vacation.", pronunciation: "ehs-TOY deh vah-kah-see-OH-nehs" },
          { spanish: "Quieres tomar algo?", english: "Want to have a drink?", pronunciation: "kee-EH-rehs toh-MAR AHL-goh" },
          { spanish: "La pase muy bien!", english: "I had a great time!", pronunciation: "lah pah-SEH mooy bee-EHN" },
          { spanish: "Vienes aqui seguido?", english: "Do you come here often?", pronunciation: "vee-EH-nehs ah-KEE seh-GEE-doh" },
        ],
        formal: [
          { spanish: "Salud, un placer!", english: "Cheers, a pleasure!", pronunciation: "sah-LOOD, oon plah-SEHR" },
          { spanish: "De donde es usted?", english: "Where are you from? (formal)", pronunciation: "deh DOHN-deh ehs oos-TEHD" },
          { spanish: "Es un lugar muy agradable.", english: "It's a very pleasant place.", pronunciation: "ehs oon loo-GAR mooy ah-grah-DAH-bleh" },
          { spanish: "Que esta tomando, si me permite?", english: "What are you drinking, if I may ask?", pronunciation: "keh ehs-TAH toh-MAHN-doh, see meh per-MEE-teh" },
          { spanish: "Le gustaria tomar algo?", english: "Would you like to have a drink?", pronunciation: "leh goos-tah-REE-ah toh-MAR AHL-goh" },
          { spanish: "Ha sido una noche encantadora.", english: "It's been a lovely evening.", pronunciation: "ah SEE-doh OO-nah NOH-cheh ehn-kahn-tah-DOH-rah" },
        ],
      },
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ RESTAURANT ━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: "restaurant",
    name: "Restaurant",
    emoji: "\uD83C\uDF7D\uFE0F",
    color: "rose",
    intents: {
      order: {
        street: [
          { spanish: "Dame el del dia.", english: "Give me the daily special.", pronunciation: "DAH-meh el del DEE-ah" },
          { spanish: "Una mesa para ___.", english: "Table for ___.", pronunciation: "OO-nah MEH-sah PAH-rah ___", isTemplate: true },
          { spanish: "Ya estamos listos.", english: "We're ready.", pronunciation: "yah ehs-TAH-mohs LEES-tohs" },
          { spanish: "Yo quiero el ___.", english: "I want the ___.", pronunciation: "yoh kee-EH-roh el ___", isTemplate: true },
          { spanish: "Nada picante.", english: "Nothing spicy.", pronunciation: "NAH-dah pee-KAHN-teh" },
          { spanish: "Bien cocido.", english: "Well done.", pronunciation: "bee-EHN koh-SEE-doh" },
          { spanish: "Termino medio.", english: "Medium.", pronunciation: "TEHR-mee-noh MEH-dee-oh" },
          { spanish: "Sin cebolla.", english: "No onion.", pronunciation: "seen seh-BOH-yah" },
          { spanish: "Para llevar.", english: "To go.", pronunciation: "PAH-rah yeh-VAR" },
          { spanish: "Lo mismo que el.", english: "Same as him.", pronunciation: "loh MEES-moh keh ehl" },
        ],
        neutral: [
          { spanish: "Una mesa para ___, por favor.", english: "A table for ___, please.", pronunciation: "OO-nah MEH-sah PAH-rah ___, por fah-VOR", isTemplate: true },
          { spanish: "Estamos listos para pedir.", english: "We're ready to order.", pronunciation: "ehs-TAH-mohs LEES-tohs PAH-rah peh-DEER" },
          { spanish: "Cual es el plato del dia?", english: "What's today's special?", pronunciation: "kwahl ehs el PLAH-toh del DEE-ah" },
          { spanish: "El menu, por favor.", english: "The menu, please.", pronunciation: "el meh-NOO, por fah-VOR" },
          { spanish: "No muy picante, por favor.", english: "Not too spicy, please.", pronunciation: "noh mooy pee-KAHN-teh, por fah-VOR" },
          { spanish: "Bien cocido, por favor.", english: "Well done, please.", pronunciation: "bee-EHN koh-SEE-doh, por fah-VOR" },
          { spanish: "Sin sal, por favor.", english: "Without salt, please.", pronunciation: "seen sahl, por fah-VOR" },
          { spanish: "Tiene menu en ingles?", english: "Do you have a menu in English?", pronunciation: "tee-EH-neh meh-NOO en een-GLEHS" },
          { spanish: "Se puede comer afuera?", english: "Can we eat outside?", pronunciation: "seh PWEH-deh koh-MEHR ah-FWEH-rah" },
          { spanish: "Para llevar, por favor.", english: "To go, please.", pronunciation: "PAH-rah yeh-VAR, por fah-VOR" },
        ],
        formal: [
          { spanish: "Buenas, tengo una reservacion a nombre de ___.", english: "Hello, I have a reservation under ___.", pronunciation: "BWEH-nahs, TEHN-goh OO-nah reh-ser-vah-see-OHN ah NOHM-breh deh ___", isTemplate: true },
          { spanish: "Podria ver el menu, por favor?", english: "Could I see the menu, please?", pronunciation: "poh-DREE-ah vehr el meh-NOO, por fah-VOR" },
          { spanish: "Me gustaria ordenar el plato del dia.", english: "I'd like to order today's special.", pronunciation: "meh goos-tah-REE-ah or-deh-NAR el PLAH-toh del DEE-ah" },
          { spanish: "Quisiera ___ sin ___, por favor.", english: "I'd like ___ without ___, please.", pronunciation: "kee-see-EH-rah ___ seen ___, por fah-VOR", isTemplate: true },
          { spanish: "Podria prepararlo con poca sal?", english: "Could you prepare it with little salt?", pronunciation: "poh-DREE-ah preh-pah-RAR-loh kohn POH-kah sahl" },
          { spanish: "Quisiera reservar una mesa para esta noche.", english: "I'd like to reserve a table for tonight.", pronunciation: "kee-see-EH-rah reh-ser-VAR OO-nah MEH-sah PAH-rah EHS-tah NOH-cheh" },
          { spanish: "Me puede traer mas pan, por favor?", english: "Could you bring more bread, please?", pronunciation: "meh PWEH-deh trah-EHR mahs pahn, por fah-VOR" },
          { spanish: "Seria posible comer en la terraza?", english: "Would it be possible to eat on the terrace?", pronunciation: "seh-REE-ah poh-SEE-bleh koh-MEHR en lah teh-RAH-sah" },
        ],
      },
      react: {
        street: [
          { spanish: "Que rico!", english: "So good!", pronunciation: "keh REE-koh" },
          { spanish: "Esta con madre.", english: "This is amazing.", pronunciation: "ehs-TAH kohn MAH-dreh" },
          { spanish: "Muy picante!", english: "Really spicy!", pronunciation: "mooy pee-KAHN-teh" },
          { spanish: "Esta frio.", english: "It's cold.", pronunciation: "ehs-TAH FREE-oh" },
          { spanish: "No es lo que pedi.", english: "Not what I ordered.", pronunciation: "noh ehs loh keh peh-DEE" },
          { spanish: "Increible.", english: "Incredible.", pronunciation: "een-kreh-EE-bleh" },
          { spanish: "Le falta sal.", english: "Needs salt.", pronunciation: "leh FAHL-tah sahl" },
          { spanish: "Neta que bueno.", english: "For real, so good.", pronunciation: "NEH-tah keh BWEH-noh" },
        ],
        neutral: [
          { spanish: "Esta delicioso.", english: "It's delicious.", pronunciation: "ehs-TAH deh-lee-see-OH-soh" },
          { spanish: "Esta muy picante para mi.", english: "It's too spicy for me.", pronunciation: "ehs-TAH mooy pee-KAHN-teh PAH-rah mee" },
          { spanish: "Esta un poco frio.", english: "It's a bit cold.", pronunciation: "ehs-TAH oon POH-koh FREE-oh" },
          { spanish: "Esto no es lo que pedi.", english: "This isn't what I ordered.", pronunciation: "EHS-toh noh ehs loh keh peh-DEE" },
          { spanish: "La comida estuvo increible.", english: "The food was incredible.", pronunciation: "lah koh-MEE-dah ehs-TOO-voh een-kreh-EE-bleh" },
          { spanish: "El servicio fue excelente.", english: "The service was excellent.", pronunciation: "el ser-VEE-see-oh fweh ehk-seh-LEHN-teh" },
          { spanish: "Me gusto mucho.", english: "I liked it a lot.", pronunciation: "meh goos-TOH MOO-choh" },
          { spanish: "Le falta un poco de sal.", english: "It needs a bit of salt.", pronunciation: "leh FAHL-tah oon POH-koh deh sahl" },
        ],
        formal: [
          { spanish: "Estuvo delicioso, muchas gracias.", english: "It was delicious, thank you.", pronunciation: "ehs-TOO-voh deh-lee-see-OH-soh, MOO-chahs GRAH-see-ahs" },
          { spanish: "Mis felicitaciones al chef.", english: "My compliments to the chef.", pronunciation: "mees feh-lee-see-tah-see-OH-nehs ahl chef" },
          { spanish: "El servicio ha sido impecable.", english: "The service has been impeccable.", pronunciation: "el ser-VEE-see-oh ah SEE-doh eem-peh-KAH-bleh" },
          { spanish: "Me temo que esto no es lo que ordene.", english: "I'm afraid this isn't what I ordered.", pronunciation: "meh TEH-moh keh EHS-toh noh ehs loh keh or-deh-NEH" },
          { spanish: "Todo excelente, volveremos pronto.", english: "Everything was excellent, we'll return soon.", pronunciation: "TOH-doh ehk-seh-LEHN-teh, vol-veh-REH-mohs PROHN-toh" },
          { spanish: "Ha sido una experiencia maravillosa.", english: "It's been a wonderful experience.", pronunciation: "ah SEE-doh OO-nah ehks-peh-ree-EHN-see-ah mah-rah-vee-YOH-sah" },
        ],
      },
      ask: {
        street: [
          { spanish: "Que tiene el ___?", english: "What's in the ___?", pronunciation: "keh tee-EH-neh el ___", isTemplate: true },
          { spanish: "Que me recomiendas?", english: "What do you recommend?", pronunciation: "keh meh reh-koh-mee-EHN-dahs" },
          { spanish: "Es picante?", english: "Is it spicy?", pronunciation: "ehs pee-KAHN-teh" },
          { spanish: "Soy alergico a ___.", english: "I'm allergic to ___.", pronunciation: "soy ah-LEHR-hee-koh ah ___", isTemplate: true },
          { spanish: "Tienen algo sin gluten?", english: "Got anything gluten-free?", pronunciation: "tee-EH-nen AHL-goh seen GLOO-ten" },
          { spanish: "Cuanto tardan?", english: "How long does it take?", pronunciation: "KWAHN-toh TAR-dahn" },
          { spanish: "Donde esta el bano?", english: "Where's the bathroom?", pronunciation: "DOHN-deh ehs-TAH el BAH-nyoh" },
          { spanish: "Tienen wifi?", english: "Got wifi?", pronunciation: "tee-EH-nen WAI-fai" },
        ],
        neutral: [
          { spanish: "Que ingredientes lleva?", english: "What ingredients does it have?", pronunciation: "keh een-greh-dee-EHN-tehs YEH-vah" },
          { spanish: "Que me recomienda?", english: "What do you recommend?", pronunciation: "keh meh reh-koh-mee-EHN-dah" },
          { spanish: "Es muy picante?", english: "Is it very spicy?", pronunciation: "ehs mooy pee-KAHN-teh" },
          { spanish: "Soy alergico/a a ___.", english: "I'm allergic to ___.", pronunciation: "soy ah-LEHR-hee-koh/kah ah ___", isTemplate: true },
          { spanish: "Tienen opciones vegetarianas?", english: "Do you have vegetarian options?", pronunciation: "tee-EH-nen op-see-OH-nehs veh-heh-tah-ree-AH-nahs" },
          { spanish: "Es una alergia grave.", english: "It's a serious allergy.", pronunciation: "ehs OO-nah ah-LEHR-hee-ah GRAH-veh" },
          { spanish: "Viene con guarnicion?", english: "Does it come with a side?", pronunciation: "vee-EH-neh kohn gwar-nee-see-OHN" },
          { spanish: "Cuanto tardan los platos?", english: "How long for the food?", pronunciation: "KWAHN-toh TAR-dahn lohs PLAH-tohs" },
        ],
        formal: [
          { spanish: "Podria informarme de los ingredientes?", english: "Could you tell me the ingredients?", pronunciation: "poh-DREE-ah een-for-MAR-meh deh lohs een-greh-dee-EHN-tehs" },
          { spanish: "Que nos recomienda usted?", english: "What would you recommend?", pronunciation: "keh nohs reh-koh-mee-EHN-dah oos-TEHD" },
          { spanish: "Tendria opciones para personas alergicas a ___?", english: "Would you have options for people allergic to ___?", pronunciation: "tehn-DREE-ah op-see-OH-nehs PAH-rah per-SOH-nahs ah-LEHR-hee-kahs ah ___", isTemplate: true },
          { spanish: "Podria prepararlo sin ___, por favor?", english: "Could you prepare it without ___, please?", pronunciation: "poh-DREE-ah preh-pah-RAR-loh seen ___, por fah-VOR", isTemplate: true },
          { spanish: "Cuanto tiempo tardaria el servicio?", english: "How long would the service take?", pronunciation: "KWAHN-toh tee-EHM-poh tar-dah-REE-ah el ser-VEE-see-oh" },
          { spanish: "Disculpe, donde se encuentran los sanitarios?", english: "Excuse me, where are the restrooms?", pronunciation: "dees-KOOL-peh, DOHN-deh seh ehn-KWEHN-trahn lohs sah-nee-TAH-ree-ohs" },
        ],
      },
      finish: {
        street: [
          { spanish: "La cuenta.", english: "Check.", pronunciation: "lah KWEHN-tah" },
          { spanish: "Todo junto.", english: "All together.", pronunciation: "TOH-doh HOON-toh" },
          { spanish: "Aceptan tarjeta?", english: "Take cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "Quedese el cambio.", english: "Keep it.", pronunciation: "KEH-deh-seh el KAHM-bee-oh" },
          { spanish: "En efectivo.", english: "Cash.", pronunciation: "en eh-fehk-TEE-voh" },
          { spanish: "Cuentas separadas.", english: "Separate checks.", pronunciation: "KWEHN-tahs seh-pah-RAH-dahs" },
          { spanish: "Ya estuvo.", english: "That's it.", pronunciation: "yah ehs-TOO-voh" },
          { spanish: "Listo, vamonos.", english: "Done, let's go.", pronunciation: "LEES-toh, VAH-moh-nohs" },
        ],
        neutral: [
          { spanish: "La cuenta, por favor.", english: "The check, please.", pronunciation: "lah KWEHN-tah, por fah-VOR" },
          { spanish: "Aceptan tarjeta?", english: "Do you accept cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "Cuentas separadas, por favor.", english: "Separate checks, please.", pronunciation: "KWEHN-tahs seh-pah-RAH-dahs, por fah-VOR" },
          { spanish: "Esta incluida la propina?", english: "Is the tip included?", pronunciation: "ehs-TAH een-kloo-EE-dah lah proh-PEE-nah" },
          { spanish: "Quiero pagar en efectivo.", english: "I want to pay cash.", pronunciation: "kee-EH-roh pah-GAR en eh-fehk-TEE-voh" },
          { spanish: "Puedo pagar con el telefono?", english: "Can I pay with my phone?", pronunciation: "PWEH-doh pah-GAR kohn el teh-LEH-foh-noh" },
          { spanish: "Quedese con el cambio.", english: "Keep the change.", pronunciation: "KEH-deh-seh kohn el KAHM-bee-oh" },
          { spanish: "Hay un error en la cuenta.", english: "There's an error on the bill.", pronunciation: "eye oon eh-ROHR en lah KWEHN-tah" },
        ],
        formal: [
          { spanish: "Podria traerme la cuenta, por favor?", english: "Could you bring me the check, please?", pronunciation: "poh-DREE-ah trah-EHR-meh lah KWEHN-tah, por fah-VOR" },
          { spanish: "Seria posible pagar con tarjeta?", english: "Would it be possible to pay by card?", pronunciation: "seh-REE-ah poh-SEE-bleh pah-GAR kohn tar-HEH-tah" },
          { spanish: "Deseariamos cuentas por separado.", english: "We'd like separate checks.", pronunciation: "deh-seh-ah-REE-ah-mohs KWEHN-tahs por seh-pah-RAH-doh" },
          { spanish: "Conserve el cambio, se lo merece.", english: "Keep the change, you've earned it.", pronunciation: "kohn-SEHR-veh el KAHM-bee-oh, seh loh meh-REH-seh" },
          { spanish: "Podria dejar una resena?", english: "Could I leave a review?", pronunciation: "poh-DREE-ah deh-HAR OO-nah reh-SEH-nyah" },
          { spanish: "Muchas gracias por todo, estuvo maravilloso.", english: "Thank you for everything, it was wonderful.", pronunciation: "MOO-chahs GRAH-see-ahs por TOH-doh, ehs-TOO-voh mah-rah-vee-YOH-soh" },
        ],
      },
      social: {
        street: [
          { spanish: "Que lugar mas chido.", english: "What a cool spot.", pronunciation: "keh loo-GAR mahs CHEE-doh" },
          { spanish: "Nos recomendaron este lugar.", english: "Someone recommended this place.", pronunciation: "nohs reh-koh-mehn-DAH-rohn EHS-teh loo-GAR" },
          { spanish: "Venimos de vacaciones.", english: "We're on vacation.", pronunciation: "veh-NEE-mohs deh vah-kah-see-OH-nehs" },
          { spanish: "Que es lo tipico de aqui?", english: "What's typical here?", pronunciation: "keh ehs loh TEE-pee-koh deh ah-KEE" },
          { spanish: "Vamos a volver.", english: "We'll be back.", pronunciation: "VAH-mohs ah vol-VEHR" },
          { spanish: "Buena onda el mesero.", english: "The waiter's cool.", pronunciation: "BWEH-nah OHN-dah el meh-SEH-roh" },
        ],
        neutral: [
          { spanish: "Muchas gracias, estuvo todo delicioso.", english: "Thank you, everything was delicious.", pronunciation: "MOO-chahs GRAH-see-ahs, ehs-TOO-voh TOH-doh deh-lee-see-OH-soh" },
          { spanish: "Nos recomendaron este restaurante.", english: "This restaurant was recommended.", pronunciation: "nohs reh-koh-mehn-DAH-rohn EHS-teh rehs-tow-RAHN-teh" },
          { spanish: "Estamos de vacaciones.", english: "We're on vacation.", pronunciation: "ehs-TAH-mohs deh vah-kah-see-OH-nehs" },
          { spanish: "Cual es el platillo tipico?", english: "What's the typical dish?", pronunciation: "kwahl ehs el plah-TEE-yoh TEE-pee-koh" },
          { spanish: "Volveremos pronto.", english: "We'll be back soon.", pronunciation: "vol-veh-REH-mohs PROHN-toh" },
          { spanish: "El mejor restaurante de la zona.", english: "Best restaurant in the area.", pronunciation: "el meh-HOR rehs-tow-RAHN-teh deh lah SOH-nah" },
        ],
        formal: [
          { spanish: "Ha sido una experiencia gastronomica excelente.", english: "It's been an excellent culinary experience.", pronunciation: "ah SEE-doh OO-nah ehks-peh-ree-EHN-see-ah gahs-troh-NOH-mee-kah ehk-seh-LEHN-teh" },
          { spanish: "Nos lo recomendaron encarecidamente.", english: "It was highly recommended to us.", pronunciation: "nohs loh reh-koh-mehn-DAH-rohn ehn-kah-reh-see-dah-MEHN-teh" },
          { spanish: "Estamos de visita en la ciudad.", english: "We're visiting the city.", pronunciation: "ehs-TAH-mohs deh vee-SEE-tah en lah see-oo-DAHD" },
          { spanish: "Volveremos con mucho gusto.", english: "We'll gladly return.", pronunciation: "vol-veh-REH-mohs kohn MOO-choh GOOS-toh" },
          { spanish: "El servicio y la comida han sido excepcionales.", english: "The service and food have been exceptional.", pronunciation: "el ser-VEE-see-oh ee lah koh-MEE-dah ahn SEE-doh ehk-sehp-see-oh-NAH-lehs" },
        ],
      },
    },
    flowStages: [
      {
        key: "arrival",
        name: "Arrival",
        phrases: [
          { spanish: "Mesa para dos, por favor.", english: "Table for two, please.", pronunciation: "MEH-sah PAH-rah dohs, por fah-VOR" },
          { spanish: "Mesa para ___, por favor.", english: "Table for ___, please.", pronunciation: "MEH-sah PAH-rah ___, por fah-VOR", isTemplate: true },
          { spanish: "Para comer aqui.", english: "To eat here.", pronunciation: "PAH-rah koh-MEHR ah-KEE" },
          { spanish: "Adentro, por favor.", english: "Inside, please.", pronunciation: "ah-DEHN-troh, por fah-VOR" },
          { spanish: "Afuera esta bien.", english: "Outside is fine.", pronunciation: "ah-FWEH-rah ehs-TAH bee-EHN" },
          { spanish: "Podemos sentarnos aqui?", english: "Can we sit here?", pronunciation: "poh-DEH-mohs sehn-TAR-nohs ah-KEE" },
          { spanish: "Somos dos.", english: "There are two of us.", pronunciation: "SOH-mohs dohs" },
          { spanish: "Estamos esperando a alguien mas.", english: "We're waiting for someone else.", pronunciation: "ehs-TAH-mohs ehs-peh-RAHN-doh ah AHL-gee-ehn mahs" },
        ],
      },
      {
        key: "drinks",
        name: "Drinks",
        phrases: [
          { spanish: "Agua natural, por favor.", english: "Still water, please.", pronunciation: "AH-gwah nah-too-RAHL, por fah-VOR" },
          { spanish: "Agua mineral, por favor.", english: "Sparkling water, please.", pronunciation: "AH-gwah mee-neh-RAHL, por fah-VOR" },
          { spanish: "Solo agua, gracias.", english: "Just water, thanks.", pronunciation: "SOH-loh AH-gwah, GRAH-see-ahs" },
          { spanish: "Una cerveza, por favor.", english: "A beer, please.", pronunciation: "OO-nah ser-VEH-sah, por fah-VOR" },
          { spanish: "Dos cervezas, por favor.", english: "Two beers, please.", pronunciation: "dohs ser-VEH-sahs, por fah-VOR" },
          { spanish: "Un refresco, por favor.", english: "A soda, please.", pronunciation: "oon reh-FREHS-koh, por fah-VOR" },
          { spanish: "Sin hielo, por favor.", english: "No ice, please.", pronunciation: "seen YEH-loh, por fah-VOR" },
          { spanish: "Todavia no.", english: "Not yet.", pronunciation: "toh-dah-VEE-ah noh" },
        ],
      },
      {
        key: "food",
        name: "Food Order",
        phrases: [
          { spanish: "Yo quiero esto.", english: "I want this one. (point)", pronunciation: "yoh kee-EH-roh EHS-toh" },
          { spanish: "Esto, por favor.", english: "This one, please. (point)", pronunciation: "EHS-toh, por fah-VOR" },
          { spanish: "Sin picante, por favor.", english: "No spice, please.", pronunciation: "seen pee-KAHN-teh, por fah-VOR" },
          { spanish: "Poco picante.", english: "A little spicy.", pronunciation: "POH-koh pee-KAHN-teh" },
          { spanish: "Eso es todo.", english: "That's all.", pronunciation: "EH-soh ehs TOH-doh" },
          { spanish: "Solo esto, gracias.", english: "Just this, thanks.", pronunciation: "SOH-loh EHS-toh, GRAH-see-ahs" },
          { spanish: "Para compartir.", english: "To share.", pronunciation: "PAH-rah kohm-par-TEER" },
          { spanish: "Lo mismo, por favor.", english: "The same, please.", pronunciation: "loh MEES-moh, por fah-VOR" },
          { spanish: "Sin cebolla, por favor.", english: "No onion, please.", pronunciation: "seen seh-BOH-yah, por fah-VOR" },
          { spanish: "Sin ___, por favor.", english: "Without ___, please.", pronunciation: "seen ___, por fah-VOR", isTemplate: true },
        ],
      },
      {
        key: "during",
        name: "During Meal",
        phrases: [
          { spanish: "Disculpe.", english: "Excuse me. (to get attention)", pronunciation: "dees-KOOL-peh" },
          { spanish: "Mas agua, por favor.", english: "More water, please.", pronunciation: "mahs AH-gwah, por fah-VOR" },
          { spanish: "Otra cerveza, por favor.", english: "Another beer, please.", pronunciation: "OH-trah ser-VEH-sah, por fah-VOR" },
          { spanish: "Mas tortillas, por favor.", english: "More tortillas, please.", pronunciation: "mahs tor-TEE-yahs, por fah-VOR" },
          { spanish: "Salsa, por favor.", english: "Salsa, please.", pronunciation: "SAHL-sah, por fah-VOR" },
          { spanish: "Servilletas, por favor.", english: "Napkins, please.", pronunciation: "ser-vee-YEH-tahs, por fah-VOR" },
          { spanish: "Donde esta el bano?", english: "Where is the bathroom?", pronunciation: "DOHN-deh ehs-TAH el BAH-nyoh" },
          { spanish: "Esta muy bueno.", english: "It's very good.", pronunciation: "ehs-TAH mooy BWEH-noh" },
        ],
      },
      {
        key: "finished",
        name: "Finished",
        phrases: [
          { spanish: "Ya terminamos.", english: "We're done.", pronunciation: "yah ter-mee-NAH-mohs" },
          { spanish: "Ya termine.", english: "I'm done.", pronunciation: "yah ter-mee-NEH" },
          { spanish: "Estoy lleno.", english: "I'm full.", pronunciation: "ehs-TOY YEH-noh" },
          { spanish: "Puede llevarse los platos.", english: "You can take the plates.", pronunciation: "PWEH-deh yeh-VAR-seh lohs PLAH-tohs" },
          { spanish: "Nada mas, gracias.", english: "Nothing else, thanks.", pronunciation: "NAH-dah mahs, GRAH-see-ahs" },
          { spanish: "Estuvo delicioso.", english: "It was delicious.", pronunciation: "ehs-TOO-voh deh-lee-see-OH-soh" },
        ],
      },
      {
        key: "bill",
        name: "Bill",
        phrases: [
          { spanish: "La cuenta, por favor.", english: "The check, please.", pronunciation: "lah KWEHN-tah, por fah-VOR" },
          { spanish: "Todo junto.", english: "All together.", pronunciation: "TOH-doh HOON-toh" },
          { spanish: "Cuentas separadas, por favor.", english: "Separate checks, please.", pronunciation: "KWEHN-tahs seh-pah-RAH-dahs, por fah-VOR" },
          { spanish: "Aceptan tarjeta?", english: "Do you accept cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "En efectivo.", english: "Cash.", pronunciation: "en eh-fehk-TEE-voh" },
          { spanish: "Quedese con el cambio.", english: "Keep the change.", pronunciation: "KEH-deh-seh kohn el KAHM-bee-oh" },
          { spanish: "Esta incluida la propina?", english: "Is the tip included?", pronunciation: "ehs-TAH een-kloo-EE-dah lah proh-PEE-nah" },
        ],
      },
      {
        key: "exit",
        name: "Exit",
        phrases: [
          { spanish: "Muchas gracias.", english: "Thank you very much.", pronunciation: "MOO-chahs GRAH-see-ahs" },
          { spanish: "Todo estuvo muy bien.", english: "Everything was great.", pronunciation: "TOH-doh ehs-TOO-voh mooy bee-EHN" },
          { spanish: "Buenas noches.", english: "Good night.", pronunciation: "BWEH-nahs NOH-chehs" },
          { spanish: "Buenas tardes.", english: "Good afternoon.", pronunciation: "BWEH-nahs TAR-dehs" },
          { spanish: "Hasta luego.", english: "See you later.", pronunciation: "AHS-tah LWEH-goh" },
          { spanish: "Muy amable.", english: "Very kind.", pronunciation: "mooy ah-MAH-bleh" },
        ],
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TAXI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: "taxi",
    name: "Taxi",
    emoji: "\uD83D\uDE95",
    color: "sky",
    intents: {
      order: {
        street: [
          { spanish: "Llevame a ___.", english: "Take me to ___.", pronunciation: "YEH-vah-meh ah ___", isTemplate: true },
          { spanish: "Al aeropuerto.", english: "Airport.", pronunciation: "ahl ah-eh-roh-PWEHR-toh" },
          { spanish: "Para aqui.", english: "Stop here.", pronunciation: "PAH-rah ah-KEE" },
          { spanish: "A la derecha.", english: "Go right.", pronunciation: "ah lah deh-REH-chah" },
          { spanish: "A la izquierda.", english: "Go left.", pronunciation: "ah lah ees-kee-EHR-dah" },
          { spanish: "Derecho.", english: "Straight.", pronunciation: "deh-REH-choh" },
          { spanish: "Mas rapido, porfa.", english: "Faster, please.", pronunciation: "mahs RAH-pee-doh, POR-fah" },
          { spanish: "Aqui mero.", english: "Right here.", pronunciation: "ah-KEE MEH-roh" },
          { spanish: "Un poco mas adelante.", english: "A bit further.", pronunciation: "oon POH-koh mahs ah-deh-LAHN-teh" },
          { spanish: "Necesito un taxi.", english: "I need a taxi.", pronunciation: "neh-seh-SEE-toh oon TAHK-see" },
        ],
        neutral: [
          { spanish: "Lleveme a ___, por favor.", english: "Take me to ___, please.", pronunciation: "YEH-veh-meh ah ___, por fah-VOR", isTemplate: true },
          { spanish: "Al aeropuerto, por favor.", english: "To the airport, please.", pronunciation: "ahl ah-eh-roh-PWEHR-toh, por fah-VOR" },
          { spanish: "Pare aqui, por favor.", english: "Stop here, please.", pronunciation: "PAH-reh ah-KEE, por fah-VOR" },
          { spanish: "A la derecha, por favor.", english: "To the right, please.", pronunciation: "ah lah deh-REH-chah, por fah-VOR" },
          { spanish: "A la izquierda, por favor.", english: "To the left, please.", pronunciation: "ah lah ees-kee-EHR-dah, por fah-VOR" },
          { spanish: "Derecho, por favor.", english: "Straight ahead, please.", pronunciation: "deh-REH-choh, por fah-VOR" },
          { spanish: "Puede ir mas rapido?", english: "Can you go faster?", pronunciation: "PWEH-deh eer mahs RAH-pee-doh" },
          { spanish: "Justo despues del semaforo.", english: "Just after the traffic light.", pronunciation: "HOOS-toh dehs-PWEHS del seh-MAH-foh-roh" },
          { spanish: "En la siguiente esquina.", english: "At the next corner.", pronunciation: "en lah see-gee-EHN-teh ehs-KEE-nah" },
          { spanish: "Puede encender el taximetro?", english: "Can you turn on the meter?", pronunciation: "PWEH-deh ehn-sehn-DEHR el tahk-SEE-meh-troh" },
        ],
        formal: [
          { spanish: "Seria tan amable de llevarme a ___?", english: "Would you be so kind as to take me to ___?", pronunciation: "seh-REE-ah tahn ah-MAH-bleh deh yeh-VAR-meh ah ___", isTemplate: true },
          { spanish: "Al aeropuerto, si es tan amable.", english: "To the airport, if you'd be so kind.", pronunciation: "ahl ah-eh-roh-PWEHR-toh, see ehs tahn ah-MAH-bleh" },
          { spanish: "Podria detenerse aqui, por favor?", english: "Could you stop here, please?", pronunciation: "poh-DREE-ah deh-teh-NEHR-seh ah-KEE, por fah-VOR" },
          { spanish: "Podria encender el taximetro, por favor?", english: "Could you turn on the meter, please?", pronunciation: "poh-DREE-ah ehn-sehn-DEHR el tahk-SEE-meh-troh, por fah-VOR" },
          { spanish: "Le muestro la direccion en el mapa.", english: "I'll show you the address on the map.", pronunciation: "leh MWEHS-troh lah dee-rehk-see-OHN en el MAH-pah" },
        ],
      },
      react: {
        street: [
          { spanish: "No, no es por ahi.", english: "No, not that way.", pronunciation: "noh, noh ehs por ah-EE" },
          { spanish: "Si, por aqui.", english: "Yeah, this way.", pronunciation: "see, por ah-KEE" },
          { spanish: "Te pasaste.", english: "You passed it.", pronunciation: "teh pah-SAHS-teh" },
          { spanish: "Va bien.", english: "Going good.", pronunciation: "vah bee-EHN" },
          { spanish: "Hay mucho trafico.", english: "Lots of traffic.", pronunciation: "eye MOO-choh TRAH-fee-koh" },
        ],
        neutral: [
          { spanish: "Creo que no es por ahi.", english: "I don't think it's that way.", pronunciation: "KREH-oh keh noh ehs por ah-EE" },
          { spanish: "Si, vamos bien.", english: "Yes, we're on track.", pronunciation: "see, VAH-mohs bee-EHN" },
          { spanish: "Creo que se paso.", english: "I think you passed it.", pronunciation: "KREH-oh keh seh pah-SOH" },
          { spanish: "Hay mucho trafico hoy.", english: "There's a lot of traffic today.", pronunciation: "eye MOO-choh TRAH-fee-koh oy" },
          { spanish: "Aqui esta bien.", english: "Here is fine.", pronunciation: "ah-KEE ehs-TAH bee-EHN" },
        ],
        formal: [
          { spanish: "Disculpe, creo que no es la ruta correcta.", english: "Excuse me, I don't think this is the right route.", pronunciation: "dees-KOOL-peh, KREH-oh keh noh ehs lah ROO-tah koh-REHK-tah" },
          { spanish: "Me parece que ya pasamos el destino.", english: "I think we've passed the destination.", pronunciation: "meh pah-REH-seh keh yah pah-SAH-mohs el dehs-TEE-noh" },
          { spanish: "Vamos muy bien, gracias.", english: "We're doing great, thank you.", pronunciation: "VAH-mohs mooy bee-EHN, GRAH-see-ahs" },
        ],
      },
      ask: {
        street: [
          { spanish: "Cuanto cuesta ir a ___?", english: "How much to ___?", pronunciation: "KWAHN-toh KWEHS-tah eer ah ___", isTemplate: true },
          { spanish: "Cuanto tiempo?", english: "How long?", pronunciation: "KWAHN-toh tee-EHM-poh" },
          { spanish: "Conoces esta zona?", english: "Know this area?", pronunciation: "koh-NOH-sehs EHS-tah SOH-nah" },
          { spanish: "Sabes donde queda ___?", english: "Know where ___ is?", pronunciation: "SAH-behs DOHN-deh KEH-dah ___", isTemplate: true },
          { spanish: "Ya estamos cerca?", english: "Are we close?", pronunciation: "yah ehs-TAH-mohs SEHR-kah" },
          { spanish: "Cual es la ruta mas rapida?", english: "What's the fastest route?", pronunciation: "kwahl ehs lah ROO-tah mahs RAH-pee-dah" },
          { spanish: "Hay mucho trafico?", english: "Lots of traffic?", pronunciation: "eye MOO-choh TRAH-fee-koh" },
          { spanish: "Esta libre?", english: "Are you free?", pronunciation: "ehs-TAH LEE-breh" },
        ],
        neutral: [
          { spanish: "Cuanto cuesta ir a ___?", english: "How much to go to ___?", pronunciation: "KWAHN-toh KWEHS-tah eer ah ___", isTemplate: true },
          { spanish: "Cuanto tiempo tarda?", english: "How long will it take?", pronunciation: "KWAHN-toh tee-EHM-poh TAR-dah" },
          { spanish: "Conoce esta zona?", english: "Do you know this area?", pronunciation: "koh-NOH-seh EHS-tah SOH-nah" },
          { spanish: "Sabe donde queda ___?", english: "Do you know where ___ is?", pronunciation: "SAH-beh DOHN-deh KEH-dah ___", isTemplate: true },
          { spanish: "Estamos cerca?", english: "Are we close?", pronunciation: "ehs-TAH-mohs SEHR-kah" },
          { spanish: "Cual es la ruta mas rapida?", english: "What's the fastest route?", pronunciation: "kwahl ehs lah ROO-tah mahs RAH-pee-dah" },
          { spanish: "Le muestro en el mapa.", english: "I'll show you on the map.", pronunciation: "leh MWEHS-troh en el MAH-pah" },
          { spanish: "La direccion es ___.", english: "The address is ___.", pronunciation: "lah dee-rehk-see-OHN ehs ___", isTemplate: true },
        ],
        formal: [
          { spanish: "Podria indicarme cuanto costaria ir a ___?", english: "Could you tell me how much it would cost to go to ___?", pronunciation: "poh-DREE-ah een-dee-KAR-meh KWAHN-toh kohs-tah-REE-ah eer ah ___", isTemplate: true },
          { spanish: "Aproximadamente cuanto tardariamos?", english: "Approximately how long would it take?", pronunciation: "ah-prok-see-mah-dah-MEHN-teh KWAHN-toh tar-dah-REE-ah-mohs" },
          { spanish: "Podria indicarme la mejor ruta?", english: "Could you tell me the best route?", pronunciation: "poh-DREE-ah een-dee-KAR-meh lah meh-HOR ROO-tah" },
          { spanish: "No conozco la direccion exacta, le muestro en el mapa.", english: "I don't know the exact address, I'll show you on the map.", pronunciation: "noh koh-NOHS-koh lah dee-rehk-see-OHN ehk-SAHK-tah, leh MWEHS-troh en el MAH-pah" },
        ],
      },
      finish: {
        street: [
          { spanish: "Cuanto es?", english: "How much?", pronunciation: "KWAHN-toh ehs" },
          { spanish: "Aceptas tarjeta?", english: "Take cards?", pronunciation: "ah-SEHP-tahs tar-HEH-tah" },
          { spanish: "Quedese el cambio.", english: "Keep it.", pronunciation: "KEH-deh-seh el KAHM-bee-oh" },
          { spanish: "No tengo cambio.", english: "I don't have change.", pronunciation: "noh TEHN-goh KAHM-bee-oh" },
          { spanish: "En efectivo.", english: "Cash.", pronunciation: "en eh-fehk-TEE-voh" },
          { spanish: "Me puede esperar?", english: "Can you wait?", pronunciation: "meh PWEH-deh ehs-peh-RAR" },
        ],
        neutral: [
          { spanish: "Cuanto le debo?", english: "How much do I owe?", pronunciation: "KWAHN-toh leh DEH-boh" },
          { spanish: "Aceptan tarjeta?", english: "Do you accept cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "Quedese con el cambio.", english: "Keep the change.", pronunciation: "KEH-deh-seh kohn el KAHM-bee-oh" },
          { spanish: "Me da un recibo?", english: "Can I get a receipt?", pronunciation: "meh dah oon reh-SEE-boh" },
          { spanish: "Puedo pagar con dolares?", english: "Can I pay in dollars?", pronunciation: "PWEH-doh pah-GAR kohn DOH-lah-rehs" },
          { spanish: "Puede esperarme?", english: "Can you wait for me?", pronunciation: "PWEH-deh ehs-peh-RAR-meh" },
          { spanish: "Me esta cobrando de mas.", english: "You're overcharging me.", pronunciation: "meh ehs-TAH koh-BRAHN-doh deh mahs" },
        ],
        formal: [
          { spanish: "Cuanto seria en total?", english: "How much would the total be?", pronunciation: "KWAHN-toh seh-REE-ah en toh-TAHL" },
          { spanish: "Seria posible pagar con tarjeta?", english: "Would it be possible to pay by card?", pronunciation: "seh-REE-ah poh-SEE-bleh pah-GAR kohn tar-HEH-tah" },
          { spanish: "Conserve el cambio, por favor.", english: "Please keep the change.", pronunciation: "kohn-SEHR-veh el KAHM-bee-oh, por fah-VOR" },
          { spanish: "Podria darme un recibo, por favor?", english: "Could I have a receipt, please?", pronunciation: "poh-DREE-ah DAR-meh oon reh-SEE-boh, por fah-VOR" },
          { spanish: "Tendria la amabilidad de esperarme unos minutos?", english: "Would you be kind enough to wait a few minutes?", pronunciation: "tehn-DREE-ah lah ah-mah-bee-lee-DAHD deh ehs-peh-RAR-meh OO-nohs mee-NOO-tohs" },
        ],
      },
      social: {
        street: [
          { spanish: "Que trafico, no?", english: "Crazy traffic, right?", pronunciation: "keh TRAH-fee-koh, noh" },
          { spanish: "Esta buena la musica.", english: "Good music.", pronunciation: "ehs-TAH BWEH-nah lah MOO-see-kah" },
          { spanish: "Siempre hay tanto trafico?", english: "Always this much traffic?", pronunciation: "see-EHM-preh eye TAHN-toh TRAH-fee-koh" },
          { spanish: "Ando de vacaciones.", english: "I'm on vacation.", pronunciation: "AHN-doh deh vah-kah-see-OH-nehs" },
          { spanish: "Que lugar me recomiendas?", english: "What spot do you recommend?", pronunciation: "keh loo-GAR meh reh-koh-mee-EHN-dahs" },
        ],
        neutral: [
          { spanish: "Mucho trafico hoy.", english: "Lots of traffic today.", pronunciation: "MOO-choh TRAH-fee-koh oy" },
          { spanish: "Estoy de vacaciones.", english: "I'm on vacation.", pronunciation: "ehs-TOY deh vah-kah-see-OH-nehs" },
          { spanish: "Conoce un buen restaurante por la zona?", english: "Know a good restaurant around here?", pronunciation: "koh-NOH-seh oon bwehn rehs-tow-RAHN-teh por lah SOH-nah" },
          { spanish: "Me gusta mucho la ciudad.", english: "I really like the city.", pronunciation: "meh GOOS-tah MOO-choh lah see-oo-DAHD" },
          { spanish: "Cuanto tiene manejando taxi?", english: "How long have you been driving?", pronunciation: "KWAHN-toh tee-EH-neh mah-neh-HAHN-doh TAHK-see" },
        ],
        formal: [
          { spanish: "Ha sido un trayecto muy agradable.", english: "It's been a pleasant ride.", pronunciation: "ah SEE-doh oon trah-YEHK-toh mooy ah-grah-DAH-bleh" },
          { spanish: "Podria recomendarme un restaurante cercano?", english: "Could you recommend a nearby restaurant?", pronunciation: "poh-DREE-ah reh-koh-mehn-DAR-meh oon rehs-tow-RAHN-teh sehr-KAH-noh" },
          { spanish: "Estamos visitando la ciudad.", english: "We're visiting the city.", pronunciation: "ehs-TAH-mohs vee-see-TAHN-doh lah see-oo-DAHD" },
          { spanish: "Muchas gracias por el servicio.", english: "Thank you very much for the service.", pronunciation: "MOO-chahs GRAH-see-ahs por el ser-VEE-see-oh" },
        ],
      },
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ JUICES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: "juices",
    name: "Juices",
    emoji: "\uD83E\uDDC3",
    color: "lime",
    intents: {
      order: {
        street: [
          { spanish: "Un jugo de ___.", english: "A ___ juice.", pronunciation: "oon HOO-goh deh ___", isTemplate: true },
          { spanish: "Un verde.", english: "A green juice.", pronunciation: "oon VEHR-deh" },
          { spanish: "Sin hielo.", english: "No ice.", pronunciation: "seen YEH-loh" },
          { spanish: "Sin azucar.", english: "No sugar.", pronunciation: "seen ah-SOO-kar" },
          { spanish: "Licuado de ___.", english: "___ smoothie.", pronunciation: "lee-KWAH-doh deh ___", isTemplate: true },
          { spanish: "Exprimido, no licuado.", english: "Pressed, not blended.", pronunciation: "ehks-pree-MEE-doh, noh lee-KWAH-doh" },
          { spanish: "El grande.", english: "The big one.", pronunciation: "el GRAHN-deh" },
          { spanish: "Para llevar.", english: "To go.", pronunciation: "PAH-rah yeh-VAR" },
          { spanish: "Con todo.", english: "With everything.", pronunciation: "kohn TOH-doh" },
          { spanish: "Echale miel.", english: "Add honey.", pronunciation: "EH-chah-leh mee-EHL" },
        ],
        neutral: [
          { spanish: "Un jugo de ___, por favor.", english: "A ___ juice, please.", pronunciation: "oon HOO-goh deh ___, por fah-VOR", isTemplate: true },
          { spanish: "Un jugo verde, por favor.", english: "A green juice, please.", pronunciation: "oon HOO-goh VEHR-deh, por fah-VOR" },
          { spanish: "Sin hielo, por favor.", english: "No ice, please.", pronunciation: "seen YEH-loh, por fah-VOR" },
          { spanish: "Sin azucar, por favor.", english: "No sugar, please.", pronunciation: "seen ah-SOO-kar, por fah-VOR" },
          { spanish: "Con miel, por favor.", english: "With honey, please.", pronunciation: "kohn mee-EHL, por fah-VOR" },
          { spanish: "Licuado, por favor.", english: "Blended, please.", pronunciation: "lee-KWAH-doh, por fah-VOR" },
          { spanish: "Recien exprimido, por favor.", english: "Fresh squeezed, please.", pronunciation: "reh-see-EHN ehks-pree-MEE-doh, por fah-VOR" },
          { spanish: "Tamano grande, por favor.", english: "Large size, please.", pronunciation: "tah-MAH-nyoh GRAHN-deh, por fah-VOR" },
          { spanish: "Para llevar, por favor.", english: "To go, please.", pronunciation: "PAH-rah yeh-VAR, por fah-VOR" },
          { spanish: "Puede mezclar ___ con ___?", english: "Can you mix ___ with ___?", pronunciation: "PWEH-deh mehs-KLAHR ___ kohn ___", isTemplate: true },
        ],
        formal: [
          { spanish: "Podria prepararme un jugo de ___, por favor?", english: "Could you prepare a ___ juice, please?", pronunciation: "poh-DREE-ah preh-pah-RAR-meh oon HOO-goh deh ___, por fah-VOR", isTemplate: true },
          { spanish: "Me gustaria un jugo verde, por favor.", english: "I'd like a green juice, please.", pronunciation: "meh goos-tah-REE-ah oon HOO-goh VEHR-deh, por fah-VOR" },
          { spanish: "Sin azucar ni hielo, si es tan amable.", english: "Without sugar or ice, if you'd be so kind.", pronunciation: "seen ah-SOO-kar nee YEH-loh, see ehs tahn ah-MAH-bleh" },
          { spanish: "Podria agregar un poco de miel?", english: "Could you add a bit of honey?", pronunciation: "poh-DREE-ah ah-greh-GAR oon POH-koh deh mee-EHL" },
          { spanish: "Seria posible mezclar ___ con ___?", english: "Would it be possible to mix ___ with ___?", pronunciation: "seh-REE-ah poh-SEE-bleh mehs-KLAHR ___ kohn ___", isTemplate: true },
        ],
      },
      react: {
        street: [
          { spanish: "Esta bien rico!", english: "Really tasty!", pronunciation: "ehs-TAH bee-EHN REE-koh" },
          { spanish: "Esta bien fresco.", english: "Super fresh.", pronunciation: "ehs-TAH bee-EHN FREHS-koh" },
          { spanish: "Le falta fruta.", english: "Needs more fruit.", pronunciation: "leh FAHL-tah FROO-tah" },
          { spanish: "Mas espeso.", english: "Thicker.", pronunciation: "mahs ehs-PEH-soh" },
          { spanish: "Muy aguado.", english: "Too watery.", pronunciation: "mooy ah-GWAH-doh" },
          { spanish: "Que bueno esta.", english: "This is so good.", pronunciation: "keh BWEH-noh ehs-TAH" },
        ],
        neutral: [
          { spanish: "Esta muy rico.", english: "It's really good.", pronunciation: "ehs-TAH mooy REE-koh" },
          { spanish: "Esta fresco.", english: "It's fresh.", pronunciation: "ehs-TAH FREHS-koh" },
          { spanish: "Podria estar un poco mas espeso.", english: "Could be a bit thicker.", pronunciation: "poh-DREE-ah ehs-TAR oon POH-koh mahs ehs-PEH-soh" },
          { spanish: "Esta un poco aguado.", english: "It's a bit watery.", pronunciation: "ehs-TAH oon POH-koh ah-GWAH-doh" },
          { spanish: "Perfecto, justo como lo queria.", english: "Perfect, just how I wanted it.", pronunciation: "per-FEHK-toh, HOOS-toh KOH-moh loh keh-REE-ah" },
        ],
        formal: [
          { spanish: "Esta excelente, muchas gracias.", english: "It's excellent, thank you.", pronunciation: "ehs-TAH ehk-seh-LEHN-teh, MOO-chahs GRAH-see-ahs" },
          { spanish: "Quedo perfecto.", english: "It turned out perfect.", pronunciation: "keh-DOH per-FEHK-toh" },
          { spanish: "Seria posible hacerlo un poco mas espeso?", english: "Would it be possible to make it a bit thicker?", pronunciation: "seh-REE-ah poh-SEE-bleh ah-SEHR-loh oon POH-koh mahs ehs-PEH-soh" },
        ],
      },
      ask: {
        street: [
          { spanish: "Que jugos tienen?", english: "What juices you got?", pronunciation: "keh HOO-gohs tee-EH-nen" },
          { spanish: "Es natural?", english: "Is it natural?", pronunciation: "ehs nah-too-RAHL" },
          { spanish: "Cuanto cuesta?", english: "How much?", pronunciation: "KWAHN-toh KWEHS-tah" },
          { spanish: "Le pueden echar ___?", english: "Can you add ___?", pronunciation: "leh PWEH-dehn eh-CHAR ___", isTemplate: true },
          { spanish: "Tienen popote?", english: "Got a straw?", pronunciation: "tee-EH-nen poh-POH-teh" },
          { spanish: "Tienen leche de almendra?", english: "Got almond milk?", pronunciation: "tee-EH-nen LEH-cheh deh ahl-MEHN-drah" },
          { spanish: "Cuales son los mas populares?", english: "Which are most popular?", pronunciation: "KWAH-lehs sohn lohs mahs poh-poo-LAH-rehs" },
        ],
        neutral: [
          { spanish: "Que jugos tienen hoy?", english: "What juices do you have today?", pronunciation: "keh HOO-gohs tee-EH-nen oy" },
          { spanish: "Es jugo natural?", english: "Is it fresh juice?", pronunciation: "ehs HOO-goh nah-too-RAHL" },
          { spanish: "Cuanto cuesta el grande?", english: "How much for the large?", pronunciation: "KWAHN-toh KWEHS-tah el GRAHN-deh" },
          { spanish: "Pueden agregar proteina?", english: "Can you add protein?", pronunciation: "PWEH-dehn ah-greh-GAR proh-teh-EE-nah" },
          { spanish: "Tienen leche de almendra?", english: "Do you have almond milk?", pronunciation: "tee-EH-nen LEH-cheh deh ahl-MEHN-drah" },
          { spanish: "Tienen pajita / popote?", english: "Do you have a straw?", pronunciation: "tee-EH-nen pah-HEE-tah / poh-POH-teh" },
          { spanish: "Que es lo mas vendido?", english: "What's the most popular?", pronunciation: "keh ehs loh mahs vehn-DEE-doh" },
        ],
        formal: [
          { spanish: "Podria decirme que jugos tienen disponibles?", english: "Could you tell me what juices are available?", pronunciation: "poh-DREE-ah deh-SEER-meh keh HOO-gohs tee-EH-nen dees-poh-NEE-blehs" },
          { spanish: "Es jugo recien exprimido?", english: "Is it freshly pressed?", pronunciation: "ehs HOO-goh reh-see-EHN ehks-pree-MEE-doh" },
          { spanish: "Seria posible agregarle ___?", english: "Would it be possible to add ___?", pronunciation: "seh-REE-ah poh-SEE-bleh ah-greh-GAR-leh ___", isTemplate: true },
          { spanish: "Tendria alguna opcion con leche vegetal?", english: "Would you have any plant milk option?", pronunciation: "tehn-DREE-ah ahl-GOO-nah op-see-OHN kohn LEH-cheh veh-heh-TAHL" },
        ],
      },
      finish: {
        street: [
          { spanish: "Cuanto es?", english: "How much?", pronunciation: "KWAHN-toh ehs" },
          { spanish: "Aceptan tarjeta?", english: "Take cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "Quedese el cambio.", english: "Keep it.", pronunciation: "KEH-deh-seh el KAHM-bee-oh" },
          { spanish: "Gracias, esta buenisimo.", english: "Thanks, it's great.", pronunciation: "GRAH-see-ahs, ehs-TAH bweh-NEE-see-moh" },
        ],
        neutral: [
          { spanish: "Cuanto es?", english: "How much is it?", pronunciation: "KWAHN-toh ehs" },
          { spanish: "Aceptan tarjeta?", english: "Do you accept cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "Quedese con el cambio.", english: "Keep the change.", pronunciation: "KEH-deh-seh kohn el KAHM-bee-oh" },
          { spanish: "Gracias, todo bien.", english: "Thanks, all good.", pronunciation: "GRAH-see-ahs, TOH-doh bee-EHN" },
        ],
        formal: [
          { spanish: "Cuanto seria en total?", english: "How much would the total be?", pronunciation: "KWAHN-toh seh-REE-ah en toh-TAHL" },
          { spanish: "Aceptan pago con tarjeta?", english: "Do you accept card payment?", pronunciation: "ah-SEHP-tahn PAH-goh kohn tar-HEH-tah" },
          { spanish: "Conserve el cambio, por favor.", english: "Please keep the change.", pronunciation: "kohn-SEHR-veh el KAHM-bee-oh, por fah-VOR" },
          { spanish: "Muchas gracias, estuvo delicioso.", english: "Thank you very much, it was delicious.", pronunciation: "MOO-chahs GRAH-see-ahs, ehs-TOO-voh deh-lee-see-OH-soh" },
        ],
      },
      social: {
        street: [
          { spanish: "Que fruta es esa?", english: "What fruit is that?", pronunciation: "keh FROO-tah ehs EH-sah" },
          { spanish: "Vengo todos los dias.", english: "I come every day.", pronunciation: "VEHN-goh TOH-dohs lohs DEE-ahs" },
          { spanish: "Cual es tu favorito?", english: "Which is your favorite?", pronunciation: "kwahl ehs too fah-voh-REE-toh" },
          { spanish: "Ya me hice adicto.", english: "I'm hooked.", pronunciation: "yah meh EE-seh ah-DEEK-toh" },
        ],
        neutral: [
          { spanish: "Que fruta es esa?", english: "What fruit is that?", pronunciation: "keh FROO-tah ehs EH-sah" },
          { spanish: "Cual recomienda?", english: "Which do you recommend?", pronunciation: "kwahl reh-koh-mee-EHN-dah" },
          { spanish: "A que hora abren?", english: "What time do you open?", pronunciation: "ah keh OH-rah AH-brehn" },
          { spanish: "Me encanta este lugar.", english: "I love this place.", pronunciation: "meh ehn-KAHN-tah EHS-teh loo-GAR" },
        ],
        formal: [
          { spanish: "Podria indicarme que fruta es esa?", english: "Could you tell me what fruit that is?", pronunciation: "poh-DREE-ah een-dee-KAR-meh keh FROO-tah ehs EH-sah" },
          { spanish: "Que me recomendaria usted?", english: "What would you recommend?", pronunciation: "keh meh reh-koh-mehn-dah-REE-ah oos-TEHD" },
          { spanish: "Me han encantado sus jugos.", english: "I've loved your juices.", pronunciation: "meh ahn ehn-kahn-TAH-doh soos HOO-gohs" },
        ],
      },
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COFFEE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: "coffee",
    name: "Coffee",
    emoji: "\u2615",
    color: "orange",
    intents: {
      order: {
        street: [
          { spanish: "Un cafe.", english: "A coffee.", pronunciation: "oon kah-FEH" },
          { spanish: "Americano.", english: "Black coffee.", pronunciation: "ah-meh-ree-KAH-noh" },
          { spanish: "Con leche.", english: "With milk.", pronunciation: "kohn LEH-cheh" },
          { spanish: "Cafe helado.", english: "Iced coffee.", pronunciation: "kah-FEH eh-LAH-doh" },
          { spanish: "Doble.", english: "Double.", pronunciation: "DOH-bleh" },
          { spanish: "Para llevar.", english: "To go.", pronunciation: "PAH-rah yeh-VAR" },
          { spanish: "Sin azucar.", english: "No sugar.", pronunciation: "seen ah-SOO-kar" },
          { spanish: "Descafeinado.", english: "Decaf.", pronunciation: "dehs-kah-feh-ee-NAH-doh" },
          { spanish: "Con leche de avena.", english: "With oat milk.", pronunciation: "kohn LEH-cheh deh ah-VEH-nah" },
        ],
        neutral: [
          { spanish: "Un cafe, por favor.", english: "A coffee, please.", pronunciation: "oon kah-FEH, por fah-VOR" },
          { spanish: "Un cafe con leche.", english: "A coffee with milk.", pronunciation: "oon kah-FEH kohn LEH-cheh" },
          { spanish: "Un cafe solo / negro.", english: "A black coffee.", pronunciation: "oon kah-FEH SOH-loh / NEH-groh" },
          { spanish: "Un cappuccino, por favor.", english: "A cappuccino, please.", pronunciation: "oon kah-poo-CHEE-noh, por fah-VOR" },
          { spanish: "Cafe helado, por favor.", english: "Iced coffee, please.", pronunciation: "kah-FEH eh-LAH-doh, por fah-VOR" },
          { spanish: "Descafeinado, por favor.", english: "Decaf, please.", pronunciation: "dehs-kah-feh-ee-NAH-doh, por fah-VOR" },
          { spanish: "Con leche de almendras.", english: "With almond milk.", pronunciation: "kohn LEH-cheh deh ahl-MEHN-drahs" },
          { spanish: "Para llevar, por favor.", english: "To go, please.", pronunciation: "PAH-rah yeh-VAR, por fah-VOR" },
          { spanish: "Para tomar aqui.", english: "For here.", pronunciation: "PAH-rah toh-MAR ah-KEE" },
          { spanish: "Doble de espresso.", english: "Double espresso.", pronunciation: "DOH-bleh deh ehs-PREH-soh" },
        ],
        formal: [
          { spanish: "Podria traerme un cafe, por favor?", english: "Could you bring me a coffee, please?", pronunciation: "poh-DREE-ah trah-EHR-meh oon kah-FEH, por fah-VOR" },
          { spanish: "Me gustaria un cappuccino, por favor.", english: "I'd like a cappuccino, please.", pronunciation: "meh goos-tah-REE-ah oon kah-poo-CHEE-noh, por fah-VOR" },
          { spanish: "Tendria leche de almendras o de avena?", english: "Would you have almond or oat milk?", pronunciation: "tehn-DREE-ah LEH-cheh deh ahl-MEHN-drahs oh deh ah-VEH-nah" },
          { spanish: "Seria para llevar, si es tan amable.", english: "It would be to go, if you'd be so kind.", pronunciation: "seh-REE-ah PAH-rah yeh-VAR, see ehs tahn ah-MAH-bleh" },
          { spanish: "Podria ser un ___ grande, por favor?", english: "Could it be a large ___, please?", pronunciation: "poh-DREE-ah sehr oon ___ GRAHN-deh, por fah-VOR", isTemplate: true },
        ],
      },
      react: {
        street: [
          { spanish: "Que buen cafe.", english: "Great coffee.", pronunciation: "keh bwehn kah-FEH" },
          { spanish: "Esta frio.", english: "It's cold.", pronunciation: "ehs-TAH FREE-oh" },
          { spanish: "Muy fuerte.", english: "Very strong.", pronunciation: "mooy FWEHR-teh" },
          { spanish: "Justo lo que necesitaba.", english: "Just what I needed.", pronunciation: "HOOS-toh loh keh neh-seh-see-TAH-bah" },
        ],
        neutral: [
          { spanish: "El cafe esta muy bueno.", english: "The coffee is really good.", pronunciation: "el kah-FEH ehs-TAH mooy BWEH-noh" },
          { spanish: "Esta un poco frio.", english: "It's a bit cold.", pronunciation: "ehs-TAH oon POH-koh FREE-oh" },
          { spanish: "Esta perfecto, gracias.", english: "It's perfect, thanks.", pronunciation: "ehs-TAH per-FEHK-toh, GRAH-see-ahs" },
          { spanish: "Podria estar un poco mas caliente.", english: "Could be a bit hotter.", pronunciation: "poh-DREE-ah ehs-TAR oon POH-koh mahs kah-lee-EHN-teh" },
        ],
        formal: [
          { spanish: "Excelente cafe, muchas gracias.", english: "Excellent coffee, thank you.", pronunciation: "ehk-seh-LEHN-teh kah-FEH, MOO-chahs GRAH-see-ahs" },
          { spanish: "Quedo perfecto.", english: "It turned out perfect.", pronunciation: "keh-DOH per-FEHK-toh" },
          { spanish: "Disculpe, podria calentarmelo un poco?", english: "Excuse me, could you warm it up a bit?", pronunciation: "dees-KOOL-peh, poh-DREE-ah kah-lehn-TAR-meh-loh oon POH-koh" },
        ],
      },
      ask: {
        street: [
          { spanish: "Tienen wifi?", english: "Got wifi?", pronunciation: "tee-EH-nen WAI-fai" },
          { spanish: "Cual es la contrasena?", english: "What's the password?", pronunciation: "kwahl ehs lah kohn-trah-SEH-nyah" },
          { spanish: "Hay enchufes?", english: "Got outlets?", pronunciation: "eye ehn-CHOO-fehs" },
          { spanish: "Tienen algo de comer?", english: "Got food?", pronunciation: "tee-EH-nen AHL-goh deh koh-MEHR" },
          { spanish: "Que pasteles tienen?", english: "What pastries you got?", pronunciation: "keh pahs-TEH-lehs tee-EH-nen" },
        ],
        neutral: [
          { spanish: "Tienen wifi?", english: "Do you have wifi?", pronunciation: "tee-EH-nen WAI-fai" },
          { spanish: "Cual es la contrasena del wifi?", english: "What's the wifi password?", pronunciation: "kwahl ehs lah kohn-trah-SEH-nyah del WAI-fai" },
          { spanish: "Tienen enchufes?", english: "Do you have outlets?", pronunciation: "tee-EH-nen ehn-CHOO-fehs" },
          { spanish: "Tienen algo de comer?", english: "Do you have anything to eat?", pronunciation: "tee-EH-nen AHL-goh deh koh-MEHR" },
          { spanish: "Que pasteles tienen?", english: "What pastries do you have?", pronunciation: "keh pahs-TEH-lehs tee-EH-nen" },
          { spanish: "Tienen leche de almendras?", english: "Do you have almond milk?", pronunciation: "tee-EH-nen LEH-cheh deh ahl-MEHN-drahs" },
        ],
        formal: [
          { spanish: "Disculpe, tendrian servicio de wifi?", english: "Excuse me, would you have wifi?", pronunciation: "dees-KOOL-peh, tehn-DREE-ahn ser-VEE-see-oh deh WAI-fai" },
          { spanish: "Podria indicarme la contrasena?", english: "Could you give me the password?", pronunciation: "poh-DREE-ah een-dee-KAR-meh lah kohn-trah-SEH-nyah" },
          { spanish: "Tendria alguna opcion para acompanar el cafe?", english: "Would you have anything to go with the coffee?", pronunciation: "tehn-DREE-ah ahl-GOO-nah op-see-OHN PAH-rah ah-kohm-pah-NYAR el kah-FEH" },
        ],
      },
      finish: {
        street: [
          { spanish: "Cuanto es?", english: "How much?", pronunciation: "KWAHN-toh ehs" },
          { spanish: "Todo junto.", english: "All together.", pronunciation: "TOH-doh HOON-toh" },
          { spanish: "Aceptan tarjeta?", english: "Take cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "Quedese el cambio.", english: "Keep it.", pronunciation: "KEH-deh-seh el KAHM-bee-oh" },
        ],
        neutral: [
          { spanish: "Cuanto es?", english: "How much is it?", pronunciation: "KWAHN-toh ehs" },
          { spanish: "La cuenta, por favor.", english: "The check, please.", pronunciation: "lah KWEHN-tah, por fah-VOR" },
          { spanish: "Todo junto, por favor.", english: "All together, please.", pronunciation: "TOH-doh HOON-toh, por fah-VOR" },
          { spanish: "Aceptan tarjeta?", english: "Do you accept cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "Quedese con el cambio.", english: "Keep the change.", pronunciation: "KEH-deh-seh kohn el KAHM-bee-oh" },
        ],
        formal: [
          { spanish: "Cuanto seria en total?", english: "How much would the total be?", pronunciation: "KWAHN-toh seh-REE-ah en toh-TAHL" },
          { spanish: "Podria cobrarme, por favor?", english: "Could you charge me, please?", pronunciation: "poh-DREE-ah koh-BRAR-meh, por fah-VOR" },
          { spanish: "Seria posible pagar con tarjeta?", english: "Would it be possible to pay by card?", pronunciation: "seh-REE-ah poh-SEE-bleh pah-GAR kohn tar-HEH-tah" },
          { spanish: "Conserve el cambio, por favor.", english: "Please keep the change.", pronunciation: "kohn-SEHR-veh el KAHM-bee-oh, por fah-VOR" },
        ],
      },
      social: {
        street: [
          { spanish: "Que buen lugar.", english: "Nice place.", pronunciation: "keh bwehn loo-GAR" },
          { spanish: "Llevan mucho aqui?", english: "Been here long?", pronunciation: "YEH-vahn MOO-choh ah-KEE" },
          { spanish: "Todo es de grano?", english: "All bean-to-cup?", pronunciation: "TOH-doh ehs deh GRAH-noh" },
        ],
        neutral: [
          { spanish: "Me gusta mucho este cafe.", english: "I really like this coffee shop.", pronunciation: "meh GOOS-tah MOO-choh EHS-teh kah-FEH" },
          { spanish: "Es cafe de grano?", english: "Is it whole-bean coffee?", pronunciation: "ehs kah-FEH deh GRAH-noh" },
          { spanish: "Que bonito lugar.", english: "What a nice place.", pronunciation: "keh boh-NEE-toh loo-GAR" },
        ],
        formal: [
          { spanish: "Es un establecimiento encantador.", english: "It's a charming establishment.", pronunciation: "ehs oon ehs-tah-bleh-see-mee-EHN-toh ehn-kahn-tah-DOR" },
          { spanish: "Que tipo de grano utilizan?", english: "What type of bean do you use?", pronunciation: "keh TEE-poh deh GRAH-noh oo-tee-LEE-sahn" },
        ],
      },
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SHOPPING ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: "shopping",
    name: "Shopping",
    emoji: "\uD83D\uDECD\uFE0F",
    color: "emerald",
    intents: {
      order: {
        street: [
          { spanish: "Me lo llevo.", english: "I'll take it.", pronunciation: "meh loh YEH-voh" },
          { spanish: "Cuanto es?", english: "How much?", pronunciation: "KWAHN-toh ehs" },
          { spanish: "Tiene en otra talla?", english: "Got another size?", pronunciation: "tee-EH-neh en OH-trah TAH-yah" },
          { spanish: "En otro color?", english: "Another color?", pronunciation: "en OH-troh koh-LOR" },
          { spanish: "Me queda chico.", english: "Too small.", pronunciation: "meh KEH-dah CHEE-koh" },
          { spanish: "Tiene mas grande?", english: "Got a bigger one?", pronunciation: "tee-EH-neh mahs GRAHN-deh" },
          { spanish: "Puedo probarmelo?", english: "Can I try it on?", pronunciation: "PWEH-doh proh-BAR-meh-loh" },
          { spanish: "Solo estoy viendo.", english: "Just looking.", pronunciation: "SOH-loh ehs-TOY vee-EHN-doh" },
        ],
        neutral: [
          { spanish: "Me lo llevo.", english: "I'll take it.", pronunciation: "meh loh YEH-voh" },
          { spanish: "Cuanto cuesta esto?", english: "How much is this?", pronunciation: "KWAHN-toh KWEHS-tah EHS-toh" },
          { spanish: "Tienen esto en otra talla?", english: "Do you have this in another size?", pronunciation: "tee-EH-nen EHS-toh en OH-trah TAH-yah" },
          { spanish: "Tienen esto en otro color?", english: "Do you have this in another color?", pronunciation: "tee-EH-nen EHS-toh en OH-troh koh-LOR" },
          { spanish: "Puedo probarmelo?", english: "Can I try it on?", pronunciation: "PWEH-doh proh-BAR-meh-loh" },
          { spanish: "Solo estoy mirando.", english: "I'm just looking.", pronunciation: "SOH-loh ehs-TOY mee-RAHN-doh" },
          { spanish: "Donde estan los probadores?", english: "Where are the fitting rooms?", pronunciation: "DOHN-deh ehs-TAHN lohs proh-bah-DOH-rehs" },
          { spanish: "Me queda perfecto.", english: "It fits perfectly.", pronunciation: "meh KEH-dah per-FEHK-toh" },
        ],
        formal: [
          { spanish: "Me gustaria llevarmelo.", english: "I'd like to take it.", pronunciation: "meh goos-tah-REE-ah yeh-VAR-meh-loh" },
          { spanish: "Podria indicarme el precio?", english: "Could you tell me the price?", pronunciation: "poh-DREE-ah een-dee-KAR-meh el PREH-see-oh" },
          { spanish: "Tendria esta prenda en otra talla?", english: "Would you have this item in another size?", pronunciation: "tehn-DREE-ah EHS-tah PREHN-dah en OH-trah TAH-yah" },
          { spanish: "Podria indicarme donde estan los probadores?", english: "Could you tell me where the fitting rooms are?", pronunciation: "poh-DREE-ah een-dee-KAR-meh DOHN-deh ehs-TAHN lohs proh-bah-DOH-rehs" },
          { spanish: "Estoy solo mirando, gracias.", english: "I'm just browsing, thank you.", pronunciation: "ehs-TOY SOH-loh mee-RAHN-doh, GRAH-see-ahs" },
        ],
      },
      react: {
        street: [
          { spanish: "Esta caro.", english: "It's expensive.", pronunciation: "ehs-TAH KAH-roh" },
          { spanish: "Que bonito.", english: "How nice.", pronunciation: "keh boh-NEE-toh" },
          { spanish: "Me queda bien.", english: "Fits me well.", pronunciation: "meh KEH-dah bee-EHN" },
          { spanish: "No me gusto.", english: "Didn't like it.", pronunciation: "noh meh goos-TOH" },
          { spanish: "Esta padre!", english: "It's cool!", pronunciation: "ehs-TAH PAH-dreh" },
        ],
        neutral: [
          { spanish: "Es muy caro.", english: "It's too expensive.", pronunciation: "ehs mooy KAH-roh" },
          { spanish: "Que bonito esta.", english: "How nice it is.", pronunciation: "keh boh-NEE-toh ehs-TAH" },
          { spanish: "Me queda grande.", english: "It's too big on me.", pronunciation: "meh KEH-dah GRAHN-deh" },
          { spanish: "Me queda chico.", english: "It's too small on me.", pronunciation: "meh KEH-dah CHEE-koh" },
          { spanish: "No es lo que buscaba.", english: "Not what I was looking for.", pronunciation: "noh ehs loh keh boos-KAH-bah" },
        ],
        formal: [
          { spanish: "Esta fuera de mi presupuesto.", english: "It's outside my budget.", pronunciation: "ehs-TAH FWEH-rah deh mee preh-soo-PWEHS-toh" },
          { spanish: "Es una pieza muy bonita.", english: "It's a very nice piece.", pronunciation: "ehs OO-nah pee-EH-sah mooy boh-NEE-tah" },
          { spanish: "Me temo que no es lo que buscaba.", english: "I'm afraid it's not what I was looking for.", pronunciation: "meh TEH-moh keh noh ehs loh keh boos-KAH-bah" },
        ],
      },
      ask: {
        street: [
          { spanish: "Hay descuento?", english: "Any discount?", pronunciation: "eye dehs-KWEHN-toh" },
          { spanish: "Si compro dos, que precio?", english: "Buy two, what price?", pronunciation: "see KOHM-proh dohs, keh PREH-see-oh" },
          { spanish: "A que hora cierran?", english: "When do you close?", pronunciation: "ah keh OH-rah see-EH-rahn" },
          { spanish: "Tienen devolucion?", english: "Got returns?", pronunciation: "tee-EH-nen deh-voh-loo-see-OHN" },
          { spanish: "Lo tiene mas barato?", english: "Got it cheaper?", pronunciation: "loh tee-EH-neh mahs bah-RAH-toh" },
        ],
        neutral: [
          { spanish: "Tienen descuento?", english: "Do you have a discount?", pronunciation: "tee-EH-nen dehs-KWEHN-toh" },
          { spanish: "Me puede hacer un descuento?", english: "Can you give me a discount?", pronunciation: "meh PWEH-deh ah-SEHR oon dehs-KWEHN-toh" },
          { spanish: "Cual es su mejor precio?", english: "What's your best price?", pronunciation: "kwahl ehs soo meh-HOR PREH-see-oh" },
          { spanish: "Tienen devolucion?", english: "Do you have returns?", pronunciation: "tee-EH-nen deh-voh-loo-see-OHN" },
          { spanish: "Esta en oferta?", english: "Is it on sale?", pronunciation: "ehs-TAH en oh-FEHR-tah" },
          { spanish: "Tiene algo mas economico?", english: "Do you have something cheaper?", pronunciation: "tee-EH-neh AHL-goh mahs eh-koh-NOH-mee-koh" },
          { spanish: "A que hora cierran?", english: "What time do you close?", pronunciation: "ah keh OH-rah see-EH-rahn" },
        ],
        formal: [
          { spanish: "Tendria algun descuento disponible?", english: "Would there be any discount available?", pronunciation: "tehn-DREE-ah ahl-GOON dehs-KWEHN-toh dees-poh-NEE-bleh" },
          { spanish: "Podria ofrecerme un mejor precio?", english: "Could you offer me a better price?", pronunciation: "poh-DREE-ah oh-freh-SEHR-meh oon meh-HOR PREH-see-oh" },
          { spanish: "Cual es su politica de devoluciones?", english: "What is your return policy?", pronunciation: "kwahl ehs soo poh-LEE-tee-kah deh deh-voh-loo-see-OH-nehs" },
          { spanish: "Podria indicarme su horario?", english: "Could you tell me your hours?", pronunciation: "poh-DREE-ah een-dee-KAR-meh soo oh-RAH-ree-oh" },
        ],
      },
      finish: {
        street: [
          { spanish: "Aceptan tarjeta?", english: "Take cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "En efectivo.", english: "Cash.", pronunciation: "en eh-fehk-TEE-voh" },
          { spanish: "Me da un recibo?", english: "Receipt?", pronunciation: "meh dah oon reh-SEE-boh" },
          { spanish: "Envuelvamelo.", english: "Wrap it up.", pronunciation: "ehn-VWEHL-vah-meh-loh" },
        ],
        neutral: [
          { spanish: "Aceptan tarjeta?", english: "Do you accept cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "Puedo pagar en dolares?", english: "Can I pay in dollars?", pronunciation: "PWEH-doh pah-GAR en DOH-lah-rehs" },
          { spanish: "Me da un recibo?", english: "Can I get a receipt?", pronunciation: "meh dah oon reh-SEE-boh" },
          { spanish: "Me puede envolver para regalo?", english: "Can you gift wrap it?", pronunciation: "meh PWEH-deh ehn-vol-VEHR PAH-rah reh-GAH-loh" },
          { spanish: "Hacen envios?", english: "Do you do shipping?", pronunciation: "AH-sehn ehn-VEE-ohs" },
          { spanish: "Quiero devolver esto.", english: "I want to return this.", pronunciation: "kee-EH-roh deh-vol-VEHR EHS-toh" },
        ],
        formal: [
          { spanish: "Seria posible pagar con tarjeta?", english: "Would it be possible to pay by card?", pronunciation: "seh-REE-ah poh-SEE-bleh pah-GAR kohn tar-HEH-tah" },
          { spanish: "Podria darme un recibo, por favor?", english: "Could I get a receipt, please?", pronunciation: "poh-DREE-ah DAR-meh oon reh-SEE-boh, por fah-VOR" },
          { spanish: "Podria envolverlo para regalo?", english: "Could you gift wrap it?", pronunciation: "poh-DREE-ah ehn-vol-VEHR-loh PAH-rah reh-GAH-loh" },
          { spanish: "Me gustaria hacer una devolucion.", english: "I'd like to make a return.", pronunciation: "meh goos-tah-REE-ah ah-SEHR OO-nah deh-voh-loo-see-OHN" },
        ],
      },
      social: {
        street: [
          { spanish: "Que tienda mas chida.", english: "What a cool store.", pronunciation: "keh tee-EHN-dah mahs CHEE-dah" },
          { spanish: "Donde compraste eso?", english: "Where'd you get that?", pronunciation: "DOHN-deh kohm-PRAHS-teh EH-soh" },
          { spanish: "Voy a pensarlo.", english: "I'll think about it.", pronunciation: "voy ah pehn-SAR-loh" },
        ],
        neutral: [
          { spanish: "Es una tienda muy bonita.", english: "It's a very nice store.", pronunciation: "ehs OO-nah tee-EHN-dah mooy boh-NEE-tah" },
          { spanish: "Lo vi mas barato en otra tienda.", english: "I saw it cheaper elsewhere.", pronunciation: "loh vee mahs bah-RAH-toh en OH-trah tee-EHN-dah" },
          { spanish: "Voy a pensarlo.", english: "I'll think about it.", pronunciation: "voy ah pehn-SAR-loh" },
        ],
        formal: [
          { spanish: "Es un establecimiento encantador.", english: "It's a charming establishment.", pronunciation: "ehs oon ehs-tah-bleh-see-mee-EHN-toh ehn-kahn-tah-DOR" },
          { spanish: "Lo voy a considerar, muchas gracias.", english: "I'll consider it, thank you.", pronunciation: "loh voy ah kohn-see-deh-RAR, MOO-chahs GRAH-see-ahs" },
        ],
      },
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━��� HOTEL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: "hotel",
    name: "Hotel",
    emoji: "\uD83C\uDFE8",
    color: "indigo",
    intents: {
      order: {
        street: [
          { spanish: "Tengo reservacion.", english: "I have a reservation.", pronunciation: "TEHN-goh reh-ser-vah-see-OHN" },
          { spanish: "Hay cuartos?", english: "Got rooms?", pronunciation: "eye KWAHR-tohs" },
          { spanish: "Cuanto la noche?", english: "How much per night?", pronunciation: "KWAHN-toh lah NOH-cheh" },
          { spanish: "Una con vista.", english: "One with a view.", pronunciation: "OO-nah kohn VEES-tah" },
          { spanish: "Incluye desayuno?", english: "Includes breakfast?", pronunciation: "een-KLOO-yeh deh-sah-YOO-noh" },
          { spanish: "Quiero hacer checkout.", english: "I want to check out.", pronunciation: "kee-EH-roh ah-SEHR checkout" },
        ],
        neutral: [
          { spanish: "Tengo una reservacion.", english: "I have a reservation.", pronunciation: "TEHN-goh OO-nah reh-ser-vah-see-OHN" },
          { spanish: "Tienen habitaciones disponibles?", english: "Do you have rooms available?", pronunciation: "tee-EH-nen ah-bee-tah-see-OH-nehs dees-poh-NEE-blehs" },
          { spanish: "Cuanto cuesta la noche?", english: "How much per night?", pronunciation: "KWAHN-toh KWEHS-tah lah NOH-cheh" },
          { spanish: "Quisiera una habitacion con vista.", english: "I'd like a room with a view.", pronunciation: "kee-see-EH-rah OO-nah ah-bee-tah-see-OHN kohn VEES-tah" },
          { spanish: "Incluye desayuno?", english: "Does it include breakfast?", pronunciation: "een-KLOO-yeh deh-sah-YOO-noh" },
          { spanish: "A que hora es el check-in?", english: "What time is check-in?", pronunciation: "ah keh OH-rah ehs el check-een" },
          { spanish: "A que hora es el check-out?", english: "What time is check-out?", pronunciation: "ah keh OH-rah ehs el check-owt" },
          { spanish: "Tienen habitacion doble?", english: "Do you have a double room?", pronunciation: "tee-EH-nen ah-bee-tah-see-OHN DOH-bleh" },
        ],
        formal: [
          { spanish: "Tengo una reservacion a nombre de ___.", english: "I have a reservation under the name ___.", pronunciation: "TEHN-goh OO-nah reh-ser-vah-see-OHN ah NOHM-breh deh ___", isTemplate: true },
          { spanish: "Tendrian habitaciones disponibles para esta noche?", english: "Would you have rooms available tonight?", pronunciation: "tehn-DREE-ahn ah-bee-tah-see-OH-nehs dees-poh-NEE-blehs PAH-rah EHS-tah NOH-cheh" },
          { spanish: "Me gustaria una habitacion con vista, por favor.", english: "I'd like a room with a view, please.", pronunciation: "meh goos-tah-REE-ah OO-nah ah-bee-tah-see-OHN kohn VEES-tah, por fah-VOR" },
          { spanish: "Podria indicarme el horario de check-out?", english: "Could you tell me the checkout time?", pronunciation: "poh-DREE-ah een-dee-KAR-meh el oh-RAH-ree-oh deh check-owt" },
        ],
      },
      react: {
        street: [
          { spanish: "El aire no jala.", english: "The AC's not working.", pronunciation: "el AH-ee-reh noh HAH-lah" },
          { spanish: "No hay agua caliente.", english: "No hot water.", pronunciation: "noh eye AH-gwah kah-lee-EHN-teh" },
          { spanish: "La llave no sirve.", english: "The key doesn't work.", pronunciation: "lah YAH-veh noh SEER-veh" },
          { spanish: "Hay mucho ruido.", english: "Too noisy.", pronunciation: "eye MOO-choh roo-EE-doh" },
          { spanish: "Esta bien el cuarto.", english: "Room's fine.", pronunciation: "ehs-TAH bee-EHN el KWAHR-toh" },
        ],
        neutral: [
          { spanish: "El aire acondicionado no funciona.", english: "The AC doesn't work.", pronunciation: "el AH-ee-reh ah-kohn-dee-see-oh-NAH-doh noh foon-see-OH-nah" },
          { spanish: "No hay agua caliente.", english: "There's no hot water.", pronunciation: "noh eye AH-gwah kah-lee-EHN-teh" },
          { spanish: "La llave no funciona.", english: "The key doesn't work.", pronunciation: "lah YAH-veh noh foon-see-OH-nah" },
          { spanish: "Hay mucho ruido.", english: "It's very noisy.", pronunciation: "eye MOO-choh roo-EE-doh" },
          { spanish: "El wifi no funciona.", english: "The wifi doesn't work.", pronunciation: "el WAI-fai noh foon-see-OH-nah" },
          { spanish: "Falta una almohada.", english: "A pillow is missing.", pronunciation: "FAHL-tah OO-nah ahl-moh-AH-dah" },
          { spanish: "Necesito toallas limpias.", english: "I need clean towels.", pronunciation: "neh-seh-SEE-toh toh-AH-yahs LEEM-pee-ahs" },
        ],
        formal: [
          { spanish: "Disculpe, el aire acondicionado no parece funcionar.", english: "Excuse me, the AC doesn't seem to be working.", pronunciation: "dees-KOOL-peh, el AH-ee-reh ah-kohn-dee-see-oh-NAH-doh noh pah-REH-seh foon-see-oh-NAR" },
          { spanish: "Me temo que no hay agua caliente en la habitacion.", english: "I'm afraid there's no hot water in the room.", pronunciation: "meh TEH-moh keh noh eye AH-gwah kah-lee-EHN-teh en lah ah-bee-tah-see-OHN" },
          { spanish: "La habitacion es muy agradable, muchas gracias.", english: "The room is very pleasant, thank you.", pronunciation: "lah ah-bee-tah-see-OHN ehs mooy ah-grah-DAH-bleh, MOO-chahs GRAH-see-ahs" },
          { spanish: "Seria posible cambiar de habitacion?", english: "Would it be possible to change rooms?", pronunciation: "seh-REE-ah poh-SEE-bleh kahm-bee-AR deh ah-bee-tah-see-OHN" },
        ],
      },
      ask: {
        street: [
          { spanish: "Donde esta el elevador?", english: "Where's the elevator?", pronunciation: "DOHN-deh ehs-TAH el eh-leh-vah-DOR" },
          { spanish: "Hay alberca?", english: "Is there a pool?", pronunciation: "eye ahl-BEHR-kah" },
          { spanish: "Hay gym?", english: "Is there a gym?", pronunciation: "eye gym" },
          { spanish: "Me llaman un taxi?", english: "Call me a taxi?", pronunciation: "meh YAH-mahn oon TAHK-see" },
          { spanish: "Tienen estacionamiento?", english: "Got parking?", pronunciation: "tee-EH-nen ehs-tah-see-oh-nah-mee-EHN-toh" },
        ],
        neutral: [
          { spanish: "Donde esta el elevador?", english: "Where is the elevator?", pronunciation: "DOHN-deh ehs-TAH el eh-leh-vah-DOR" },
          { spanish: "Donde esta la piscina?", english: "Where is the pool?", pronunciation: "DOHN-deh ehs-TAH lah pee-SEE-nah" },
          { spanish: "Hay gimnasio?", english: "Is there a gym?", pronunciation: "eye heem-NAH-see-oh" },
          { spanish: "Puede llamarme un taxi?", english: "Can you call me a taxi?", pronunciation: "PWEH-deh yah-MAR-meh oon TAHK-see" },
          { spanish: "Tienen servicio de lavanderia?", english: "Do you have laundry service?", pronunciation: "tee-EH-nen ser-VEE-see-oh deh lah-vahn-deh-REE-ah" },
          { spanish: "Tienen estacionamiento?", english: "Do you have parking?", pronunciation: "tee-EH-nen ehs-tah-see-oh-nah-mee-EHN-toh" },
          { spanish: "Tienen servicio a la habitacion?", english: "Do you have room service?", pronunciation: "tee-EH-nen ser-VEE-see-oh ah lah ah-bee-tah-see-OHN" },
          { spanish: "Donde puedo dejar las maletas?", english: "Where can I leave my bags?", pronunciation: "DOHN-deh PWEH-doh deh-HAR lahs mah-LEH-tahs" },
        ],
        formal: [
          { spanish: "Podria indicarme donde esta el elevador?", english: "Could you tell me where the elevator is?", pronunciation: "poh-DREE-ah een-dee-KAR-meh DOHN-deh ehs-TAH el eh-leh-vah-DOR" },
          { spanish: "Tendrian servicio de lavanderia?", english: "Would you have laundry service?", pronunciation: "tehn-DREE-ahn ser-VEE-see-oh deh lah-vahn-deh-REE-ah" },
          { spanish: "Seria posible solicitar un taxi?", english: "Would it be possible to request a taxi?", pronunciation: "seh-REE-ah poh-SEE-bleh soh-lee-see-TAR oon TAHK-see" },
          { spanish: "Podria despertarme a las ___?", english: "Could you wake me at ___?", pronunciation: "poh-DREE-ah dehs-per-TAR-meh ah lahs ___", isTemplate: true },
          { spanish: "Me podrian guardar esto en la caja fuerte?", english: "Could you keep this in the safe?", pronunciation: "meh poh-DREE-ahn gwar-DAR EHS-toh en lah KAH-hah FWEHR-teh" },
        ],
      },
      finish: {
        street: [
          { spanish: "Quiero hacer checkout.", english: "Checking out.", pronunciation: "kee-EH-roh ah-SEHR checkout" },
          { spanish: "Cuanto es el total?", english: "Total?", pronunciation: "KWAHN-toh ehs el toh-TAHL" },
          { spanish: "Aceptan tarjeta?", english: "Take cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "Puedo quedarme una hora mas?", english: "Can I stay an hour more?", pronunciation: "PWEH-doh keh-DAR-meh OO-nah OH-rah mahs" },
        ],
        neutral: [
          { spanish: "Quisiera hacer el check-out.", english: "I'd like to check out.", pronunciation: "kee-see-EH-rah ah-SEHR el check-owt" },
          { spanish: "Cuanto es el total?", english: "How much is the total?", pronunciation: "KWAHN-toh ehs el toh-TAHL" },
          { spanish: "Aceptan tarjeta?", english: "Do you accept cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "Puedo hacer late check-out?", english: "Can I do late check-out?", pronunciation: "PWEH-doh ah-SEHR late check-owt" },
          { spanish: "Puede llamarme un taxi al aeropuerto?", english: "Can you call me a taxi to the airport?", pronunciation: "PWEH-deh yah-MAR-meh oon TAHK-see ahl ah-eh-roh-PWEHR-toh" },
        ],
        formal: [
          { spanish: "Deseo realizar el check-out, por favor.", english: "I'd like to check out, please.", pronunciation: "deh-SEH-oh reh-ah-lee-SAR el check-owt, por fah-VOR" },
          { spanish: "Seria posible un late check-out?", english: "Would late check-out be possible?", pronunciation: "seh-REE-ah poh-SEE-bleh oon late check-owt" },
          { spanish: "Podria solicitarme un taxi al aeropuerto?", english: "Could you arrange a taxi to the airport?", pronunciation: "poh-DREE-ah soh-lee-see-TAR-meh oon TAHK-see ahl ah-eh-roh-PWEHR-toh" },
          { spanish: "Muchas gracias por la estancia.", english: "Thank you very much for the stay.", pronunciation: "MOO-chahs GRAH-see-ahs por lah ehs-TAHN-see-ah" },
        ],
      },
      social: {
        street: [
          { spanish: "Que buen hotel.", english: "Nice hotel.", pronunciation: "keh bwehn oh-TEL" },
          { spanish: "Que me recomiendas por aqui?", english: "What do you recommend nearby?", pronunciation: "keh meh reh-koh-mee-EHN-dahs por ah-KEE" },
          { spanish: "Andamos de vacaciones.", english: "We're on vacation.", pronunciation: "ahn-DAH-mohs deh vah-kah-see-OH-nehs" },
        ],
        neutral: [
          { spanish: "El hotel es muy bonito.", english: "The hotel is very nice.", pronunciation: "el oh-TEL ehs mooy boh-NEE-toh" },
          { spanish: "Que restaurante nos recomienda?", english: "What restaurant do you recommend?", pronunciation: "keh rehs-tow-RAHN-teh nohs reh-koh-mee-EHN-dah" },
          { spanish: "Estamos de vacaciones.", english: "We're on vacation.", pronunciation: "ehs-TAH-mohs deh vah-kah-see-OH-nehs" },
        ],
        formal: [
          { spanish: "Es un hotel encantador.", english: "It's a charming hotel.", pronunciation: "ehs oon oh-TEL ehn-kahn-tah-DOR" },
          { spanish: "Podria recomendarnos algun restaurante cercano?", english: "Could you recommend a nearby restaurant?", pronunciation: "poh-DREE-ah reh-koh-mehn-DAR-nohs ahl-GOON rehs-tow-RAHN-teh sehr-KAH-noh" },
          { spanish: "Ha sido una estancia maravillosa.", english: "It's been a wonderful stay.", pronunciation: "ah SEE-doh OO-nah ehs-TAHN-see-ah mah-rah-vee-YOH-sah" },
        ],
      },
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ EMERGENCY ━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: "emergency",
    name: "Emergency",
    emoji: "\uD83D\uDEA8",
    color: "red",
    intents: {
      order: {
        street: [
          { spanish: "Ayuda!", english: "Help!", pronunciation: "ah-YOO-dah" },
          { spanish: "Llama a la policia.", english: "Call the cops.", pronunciation: "YAH-mah ah lah poh-lee-SEE-ah" },
          { spanish: "Necesito un doctor.", english: "I need a doctor.", pronunciation: "neh-seh-SEE-toh oon DOHK-tor" },
          { spanish: "Una ambulancia!", english: "An ambulance!", pronunciation: "OO-nah ahm-boo-LAHN-see-ah" },
          { spanish: "Es una emergencia.", english: "It's an emergency.", pronunciation: "ehs OO-nah eh-mer-HEHN-see-ah" },
          { spanish: "Me robaron.", english: "I was robbed.", pronunciation: "meh roh-BAH-rohn" },
          { spanish: "Perdi mi pasaporte.", english: "I lost my passport.", pronunciation: "per-DEE mee pah-sah-POR-teh" },
        ],
        neutral: [
          { spanish: "Ayuda!", english: "Help!", pronunciation: "ah-YOO-dah" },
          { spanish: "Llame a la policia.", english: "Call the police.", pronunciation: "YAH-meh ah lah poh-lee-SEE-ah" },
          { spanish: "Necesito un medico.", english: "I need a doctor.", pronunciation: "neh-seh-SEE-toh oon MEH-dee-koh" },
          { spanish: "Llame a una ambulancia.", english: "Call an ambulance.", pronunciation: "YAH-meh ah OO-nah ahm-boo-LAHN-see-ah" },
          { spanish: "Es una emergencia.", english: "It's an emergency.", pronunciation: "ehs OO-nah eh-mer-HEHN-see-ah" },
          { spanish: "Me robaron.", english: "I was robbed.", pronunciation: "meh roh-BAH-rohn" },
          { spanish: "Perdi mi pasaporte.", english: "I lost my passport.", pronunciation: "per-DEE mee pah-sah-POR-teh" },
          { spanish: "Donde esta el hospital mas cercano?", english: "Where's the nearest hospital?", pronunciation: "DOHN-deh ehs-TAH el ohs-pee-TAHL mahs ser-KAH-noh" },
        ],
        formal: [
          { spanish: "Ayuda, por favor!", english: "Help, please!", pronunciation: "ah-YOO-dah, por fah-VOR" },
          { spanish: "Podria llamar a la policia, por favor?", english: "Could you call the police, please?", pronunciation: "poh-DREE-ah yah-MAR ah lah poh-lee-SEE-ah, por fah-VOR" },
          { spanish: "Necesito asistencia medica urgente.", english: "I need urgent medical assistance.", pronunciation: "neh-seh-SEE-toh ah-sees-TEHN-see-ah MEH-dee-kah oor-HEHN-teh" },
          { spanish: "Necesito contactar a mi embajada.", english: "I need to contact my embassy.", pronunciation: "neh-seh-SEE-toh kohn-tahk-TAR ah mee ehm-bah-HAH-dah" },
        ],
      },
      react: {
        street: [
          { spanish: "Me siento mal.", english: "I feel bad.", pronunciation: "meh see-EHN-toh mahl" },
          { spanish: "Me duele ___.", english: "My ___ hurts.", pronunciation: "meh DWEH-leh ___", isTemplate: true },
          { spanish: "No puedo respirar bien.", english: "Can't breathe well.", pronunciation: "noh PWEH-doh rehs-pee-RAR bee-EHN" },
          { spanish: "Me siento mareado.", english: "I feel dizzy.", pronunciation: "meh see-EHN-toh mah-reh-AH-doh" },
          { spanish: "Estoy sangrando.", english: "I'm bleeding.", pronunciation: "ehs-TOY sahn-GRAHN-doh" },
        ],
        neutral: [
          { spanish: "Me siento mal.", english: "I feel sick.", pronunciation: "meh see-EHN-toh mahl" },
          { spanish: "Me duele ___.", english: "My ___ hurts.", pronunciation: "meh DWEH-leh ___", isTemplate: true },
          { spanish: "Soy alergico/a a ___.", english: "I'm allergic to ___.", pronunciation: "soy ah-LEHR-hee-koh/kah ah ___", isTemplate: true },
          { spanish: "Tengo dolor de cabeza.", english: "I have a headache.", pronunciation: "TEHN-goh doh-LOR deh kah-BEH-sah" },
          { spanish: "Tengo fiebre.", english: "I have a fever.", pronunciation: "TEHN-goh fee-EH-breh" },
          { spanish: "Necesito mi medicina.", english: "I need my medicine.", pronunciation: "neh-seh-SEE-toh mee meh-dee-SEE-nah" },
        ],
        formal: [
          { spanish: "Me siento indispuesto/a.", english: "I feel unwell.", pronunciation: "meh see-EHN-toh een-dees-PWEHS-toh/tah" },
          { spanish: "Padezco de ___.", english: "I suffer from ___.", pronunciation: "pah-DEHS-koh deh ___", isTemplate: true },
          { spanish: "Tengo una condicion medica.", english: "I have a medical condition.", pronunciation: "TEHN-goh OO-nah kohn-dee-see-OHN MEH-dee-kah" },
          { spanish: "Necesito mi medicamento con urgencia.", english: "I urgently need my medication.", pronunciation: "neh-seh-SEE-toh mee meh-dee-kah-MEHN-toh kohn oor-HEHN-see-ah" },
        ],
      },
      ask: {
        street: [
          { spanish: "Donde hay una farmacia?", english: "Where's a pharmacy?", pronunciation: "DOHN-deh eye OO-nah far-MAH-see-ah" },
          { spanish: "Habla ingles?", english: "Speak English?", pronunciation: "AH-blah een-GLEHS" },
          { spanish: "Puede ayudarme?", english: "Can you help?", pronunciation: "PWEH-deh ah-yoo-DAR-meh" },
          { spanish: "Donde estoy?", english: "Where am I?", pronunciation: "DOHN-deh ehs-TOY" },
          { spanish: "Donde esta la embajada de ___?", english: "Where's the ___ embassy?", pronunciation: "DOHN-deh ehs-TAH lah ehm-bah-HAH-dah deh ___", isTemplate: true },
        ],
        neutral: [
          { spanish: "Donde hay una farmacia?", english: "Where is a pharmacy?", pronunciation: "DOHN-deh eye OO-nah far-MAH-see-ah" },
          { spanish: "Habla ingles?", english: "Do you speak English?", pronunciation: "AH-blah een-GLEHS" },
          { spanish: "Puede ayudarme?", english: "Can you help me?", pronunciation: "PWEH-deh ah-yoo-DAR-meh" },
          { spanish: "No hablo mucho espanol.", english: "I don't speak much Spanish.", pronunciation: "noh AH-bloh MOO-choh ehs-pah-NYOL" },
          { spanish: "Necesito ir al hospital.", english: "I need to go to the hospital.", pronunciation: "neh-seh-SEE-toh eer ahl ohs-pee-TAHL" },
          { spanish: "Necesito hacer una llamada.", english: "I need to make a phone call.", pronunciation: "neh-seh-SEE-toh ah-SEHR OO-nah yah-MAH-dah" },
        ],
        formal: [
          { spanish: "Podria indicarme donde hay una farmacia?", english: "Could you tell me where a pharmacy is?", pronunciation: "poh-DREE-ah een-dee-KAR-meh DOHN-deh eye OO-nah far-MAH-see-ah" },
          { spanish: "Habla usted ingles?", english: "Do you speak English?", pronunciation: "AH-blah oos-TEHD een-GLEHS" },
          { spanish: "Seria tan amable de ayudarme?", english: "Would you be so kind as to help me?", pronunciation: "seh-REE-ah tahn ah-MAH-bleh deh ah-yoo-DAR-meh" },
          { spanish: "Podria indicarme como llegar al hospital?", english: "Could you tell me how to get to the hospital?", pronunciation: "poh-DREE-ah een-dee-KAR-meh KOH-moh yeh-GAR ahl ohs-pee-TAHL" },
          { spanish: "Necesito comunicarme con mi embajada.", english: "I need to communicate with my embassy.", pronunciation: "neh-seh-SEE-toh koh-moo-nee-KAR-meh kohn mee ehm-bah-HAH-dah" },
        ],
      },
      finish: {
        street: [
          { spanish: "Gracias por la ayuda.", english: "Thanks for the help.", pronunciation: "GRAH-see-ahs por lah ah-YOO-dah" },
          { spanish: "Ya estoy bien.", english: "I'm fine now.", pronunciation: "yah ehs-TOY bee-EHN" },
          { spanish: "Ya llego alguien.", english: "Someone's here now.", pronunciation: "yah yeh-GOH AHL-gee-ehn" },
        ],
        neutral: [
          { spanish: "Muchas gracias por su ayuda.", english: "Thank you very much for your help.", pronunciation: "MOO-chahs GRAH-see-ahs por soo ah-YOO-dah" },
          { spanish: "Ya me siento mejor.", english: "I'm feeling better now.", pronunciation: "yah meh see-EHN-toh meh-HOR" },
          { spanish: "Ya no necesito ayuda.", english: "I don't need help anymore.", pronunciation: "yah noh neh-seh-SEE-toh ah-YOO-dah" },
        ],
        formal: [
          { spanish: "Le agradezco enormemente su ayuda.", english: "I'm deeply grateful for your help.", pronunciation: "leh ah-grah-DEHS-koh eh-NOR-meh-MEHN-teh soo ah-YOO-dah" },
          { spanish: "Muchisimas gracias por su amabilidad.", english: "Thank you so much for your kindness.", pronunciation: "moo-CHEE-see-mahs GRAH-see-ahs por soo ah-mah-bee-lee-DAHD" },
        ],
      },
      social: {
        street: [
          { spanish: "No me siento seguro.", english: "I don't feel safe.", pronunciation: "noh meh see-EHN-toh seh-GOO-roh" },
          { spanish: "Dejame en paz.", english: "Leave me alone.", pronunciation: "DEH-hah-meh en pahs" },
          { spanish: "Estoy perdido.", english: "I'm lost.", pronunciation: "ehs-TOY per-DEE-doh" },
        ],
        neutral: [
          { spanish: "No me siento seguro/a.", english: "I don't feel safe.", pronunciation: "noh meh see-EHN-toh seh-GOO-roh/rah" },
          { spanish: "Dejeme en paz.", english: "Leave me alone.", pronunciation: "DEH-heh-meh en pahs" },
          { spanish: "Estoy perdido/a.", english: "I'm lost.", pronunciation: "ehs-TOY per-DEE-doh/dah" },
          { spanish: "Quiero hablar con un abogado.", english: "I want to speak with a lawyer.", pronunciation: "kee-EH-roh ah-BLAR kohn oon ah-boh-GAH-doh" },
        ],
        formal: [
          { spanish: "No me siento seguro/a en esta zona.", english: "I don't feel safe in this area.", pronunciation: "noh meh see-EHN-toh seh-GOO-roh/rah en EHS-tah SOH-nah" },
          { spanish: "Le solicito amablemente que me deje en paz.", english: "I kindly ask you to leave me alone.", pronunciation: "leh soh-lee-SEE-toh ah-MAH-bleh-MEHN-teh keh meh DEH-heh en pahs" },
          { spanish: "Deseo comunicarme con un abogado.", english: "I wish to communicate with a lawyer.", pronunciation: "deh-SEH-oh koh-moo-nee-KAR-meh kohn oon ah-boh-GAH-doh" },
        ],
      },
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ GREETINGS ━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: "greetings",
    name: "Greetings",
    emoji: "\uD83D\uDC4B",
    color: "teal",
    intents: {
      order: {
        street: [
          { spanish: "Que onda.", english: "What's up.", pronunciation: "keh OHN-dah" },
          { spanish: "Que hubo.", english: "Hey / What's going on.", pronunciation: "keh OO-boh" },
          { spanish: "Hola, que tal.", english: "Hey, how's it going.", pronunciation: "OH-lah, keh tahl" },
          { spanish: "Nos vemos.", english: "See ya.", pronunciation: "nohs VEH-mohs" },
          { spanish: "Bye.", english: "Bye.", pronunciation: "bye" },
          { spanish: "Al rato.", english: "Later.", pronunciation: "ahl RAH-toh" },
          { spanish: "Me llamo ___.", english: "I'm ___.", pronunciation: "meh YAH-moh ___", isTemplate: true },
          { spanish: "Mucho gusto.", english: "Nice to meet you.", pronunciation: "MOO-choh GOOS-toh" },
        ],
        neutral: [
          { spanish: "Hola!", english: "Hello!", pronunciation: "OH-lah" },
          { spanish: "Buenos dias!", english: "Good morning!", pronunciation: "BWEH-nohs DEE-ahs" },
          { spanish: "Buenas tardes!", english: "Good afternoon!", pronunciation: "BWEH-nahs TAR-dehs" },
          { spanish: "Buenas noches!", english: "Good evening/night!", pronunciation: "BWEH-nahs NOH-chehs" },
          { spanish: "Como estas?", english: "How are you?", pronunciation: "KOH-moh ehs-TAHS" },
          { spanish: "Muy bien, gracias.", english: "Very well, thanks.", pronunciation: "mooy bee-EHN, GRAH-see-ahs" },
          { spanish: "Mucho gusto.", english: "Nice to meet you.", pronunciation: "MOO-choh GOOS-toh" },
          { spanish: "Me llamo ___.", english: "My name is ___.", pronunciation: "meh YAH-moh ___", isTemplate: true },
          { spanish: "Adios!", english: "Goodbye!", pronunciation: "ah-dee-OHS" },
          { spanish: "Hasta luego!", english: "See you later!", pronunciation: "AHS-tah LWEH-goh" },
        ],
        formal: [
          { spanish: "Muy buenas, como esta usted?", english: "Hello, how are you?", pronunciation: "mooy BWEH-nahs, KOH-moh ehs-TAH oos-TEHD" },
          { spanish: "Es un placer conocerle.", english: "It's a pleasure to meet you.", pronunciation: "ehs oon plah-SEHR koh-noh-SEHR-leh" },
          { spanish: "Mi nombre es ___.", english: "My name is ___.", pronunciation: "mee NOHM-breh ehs ___", isTemplate: true },
          { spanish: "Con su permiso, me retiro.", english: "With your permission, I'll take my leave.", pronunciation: "kohn soo per-MEE-soh, meh reh-TEE-roh" },
          { spanish: "Ha sido un gusto saludarle.", english: "It's been a pleasure greeting you.", pronunciation: "ah SEE-doh oon GOOS-toh sah-loo-DAR-leh" },
          { spanish: "Que tenga un excelente dia.", english: "Have an excellent day.", pronunciation: "keh TEHN-gah oon ehk-seh-LEHN-teh DEE-ah" },
        ],
      },
      react: {
        street: [
          { spanish: "Que buena onda.", english: "That's awesome.", pronunciation: "keh BWEH-nah OHN-dah" },
          { spanish: "Sale!", english: "Deal! / Cool!", pronunciation: "SAH-leh" },
          { spanish: "Neta?", english: "For real?", pronunciation: "NEH-tah" },
          { spanish: "Que padre.", english: "How cool.", pronunciation: "keh PAH-dreh" },
          { spanish: "A poco.", english: "Really? / No way.", pronunciation: "ah POH-koh" },
        ],
        neutral: [
          { spanish: "Que bien!", english: "How nice!", pronunciation: "keh bee-EHN" },
          { spanish: "En serio?", english: "Really?", pronunciation: "en SEH-ree-oh" },
          { spanish: "Que interesante.", english: "How interesting.", pronunciation: "keh een-teh-reh-SAHN-teh" },
          { spanish: "Que bueno.", english: "That's good.", pronunciation: "keh BWEH-noh" },
        ],
        formal: [
          { spanish: "Que maravilloso!", english: "How wonderful!", pronunciation: "keh mah-rah-vee-YOH-soh" },
          { spanish: "Me alegro mucho.", english: "I'm very glad.", pronunciation: "meh ah-LEH-groh MOO-choh" },
          { spanish: "Es fascinante.", english: "It's fascinating.", pronunciation: "ehs fah-see-NAHN-teh" },
        ],
      },
      ask: {
        street: [
          { spanish: "De donde eres?", english: "Where are you from?", pronunciation: "deh DOHN-deh EH-rehs" },
          { spanish: "Que haces por aqui?", english: "What are you doing here?", pronunciation: "keh AH-sehs por ah-KEE" },
          { spanish: "Hablas ingles?", english: "Speak English?", pronunciation: "AH-blahs een-GLEHS" },
          { spanish: "Como te llamas?", english: "What's your name?", pronunciation: "KOH-moh teh YAH-mahs" },
        ],
        neutral: [
          { spanish: "De donde eres?", english: "Where are you from?", pronunciation: "deh DOHN-deh EH-rehs" },
          { spanish: "Que haces aqui?", english: "What are you doing here?", pronunciation: "keh AH-sehs ah-KEE" },
          { spanish: "Hablas ingles?", english: "Do you speak English?", pronunciation: "AH-blahs een-GLEHS" },
          { spanish: "Que me recomiendas visitar?", english: "What do you recommend visiting?", pronunciation: "keh meh reh-koh-mee-EHN-dahs vee-see-TAR" },
          { spanish: "Hace buen tiempo hoy?", english: "Nice weather today?", pronunciation: "AH-seh bwehn tee-EHM-poh oy" },
        ],
        formal: [
          { spanish: "De donde es usted?", english: "Where are you from? (formal)", pronunciation: "deh DOHN-deh ehs oos-TEHD" },
          { spanish: "Habla usted ingles?", english: "Do you speak English? (formal)", pronunciation: "AH-blah oos-TEHD een-GLEHS" },
          { spanish: "Que lugares me recomendaria visitar?", english: "What places would you recommend visiting?", pronunciation: "keh loo-GAH-rehs meh reh-koh-mehn-dah-REE-ah vee-see-TAR" },
          { spanish: "A que se dedica usted?", english: "What do you do? (formal)", pronunciation: "ah keh seh deh-DEE-kah oos-TEHD" },
        ],
      },
      finish: {
        street: [
          { spanish: "Nos vemos.", english: "See ya.", pronunciation: "nohs VEH-mohs" },
          { spanish: "Cuídate.", english: "Take care.", pronunciation: "kwee-DAH-teh" },
          { spanish: "Sale, bye.", english: "Alright, bye.", pronunciation: "SAH-leh, bye" },
          { spanish: "Ahi nos vemos.", english: "Catch you later.", pronunciation: "ah-EE nohs VEH-mohs" },
        ],
        neutral: [
          { spanish: "Hasta luego.", english: "See you later.", pronunciation: "AHS-tah LWEH-goh" },
          { spanish: "Que te vaya bien.", english: "Hope it goes well.", pronunciation: "keh teh VAH-yah bee-EHN" },
          { spanish: "Cuidate mucho.", english: "Take good care.", pronunciation: "kwee-DAH-teh MOO-choh" },
          { spanish: "Fue un gusto.", english: "It was a pleasure.", pronunciation: "fweh oon GOOS-toh" },
        ],
        formal: [
          { spanish: "Ha sido un placer.", english: "It's been a pleasure.", pronunciation: "ah SEE-doh oon plah-SEHR" },
          { spanish: "Que tenga un buen dia.", english: "Have a good day.", pronunciation: "keh TEHN-gah oon bwehn DEE-ah" },
          { spanish: "Fue un gusto conocerle.", english: "It was a pleasure meeting you.", pronunciation: "fweh oon GOOS-toh koh-noh-SEHR-leh" },
          { spanish: "Le deseo lo mejor.", english: "I wish you the best.", pronunciation: "leh deh-SEH-oh loh meh-HOR" },
        ],
      },
      social: {
        street: [
          { spanish: "Soy de ___.", english: "I'm from ___.", pronunciation: "soy deh ___", isTemplate: true },
          { spanish: "Ando de vacaciones.", english: "I'm on vacation.", pronunciation: "AHN-doh deh vah-kah-see-OH-nehs" },
          { spanish: "Me encanta este lugar.", english: "I love this place.", pronunciation: "meh ehn-KAHN-tah EHS-teh loo-GAR" },
          { spanish: "Estoy aprendiendo espanol.", english: "I'm learning Spanish.", pronunciation: "ehs-TOY ah-prehn-dee-EHN-doh ehs-pah-NYOL" },
        ],
        neutral: [
          { spanish: "Soy de ___.", english: "I'm from ___.", pronunciation: "soy deh ___", isTemplate: true },
          { spanish: "Estoy de vacaciones.", english: "I'm on vacation.", pronunciation: "ehs-TOY deh vah-kah-see-OH-nehs" },
          { spanish: "Me encanta este lugar.", english: "I love this place.", pronunciation: "meh ehn-KAHN-tah EHS-teh loo-GAR" },
          { spanish: "Estoy aprendiendo espanol.", english: "I'm learning Spanish.", pronunciation: "ehs-TOY ah-prehn-dee-EHN-doh ehs-pah-NYOL" },
        ],
        formal: [
          { spanish: "Soy originario/a de ___.", english: "I'm originally from ___.", pronunciation: "soy oh-ree-hee-NAH-ree-oh/ah deh ___", isTemplate: true },
          { spanish: "Estamos de visita en el pais.", english: "We're visiting the country.", pronunciation: "ehs-TAH-mohs deh vee-SEE-tah en el pah-EES" },
          { spanish: "Es un pais hermoso.", english: "It's a beautiful country.", pronunciation: "ehs oon pah-EES ehr-MOH-soh" },
        ],
      },
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TRANSPORT ━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    key: "transport",
    name: "Transport",
    emoji: "\uD83D\uDE8C",
    color: "violet",
    intents: {
      order: {
        street: [
          { spanish: "Un boleto a ___.", english: "Ticket to ___.", pronunciation: "oon boh-LEH-toh ah ___", isTemplate: true },
          { spanish: "Ida y vuelta.", english: "Round trip.", pronunciation: "EE-dah ee VWEHL-tah" },
          { spanish: "Solo ida.", english: "One way.", pronunciation: "SOH-loh EE-dah" },
          { spanish: "Dos boletos.", english: "Two tickets.", pronunciation: "dohs boh-LEH-tohs" },
          { spanish: "Me bajo aqui.", english: "I'm getting off here.", pronunciation: "meh BAH-hoh ah-KEE" },
          { spanish: "Permiso, voy a bajar.", english: "Excuse me, getting off.", pronunciation: "per-MEE-soh, voy ah bah-HAR" },
        ],
        neutral: [
          { spanish: "Un boleto a ___, por favor.", english: "A ticket to ___, please.", pronunciation: "oon boh-LEH-toh ah ___, por fah-VOR", isTemplate: true },
          { spanish: "Un boleto de ida y vuelta.", english: "A round-trip ticket.", pronunciation: "oon boh-LEH-toh deh EE-dah ee VWEHL-tah" },
          { spanish: "Un boleto de ida.", english: "A one-way ticket.", pronunciation: "oon boh-LEH-toh deh EE-dah" },
          { spanish: "Dos boletos, por favor.", english: "Two tickets, please.", pronunciation: "dohs boh-LEH-tohs, por fah-VOR" },
          { spanish: "Donde bajo para ___?", english: "Where do I get off for ___?", pronunciation: "DOHN-deh BAH-hoh PAH-rah ___", isTemplate: true },
          { spanish: "Tienen pase de dia?", english: "Do you have a day pass?", pronunciation: "tee-EH-nen PAH-seh deh DEE-ah" },
        ],
        formal: [
          { spanish: "Me gustaria un boleto a ___, por favor.", english: "I'd like a ticket to ___, please.", pronunciation: "meh goos-tah-REE-ah oon boh-LEH-toh ah ___, por fah-VOR", isTemplate: true },
          { spanish: "Podria venderme un boleto de ida y vuelta?", english: "Could you sell me a round-trip ticket?", pronunciation: "poh-DREE-ah vehn-DEHR-meh oon boh-LEH-toh deh EE-dah ee VWEHL-tah" },
          { spanish: "Podria indicarme donde debo descender para ___?", english: "Could you tell me where I should get off for ___?", pronunciation: "poh-DREE-ah een-dee-KAR-meh DOHN-deh DEH-boh deh-sehn-DEHR PAH-rah ___", isTemplate: true },
        ],
      },
      react: {
        street: [
          { spanish: "Ya se paso.", english: "We already passed it.", pronunciation: "yah seh pah-SOH" },
          { spanish: "Esta lleno.", english: "It's full.", pronunciation: "ehs-TAH YEH-noh" },
          { spanish: "Viene retrasado.", english: "It's running late.", pronunciation: "vee-EH-neh reh-trah-SAH-doh" },
          { spanish: "Que largo el viaje.", english: "Long trip.", pronunciation: "keh LAR-goh el vee-AH-heh" },
        ],
        neutral: [
          { spanish: "Creo que ya se paso.", english: "I think we passed it.", pronunciation: "KREH-oh keh yah seh pah-SOH" },
          { spanish: "Esta bastante lleno.", english: "It's quite full.", pronunciation: "ehs-TAH bahs-TAHN-teh YEH-noh" },
          { spanish: "Viene retrasado.", english: "It's running late.", pronunciation: "vee-EH-neh reh-trah-SAH-doh" },
        ],
        formal: [
          { spanish: "Me parece que ya hemos pasado la parada.", english: "I think we've passed the stop.", pronunciation: "meh pah-REH-seh keh yah EH-mohs pah-SAH-doh lah pah-RAH-dah" },
          { spanish: "Hay bastante afluencia hoy.", english: "There's quite a crowd today.", pronunciation: "eye bahs-TAHN-teh ah-floo-EHN-see-ah oy" },
        ],
      },
      ask: {
        street: [
          { spanish: "Donde esta la parada?", english: "Where's the stop?", pronunciation: "DOHN-deh ehs-TAH lah pah-RAH-dah" },
          { spanish: "Donde esta el metro?", english: "Where's the metro?", pronunciation: "DOHN-deh ehs-TAH el MEH-troh" },
          { spanish: "Que autobus va a ___?", english: "Which bus to ___?", pronunciation: "keh ow-toh-BOOS vah ah ___", isTemplate: true },
          { spanish: "A que hora sale?", english: "What time does it leave?", pronunciation: "ah keh OH-rah SAH-leh" },
          { spanish: "Cuanto cuesta?", english: "How much?", pronunciation: "KWAHN-toh KWEHS-tah" },
          { spanish: "Es esta la linea correcta?", english: "Right line?", pronunciation: "ehs EHS-tah lah LEE-neh-ah koh-REHK-tah" },
          { spanish: "Como llego a ___?", english: "How do I get to ___?", pronunciation: "KOH-moh YEH-goh ah ___", isTemplate: true },
          { spanish: "Esta lejos?", english: "Is it far?", pronunciation: "ehs-TAH LEH-hohs" },
        ],
        neutral: [
          { spanish: "Donde esta la parada de autobus?", english: "Where is the bus stop?", pronunciation: "DOHN-deh ehs-TAH lah pah-RAH-dah deh ow-toh-BOOS" },
          { spanish: "Donde esta la estacion de metro?", english: "Where is the metro station?", pronunciation: "DOHN-deh ehs-TAH lah ehs-tah-see-OHN deh MEH-troh" },
          { spanish: "Que autobus va a ___?", english: "Which bus goes to ___?", pronunciation: "keh ow-toh-BOOS vah ah ___", isTemplate: true },
          { spanish: "A que hora sale el proximo?", english: "What time does the next one leave?", pronunciation: "ah keh OH-rah SAH-leh el PROHK-see-moh" },
          { spanish: "Cuanto cuesta el boleto?", english: "How much is the ticket?", pronunciation: "KWAHN-toh KWEHS-tah el boh-LEH-toh" },
          { spanish: "Esta es la linea correcta?", english: "Is this the right line?", pronunciation: "EHS-tah ehs lah LEE-neh-ah koh-REHK-tah" },
          { spanish: "Como llego a ___?", english: "How do I get to ___?", pronunciation: "KOH-moh YEH-goh ah ___", isTemplate: true },
          { spanish: "Se puede ir caminando?", english: "Can you walk there?", pronunciation: "seh PWEH-deh eer kah-mee-NAHN-doh" },
        ],
        formal: [
          { spanish: "Podria indicarme donde esta la parada mas cercana?", english: "Could you tell me where the nearest stop is?", pronunciation: "poh-DREE-ah een-dee-KAR-meh DOHN-deh ehs-TAH lah pah-RAH-dah mahs sehr-KAH-nah" },
          { spanish: "Que linea me lleva a ___?", english: "Which line takes me to ___?", pronunciation: "keh LEE-neh-ah meh YEH-vah ah ___", isTemplate: true },
          { spanish: "Podria indicarme el horario del proximo servicio?", english: "Could you tell me the schedule of the next service?", pronunciation: "poh-DREE-ah een-dee-KAR-meh el oh-RAH-ree-oh del PROHK-see-moh ser-VEE-see-oh" },
          { spanish: "Seria posible llegar caminando?", english: "Would it be possible to walk?", pronunciation: "seh-REE-ah poh-SEE-bleh yeh-GAR kah-mee-NAHN-doh" },
        ],
      },
      finish: {
        street: [
          { spanish: "Cuanto es?", english: "How much?", pronunciation: "KWAHN-toh ehs" },
          { spanish: "Aceptan tarjeta?", english: "Take cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "Donde compro el boleto?", english: "Where do I buy tickets?", pronunciation: "DOHN-deh KOHM-proh el boh-LEH-toh" },
          { spanish: "Puedo cancelar?", english: "Can I cancel?", pronunciation: "PWEH-doh kahn-seh-LAR" },
        ],
        neutral: [
          { spanish: "Cuanto cuesta el boleto?", english: "How much is the ticket?", pronunciation: "KWAHN-toh KWEHS-tah el boh-LEH-toh" },
          { spanish: "Aceptan tarjeta?", english: "Do you accept cards?", pronunciation: "ah-SEHP-tahn tar-HEH-tah" },
          { spanish: "Donde compro el boleto?", english: "Where do I buy the ticket?", pronunciation: "DOHN-deh KOHM-proh el boh-LEH-toh" },
          { spanish: "Hay descuento para estudiantes?", english: "Is there a student discount?", pronunciation: "eye dehs-KWEHN-toh PAH-rah ehs-too-dee-AHN-tehs" },
          { spanish: "Puedo cancelar el boleto?", english: "Can I cancel the ticket?", pronunciation: "PWEH-doh kahn-seh-LAR el boh-LEH-toh" },
        ],
        formal: [
          { spanish: "Podria indicarme donde puedo adquirir los boletos?", english: "Could you tell me where I can purchase tickets?", pronunciation: "poh-DREE-ah een-dee-KAR-meh DOHN-deh PWEH-doh ahd-kee-REER lohs boh-LEH-tohs" },
          { spanish: "Tendrian descuento para estudiantes?", english: "Would there be a student discount?", pronunciation: "tehn-DREE-ahn dehs-KWEHN-toh PAH-rah ehs-too-dee-AHN-tehs" },
          { spanish: "Seria posible cancelar la compra?", english: "Would it be possible to cancel the purchase?", pronunciation: "seh-REE-ah poh-SEE-bleh kahn-seh-LAR lah KOHM-prah" },
        ],
      },
      social: {
        street: [
          { spanish: "Esta bien lleno hoy.", english: "Super crowded today.", pronunciation: "ehs-TAH bee-EHN YEH-noh oy" },
          { spanish: "Siempre esta asi?", english: "Always like this?", pronunciation: "see-EHM-preh ehs-TAH ah-SEE" },
          { spanish: "Que ciudad tan grande.", english: "What a big city.", pronunciation: "keh see-oo-DAHD tahn GRAHN-deh" },
        ],
        neutral: [
          { spanish: "Hay mucha gente hoy.", english: "Lots of people today.", pronunciation: "eye MOO-chah HEHN-teh oy" },
          { spanish: "El metro es muy rapido.", english: "The metro is very fast.", pronunciation: "el MEH-troh ehs mooy RAH-pee-doh" },
          { spanish: "Es facil moverse en esta ciudad.", english: "It's easy to get around this city.", pronunciation: "ehs FAH-seel moh-VEHR-seh en EHS-tah see-oo-DAHD" },
        ],
        formal: [
          { spanish: "El sistema de transporte es muy eficiente.", english: "The transport system is very efficient.", pronunciation: "el sees-TEH-mah deh trahns-POR-teh ehs mooy eh-fee-see-EHN-teh" },
          { spanish: "La ciudad cuenta con buena infraestructura.", english: "The city has good infrastructure.", pronunciation: "lah see-oo-DAHD KWEHN-tah kohn BWEH-nah een-frah-ehs-trook-TOO-rah" },
        ],
      },
    },
  },
]
