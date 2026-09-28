export interface User {
    UID: string;
    email: string;
    studentID: string;
    name: string;
    accStatus: 'Pending' | 'Inactive' | 'Active';
    isVolunteer: boolean;
}