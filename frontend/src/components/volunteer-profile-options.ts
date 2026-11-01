export const CATEGORIES = [
  "Academic Support",
  "Technology Support",
  "New Student Support",
  "General Student Support",
] as const;

export const CATEGORY_SKILLS = {
  "Academic Support": [
    "Mathematics",
    "Programming",
    "Poster & Slides Design",
    "Proofreading",
    "Presentation Rehearsal",
    "Language Practice",
  ],
  "Technology Support": [
    "Operating System Setup",
    "Software Installation",
    "Device Troubleshooting",
  ],
  "New Student Support": [
    "Campus Navigation",
    "Course Registration Help",
    "Orientation Guidance",
    "Housing Setup",
    "Club & Activity Guide",
  ],
  "General Student Support": [
    "Cooking & Meal Prep",
    "Sewing & Clothing",
    "Furniture Assembly",
    "Errands & Transport",
    "Time & Study Planning",
  ],
} as const;

export const SUPPORT_MODES = [
  { value: "Virtual", label: "Virtual" },
  { value: "Physical", label: "Physical" },
];
