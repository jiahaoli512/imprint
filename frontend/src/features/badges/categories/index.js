import { accountAgeCategory } from './accountAge';
import { countriesCategory } from './countries';
import { statesUSCategory } from './statesUS';

// Registry of badge categories, rendered in order by BadgesModal. To add a new
// category (e.g. distance travelled), implement the category shape — { id,
// title, subtitle, badgeCount, continents, getBadges(ctx) } — in its own file
// and add it here. `badgeCount`/`continents` are static metadata computed once
// from the category's own badge list (see countries.js for why); `continents`
// is `[]` for categories whose badges don't carry one. Nothing else needs to
// change; the modal and Badge component are generic.
//
// `ctx` is the shared context passed to every category's getBadges (see
// BadgesModal): `{ user, markers, visitedStates, visitedCountries }`. A
// category only needs to read the fields relevant to it.
// Order here is the carousel order in BadgesModal (Milestones → Passports → …).
export const BADGE_CATEGORIES = [
  accountAgeCategory,
  countriesCategory,
  statesUSCategory,
];
