export type ContextKey =
  | 'bar'
  | 'restaurant'
  | 'cafe'
  | 'taxiUber'
  | 'shopping'
  | 'pharmacy'
  | 'smallTalk'

export type Phrase = {
  spanish: string
  hint?: string
}

export type PhraseContext = {
  key: ContextKey
  name: string
  emoji: string
  phrases: Phrase[]
}

export const phraseContexts: PhraseContext[] = [
  {
    key: 'bar',
    name: 'Bar',
    emoji: '🍻',
    phrases: [
      { spanish: 'Otra más, por favor.', hint: 'one more' },
      { spanish: '¿Qué me recomiendas?', hint: 'what is good here' },
      { spanish: '¿Me regalas una chela?', hint: 'a beer, please' },
      { spanish: 'Sin hielo, por favor.', hint: 'no ice' },
      { spanish: 'Buenísimo, gracias.', hint: 'awesome, thanks' },
      { spanish: 'La cuenta, por favor.', hint: 'the check please' },
      { spanish: '¿Puedo pagar con tarjeta?', hint: 'pay with card' },
      { spanish: 'Disculpa', hint: 'excuse me' },
      { spanish: 'Con permiso', hint: 'passing through' }
    ]
  },
  {
    key: 'restaurant',
    name: 'Restaurant',
    emoji: '🍽️',
    phrases: [
      { spanish: '¿Me recomiendas algo?', hint: 'your recommendation' },
      { spanish: '¿Qué lleva este platillo?', hint: 'what is in this dish' },
      { spanish: 'Sin picante, por favor.', hint: 'not spicy' },
      { spanish: '¿Me traes agua natural?', hint: 'still water' },
      { spanish: 'Está delicioso.', hint: 'it is delicious' },
      { spanish: 'La cuenta, por favor.', hint: 'the check' },
      { spanish: '¿Puedo pagar con tarjeta?', hint: 'pay with card' },
      { spanish: 'Buenísimo, gracias.', hint: 'great, thanks' },
      { spanish: 'Disculpa', hint: 'excuse me' }
    ]
  },
  {
    key: 'cafe',
    name: 'Café',
    emoji: '☕',
    phrases: [
      { spanish: 'Un latte chico, por favor.', hint: 'small latte' },
      { spanish: '¿Tienes leche de avena?', hint: 'oat milk' },
      { spanish: 'Para aquí, por favor.', hint: 'for here' },
      { spanish: 'Para llevar, por favor.', hint: 'to go' },
      { spanish: '¿Me recomiendas algo?', hint: 'what should I order' },
      { spanish: 'Sin azúcar, por favor.', hint: 'no sugar' },
      { spanish: '¿Puedo pagar con tarjeta?', hint: 'pay with card' },
      { spanish: 'Buenísimo, gracias.', hint: 'great, thanks' },
      { spanish: 'Con permiso', hint: 'excuse me passing' }
    ]
  },
  {
    key: 'taxiUber',
    name: 'Taxi / Uber',
    emoji: '🚕',
    phrases: [
      { spanish: 'Aquí está bien.', hint: 'stop here' },
      { spanish: 'A la derecha.', hint: 'to the right' },
      { spanish: 'A la izquierda.', hint: 'to the left' },
      { spanish: '¿Cuánto es?', hint: 'how much is it' },
      { spanish: '¿Me puede dejar aquí?', hint: 'drop me off here' },
      { spanish: '¿Cuánto tiempo falta?', hint: 'how much longer' },
      { spanish: 'Voy al centro, por favor.', hint: 'to downtown' },
      { spanish: 'Gracias, buen día.', hint: 'thanks, have a good day' },
      { spanish: 'Con permiso', hint: 'excuse me' }
    ]
  },
  {
    key: 'shopping',
    name: 'Shopping',
    emoji: '🛍️',
    phrases: [
      { spanish: '¿Cuánto cuesta?', hint: 'price' },
      { spanish: '¿Tienes otra talla?', hint: 'another size' },
      { spanish: 'Solo estoy viendo, gracias.', hint: 'just looking' },
      { spanish: '¿Lo tienes en negro?', hint: 'in black' },
      { spanish: '¿Puedo probármelo?', hint: 'can I try it on' },
      { spanish: '¿Aceptan tarjeta?', hint: 'do you take card' },
      { spanish: '¿Me haces descuento?', hint: 'discount?' },
      { spanish: 'Me lo llevo.', hint: 'I will take it' },
      { spanish: 'Buenísimo, gracias.', hint: 'awesome, thanks' }
    ]
  },
  {
    key: 'pharmacy',
    name: 'Pharmacy',
    emoji: '💊',
    phrases: [
      {
        spanish: '¿Tienes algo para la diarrea o la congestión?',
        hint: 'for diarrhea/congestion'
      },
      { spanish: 'Sin receta, por favor.', hint: 'without prescription' },
      { spanish: '¿Cada cuántas horas?', hint: 'how often' },
      { spanish: '¿Cuánto cuesta?', hint: 'price' },
      { spanish: '¿Esto da sueño?', hint: 'makes you sleepy?' },
      { spanish: '¿Tienes algo para el dolor de cabeza?', hint: 'headache' },
      { spanish: 'Solo necesito algo leve.', hint: 'something mild' },
      { spanish: '¿Me explicas cómo tomarlo?', hint: 'how to take it' },
      { spanish: 'Gracias, buen día.', hint: 'thanks, good day' }
    ]
  },
  {
    key: 'smallTalk',
    name: 'Small Talk',
    emoji: '💬',
    phrases: [
      { spanish: 'Mucho gusto.', hint: 'nice to meet you' },
      { spanish: '¿De dónde eres?', hint: 'where are you from' },
      { spanish: 'Somos de Los Ángeles.', hint: 'we are from LA' },
      { spanish: 'Todo bien.', hint: 'all good' },
      { spanish: '¿Qué me recomiendas hacer por aquí?', hint: 'what to do nearby' },
      { spanish: 'Está padrísimo aquí.', hint: 'this place is awesome' },
      { spanish: 'Disculpa, mi español es básico.', hint: 'my Spanish is basic' },
      { spanish: 'Buenísimo, gracias.', hint: 'great, thanks' },
      { spanish: 'Con permiso', hint: 'excuse me' }
    ]
  }
]
