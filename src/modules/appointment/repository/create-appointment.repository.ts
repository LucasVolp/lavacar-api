import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { Prisma } from "prisma/generated";

interface CreateAppointmentData {
    scheduledAt: Date;
    endTime: Date;
    totalPrice: number;
    totalDuration: number;
    notes?: string;
    userId: string;
    shopId: string;
    vehicleId: string;
    services: {
        serviceId: string;
        serviceName: string;
        servicePrice: number;
        duration: number;
    }[];
}

@Injectable()
export class CreateAppointmentRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateAppointmentData) {
        const { services, ...appointmentData } = data;

        return await this.prisma.appointment.create({
            data: {
                ...appointmentData,
                totalPrice: new Prisma.Decimal(appointmentData.totalPrice),
                services: {
                    create: services.map(service => ({
                        serviceId: service.serviceId,
                        serviceName: service.serviceName,
                        servicePrice: new Prisma.Decimal(service.servicePrice),
                        duration: service.duration,
                    })),
                },
            },
            include: {
                services: true,
                vehicle: true,
                shop: true,
            },
        });
    }
}
