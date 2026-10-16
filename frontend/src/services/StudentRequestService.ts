import { getAvailabilityByVolunteer } from './AvailabilityService';
import { getUser } from './UserService';
import { getVolunteersByPrefSupportMode } from './VolunteerService';
import type { StudentRequestVolunteer } from '../types/StudentRequestVolunteer';
import type { Volunteer } from '../types/Volunteer';

/** Loads matching-mode volunteer profiles and their recurring availability for the request form. */
export async function loadRequestFormVolunteers(
  supportMode: Volunteer['prefSupportMode'],
): Promise<StudentRequestVolunteer[]> {
  const volunteers = await getVolunteersByPrefSupportMode(supportMode);
  const profiles = await Promise.all(volunteers.map(async volunteer => {
    const [user, availability] = await Promise.all([
      getUser(volunteer.UID),
      getAvailabilityByVolunteer(volunteer.UID),
    ]);

    if (!user || !user.isVolunteer) return null;

    return {
      volUID: volunteer.UID,
      name: user.name,
      rating: volunteer.avgRating,
      skills: volunteer.skills,
      categories: volunteer.volCategories,
      supportMode: volunteer.prefSupportMode,
      availability,
    };
  }));

  return profiles.filter((profile): profile is StudentRequestVolunteer => profile !== null);
}
