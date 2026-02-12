import { AppointmentStatus } from "../types/AppointmentStatus";

export interface FindAllFilters {
    shopId?: string;
    userId?: string;
    status?: AppointmentStatus | AppointmentStatus[];
    startDate?: string;
    endDate?: string;
    page?: number;
    perPage?: number;
}