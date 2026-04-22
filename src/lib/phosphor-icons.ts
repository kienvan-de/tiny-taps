// Curated list of Phosphor icons suitable for kids content tagging.
// Each entry is the icon base name (e.g. "PawPrint" → phosphor-svelte exports PawPrintIcon).
// Grouped by category for the admin picker UI.

export interface IconEntry {
  name: string;   // phosphor base name — used as the stored value in DB
  label: string;  // human-readable label shown in picker
}

export interface IconGroup {
  group: string;
  icons: IconEntry[];
}

export const ICON_GROUPS: IconGroup[] = [
  {
    group: 'Animals',
    icons: [
      { name: 'PawPrint',   label: 'Paw' },
      { name: 'Dog',        label: 'Dog' },
      { name: 'Cat',        label: 'Cat' },
      { name: 'Bird',       label: 'Bird' },
      { name: 'Fish',       label: 'Fish' },
      { name: 'Butterfly',  label: 'Butterfly' },
      { name: 'Horse',      label: 'Horse' },
      { name: 'Cow',        label: 'Cow' },
      { name: 'Rabbit',     label: 'Rabbit' },
      { name: 'Shrimp',     label: 'Shrimp' },
      { name: 'Bone',       label: 'Bone' },
      { name: 'Rabbit',     label: 'Rabbit' },
    ],
  },
  {
    group: 'Food & Drink',
    icons: [
      { name: 'ForkKnife',  label: 'Fork & Knife' },
      { name: 'Hamburger',  label: 'Burger' },
      { name: 'Pizza',      label: 'Pizza' },
      { name: 'Cookie',     label: 'Cookie' },
      { name: 'Cake',       label: 'Cake' },
      { name: 'IceCream',   label: 'Ice Cream' },
      { name: 'Bread',      label: 'Bread' },
      { name: 'Egg',        label: 'Egg' },
      { name: 'Cheese',     label: 'Cheese' },
      { name: 'Carrot',     label: 'Carrot' },
      { name: 'Avocado',    label: 'Avocado' },
      { name: 'Orange',     label: 'Orange' },
      { name: 'Pepper',     label: 'Pepper' },
    ],
  },
  {
    group: 'Vehicles',
    icons: [
      { name: 'Car',        label: 'Car' },
      { name: 'Bus',        label: 'Bus' },
      { name: 'Truck',      label: 'Truck' },
      { name: 'Tractor',    label: 'Tractor' },
      { name: 'Bicycle',    label: 'Bicycle' },
      { name: 'Motorcycle', label: 'Motorcycle' },
      { name: 'Airplane',   label: 'Airplane' },
      { name: 'Rocket',     label: 'Rocket' },
      { name: 'Boat',       label: 'Boat' },
      { name: 'Ambulance',  label: 'Ambulance' },
      { name: 'Train',      label: 'Train' },
      { name: 'Anchor',     label: 'Anchor' },
    ],
  },
  {
    group: 'Nature',
    icons: [
      { name: 'Tree',       label: 'Tree' },
      { name: 'Flower',     label: 'Flower' },
      { name: 'Leaf',       label: 'Leaf' },
      { name: 'Plant',      label: 'Plant' },
      { name: 'Sun',        label: 'Sun' },
      { name: 'Moon',       label: 'Moon' },
      { name: 'Cloud',      label: 'Cloud' },
      { name: 'Rainbow',    label: 'Rainbow' },
      { name: 'Snowflake',  label: 'Snowflake' },
      { name: 'Fire',       label: 'Fire' },
      { name: 'Wind',       label: 'Wind' },
      { name: 'Lightning',  label: 'Lightning' },
      { name: 'Island',     label: 'Island' },
    ],
  },
  {
    group: 'Learning',
    icons: [
      { name: 'Book',           label: 'Book' },
      { name: 'Pencil',         label: 'Pencil' },
      { name: 'Ruler',          label: 'Ruler' },
      { name: 'Scissors',       label: 'Scissors' },
      { name: 'Eraser',         label: 'Eraser' },
      { name: 'Backpack',       label: 'Backpack' },
      { name: 'PaintBrush',     label: 'Paint Brush' },
      { name: 'Palette',        label: 'Palette' },
      { name: 'MusicNote',      label: 'Music' },
      { name: 'NumberSquareOne',label: 'Numbers' },
      { name: 'Globe',          label: 'Globe' },
      { name: 'Compass',        label: 'Compass' },
    ],
  },
  {
    group: 'Shapes & Objects',
    icons: [
      { name: 'Circle',     label: 'Circle' },
      { name: 'Square',     label: 'Square' },
      { name: 'Triangle',   label: 'Triangle' },
      { name: 'Diamond',    label: 'Diamond' },
      { name: 'Cube',       label: 'Cube' },

      { name: 'Star',       label: 'Star' },
      { name: 'Heart',      label: 'Heart' },
      { name: 'Balloon',    label: 'Balloon' },
      { name: 'Gift',       label: 'Gift' },
      { name: 'Umbrella',   label: 'Umbrella' },
      { name: 'Confetti',   label: 'Confetti' },
    ],
  },
  {
    group: 'People & Body',
    icons: [
      { name: 'Baby',       label: 'Baby' },
      { name: 'Smiley',     label: 'Smiley' },
      { name: 'Hand',       label: 'Hand' },
      { name: 'Eye',        label: 'Eye' },
      { name: 'Ear',        label: 'Ear' },
      { name: 'Tooth',      label: 'Tooth' },
      { name: 'House',      label: 'House' },
      { name: 'Bed',        label: 'Bed' },
      { name: 'Bathtub',    label: 'Bathtub' },
      { name: 'Crown',      label: 'Crown' },
      { name: 'Robot',      label: 'Robot' },
    ],
  },
  {
    group: 'Sports & Play',
    icons: [
      { name: 'SoccerBall', label: 'Soccer' },
      { name: 'Basketball', label: 'Basketball' },
      { name: 'Volleyball', label: 'Volleyball' },
      { name: 'Guitar',     label: 'Guitar' },
      { name: 'Microphone', label: 'Microphone' },
      { name: 'Camera',     label: 'Camera' },
      { name: 'Bell',       label: 'Bell' },
      { name: 'Flag',       label: 'Flag' },
      { name: 'Sparkle',    label: 'Sparkle' },
    ],
  },
];

// Flat list for quick lookup by name
export const ICON_LIST: IconEntry[] = ICON_GROUPS.flatMap(g => g.icons);

// Default fallback icon name when tag has no icon set
export const DEFAULT_ICON = 'Tag';
