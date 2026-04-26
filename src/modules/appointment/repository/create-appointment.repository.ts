import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/databases/prisma.database";
import { CreateAppointmentDto } from "../dto/create-appointment.dto";
import { Prisma } from "prisma/generated";

@Injectable()
export class CreateAppointmentRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateAppointmentDto, dbClient?: Prisma.TransactionClient) {
        const db = dbClient ?? this.prisma;
        const { serviceIds, ...appointmentData } = data;

        return await db.appointment.create({
            data: {
                ...appointmentData,
                services: {
                    create: serviceIds.map(service => ({
                        serviceId: service.serviceId,
                        serviceName: service.serviceName,
                        servicePrice: new Prisma.Decimal(service.servicePrice),
                        duration: service.duration,
                        isBudget: Boolean(service.isBudget),
                        vehicleSize: service.vehicleSize,
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
