// Countries badge category ("Passports") — stamps for the countries a user has
// visited. No badges defined yet; getBadges returns an empty list so the modal
// shows the category's empty state. When implemented, it can read visited
// countries from the shared ctx (e.g. derived from markers) without any modal
// change.
export const countriesCategory = {
  id: 'countries',
  title: 'Passports',
  subtitle: "Stamps for the countries you've visited.",
  getBadges() {
    return [];
  },
};
