// ===================== COMICS: STATIC DATA =====================
const CG = [ // genres
  {k:'hero',n:'Superhero'},{k:'scifi',n:'Science fiction'},{k:'fantasy',n:'Fantasy'},{k:'horror',n:'Horror'},{k:'crime',n:'Crime'},
  {k:'mystery',n:'Mystery'},{k:'thriller',n:'Thriller'},{k:'western',n:'Western'},{k:'romance',n:'Romance'},{k:'comedy',n:'Comedy'},
  {k:'satire',n:'Satire'},{k:'slice',n:'Slice of life'},{k:'literary',n:'Literary'},{k:'historical',n:'Historical'},{k:'war',n:'War'},
  {k:'adventure',n:'Adventure'},{k:'ya',n:'Young adult'},{k:'kids',n:"Children's"},{k:'anthology',n:'Anthology'},{k:'exp',n:'Experimental'},
  {k:'alt',n:'Underground'},{k:'manga',n:'Manga-influenced'}
];
const GI = {}; CG.forEach((g,i)=>GI[g.k]=i);
// era: [startYear, name, genre weights in CG order]
const ERAS = [
  [1938,'Golden Age',      [10,3,1,4,6,2,1,5,6,5,2,1,0.2,1.5,4,5,1,6,3,0.1,0,0]],
  [1956,'Silver Age',      [12,5,1.5,1.5,1.5,1.5,1,4,5,4,3,1,0.3,1,4,3,2,5,2,0.3,1,0]],
  [1970,'Bronze Age',      [12,4,4,5,2,1.5,1.5,2,2,3,3,1,1,1,2.5,3,1.5,3,3,1,3,0.2]],
  [1985,'Creator boom',    [12,4,4,3,4,2,2,1,0.5,2,2,2,3,1.5,1,2,1,1.5,2,3,4,1.5]],
  [1993,'Speculator era',  [16,3,4,4,2,1,2,0.5,0.3,1.5,1,1.5,1.5,0.8,0.5,2,1,1,1,1.5,3,2]],
  [2000,'Modern era',      [11,4,4,5,5,2.5,3,1,1,2,1.5,2.5,3,1.5,1,2,2.5,2,1,1.5,2.5,3]],
  [2010,'Creator-owned wave',[9,6,5,5,4,2.5,3,1.5,1.5,2,1.5,3,3,1.5,0.8,2.5,3.5,3,1.5,1.5,2,3]],
  [2020,'Current era',     [8,5,6,7,3.5,3,3,1.5,2.5,2,1.5,3,3,1.5,0.6,2.5,4,4,1.5,1.5,2,4]]
];
function eraOf(yr){ let e=0; for (let i=0;i<ERAS.length;i++) if (yr>=ERAS[i][0]) e=i; return e; }
const TIER_N = ['Major publisher','Mid-size publisher','Established indie','Small press','Boutique press','Self-published'];
const TIERF = [1, 0.42, 0.2, 0.07, 0.035, 0.012];
// [name, short, tier, founded, folds, genre boosts {genreKey:mult}, imprints]
const PUB_DEF = [
  ['Vanguard Comics','VGD',0,1938,0,{hero:2.4,war:1.3,western:1.1},['Vanguard Midnight','Vanguard Junior']],
  ['Crown & Comet','C&C',0,1939,0,{hero:2.2,scifi:1.4,romance:1.3,kids:1.2},['Nocturne','Comet Kids']],
  ['Halcyon Periodicals','HAL',1,1946,1956,{horror:3,crime:3,war:1.5,romance:1.4},[]],
  ['Brightwater Comics','BRW',1,1949,0,{kids:3.5,comedy:3,romance:1.5,ya:1.5},[]],
  ['Gutter Press Collective','GPC',3,1968,0,{alt:5,satire:3,exp:3,literary:1.5},[]],
  ['Rat Alley Comix','RAC',3,1969,1986,{alt:6,satire:3,exp:2},[]],
  ['Northlight Publishing','NLP',1,1972,0,{scifi:2.5,fantasy:2.5,adventure:1.5},[]],
  ['Black Lantern Press','BLP',2,1981,0,{horror:2.2,crime:1.8,fantasy:1.4,literary:1.4},[]],
  ['Kestrel House','KSH',2,1984,0,{fantasy:2,adventure:1.8,scifi:1.5,manga:1.5},[]],
  ['Redshift Press','RSP',1,1986,0,{scifi:2.2,thriller:1.6,crime:1.4,hero:1.2},[]],
  ['Tin Roof Press','TRP',3,1987,0,{slice:3,literary:2.5,comedy:1.5,alt:1.5},[]],
  ['Undertow Comics','UND',2,1988,0,{crime:2.2,thriller:2,horror:1.6},[]],
  ['Bramble Books','BRB',3,1990,2011,{kids:2,fantasy:2,ya:2},[]],
  ['Monolith Comics','MON',0,1992,0,{hero:1.6,scifi:1.6,fantasy:1.4,horror:1.3,crime:1.2},['Monolith Edge']],
  ['Sable Crow Comics','SCC',1,1993,1998,{hero:2.5,fantasy:2,horror:1.8},[]],
  ['Fathom & Finch','F&F',2,1995,0,{literary:2.5,historical:2,mystery:1.8,romance:1.5},[]],
  ['Low Tide Comics','LTC',3,1999,0,{horror:2.2,alt:2,exp:1.8},[]],
  ['Quiet Hours Press','QHP',3,2003,0,{literary:2.5,slice:2.2,romance:1.8},[]],
  ['Paper Moth Books','PMB',1,2004,0,{ya:3,kids:2,literary:1.8,fantasy:1.6,manga:1.5},[]],
  ['Signal Fire Comics','SFC',2,2007,0,{scifi:2,thriller:1.8,crime:1.6,horror:1.5},[]],
  ['Copperline Comics','CPL',3,2009,0,{western:3,historical:2,crime:1.6},[]],
  ['Blue Heron Editions','BHE',4,2011,0,{literary:3,exp:2.5,slice:2},[]],
  ['Lodestar Comics','LDS',2,2012,0,{fantasy:2.2,scifi:2,ya:1.6,manga:1.6},[]],
  ['Dogear Editions','DGE',3,2014,0,{comedy:2.5,satire:2,slice:2,kids:1.5},[]],
  ['Static Cling Press','SCP',4,2016,0,{alt:3,exp:3,horror:1.6},[]],
  ['Wildfell Press','WFP',3,2017,0,{horror:2.5,fantasy:2,romance:1.6},[]],
  ['Ampersand & Ink','A&I',4,2019,0,{romance:2.5,slice:2,ya:2},[]],
  ['Moonrise Comics','MRC',3,2021,0,{manga:2.5,fantasy:2,ya:2},[]],
  ['Grayhaven Micro','GHM',4,2022,0,{horror:2.4,mystery:2,exp:1.6},[]],
  ['Riverbend Zine Co.','RZC',4,2024,0,{alt:3,slice:2.5,comedy:1.8},[]]
];
const STUDIOS_FILM = ['Silverframe Pictures','Northbeam Studios','Paperkite Films','Harborlight Entertainment','Redwood Circle Films','Meridian Road Pictures','Old Lantern Films'];
const STUDIOS_TV = ['Lanternfish Television','Tidewater+','Loop Streaming','Cinderbox','Broadcast Seven','Halfmoon Network'];
const OUTLETS = ['Panel & Page','The Gutter Report','Inkwire','Longbox Weekly','Splash Page Review'];
const AWARD_NAME = 'Quill & Panel Awards';
const AWARD_CATS = [['bs','Best Continuing Series'],['bn','Best New Series'],['bl','Best Limited Series'],['bw','Best Writer'],['ba','Best Artist'],['bg','Best Graphic Novel'],['bi','Best Single Issue']];
const CONS = [['Harbor City Comic Expo',7,23],['Paper Trails Small Press Fest',9,17],['Northfall Comic Con',10,8]];
const SHOP_NAME = 'Second Panel Comics';

// names (creators and non-costumed characters)
const CFN = ['Mara','Tomas','Ines','Theo','June','Arlo','Priya','Dev','Noor','Felix','Ada','Rafe','Sunny','Iris','Otto','Lena','Cass','Wendell','Hana','Bram','Odette','Kai','Rosa','Emil','Vera','Silas','Nadia','Jonah','Mireille','Ezra','Lucia','Gus','Tamsin','Idris','Beatrix','Lou','Yuki','Marcus','Pilar','Anselm','Greta','Colm','Zadie','Ray','Wren','Hollis','Delphine','Abe','Signe','Tobias','Leilani','Moss','Freya','Nico','Ottilie','Sol','Rhea','Bastian','Clementine','Dario','Esme','Fitz','Gwen','Hugo','Imogen','Jem','Kit','Lotte','Milo','Nell','Orla','Pax','Quentin','Ruth','Sami','Tove','Una','Vik','Winnie','Xavi','Yara','Zeke','Anouk','Baz','Celeste','Dolores','Eamon','Fern'];
const CLN = ['Ellison','Vale','Okonkwo','Marchetti','Brandt','Castellanos','Holm','Achebe','Sorensen','Varga','Lindqvist','Oyelaran','Delacroix','Ferreira','Nakamura','Quill','Harrow','Szabo','Ibarra','Fenwick','Abernathy','Mbeki','Rourke','Strand','Takahashi','Voss','Kowalczyk','Adeyemi','Moreau','Grieve','Paquette','Hollister','Ruiz','Sato','Blackwood','Kincaid','Nwosu','Petrov','Lachance','Whitcombe','Esposito','Dunleavy','Farrow','Galloway','Haddad','Iversen','Jovanovic','Kaur','Lemaire','Mendoza','Norrell','Ostrowski','Pike','Quesnel','Roscoe','Salinger','Tran','Umberto','Vasquez','Winslow','Yilmaz','Zeller','Aldana','Bergeron','Crane','Dorsey','Emberly','Fontaine','Gallant','Hawthorne','Ilunga','Jansen','Kessler','Lowell','Marlow','Nygaard','Orsini','Pemberton','Quarry','Rasmussen','Sinclair','Thibault','Underhill','Valdez','Wexford','Yeats'];
// costumed names
const HP = ['Captain','Doctor','Kid','Lady','Mister','Miss','Night','Star','Iron','Silver','Red','Blue','Black','White','Storm','Shadow','Solar','Quantum','Atomic','Crimson','Golden','Steel','Thunder','Moon','Sky','Void','Phantom','Ultra','Wild','Ember','Glass','Hollow','Rust','Tidal','Winter','Signal','Neon','Paper','Brass','Cobalt'];
const HN = ['Wren','Comet','Sentinel','Spectre','Blaze','Bolt','Mantle','Warden','Lancer','Ranger','Siren','Viper','Lynx','Kestrel','Tempest','Vanguard','Cipher','Orbit','Nova','Jaguar','Heron','Hammer','Magpie','Fathom','Pilgrim','Beacon','Harrier','Gargoyle','Jackal','Marauder','Paragon','Monarch','Specter','Rook','Swift','Talon','Vesper','Zephyr','Anvil','Juggernaut','Nightjar','Skylark','Thorn','Cinder','Mirage'];
const HBLOCK = new Set(['Moon Knight','Night Hawk','Red Arrow','Captain Comet','Black Knight','Iron Fist','Night Owl','Red Hawk','Black Hawk','Doctor Fate','Black Canary','Iron Man','Night Wing','Star Fire','Black Bolt','Kid Flash','Blue Beetle','Captain Atom','Black Panther','Night Crawler','Black Widow','Night Shade','Moon Stone','Captain Marvel','Silver Surfer','Doctor Doom','Captain Cold','Black Lightning','Kid Eternity','Star Lord','Iron Lad','Red Tornado','Doctor Light','Mister Miracle','Captain Boomerang','Shadow Cat','Storm Shadow','Lady Death','Doctor Mid-Nite','Ultra Boy','Star Sapphire','White Tiger','Blue Marvel','Miss Martian','Solar Man','Moon Girl','Thunder Bolt','Void Knight','Golden Age','Steel Mantle']);
const TEAMN = ['League','Legion','Squad','Society','Brigade','Assembly','Order','Circle','Guard','Syndicate','Company','Corps'];
const TEAMA = ['Midnight','Emerald','Iron','Last','Outer','Silver','Signal','Vanguard','Northern','Hidden','Tomorrow','Paragon','Harbor','Lantern'];

// title word banks
const TA = ['Hollow','Silent','Last','Crimson','Broken','Quiet','Burning','Glass','Pale','Wild','Drowned','Lonely','Endless','Golden','Black','Little','Second','Midnight','Winter','Forgotten','Bright','Salt','Paper','Ghost','Velvet','Distant','Sunken','Shattered','Northern','Savage','Gentle','Strange','Final','Hidden','Violet','Lucky','Wicked','Tender','Rusted','Sleeping','Holy','Crooked','Borrowed','Starving','Sweet','Bitter','Lost','Blue','Ninth','Empty'];
const TN = ['Crown','Orchard','Harbor','Signal','Garden','Kingdom','Engine','Lantern','Ferry','Choir','Frontier','Circus','Mile','Tide','Witness','Parish','Archive','Machine','House','River','Hour','Season','Country','Empire','Road','Frequency','Hunger','Oath','Sparrow','Wolf','Moth','Saint','Stranger','Orbit','Horizon','Harvest','Island','Chapel','Diner','Motel','Lighthouse','Mountain','Well','Carnival','Radio','Kitchen','Library','Station','Vineyard','Quarry'];
const TPLACE = ['Ashfall','Greyhaven','Coldwater','Marrow Creek','Bellwether','Low Hollow','Kessler Point','Vesper Bay','Station Nine','Saltmarsh','Tannery Row','Dunmore','Half Moon Bay','Brackwater','Juniper Falls','Hesper','Cinder Flats','Oldcastle','Northgate','Sorrow Ridge','Pale River','Candle Street','Wolf County','Fennick Island'];
const GENRE_WORDS = {
  scifi:['Starfall','Void','Colony','Outpost','Drift','Parallax','Hyperion','Singularity','Ark','Relay','Nebula','Exodus','Cosmonaut','Satellite','Tessellate','Zero Point','Afterlight','Deep Field','Red Planet','Lightyear'],
  fantasy:['Thornwood','Dragonmere','Spellbound','Wyrm','Rune','Hearthstone','Witchlight','Moonblade','Fae','Grimoire','Starthorn','Kingsbane','Oakheart','Emberfall','Mistral','Hexen','Wandering Keep','Silverfen','Barrow','Wyldwood'],
  horror:['Rot','Hollowing','Dread','Carrion','The Unquiet','Nightsoil','Pallor','Wormwood','Bone Garden','Harrowed','Gloam','The Visitor','Cellar','Rust Belt Gothic','Teeth','Lamb','Hush','Pale Thing','Dollhouse','Ossuary'],
  crime:['Blues','Dead Drop','Hard Luck','Night Shift','Cold Case','Payday','Getaway','Snitch','Heist','Pawn','Long Con','Bad Blood','Vice','The Fixer','Kickback','Wire','Knuckles','Bagman','Dirty Money','Gun Moll'],
  mystery:['Clue','Riddle','The Locked Room','Whodunit','Inquest','Case File','Alibi','The Detective','Red Herring','Cipher Club','The Vanishing','Missing','Casebook','The Inspector','Keyhole'],
  thriller:['Burn Notice','Blackout','Countdown','Extraction','Safehouse','Cold Open','Deadline','Kill Switch','Tripwire','Zero Hour','Cold Protocol','Handler','Asset'],
  western:['Dust','Six-Gun','Rawhide','Sundown','Maverick','Tumbleweed','Gold Rush','Outlaw','Saddle','Frontier Law','Buckshot','Wanted','High Noon','Iron Horse','Coyote'],
  romance:['Sweetheart','True Love','Heartstrings','First Kiss','Secret Hearts','Love Letters','Forever Yours','Moonlight Kiss','Girl Next Door','Summer Fling','Wedding Bells','Lovelorn'],
  comedy:['Pals','Hijinks','Goofballs','Oddballs','Nutty','Slapstick','Wisecracks','Mischief','Knuckleheads','Boneheads','Rascals'],
  satire:['Cracked Mirror','Buffoon','Snark','Folly','The Absurd','Lampoon','Spoof','Jester','Punchline','Grotesque'],
  slice:['Days','Roommates','Weekend','Lunch Break','Small Town','Neighbours','The Commute','Porch Light','Rent','Night Market','Laundromat','Part-Time'],
  literary:['Elegy','Anatomy of','Portrait','Testament','Almanac','Ledger','Correspondence','Requiem','Inheritance','Aftermath','Tributary','Palimpsest'],
  historical:['Dynasty','Revolution','Empire','Crusade','Pioneers','Chronicle','Armada','Siege','Rebellion','Legion','Plague Year'],
  war:['Combat','Battlefront','Foxhole','Airborne','Frontline','Warbirds','Dogfight','Trench','Sergeant','Company','Blitz','Commando','Sub Hunter'],
  adventure:['Expedition','Treasure','Jungle','Voyage','Explorer','Castaway','Pirates','Lost World','Safari','Quest','Atlas','Compass'],
  ya:['Senior Year','Homeroom','Spellschool','Summer Camp','The New Kid','Detention','Prom','Varsity','Graduation','Locker 13'],
  kids:['Bunny Town','Pip & Button','Captain Carrot','Tiny Robots','Pupcakes','Moon Mice','Wobble','Treehouse','Picnic Planet','Doodlebug','Jellybean','Snowpup'],
  anthology:['Tales','Stories','Showcase','Theatre','Weird Tales of','Chillers','Parade','Omnibus of Oddities','Mystery Hour'],
  exp:['Glyph','Static','Signal/Noise','Recursion','Fragments','Collage','Negative Space','Folds','Loop','Aperture'],
  alt:['Comix','Raw Nerve','Weirdo','Zap Street','Underground','Sludge','Head Trip','Freak Show','Mutant Suburb','Grease'],
  manga:['Blade Dancer','Spirit Circuit','Neo Tokyo Nights','Shonen Star','Kitsune Road','Mecha Heart','Sakura Street','Ghost Idol','Oni Rising','Ramen Knights']
};
const PREMISE = {
  hero:['A {job} discovers {power} and takes up the mantle of {hero}.','{hero} returns after a decade away to find the city has moved on.','A team of reluctant heroes fights a threat none of them can face alone.','The sidekick of a fallen legend steps out of the shadows.'],
  scifi:['The crew of a salvage ship finds something alive in a dead colony.','A generation ship is two centuries late and the passengers are waking up.','An engineer on a failing orbital station uncovers who is sabotaging it.','First contact goes wrong in the most bureaucratic way possible.'],
  fantasy:['A beastkeeper sworn to a dying queen must hide the last dragon egg.','Three siblings inherit a map to a kingdom that no longer exists.','A witch who cannot lie is hired to guard the court of liars.','The gods have gone quiet, and a village priest goes looking for them.'],
  horror:['Something has been living under the orchard for longer than the town has existed.','A night-shift nurse keeps seeing the same patient die.','A family moves into a house that remembers everyone who lived there.','In a flooded mill town, the children stopped aging.'],
  crime:['A getaway driver tries to quit after one last job goes sideways.','A disgraced detective works cold cases nobody wants solved.','Two brothers run a pawn shop that fences more than jewellery.','A small-town sheriff finds a suitcase of money and a body.'],
  mystery:['A retired magician solves murders at a seaside hotel.','A librarian notices the same book returned by a dead man.','An amateur sleuth club of pensioners takes on a missing-person case.'],
  thriller:['A spy wakes up with a new face and someone else\'s mission.','A journalist has 72 hours to prove a conspiracy before she vanishes.','An extraction specialist must rescue the man who ruined her life.'],
  western:['A widow hunts the gang that burned her homestead.','A travelling doctor keeps a frontier town alive, and its secrets buried.','The last stagecoach line in the territory runs through outlaw country.'],
  romance:['Two rival florists fall for each other over one very long summer.','A nurse and a pilot write letters across a war.','A matchmaker who has never been in love meets her match.'],
  comedy:['Three roommates try to run a haunted bed-and-breakfast.','A hapless inventor\'s gadgets cause chaos in a sleepy suburb.','A kid and his dog get into trouble every single week.'],
  satire:['A superhero union goes on strike.','Corporate middle managers compete to become emperor of a collapsing company.','An advertising agency accidentally starts a religion.'],
  slice:['Life in a 24-hour diner, one regular at a time.','Two sisters run their late father\'s bookshop.','A year in the life of a small-town radio host.'],
  literary:['A daughter reconstructs her mother\'s life from a box of letters.','A graphic memoir of growing up above a laundromat.','An old sailor recounts the voyage that ended his career.'],
  historical:['The rise and fall of a merchant dynasty in a port city.','A codebreaker\'s war, told from the operator\'s chair.','A revolution seen through the eyes of a printer\'s apprentice.'],
  war:['A bomber crew flies its last twenty missions.','A platoon holds a bridge for six impossible days.','A medic crosses the front lines to bring back a friend.'],
  adventure:['An archaeologist and her rival race to a lost city.','A sea captain chases a legendary whale of pure gold.','Explorers map a hollow world beneath the ice.'],
  ya:['A shy student joins the school\'s secret monster-hunting club.','Four friends spend the summer before college solving a disappearance.','A girl discovers her school is a training ground for witches.'],
  kids:['A bunny postmaster delivers letters to every creature in the forest.','Tiny robots help a little girl fix the town\'s broken clock.','Two mice build a rocket out of teacups.'],
  anthology:['Short tales of the strange and uncanny from rotating creators.','A showcase of new voices, a different story every issue.'],
  exp:['A wordless comic told entirely through the rooms of one apartment.','A story that folds in on itself, one panel at a time.'],
  alt:['Scenes from a scuzzy city seen through a cartoonist\'s crooked eye.','Autobiographical strips about bad jobs and worse apartments.'],
  manga:['A sword prodigy enters a tournament to free her village.','A delivery boy discovers his scooter is a spirit in disguise.','Idols by day, demon hunters by night.']
};
const JOBS=['night-shift paramedic','high-school chemistry teacher','bike courier','disgraced cop','museum curator','struggling musician','subway engineer','marine biologist','sanitation worker','junior reporter'];
const POWERS=['impossible speed','the ability to bend light','a stolen alien gauntlet','control over storms','a sentient shadow','an ancient armour','the voices of the dead','perfect memory','gravity itself'];
const CM_HANDLE_A = ['longbox','panel','gutter','ink','keyissue','firstapp','slabbed','cover','variant','backissue','silverage','bronze','indie','spec','pulp','dimebin','mylar','boards','newsstand','splash','fourcolor','wednesday'];
const KEY_N = { fa:'First appearance', cam:'First cameo', ss:'First solo series', dth:'Death of', ret:'Return of', cos:'New costume for', ori:'Origin of', team:'First appearance of the team', arc:'Start of a major storyline', ic:'Iconic cover', cont:'Controversial issue', ann:'Anniversary issue', cd:'Creator debut', ct:'New creative team', fin:'Final issue', aw:'Award-winning issue', as:'Adapted storyline', one:'First issue' };
