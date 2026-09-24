// Lawro's word lists. The prompt is built from these same arrays, so the rule he is given and the
// rule the editor runs cannot drift; `NEVER` and `FAMOUS` are the two checked and never prompted.

/** Chatbot tells: never right in this column. */
const CHATBOT = [
  "delve", "delves", "delved", "tapestry", "testament", "poised", "primed", "boast", "boasts", "showcase", "unleash",
  "embark", "journey", "landscape", "realm", "navigate", "elevate", "harness", "leverage", "robust", "seamless",
  "dynamic", "pivotal", "crucial", "vital", "notably", "interestingly", "importantly", "ultimately", "essentially",
  "arguably", "undoubtedly", "moreover", "furthermore", "additionally", "however", "nevertheless", "that said",
  "on the other hand", "in conclusion", "overall", "it's worth noting", "it's fair to say", "it goes without saying",
  "when it comes to", "at the heart of", "speaks volumes", "says it all", "tells its own story", "only time will tell",
  "who knows", "anything can happen", "all eyes", "in the spotlight", "a tale of two", "clash of the titans",
  "the real story", "the bigger picture", "writes itself", "and then some", "sheer", "no stranger to",
  "force to be reckoned with", "under the radar", "dark horse", "one to watch", "keep an eye on", "let's", "here's",
  "buckle up", "strap in", "without further ado", "next up", "stay tuned", "watch this space",
  "fingers crossed", "folks", "honestly", "frankly", "truth be told", "I have to say", "in my opinion", "personally",
  "I believe", "I feel", "literally", "truly", "genuinely", "incredibly", "hugely", "massively", "narrative",
  "momentum", "belief", "mentality", "statement", "send a message", "lay down a marker", "in a bid to",
  "turn the tide", "shaping up", "set to", "gearing up", "firepower", "weapon", "weapons",
];

/** Hype and over-optimism: he is hard to impress. */
const HYPE = [
  "massive", "huge", "enormous", "giant", "giants", "electric", "exciting", "thrilling", "thriller", "mouth-watering",
  "tantalising", "tasty", "cracker", "belter", "blockbuster", "showdown", "clash", "battle", "duel", "encounter", "epic",
  "classic", "fireworks", "end-to-end", "nail-biter", "cliffhanger", "down to the wire", "sensational", "spectacular",
  "stunning", "incredible", "unbelievable", "remarkable", "phenomenal", "outstanding", "magnificent", "superb",
  "brilliant", "world-class", "elite", "masterclass", "clinical", "ruthless", "lethal", "talisman", "star man",
  "superstar", "on fire", "red-hot", "in-form", "purple patch", "rampant", "unstoppable", "unbeatable", "invincible",
  "flawless", "dominant", "dominate", "juggernaut", "powerhouse", "cruise", "stroll", "romp", "canter", "walkover",
  "procession", "rout", "thrash", "hammer", "demolish", "destroy", "run riot", "table-toppers", "rock bottom", "leaky",
  "guaranteed", "surely", "no-brainer", "certainty", "sure thing", "can't lose", "the team to beat", "must-win",
  "six-pointer", "job done", "all to play for", "upset alert", "shock",
];

/** Tipster and betting: the house never advises. */
const TIPSTER = [
  "tip", "tips", "tipped", "tipster", "banker", "odds", "odds-on", "evens", "each-way", "acca", "bet", "betting", "punt",
  "punter", "wager", "bookie", "bookies", "dead cert", "nailed on", "if I were", "in his shoes",
];

/** Jargon, and the machine this column does not have. */
const JARGON = [
  "the numbers", "projection", "projected", "Fantrax", "the wire", "differential",
  "template", "xG", "xA", "expected goals", "underlying", "metrics", "data", "analytics", "stats", "algorithm", "model",
  "AI", "computer", "spreadsheet", "low block", "high press", "gegenpress", "gegenpressing", "half-space", "inverted",
  "overload", "transition", "false nine", "double pivot", "progressive", "tactical", "tactically", "system",
  "philosophy", "process", "vibes", "energy",
];

/** A chance in figures: he says out, injured or a doubt, never FPL's percentage. */
const CHANCES = ["per cent", "percent", "%", "50-50", "fifty-fifty", "chance of playing"];

/** The managers are friends: a bad pick may be useless, the man who made it is never an idiot. */
const MANAGERS = [
  "clueless", "pathetic", "disgrace", "laughing stock", "idiot",
  "muppet", "clown", "donkey", "numpty", "plonker", "stupid", "incompetent", "bottled", "bottler", "choked", "sacked",
  "the sack", "gutted", "fuming", "furious", "devastated", "heartbroken", "over the moon", "sick as a parrot", "panic",
  "under pressure", "unlucky", "cruel", "bad luck", "fine margins", "robbed", "told you so", "called it", "nailed it",
  "vindicated", "still got it",
];

/** Label words from the brief and the prompt, which a model copies into copy. */
const LEAKS = [
  "instinct", "instincts", "overrule", "overruled", "key man", "kinder fixture", "kinder fixtures", "my gut",
  "gut feeling", "brief", "WHO YOU ARE", "joke", "pun", "groaner", "deadpan", "dour", "Lawro", "Lawro's prediction",
  "sub-editor", "the page",
];

/** American, and the chatbot's own football: not a dour Lancastrian's. */
const AMERICAN = ["lean on", "leans on", "leaning on", "rely on", "relies on", "carry the load", "step up", "steps up", "stepped up", "show up", "shows up", "showed up", "gives them nothing", "give them nothing", "big fat", "in for a long one", "in for a long afternoon"];

/** Not an old man's football: a defence is tough or soft, an attack is hard to keep out or weak. */
const ADJECTIVES = ["mean", "meaner", "meanest", "leakier", "leakiest", "lively", "sharpest attack", "sharpest attacks"];

/** A man out is replaced from the bench (Craig): a side is never short-handed, and nobody says who plays instead. */
const TEN_MEN = ["shorn", "a man short", "a man light", "a man down", "men short", "men light", "down to ten", "short-handed", "short of a man", "worse man", "lesser man", "lesser name", "takes his place", "take his place", "in his place", "in his stead", "deputises", "deputy", "steps in", "step in", "fills in", "fill in", "stands in", "stand in", "plays instead", "play instead", "in for him", "in his absence", "without him"];

/** Somebody plays Liverpool every week (Craig): a difficult game is difficult, never measured against the round. */
const MEASURED = ["one of the hardest", "hardest this round", "hardest of the round", "hardest fixture", "toughest fixture", "as hard as it gets", "as unkind a trip"];

/** Dialect is caricature. */
const DIALECT = ["nowt", "owt", "summat", "reet", "ey up", "our kid", "Scouse", "Scouser"];

/** Everything he may not write, checked after he files and sent back once. */
export const LAWRO_BANNED: readonly string[] = [...CHATBOT, ...HYPE, ...TIPSTER, ...JARGON, ...CHANCES, ...MANAGERS, ...LEAKS, ...AMERICAN, ...ADJECTIVES, ...TEN_MEN, ...MEASURED, ...DIALECT];

/** The deck is the sub-editor's, so it skips the label words and may say "Lawro". */
export const DESK_BANNED: readonly string[] = [...CHATBOT, ...HYPE, ...TIPSTER];

/** His habits, allowed and counted so they stay habits and never become tics. */
export const LAWRO_CAPPED: readonly (readonly [phrase: string, most: number])[] = [
  ["mind you", 1], ["to be fair", 1], ["to be honest", 1], ["most definitely", 1], ["did he not", 1],
  ["have they not", 1], ["absolutely", 1], ["I fancy", 1], ["I'm backing", 1], ["I'll go with", 1],
  ["come out on top", 1], ["on the bounce", 1], ["afternoon", 2], ["hard one", 2], ["kind one", 1], ["no picnic", 1],
  ["blow hot and cold", 1], ["due a fall", 1], ["find a way to waste", 1], ["ugly", 1], ["the sort", 1], ["the type", 1],
  ["that lot", 2], ["settle", 1], ["settles", 1], ["being kind", 1], ["carries", 1], ["carry", 1], ["on paper", 1], ["go against", 1], ["going against", 1],
  ["gone against", 1], ["gut", 1], ["favourite", 2], ["favourites", 2], ["underdog", 1], ["underdogs", 1],
  ["upset", 1], ["haul", 1], ["blank", 1], ["home and hosed", 1], ["I'd be surprised", 1], ["that's about it", 1],
  ["put a shift in", 1], ["quality", 1], ["best man", 2], ["Liverpool men", 2], ["I think", 2], ["very", 2],
];

/** Checked and never prompted, because printing "Heysel" in every prompt to forbid it puts it in
 *  front of the model every week. The prompt names the categories instead. */
export const LAWRO_NEVER: readonly string[] = [
  "Heysel", "Juventus", "Hillsborough", "cancer", "chemo", "chemotherapy", "tumour", "woke", "skirt", "axed",
  "politically correct", "politics", "political", "government", "election", "immigration", "Brexit", "GB News",
  "talkSPORT", "Paddy Power", "wife", "divorce", "kids", "children", "drunk", "hangover",
];
export const NEVER_CATEGORIES = "tragedies, illness, how any job ended, politics, culture-war words, betting firms and your family";

/** His famous lines: the shapes are his, the sentences are spent. Checked, never prompted. */
export const LAWRO_FAMOUS: readonly string[] = [
  "revert to plan a", "besotted by injuries", "great day for their fans", "know their onions", "cut their cloth",
  "nits and worms", "tallest of lads", "teas", "duck-sized", "scares me from", "in a word, no", "you saddo",
  "aptly named", "dislocated shoelace", "move to Cologne", "auto-ban", "tough nut to crack", "the quality will tell",
];

/** Anything that says who starts, who is benched or who was picked: the league's line-ups are
 *  private until the lock, so one of these never prints. */
export const LINEUP_CLAIMS: readonly RegExp[] = [
  /\bline-?ups?\b/iu,
  /\bstarting (?:eleven|xi|side|team|line-?up)\b/iu,
  /\bstarters?\b/iu,
  /\bstart(?:s|ed|ing)? (?:for|in|up front|at the back|against|him|them)\b/iu,
  /\b(?:should|will|would|won't|to|doesn't|didn't|does not|may|might) start\b/iu,
  /\b(?:bench|benched|benching)\b/iu,
  /\bdropped (?:him|them|\p{Lu})/u,
  /\b(?:left out|leaves? (?:him|them) out|leaving (?:him|them) out)\b/iu,
  /\b(?:picked(?! up)|picks(?! up)|selected|selection|fielded|fielding)\b/iu,
  /\bin (?:his|their|the) (?:side|team|eleven|xi)\b/iu,
  /\b(?:rested|resting)\b/iu,
  /\b(?:plays?|playing|risks?|risked|risking) (?:him|them)\b/iu,
];

/** Words that say a tie will be easy, which a close tie is not. */
export const COMFORTABLE: readonly string[] = [
  "comfortably", "comfortable", "easily", "easy", "plenty", "home and hosed", "home and dry", "in the bag",
];
