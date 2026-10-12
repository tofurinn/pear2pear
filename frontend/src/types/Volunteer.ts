export interface Volunteer {
    UID: string;
    volCategories: string[];
    skills: string[];
    prefSupportMode: "Physical" | "Virtual";
    avgRating: number;
}