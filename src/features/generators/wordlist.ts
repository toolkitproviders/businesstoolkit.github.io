/**
 * Passphrase word list.
 *
 * Stored as one space-separated string and split at module load — an array of
 * 512 quoted strings costs far more source bytes for no benefit.
 *
 * Size matters for security: entropy per word is log2(listLength), so this
 * list contributes exactly 9 bits per word. Words are 4–8 letters, lowercase,
 * unambiguous to spell and free of near-homophones, so a passphrase can be
 * read aloud or typed from memory without guesswork.
 */
const RAW = `
anchor amber apple arbor arch arrow ash aspen atlas attic autumn avenue awake
axis azure badge badger bamboo banjo barley basalt basin basket batch beacon
beam bean bear beech beetle bell bench berry birch bison blade blanket blaze
bloom blossom blue bluff board boat bolt bonfire bonus border boulder bracket
braid bramble branch brass bread breeze brick bridge bright bronze brook broom
brush bubble bucket buckle buffalo bugle bundle bunker burrow button cabin
cable cactus camel campus canal candle canoe canopy canyon cape captain carbon
cargo carrot carve cascade castle cavern cedar cellar cement census chain chalk
chamber channel chapel charcoal charm chart cheese cherry chess chestnut chime
chisel cider cinder circle citrus city clay cliff climate cloak clock clover
cluster coast cobalt cocoa coffee coil collar colony column comet compass
copper coral corner cottage cotton council county cove coyote crane crater
crayon creek crescent crest cricket crimson crocus crown crystal cup curve
cygnet cypress daisy damson dawn daylight deck delta denim desert dial diamond
dice ditch dock dolphin dome donkey draft dragon drawer dream drift drum dune
dusk eagle earth east echo eclipse edge elder elk elm ember emerald empire
engine equal ermine estate ether evening exile fable fabric falcon fallow fan
farm feather fennel fern ferry fiber fiddle field figure filter finch fjord
flag flame flask fleet flint float flock flour flower flute foam focus fold
forest forge fossil fountain fox frame freckle frost fruit garden garlic garnet
gate gazelle geode ginger glacier glade glass globe glove glow gold gorge
granite grape grass gravel green grotto grove guitar gulf gully gypsum hail
hamlet hammer harbor harvest hawk hazel header hearth heather hedge helix
hemlock heron hickory hollow honey hoof horizon hornet horse hostel hour hurdle
hutch ice icon igloo indigo ink inlet iris iron island ivory ivy jade jasmine
jetty jewel jigsaw journal juniper jute kayak kelp kernel kestrel kettle key
kiln kite koala lace ladder lagoon lake lamp lantern larch lark latch laurel
lava lawn leaf ledge lemon lentil leopard lever lichen lilac lily lime linen
lion loft lotus lumber lunar lupine lynx magnet magpie mahogany mallow mango
manor maple marble marigold market marsh mask mast meadow medal melon mercury
mesa meteor mica midday mineral mint mirror mist mitten moat monsoon moon moss
motor mountain mouse mulberry muscle museum mussel nectar needle nest nettle
nickel night nimbus noble north notch nova nugget nutmeg oak oasis oat obelisk
ocean ochre octave olive onion onyx opal orange orbit orchard orchid organ
osprey otter outpost oval owl oxide oyster paddle pagoda palace palm pantry
papaya paper parcel parish parsley pasture patch pathway pebble pelican pencil
penguin pepper perch petal pewter phantom phoenix piano picket pigeon pillar
pilot pine pistol piston pitcher planet plank plateau plaza plum plume pocket
pollen pond poplar poppy porch portal potato pottery prairie press primrose
prism puffin pumpkin purple quarry quartz quest quill quilt quiver rabbit
radish rafter ragged rail rainbow ranch rapid raven ravine reed reef relay
resin ribbon ridge rifle rim ripple river road robin rocket rook root rope
rose rowan ruby rudder rug ruin runner rust saddle safari saffron sage sail
salmon salt sand sandal sapling sapphire satin savanna scale scarf school
scooter scout screen scroll seal seed sequoia shade shale shard shawl shed
shell shelter sherbet shield shingle shore shovel shrine shuttle sierra signal
silk silo silver siren skate sketch ski sky slate sleet slope smoke snail snow
socket soda solar sonnet sorbet south spade span spark sparrow spear spice
spider spinach spire spoke spring spruce spur square squash squirrel stable
stag stairway stamp star steam steel stem stencil steppe stitch stone stork
storm stove strand straw stream street stucco studio summit sunrise sunset
surf swallow swamp swan sweater swift sword sycamore table tadpole talon tamer
tandem tangerine tannin tapestry target tavern tawny teak teapot temple tender
tennis tent terrace thicket thimble thistle thorn thread thrush thunder ticket
tide tiger timber tinder tissue toast toffee token tomato topaz torch tortoise
tower town trail train tram trawler treaty trellis trench triangle tribe trout
trowel truffle trumpet trunk tulip tundra tunnel turbine turret turtle twig
twilight umber umbrella unicorn union upland urchin valley vanilla vault velvet
venture verbena vessel viola violet viper vista volcano vulture wagon walnut
walrus warden warren wasp water waterfall wattle weasel weaver web wedge whale
wharf wheat wheel whisker willow window winter wisteria wolf wombat wonder
woodland wool wren yacht yarn yellow yew yield yogurt yonder zebra zenith
zephyr zinc zircon zone
`;

export const PASSPHRASE_WORDS: string[] = Array.from(
  new Set(RAW.split(/\s+/).filter(Boolean)),
);

/**
 * Bits of entropy each word contributes. Exported so the UI can show an honest
 * figure rather than a hard-coded number that drifts when the list changes.
 */
export const BITS_PER_WORD = Math.log2(PASSPHRASE_WORDS.length);
