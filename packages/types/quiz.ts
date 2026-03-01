/**
 * Quiz-related TypeScript types
 * Used by both Next.js web app and future React Native app
 */

import type { SkinType } from './user';

export interface QuizQuestion {
  id: string;
  question_ru: string;
  question_en: string;
  order: number;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  text_ru: string;
  text_en: string;
  value: string;
  scores: Record<SkinType, number>;
}

export interface QuizAnswer {
  question_id: string;
  option_id: string;
  value: string;
}

export interface QuizResult {
  id: string;
  user_id: string | null;
  session_id: string | null;
  answers: QuizAnswer[];
  skin_type_result: SkinType;
  recommended_product_ids: string[];
  created_at: string;
}

export interface QuizResultInsert {
  id?: string;
  user_id?: string | null;
  session_id?: string | null;
  answers: QuizAnswer[];
  skin_type_result: SkinType;
  recommended_product_ids: string[];
  created_at?: string;
}

export interface QuizResultWithProducts extends QuizResult {
  recommended_products: {
    id: string;
    name_ru: string;
    slug: string;
    brand_name: string;
    price_rub: number;
    sale_price_rub: number | null;
    image_url: string | null;
  }[];
}

export interface SkinTypeDescription {
  type: SkinType;
  name_ru: string;
  name_en: string;
  description_ru: string;
  characteristics: string[];
  recommended_ingredients: string[];
  avoid_ingredients: string[];
}

export const SKIN_TYPE_DESCRIPTIONS: Record<SkinType, SkinTypeDescription> = {
  dry: {
    type: 'dry',
    name_ru: 'Сухая кожа',
    name_en: 'Dry Skin',
    description_ru: 'Кожа ощущается стянутой, часто шелушится, мелкие поры.',
    characteristics: [
      'Ощущение стянутости после умывания',
      'Шелушение в некоторых зонах',
      'Мелкие, едва заметные поры',
      'Раннее появление мимических морщин',
    ],
    recommended_ingredients: [
      'гиалуроновая кислота',
      'керамиды',
      'масло ши',
      'сквалан',
      'пантенол',
    ],
    avoid_ingredients: [
      'спирт',
      'салициловая кислота в высокой концентрации',
      'сульфаты',
    ],
  },
  oily: {
    type: 'oily',
    name_ru: 'Жирная кожа',
    name_en: 'Oily Skin',
    description_ru: 'Блеск в Т-зоне, расширенные поры, склонность к высыпаниям.',
    characteristics: [
      'Блеск кожи через несколько часов после умывания',
      'Расширенные поры',
      'Склонность к черным точкам и прыщам',
      'Жирная Т-зона (лоб, нос, подбородок)',
    ],
    recommended_ingredients: [
      'ниацинамид',
      'салициловая кислота (BHA)',
      'чайное дерево',
      'цинк',
      'глина',
    ],
    avoid_ingredients: [
      'тяжелые масла',
      'комедогенные ингредиенты',
      'спирт в высокой концентрации',
    ],
  },
  combination: {
    type: 'combination',
    name_ru: 'Комбинированная кожа',
    name_en: 'Combination Skin',
    description_ru: 'Смесь сухих и жирных зон, обычно жирная Т-зона и сухие щеки.',
    characteristics: [
      'Жирная Т-зона и сухие или нормальные щеки',
      'Расширенные поры в Т-зоне',
      'Шелушение на щеках',
      'Блеск в центральной части лица',
    ],
    recommended_ingredients: [
      'ниацинамид',
      'гиалуроновая кислота',
      'зеленый чай',
      'легкие эмульсии',
    ],
    avoid_ingredients: [
      'тяжелые кремы для всего лица',
      'агрессивное очищение',
    ],
  },
  sensitive: {
    type: 'sensitive',
    name_ru: 'Чувствительная кожа',
    name_en: 'Sensitive Skin',
    description_ru: 'Легко раздражается, склонна к покраснениям и аллергическим реакциям.',
    characteristics: [
      'Быстрое покраснение при прикосновении',
      'Реакция на новые продукты',
      'Ощущение жжения или зуда',
      'Сухость и стянутость',
    ],
    recommended_ingredients: [
      'пантенол',
      'центелла азиатская',
      'аллантоин',
      'бисаболол',
      'пребиотики',
    ],
    avoid_ingredients: [
      'отдушки',
      'спирт',
      'эфирные масла',
      'агрессивные кислоты',
    ],
  },
  normal: {
    type: 'normal',
    name_ru: 'Нормальная кожа',
    name_en: 'Normal Skin',
    description_ru: 'Сбалансированная кожа без особых проблем, ровный тон.',
    characteristics: [
      'Ровный тон и текстура',
      'Нет выраженного блеска или сухости',
      'Минимальное количество дефектов',
      'Хорошая переносимость продуктов',
    ],
    recommended_ingredients: [
      'антиоксиданты',
      'пептиды',
      'витамин C',
      'витамин E',
      'кофермент Q10',
    ],
    avoid_ingredients: [
      'агрессивные ингредиенты без необходимости',
    ],
  },
};

// Quiz questions for skin type detection
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question_ru: 'Как ваша кожа ощущается после умывания?',
    question_en: 'How does your skin feel after cleansing?',
    order: 1,
    options: [
      { id: 'q1_a', text_ru: 'Стянутая и сухая', text_en: 'Tight and dry', value: 'tight_dry', scores: { dry: 3, sensitive: 1, normal: 0, combination: 0, oily: 0 } },
      { id: 'q1_b', text_ru: 'Комфортно, без особых ощущений', text_en: 'Comfortable, no particular feeling', value: 'comfortable', scores: { dry: 0, sensitive: 0, normal: 3, combination: 1, oily: 0 } },
      { id: 'q1_c', text_ru: 'Блестит в Т-зоне, щеки нормальные', text_en: 'Shiny in T-zone, cheeks normal', value: 'tzone_shiny', scores: { dry: 0, sensitive: 0, normal: 0, combination: 3, oily: 1 } },
      { id: 'q1_d', text_ru: 'Жирная по всему лицу', text_en: 'Oily all over', value: 'oily_all', scores: { dry: 0, sensitive: 0, normal: 0, combination: 1, oily: 3 } },
    ],
  },
  {
    id: 'q2',
    question_ru: 'Как выглядят ваши поры?',
    question_en: 'How do your pores look?',
    order: 2,
    options: [
      { id: 'q2_a', text_ru: 'Почти незаметны', text_en: 'Barely visible', value: 'invisible', scores: { dry: 3, sensitive: 2, normal: 2, combination: 0, oily: 0 } },
      { id: 'q2_b', text_ru: 'Расширены в Т-зоне', text_en: 'Enlarged in T-zone', value: 'tzone_large', scores: { dry: 0, sensitive: 0, normal: 0, combination: 3, oily: 2 } },
      { id: 'q2_c', text_ru: 'Расширены по всему лицу', text_en: 'Enlarged all over', value: 'large_all', scores: { dry: 0, sensitive: 0, normal: 0, combination: 1, oily: 3 } },
      { id: 'q2_d', text_ru: 'Небольшие, но заметны', text_en: 'Small but visible', value: 'small_visible', scores: { dry: 1, sensitive: 1, normal: 1, combination: 0, oily: 0 } },
    ],
  },
  {
    id: 'q3',
    question_ru: 'Как часто у вас появляются высыпания?',
    question_en: 'How often do you get breakouts?',
    order: 3,
    options: [
      { id: 'q3_a', text_ru: 'Практически никогда', text_en: 'Almost never', value: 'never', scores: { dry: 2, sensitive: 1, normal: 3, combination: 0, oily: 0 } },
      { id: 'q3_b', text_ru: 'Иногда в Т-зоне', text_en: 'Sometimes in T-zone', value: 'tzone_breakouts', scores: { dry: 0, sensitive: 0, normal: 0, combination: 3, oily: 1 } },
      { id: 'q3_c', text_ru: 'Часто, по всему лицу', text_en: 'Often, all over face', value: 'frequent', scores: { dry: 0, sensitive: 1, normal: 0, combination: 1, oily: 3 } },
      { id: 'q3_d', text_ru: 'Реакция на новые продукты', text_en: 'Reaction to new products', value: 'product_reaction', scores: { dry: 1, sensitive: 3, normal: 0, combination: 0, oily: 0 } },
    ],
  },
  {
    id: 'q4',
    question_ru: 'Как ваша кожа реагирует на погоду?',
    question_en: 'How does your skin react to weather?',
    order: 4,
    options: [
      { id: 'q4_a', text_ru: 'Сильно шелушится зимой', text_en: 'Peels a lot in winter', value: 'winter_peel', scores: { dry: 3, sensitive: 1, normal: 0, combination: 1, oily: 0 } },
      { id: 'q4_b', text_ru: 'Сильно блестит летом', text_en: 'Very shiny in summer', value: 'summer_shiny', scores: { dry: 0, sensitive: 0, normal: 0, combination: 2, oily: 3 } },
      { id: 'q4_c', text_ru: 'Легко краснеет и раздражается', text_en: 'Easily reddens and irritates', value: 'easily_irritated', scores: { dry: 1, sensitive: 3, normal: 0, combination: 0, oily: 0 } },
      { id: 'q4_d', text_ru: 'Переносит изменения нормально', text_en: 'Handles changes well', value: 'handles_well', scores: { dry: 0, sensitive: 0, normal: 3, combination: 1, oily: 1 } },
    ],
  },
  {
    id: 'q5',
    question_ru: 'Какие у вас основные проблемы с кожей?',
    question_en: 'What are your main skin concerns?',
    order: 5,
    options: [
      { id: 'q5_a', text_ru: 'Сухость и шелушение', text_en: 'Dryness and flaking', value: 'dryness', scores: { dry: 3, sensitive: 1, normal: 0, combination: 1, oily: 0 } },
      { id: 'q5_b', text_ru: 'Блеск и расширенные поры', text_en: 'Shine and enlarged pores', value: 'shine_pores', scores: { dry: 0, sensitive: 0, normal: 0, combination: 2, oily: 3 } },
      { id: 'q5_c', text_ru: 'Покраснения и чувствительность', text_en: 'Redness and sensitivity', value: 'redness', scores: { dry: 1, sensitive: 3, normal: 0, combination: 0, oily: 0 } },
      { id: 'q5_d', text_ru: 'Профилактика старения', text_en: 'Anti-aging prevention', value: 'antiaging', scores: { dry: 1, sensitive: 0, normal: 2, combination: 1, oily: 1 } },
    ],
  },
  {
    id: 'q6',
    question_ru: 'Когда ваша кожа больше всего блестит?',
    question_en: 'When is your skin most shiny?',
    order: 6,
    options: [
      { id: 'q6_a', text_ru: 'Никогда, всегда матовая', text_en: 'Never, always matte', value: 'never_shiny', scores: { dry: 3, sensitive: 2, normal: 1, combination: 0, oily: 0 } },
      { id: 'q6_b', text_ru: 'К вечеру в Т-зоне', text_en: 'By evening in T-zone', value: 'evening_tzone', scores: { dry: 0, sensitive: 0, normal: 1, combination: 3, oily: 1 } },
      { id: 'q6_c', text_ru: 'Через пару часов после умывания', text_en: 'A couple hours after cleansing', value: 'few_hours', scores: { dry: 0, sensitive: 0, normal: 0, combination: 1, oily: 3 } },
      { id: 'q6_d', text_ru: 'Только летом', text_en: 'Only in summer', value: 'summer_only', scores: { dry: 0, sensitive: 0, normal: 2, combination: 1, oily: 1 } },
    ],
  },
  {
    id: 'q7',
    question_ru: 'Как долго сохраняется увлажнение от крема?',
    question_en: 'How long does moisturizer hydration last?',
    order: 7,
    options: [
      { id: 'q7_a', text_ru: 'Нужно увлажнять несколько раз в день', text_en: 'Need to moisturize multiple times', value: 'multiple_times', scores: { dry: 3, sensitive: 1, normal: 0, combination: 0, oily: 0 } },
      { id: 'q7_b', text_ru: 'Достаточно утром и вечером', text_en: 'Morning and evening is enough', value: 'twice_daily', scores: { dry: 0, sensitive: 0, normal: 3, combination: 1, oily: 0 } },
      { id: 'q7_c', text_ru: 'Легкого увлажнения достаточно', text_en: 'Light moisture is enough', value: 'light_enough', scores: { dry: 0, sensitive: 0, normal: 1, combination: 2, oily: 2 } },
      { id: 'q7_d', text_ru: 'Тяжелые кремы вызывают блеск', text_en: 'Heavy creams cause shine', value: 'heavy_shine', scores: { dry: 0, sensitive: 0, normal: 0, combination: 1, oily: 3 } },
    ],
  },
];
