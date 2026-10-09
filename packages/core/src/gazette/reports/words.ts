// The match report's vocabulary: the voice is built from these arrays and the editor checks against them.

/** Match-report clichés a sports desk spikes on sight. */
export const REPORT_CLICHES: readonly string[] = [
  "found the net", "back of the net", "net bulged", "rippled", "stunner", "slotted home", "fired home", "bundled home",
  "tucked away", "made no mistake", "extended their lead", "sealed it", "wrapped it up", "put the game to bed", "beyond doubt",
  "game over", "floodgates", "turned provider", "capped a fine display", "icing on the cake", "moment of magic",
  "moment of madness", "against the run of play", "dying embers", "grandstand finish", "nervy finale", "late scare",
  "too little too late", "too little, too late", "lifeline", "sucker punch", "killer blow", "hammer blow", "sealed the deal",
  "turned the screw", "twisted the knife", "salt in the wound", "piled on the misery", "smash and grab", "parked the bus",
  "backs to the wall", "rearguard", "ghosted", "a day to forget", "an afternoon to forget", "late show", "drama", "dramatic",
  "frantic", "nervy", "pulsating", "breathless", "stole the show", "turned the game on its head", "set the tone",
  "made to pay", "rued", "statement win", "sparked into life", "left it late", "did the damage", "in the driving seat",
  "into the history books", "a game of two halves", "the points were shared", "dominated proceedings", "woes", "plight",
  "misery", "nightmare", "horror show", "crisis", "freefall", "torrid", "dismal", "abject", "woeful", "calamitous",
  "rollercoaster", "heroics", "hero", "villain", "never looked back", "no way back", "mountain to climb", "threw everything at",
  "towering", "lung-busting", "pinpoint", "inch-perfect", "super-sub", "impact sub", "game-changer", "changed the game",
  "opened his account", "off the mark", "at the death", "last kick of the game", "languish", "languishing",
  "find themselves", "controversially", "VAR drama", "Spursy", "rose highest", "bullet header", "powered home",
  // The sports desk's red pen.
  "very close range", "one shot", "tight afternoon", "tight game", "comfortable", "pressed without reward", "nothing separated",
  "dangerous attack", "tough defence", "weak attack", "soft defence", "kept two saves", "afternoon", "evening", "tonight",
  "leave it late", "leaves it late", "leaving it late",
  // Play nobody saw: how a man moved, ran or led is not in the facts.
  "marshalled", "set the tempo", "ran through him", "on the front foot", "stretched", "running in behind", "dropping in",
  "carved out", "pulled the strings", "drove forward", "offered little", "at the heart of", "tireless", "a menace",
  "a constant threat", "lifted a", "lifted the", "his introduction", "his work", "his running", "his movement",
  "finely poised", "a free man", "holds him", "hold him", "held by", "holder", "nobody holds", "nobody in the league holds", "picked him", "held him",
  "who held", "held and picked", "picked and",
  "in their eleven", "among their reserves", "profligacy", "chance after chance", "held firm", "still pressing",
  // A flashback, a stake's idiom, and a judgement of a chance nobody saw.
  "had earlier", "had already", "available to anyone", "there for the taking", "whoever owns him", "scored for nobody",
  "among the reserves", "second time of asking", "to show for", "good enough sight", "gone begging", "went begging",
  "cut the arrears", "the pick of them", "announces himself", "fashioned", "mustered", "endeavours", "productive",
  "for no side", "no manager", "for nobody", "without a club", "a tally", "day's work", "adding nothing", "goes unrewarded",
];

/** Grounds the house list lacks, and their nicknames; the brief carries no ground, so every one is recalled. */
export const REPORT_GROUNDS: readonly string[] = [
  "the Lane", "White Hart Lane", "Tottenham Hotspur Stadium", "the Vitality", "City Ground", "the MKM", "Coventry Building Society Arena",
  "the Hawthorns", "Carrow Road", "Vicarage Road", "Emirates Stadium", "Etihad Stadium", "St Mary's", "Gtech Community Stadium",
  "north London", "south London", "west London", "east London", "the capital", "the Midlands", "Merseyside", "Tyneside",
  "Wearside", "Teesside", "the south coast", "the north-east", "the north-west",
];

/** A shot described beyond what the commentary said. */
export const REPORT_SHOTS: readonly string[] = [
  "steered", "stroked", "prodded", "poked", "curved", "curves", "curving", "bent", "bends", "bending", "drove", "drives", "driving", "drilled", "drills", "thumped",
  "hammered", "crashed", "arrowed in", "curls", "curling", "whips", "blasts", "smashes", "fires", "rifles", "lashes",
  "debut", "debutant", "full debut",
  "curled", "curler", "rocket", "screamer", "thunderbolt", "piledriver", "worldie", "wonder strike", "volley", "volleyed",
  "half-volley", "chipped", "lobbed", "dinked", "tap-in", "tapped in", "bundled", "scrambled", "glancing", "looping", "lashed",
  "blasted", "smashed", "rifled", "arrowed", "whipped", "sublime",
];

/** Verdicts on a match the paper did not watch, and minds it cannot read. */
export const REPORT_VERDICTS: readonly string[] = [
  "spurned", "spurning", "deserved", "deservedly", "merited", "harsh", "lucky", "fortunate", "rode their luck", "on another day", "should have",
  "could have had", "dominated", "controlled", "second best", "outplayed", "wasteful", "profligate", "sloppy", "shambolic",
  "frailties", "howler", "gifted", "hard-fought", "hard-earned", "much-needed", "gritty", "battling", "balance of play",
  "bossed", "dictated", "laid siege", "peppered", "pressure told", "profligacy", "paid for their", "fine return", "good return", "big return", "would have made", "frustration", "frustrated", "desperate", "nerves",
  "jittery", "character", "spirit", "resilience", "resilient", "composure", "hunger", "determined", "galvanised", "rattled",
  "stunned", "shell-shocked", "thought he had", "thought they had", "believed he had", "believed they had", "chalked off",
  "defined the afternoon", "defined the match", "mettle", "dug deep", "ground out", "heartbreak",
];

/** The crowd, pressure on a manager, and club nicknames: none of it is in the facts. */
export const REPORT_CROWD: readonly string[] = [
  "the watching", "travelling fans", "travelling support", "the home crowd", "the faithful", "booed", "jeered", "boos",
  "boo-boys", "silenced", "the crowd", "atmosphere", "under-fire", "embattled", "pressure mounts", "heaped pressure",
  "Lilywhites", "Villans", "Toffees", "Gunners", "Magpies", "Black Cats", "Cherries", "Hornets", "Eagles", "Seagulls",
  "Hammers", "Clarets", "Cottagers", "Bees", "Foxes", "Saints", "Sky Blues", "Tractor Boys", "Tigers", "Red Devils",
  "Citizens", "the Reds", "the Blues", "north Londoners", "Londoners", "Midlanders",
];

/** The machine's own tells. */
export const REPORT_TELLS: readonly string[] = [
  "what followed", "in a match that", "in a game where", "in the end", "as it turned out", "would prove", "proved to be",
  "proved decisive", "proved costly", "would go on to", "underlined", "underscored", "highlighted", "epitomised",
  "encapsulated", "summed up", "a reminder that", "a sign of", "a sign that", "the message was clear", "the story of",
  "fittingly", "a sense of", "palpable", "for good measure", "a far cry from", "in stark contrast", "none other than",
  "will be hoping", "will rue", "left to rue", "left wondering", "questions will be asked", "simply put", "in short",
  "suffice to say", "indeed", "crucially", "tellingly", "ironically", "inevitably", "predictably", "remarkably",
  "made the difference", "microcosm", "sparked", "ignited", "a flurry", "vintage", "trademark", "no fewer than",
  "a whopping", "staggering", "elsewhere", "across the league",
];

/** American, or no British football writer's word, beyond the team-news list. */
export const REPORT_AMERICAN: readonly string[] = [
  "tied the game", "tied it", "tied at", "go-ahead", "game-winner", "game-winning", "goalie", "PK", "penalty kick",
  "overtime", "extra time", "clutch", "blowout", "rally", "rallied", "streak", "on the road", "road win", "home opener",
  "season-high", "standings", "backline", "scoreless", "shots on goal", "subbed in", "subbed off", "got the start",
  "saw minutes", "racked up", "chalked up", "on the season", "heartbreaker", "coach", "head coach", "standout", "stellar",
  "shot-stopper", "winless", "halftime",
];

/** Fantasy Premier League's own terms, which mean nothing here and name a source. */
export const REPORT_FPL: readonly string[] = [
  "FPL", "Fantasy Premier League", "price", "£", "ownership", "owned by", "selected by", "template", "bonus", "BPS", "ICT",
  "captaincy", "wildcard", "free hit", "bench boost", "triple captain", "differential", "xG", "xA", "expected goals",
  "expected assists", "big chance", "big chances", "Opta", "DefCon", "defensive contribution", "attacking returns",
];

/** A tipster's instruction; the paper sets facts side by side and stops. */
export const REPORT_ADVICE: readonly string[] = [
  "claim him", "pick him up", "snap up", "snap him up", "grab him", "stash", "get him in", "sell him", "drop him",
  "bench him", "start him", "must-have", "worth a look", "worth a punt", "one to watch", "on the radar", "keep an eye on",
];

/** Football read like a depth chart: nobody inherits a place, and nothing forecasts selection. */
export const REPORT_DEPTH_CHART: readonly string[] = [
  "next man up", "depth chart", "backup", "back-up", "handcuff", "understudy", "in line to start", "set to start",
  "should start", "will start", "likely to start", "expected to start", "the obvious replacement", "the beneficiary",
  "his chance", "an opportunity", "audition", "stake a claim", "earned a start", "steps in", "slots in", "the job is his",
  "first choice now", "the new taker", "on set pieces now", "in for the injured",
];

/** Draft words, kept out of the football: allowed only in a section's stake. */
export const REPORT_FANTASY: readonly string[] = [
  "haul", "hauled", "blank", "blanked", "owner", "owners", "owned", "picked by", "free agent", "draft", "waiver",
  "waivers", "fielded",
];

/** Plain phrases that turn into a rhythm: most in one match. */
export const REPORT_CAPPED_MATCH: readonly (readonly [phrase: string, most: number])[] = [
  ["pulled one back", 1], ["consolation", 1], ["on the break", 1], ["late on", 1], ["the hosts", 1], ["the visitors", 1],
  ["the home side", 1], ["bottom three", 1], ["relegation zone", 1], ["from close range", 1], ["from the spot", 1],
  ["equaliser", 2], ["winner", 1], ["doubled the lead", 1], ["restored the lead", 1], ["hit the woodwork", 1], ["only to", 1],
  ["just", 2], ["added time", 3], ["stoppage time", 3], ["low into the corner", 1], ["top corner", 1], ["inside the box", 1],
];

/** And across the whole day's page. */
export const REPORT_CAPPED_DAY: readonly (readonly [phrase: string, most: number])[] = [
  ["from time", 2], ["added time", 5], ["stoppage time", 5], ["on the hour", 1], ["midway through", 2],
  ["just before half-time", 2], ["there was", 1], ["the result leaves", 1], ["the result means", 1], ["moments later", 1],
  ["minutes later", 1], ["shortly after", 1], ["free agent", 3], ["points for", 3], ["has him", 2],
  ["while", 1],
];

/** Calling a man anything but his name. */
export const REPORT_NOT_HIS_NAME =
  /\b[Tt]he (?:\d+-year-old|youngster|veteran|summer signing|loanee|former [\p{L} ]{2,30} man|(?:Dutch|French|English|Irish|Welsh|Scots)man|Dane|Swede|Pole|Scot|Swiss|Czech|Serb|Croat|Spaniard|Norwegian|Brazilian|Argentine|Argentinian|Portuguese|German|Belgian|Italian|Ghanaian|Nigerian|Senegalese|Ivorian|Moroccan|Egyptian|Japanese|Korean|Uruguayan|Colombian|Austrian|Ukrainian|Hungarian|Slovakian|Slovenian|Albanian|Cameroonian|Malian|Jamaican|American|Canadian|Australian)\b/u;

/** The sub-editor's pencil: slips with one right answer are corrected, not sent back. */
export const REPORT_PENCIL: readonly (readonly [wrong: RegExp, right: string])[] = [
  [/\b(down|up) (\d+)-(\d+)\b/gu, "$2-$3 $1"],
  [/\bhalftime\b/gu, "half-time"],
  [/\bwinless\b/gu, "without a win"],
];
