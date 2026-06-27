import { accountAgeCategory } from './accountAge';
import { countriesCategory } from './countries';

// Registry of badge categories, rendered in order by BadgesModal. To add a new
// category (e.g. countries visited, distance travelled), implement the category
// shape — { id, title, subtitle, getBadges(ctx) } — in its own file and add it
// here. Nothing else needs to change; the modal and Badge component are generic.
//
// `ctx` is the shared context passed to every category's getBadges (see
// BadgesModal). Today it carries `{ user }`; future categories can read
// additional fields (e.g. markers) once those are threaded through.
// Order here is the carousel order in BadgesModal (Milestones → Passports → …).
export const BADGE_CATEGORIES = [
  accountAgeCategory,
  countriesCategory,
];
