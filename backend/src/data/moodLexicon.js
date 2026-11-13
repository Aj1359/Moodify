/**
 * Multilingual mood lexicon used by the rule-based fallback
 * (services/keywordFallback.js).
 *
 * Conventions
 * - Terms are lowercase, without apostrophes ("dont", "lets go").
 * - A term with spaces is a phrase; phrases are matched before single words
 *   and count 1.5x, because they are more specific.
 * - A word ending in "*" matches as a prefix: "frustrat*" matches
 *   "frustrated", "frustrating" and "frustration".
 * - Each cue group names the emotion it signals, the moods it points to
 *   (weights 0-1), and optionally the music energy it implies.
 * - Terms are grouped by script: en (English), hinglish (Romanised Hindi),
 *   hi (Devanagari).
 */

const CUE_GROUPS = [
  {
    emotion: 'joy',
    moods: { Happy: 1 },
    terms: {
      en: [
        'happy', 'happier', 'happiest', 'glad', 'joy', 'joyful', 'cheerful', 'excited', 'exciting',
        'thrilled', 'ecstatic', 'elated', 'delighted', 'overjoyed', 'awesome', 'amazing', 'wonderful',
        'fantastic', 'yay', 'woohoo', 'hurray', 'hooray', 'blessed', 'grateful', 'celebrat*', 'party',
        'partying', 'dance', 'dancing', 'fun', 'lit', 'vibing', 'proud', 'smiling', 'lucky', 'promotion',
        'great day', 'best day', 'good day', 'good mood', 'feeling good', 'feel good', 'feeling great',
        'on top of the world', 'got selected', 'got placed', 'got the job', 'cleared the exam',
        'in a great mood',
      ],
      hinglish: [
        'khush', 'khushi', 'khus', 'maza', 'mazaa', 'maja', 'majaa', 'mazze', 'mast', 'masti', 'badhiya',
        'badiya', 'bdiya', 'badhiyaa', 'zabardast', 'jabardast', 'jhakaas', 'jhakkas', 'dhamaal', 'dhamal',
        'anand', 'naach*', 'nachna', 'nachne', 'khushkhabri',
        'maze aa', 'maza aa', 'mazaa aa', 'accha lag raha', 'acha lag raha', 'achha lag raha',
        'accha feel', 'acha feel', 'dil khush', 'party kar*', 'celebrate kar*', 'khush khabri',
        'selection ho gaya', 'select ho gaya', 'placement ho gaya', 'placement lag gayi',
      ],
      hi: [],
    },
  },
  {
    emotion: 'sadness',
    moods: { Sad: 1 },
    terms: {
      en: [
        'sad', 'sadness', 'unhappy', 'upset', 'depressed', 'depressing', 'depression', 'miserable',
        'gloomy', 'heartbroken', 'heartbreak', 'broken', 'hurt', 'hurting', 'crying', 'cry', 'cried',
        'tears', 'lonely', 'loneliness', 'alone', 'empty', 'hopeless', 'grief', 'grieving', 'devastated',
        'disappointed', 'disappointing', 'dumped', 'rejected', 'breakup',
        'feeling low', 'feeling down', 'feel low', 'feel down', 'let down', 'fell apart', 'broke up',
        'break up', 'passed away', 'lost my', 'dont feel like doing anything',
        'dont want to do anything', 'feel like doing nothing', 'nothing feels right',
      ],
      hinglish: [
        'udaas', 'udas', 'udaasi', 'udasi', 'dukhi', 'dukh', 'rona', 'rone', 'akela', 'akeli', 'akelapan',
        'tanha', 'tanhai', 'dard', 'gham', 'dhoka', 'dhokha', 'nirash', 'niraash',
        'ro raha', 'ro rahi', 'ro diya', 'ro di', 'rona aa', 'dil toot', 'dil tut', 'dil tuta',
        'dil dukh', 'dil bhari', 'dil bhaari', 'mann nahi lag', 'man nahi lag', 'mann udaas',
        'mood off', 'mood kharab', 'mood bigad', 'bura lag', 'kuch accha nahi', 'kuch acha nahi',
        'kuch achha nahi', 'toot gaya', 'toot gayi', 'tut gaya', 'break up ho', 'breakup ho',
        'chhod diya', 'chod diya', 'chhod ke', 'chod ke', 'haar gaya', 'haar gayi', 'fail ho gaya',
        'fail ho gayi', 'karne ka mann nahi', 'karne ka man nahi', 'mann nahi kar raha',
        'man nahi kar raha',
      ],
      hi: [],
    },
  },
  {
    emotion: 'anger',
    moods: { Angry: 1 },
    terms: {
      en: [
        'angry', 'anger', 'mad', 'furious', 'pissed', 'annoyed', 'annoying', 'irritated', 'irritating',
        'frustrat*', 'rage', 'raging', 'hate', 'hating', 'livid', 'outraged', 'infuriat*', 'triggered',
        'bitter', 'betrayed', 'screaming', 'yell*',
        'fed up', 'sick of', 'so done', 'had enough', 'cant stand', 'want to punch', 'want to scream',
        'want to break', 'want to smash',
      ],
      hinglish: [
        'gussa', 'gusa', 'gussaa', 'ghussa', 'gussey', 'gusse', 'naraz', 'naraaz', 'naraj', 'chidh', 'chid',
        'chidchida', 'chidchidapan', 'irritate', 'nafrat', 'bhadak', 'bhadka', 'jalan', 'bakwas', 'faltu',
        'bewakoof', 'bevakoof', 'chillana', 'chilla',
        'dimag kharab', 'dimaag kharab', 'dimag mat kha', 'khoon khaul', 'jal raha', 'jal rahi',
        'pagal kar', 'sir phod', 'tod dun', 'tod du', 'maar dun',
      ],
      hi: [],
    },
  },
  {
    emotion: 'stress',
    moods: { Stressed: 1 },
    terms: {
      en: [
        'stress', 'stressed', 'stressful', 'stressing', 'anxious', 'anxiety', 'nervous', 'worried', 'worry',
        'worrying', 'tense', 'tension', 'pressure', 'overwhelmed', 'overwhelming', 'panic*', 'scared',
        'afraid', 'fear', 'frightened', 'restless', 'overthinking', 'overthink', 'insomnia', 'burnout',
        'deadline', 'deadlines', 'hectic', 'chaos', 'chaotic', 'struggling', 'suffocat*',
        'cant sleep', 'burned out', 'burnt out', 'too much work', 'so much work', 'freaking out',
        'losing my mind', 'cant focus', 'under pressure', 'on edge',
      ],
      hinglish: [
        'tension', 'tensed', 'pareshan', 'pareshaan', 'preshan', 'pareshani', 'ghabrahat', 'ghabra*',
        'darr', 'chinta', 'fikar', 'fikr', 'bechain', 'bechaini', 'ghutan',
        'dar lag', 'darr lag', 'dar raha', 'dar rahi', 'dimag ka dahi', 'dimaag ka dahi', 'sar dard',
        'sir dard', 'sir phat', 'sar phat', 'bahut kaam', 'itna kaam', 'kaam ka load', 'kaam ka pressure',
        'load hai', 'pressure hai', 'neend nahi', 'so nahi pa', 'padhai ka pressure', 'exam ka tension',
        'exam ki tension', 'atak gaya', 'phas gaya', 'fas gaya', 'fasa hua', 'samajh nahi aa',
        'kya karun', 'kya karu', 'kya kru',
      ],
      hi: [],
    },
  },
  {
    emotion: 'calm',
    moods: { Relaxed: 1 },
    energy: 'low',
    terms: {
      en: [
        'relax', 'relaxed', 'relaxing', 'calm', 'calming', 'chill', 'chilled', 'chilling', 'chillin',
        'peaceful', 'peace', 'cozy', 'cosy', 'lazy', 'unwind', 'unwinding', 'mellow', 'soothing', 'serene',
        'lofi', 'breeze',
        'lo fi', 'soft music', 'soft songs', 'calm down', 'slow down', 'take it easy', 'sunday mood',
        'rainy day', 'cup of tea', 'chai time',
      ],
      hinglish: [
        'aaram', 'aram', 'araam', 'sukoon', 'sukun', 'shanti', 'shaanti', 'shaant', 'shant', 'chain',
        'chaain', 'suhana', 'suhaana',
        'chill kar', 'relax kar', 'aaram kar', 'araam kar', 'halka feel', 'halka lag', 'chai pe',
        'kuch soft', 'kuch halka', 'relax wala', 'chill wala', 'sukoon wala',
      ],
      hi: [],
    },
  },
  {
    emotion: 'exhaustion',
    moods: { Relaxed: 1, Stressed: 0.5 },
    energy: 'low',
    terms: {
      en: [
        'tired', 'exhausted', 'drained', 'sleepy', 'fatigue*', 'weary',
        'worn out', 'wiped out', 'dead tired', 'no energy', 'low energy', 'long day', 'long week',
      ],
      hinglish: [
        'thak', 'thaka', 'thaki', 'thake', 'thakaan', 'thakan', 'thakawat', 'thakavat',
        'thak gaya', 'thak gayi', 'thak chuka', 'neend aa', 'sona hai', 'energy nahi', 'jaan nahi',
        'himmat nahi', 'lamba din', 'pura din',
      ],
      hi: [],
    },
  },
  {
    emotion: 'determination',
    moods: { Motivated: 1 },
    energy: 'high',
    terms: {
      en: [
        'motivated', 'motivation', 'pumped', 'energetic', 'energized', 'determined', 'focused', 'focus',
        'productive', 'hustle', 'hustling', 'grind', 'grinding', 'gym', 'workout', 'run', 'running',
        'training', 'ambitious', 'inspired', 'confident', 'unstoppable', 'winning', 'champion',
        'work out', 'working out', 'beast mode', 'lets go', 'lets do this', 'can do this', 'crush it',
        'get things done', 'push myself', 'level up', 'game day', 'big day', 'ready to', 'fired up',
      ],
      hinglish: [
        'josh', 'jazba', 'jazbaa', 'junoon', 'junun', 'mehnat', 'himmat', 'taiyaar', 'tayyar', 'taiyar',
        'jeetna', 'jeet',
        'kuch kar dikhana', 'kar dikhana', 'kar ke dikhana', 'karke dikhana', 'kar dikhaunga',
        'kar dikhaungi', 'ready hu', 'gym jaana', 'gym ja raha', 'gym jaa raha', 'padhai karni',
        'padhne baith', 'focus karna', 'focus kar', 'phod denge', 'phod dunga', 'full power', 'full josh',
        'chalo shuru',
      ],
      hi: [],
    },
  },
  {
    emotion: 'love',
    moods: { Romantic: 1 },
    energy: 'medium',
    terms: {
      en: [
        'love', 'loving', 'romantic', 'romance', 'crush', 'date', 'dating', 'butterflies', 'cute', 'darling',
        'sweetheart', 'girlfriend', 'boyfriend', 'bae', 'partner', 'valentine', 'kiss', 'flirt*',
        'affection', 'candlelight', 'anniversary', 'proposal', 'propose',
        'in love', 'candle light', 'thinking about her', 'thinking about him', 'special someone',
      ],
      hinglish: [
        'pyaar', 'pyar', 'ishq', 'mohabbat', 'mohobbat', 'muhabbat', 'prem', 'jaan', 'jaanu', 'janu',
        'babu', 'shona', 'gf', 'bf',
        'dil aa gaya', 'uske saath', 'unke saath', 'date pe', 'date par', 'milne ja', 'first date',
        'propose kar', 'haan bol di', 'haan bol diya', 'crush ne', 'crush se',
      ],
      hi: [],
    },
  },
  {
    emotion: 'nostalgia',
    moods: { Nostalgic: 1 },
    energy: 'medium',
    terms: {
      en: [
        'nostalgic', 'nostalgia', 'memories', 'memory', 'remember', 'remembering', 'reminisc*',
        'childhood', 'throwback', 'flashback', 'retro', '90s', '2000s',
        'old days', 'good old days', 'school days', 'college days', 'hostel days', 'back then',
        'those days', 'old songs', 'old school', 'old times', 'used to', 'grew up', 'growing up',
      ],
      hinglish: [
        'bachpan', 'yaadein', 'yaadon', 'yaade',
        'purane din', 'purana zamana', 'purane gaane', 'purane gane', 'purani yaadein', 'purani yaadon',
        'woh din', 'wo din', 'vo din', 'pehle ke din', 'pehle wale din', 'school ke din',
        'college ke din', 'hostel ke din', 'yaad karna', 'yaad kar raha', 'yaad kar rahi',
        'nani ke ghar', 'dadi ke ghar',
      ],
      hi: [],
    },
  },
  {
    emotion: 'longing',
    moods: { Nostalgic: 1, Sad: 0.5, Romantic: 0.5 },
    energy: 'low',
    terms: {
      en: [
        'miss', 'missing', 'homesick', 'longing',
        'miss you', 'miss her', 'miss him', 'miss them', 'miss home', 'wish i could go back',
        'far away', 'long distance',
      ],
      hinglish: [
        'yaad', 'doori',
        'yaad aa', 'yaad aati', 'yaad aata', 'bahut yaad', 'uski yaad', 'ghar ki yaad', 'ghar yaad',
        'maa ki yaad', 'door hai', 'dur hai',
      ],
      hi: [],
    },
  },
];

/** Emoji cues. Variation selectors are stripped before matching. */
const EMOJI_CUES = [
  { emotion: 'joy', moods: { Happy: 1 }, emojis: ['😀', '😃', '😄', '😁', '😆', '😊', '🙂', '🥳', '🎉', '🤩', '😂', '🤣', '☺'] },
  { emotion: 'sadness', moods: { Sad: 1 }, emojis: ['😢', '😭', '😞', '😔', '☹', '🙁', '💔', '🥺', '😿', '😥'] },
  { emotion: 'anger', moods: { Angry: 1 }, emojis: ['😡', '😠', '🤬', '💢', '👿'] },
  { emotion: 'stress', moods: { Stressed: 1 }, emojis: ['😰', '😟', '😓', '🤯', '😫', '😖', '😬', '😩'] },
  { emotion: 'calm', moods: { Relaxed: 1 }, emojis: ['😌', '🧘', '😴', '🌿', '☕', '🍃'] },
  { emotion: 'determination', moods: { Motivated: 1 }, emojis: ['💪', '🏋', '🚀', '🏃', '🏆'] },
  { emotion: 'love', moods: { Romantic: 1 }, emojis: ['❤', '😍', '🥰', '😘', '💕', '💖', '💗', '💘', '💞', '💓'] },
  { emotion: 'nostalgia', moods: { Nostalgic: 1 }, emojis: ['📻', '📼', '🕰', '🥲'] },
];

/**
 * Negators. English negators only affect what follows them ("not happy").
 * Hindi and Hinglish negators usually follow the word they negate
 * ("khush nahi hu"), so they are checked on both sides.
 */
const NEGATORS = {
  before: [
    'not', 'no', 'never', 'dont', 'doesnt', 'didnt', 'isnt', 'wasnt', 'arent', 'werent', 'cant',
    'cannot', 'wont', 'nothing', 'without', 'hardly', 'barely', 'neither', 'nor', 'aint',
  ],
  around: ['nahi', 'nahin', 'nhi', 'nai', 'mat'],
};

/** Negated moods that flip to an opposite instead of just being dropped. */
const NEGATION_FLIP = {
  Happy: 'Sad',
  Relaxed: 'Stressed',
  Motivated: 'Sad',
  Romantic: 'Sad',
  Stressed: 'Relaxed',
};

/** Words that end a clause: negation and intensity never reach across them. */
const CLAUSE_BREAKS = [
  'but', 'however', 'although', 'though', 'yet', 'because', 'coz', 'cuz',
  'par', 'pr', 'lekin', 'magar', 'kyunki', 'kyuki', 'kyonki',
];

const INTENSIFIERS = [
  'very', 'so', 'really', 'extremely', 'super', 'too', 'totally', 'completely', 'absolutely',
  'insanely', 'deeply', 'incredibly', 'terribly', 'awfully', 'utterly', 'seriously', 'damn', 'hella',
  'bahut', 'bohot', 'bohut', 'bhot', 'bht', 'bahot', 'bhut', 'boht', 'bahutt', 'itna', 'itni', 'itne',
  'kaafi', 'kafi', 'ekdum', 'bilkul', 'zyada', 'jyada', 'jada', 'sabse', 'hadd', 'full',
];

const DIMINISHERS = [
  'bit', 'little', 'slightly', 'kinda', 'somewhat', 'mildly', 'sorta', 'thoda', 'thodi', 'thode',
  'halka', 'zara',
];

/** Context cues: what the feeling is about. Free-text label, snake_case. */
const CONTEXT_CUES = [
  {
    context: 'work',
    terms: [
      'office', 'work', 'boss', 'job', 'manager', 'meeting', 'meetings', 'client', 'shift', 'overtime',
      'appraisal', 'salary', 'promotion', 'colleague', 'colleagues', 'internship', 'kaam', 'naukri',
      'deadline', 'deadlines',
    ],
  },
  {
    context: 'studies',
    terms: [
      'exam', 'exams', 'test', 'assignment', 'assignments', 'study', 'studying', 'studies', 'college',
      'class', 'classes', 'lecture', 'semester', 'sem', 'results', 'result', 'marks', 'grades', 'viva',
      'quiz', 'endsem', 'midsem', 'midsems', 'padhai', 'padhna', 'padhne', 'jee', 'neet', 'upsc',
      'placement', 'placements',
    ],
  },
  {
    context: 'relationship',
    terms: [
      'breakup', 'break up', 'broke up', 'girlfriend', 'boyfriend', 'gf', 'bf', 'crush', 'partner', 'ex',
      'date', 'dating', 'wife', 'husband', 'relationship', 'pyaar', 'pyar', 'uske saath',
    ],
  },
  {
    context: 'family',
    terms: [
      'family', 'mom', 'mum', 'mummy', 'maa', 'mother', 'dad', 'papa', 'father', 'parents', 'ghar',
      'home', 'bhai', 'behen', 'sister', 'brother', 'nani', 'dadi', 'grandma', 'grandpa', 'homesick',
    ],
  },
  {
    context: 'fitness',
    terms: [
      'gym', 'workout', 'work out', 'run', 'running', 'jog', 'jogging', 'cricket', 'football', 'match',
      'training', 'exercise', 'yoga', 'cycling',
    ],
  },
  {
    context: 'celebration',
    terms: [
      'party', 'birthday', 'bday', 'wedding', 'shaadi', 'festival', 'diwali', 'holi', 'celebration',
      'celebrate', 'anniversary',
    ],
  },
  {
    context: 'travel',
    terms: [
      'trip', 'travel', 'travelling', 'traveling', 'journey', 'flight', 'train', 'road trip', 'vacation',
      'holiday', 'safar', 'ghoomne', 'ghumne',
    ],
  },
  {
    context: 'night',
    terms: ['night', 'tonight', 'midnight', 'raat', 'late night', '3am', '2am', 'neend', 'sleep', 'insomnia'],
  },
  {
    context: 'weather',
    terms: ['rain', 'raining', 'rainy', 'baarish', 'barish', 'monsoon', 'winter', 'sardi', 'thand'],
  },
  {
    context: 'health',
    terms: ['sick', 'ill', 'fever', 'bimaar', 'bimar', 'hospital', 'headache', 'sir dard', 'sar dard'],
  },
];

module.exports = {
  CUE_GROUPS,
  EMOJI_CUES,
  NEGATORS,
  NEGATION_FLIP,
  CLAUSE_BREAKS,
  INTENSIFIERS,
  DIMINISHERS,
  CONTEXT_CUES,
};
