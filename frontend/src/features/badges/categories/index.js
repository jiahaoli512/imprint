import { accountAgeCategory } from './accountAge';
import { countriesCategory } from './countries';
import { statesUSCategory } from './statesUS';

// Registry of badge categories, rendered in order by BadgesModal. To add a new
// category, implement the category shape — { id, title, subtitle, badgeCount,
// continents, getBadges(ctx) } — in its own file and add it here.
// `badgeCount`/`continents` are static metadata computed once from the
// category's own badge list (see countries.js for why); `continents` is `[]`
// for categories whose badges don't carry one.
//
// `ctx` is the shared context passed to every category's getBadges (see
// BadgesModal): `{ user, markers, visitedStates, visitedCountries }`. A
// category only needs to read the fields relevant to it — if that's enough
// (e.g. a "distance travelled" category reading `markers` directly), the modal
// and Badge component are generic and nothing else changes. A category that
// needs a NEW resolved set (its own boundary data, like visitedStates/
// visitedCountries) does require adding that hook + ctx field in BadgesModal —
// React's rules of hooks mean a hook can't be registered dynamically per
// category, so the orchestrator has to know about each concrete resolver.
// Order here is the carousel order in BadgesModal (Milestones → Passports → …).
export const BADGE_CATEGORIES = [
  accountAgeCategory,
  countriesCategory,
  statesUSCategory,
];
