// import { PrismaClient, Role, VehicleType, Weekday, ShopStatus } from './generated/client';
// import * as bcrypt from 'bcrypt';
// import { PrismaPg } from '@prisma/adapter-pg';

// const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// const prisma = new PrismaClient({ adapter: pool });

// async function main() {
//     console.log('🌱 Starting seed...');

//     // Limpar dados existentes (ordem inversa das dependências)
//     await prisma.appointmentService.deleteMany();
//     await prisma.appointment.deleteMany();
//     await prisma.blockedTime.deleteMany();
//     await prisma.schedule.deleteMany();
//     await prisma.service.deleteMany();
//     await prisma.serviceGroup.deleteMany();
//     await prisma.vehicle.deleteMany();
//     await prisma.shopManager.deleteMany();
//     await prisma.shop.deleteMany();
//     await prisma.organizationMember.deleteMany();
//     await prisma.organization.deleteMany();
//     await prisma.evaluation.deleteMany();
//     await prisma.user.deleteMany();

//     console.log('🗑️  Cleared existing data');

//     // ==================== USERS ====================
//     const hashedPassword = await bcrypt.hash('123456', 10);

//     const userAdmin = await prisma.user.create({
//         data: {
//             firstName: 'Admin',
//             lastName: 'Sistema',
//             email: 'admin@lavacar.com',
//             password: hashedPassword,
//             phone: '67999999999',
//             role: Role.ADMIN,
//             isActive: true,
//         },
//     });
//     console.log('👤 Created admin user:', userAdmin.email);

//     const userOwner = await prisma.user.create({
//         data: {
//             firstName: 'João',
//             lastName: 'Silva',
//             email: 'joao@lavacar.com',
//             password: hashedPassword,
//             phone: '67988888888',
//             role: Role.OWNER,
//             isActive: true,
//         },
//     });
//     console.log('👤 Created owner user:', userOwner.email);

//     const userEmployee = await prisma.user.create({
//         data: {
//             firstName: 'Maria',
//             lastName: 'Santos',
//             email: 'maria@lavacar.com',
//             password: hashedPassword,
//             phone: '67977777777',
//             role: Role.EMPLOYEE,
//             isActive: true,
//         },
//     });
//     console.log('👤 Created employee user:', userEmployee.email);

//     const userCustomer = await prisma.user.create({
//         data: {
//             firstName: 'Lucas',
//             lastName: 'Gabriel',
//             email: 'lucas@cliente.com',
//             cpf: '12345678901',
//             password: hashedPassword,
//             phone: '67992448204',
//             role: Role.USER,
//             isActive: true,
//         },
//     });
//     console.log('👤 Created customer user:', userCustomer.email);

//     const userCustomer2 = await prisma.user.create({
//         data: {
//             firstName: 'Pedro',
//             lastName: 'Oliveira',
//             email: 'pedro@cliente.com',
//             cpf: '98765432100',
//             password: hashedPassword,
//             phone: '67966666666',
//             role: Role.USER,
//             isActive: true,
//         },
//     });
//     console.log('👤 Created customer user:', userCustomer2.email);

//     // ==================== ORGANIZATION ====================
//     const organization = await prisma.organization.create({
//         data: {
//             name: 'Organização Teste',
//             slug: 'organizacao-teste',
//             document: '12345678000190',
//             ownerId: userOwner.id,
//             isActive: true,
//         },
//     });
//     console.log('🏢 Created organization:', organization.name);

//     // ==================== ORGANIZATION MEMBERS ====================

//     const memberEmployee = await prisma.organizationMember.create({
//         data: {
//             userId: userEmployee.id,
//             organizationId: organization.id,
//             role: Role.EMPLOYEE,
//             isActive: true,
//         },
//     });
//     console.log('👥 Added employee to organization');

//     // ==================== SHOPS ====================
//     const shop1 = await prisma.shop.create({
//         data: {
//             name: 'LavaCar Centro',
//             slug: 'lavacar-centro',
//             description: 'LavaCar no centro da cidade - atendimento de qualidade',
//             document: '09169244162',
//             phone: '67992448204',
//             email: 'centro@lavacar.com',
//             status: ShopStatus.ACTIVE,
//             zipCode: '79630220',
//             street: 'Rua Clóvis Bevilaqua',
//             number: '635',
//             neighborhood: 'Centro',
//             city: 'Três Lagoas',
//             state: 'MS',
//             slotInterval: 30,
//             bufferBetweenSlots: 0,
//             maxAdvanceDays: 30,
//             minAdvanceMinutes: 60,
//             organizationId: organization.id,
//             ownerId: userOwner.id,
//         },
//     });
//     console.log('🏪 Created shop:', shop1.name);

//     const shop2 = await prisma.shop.create({
//         data: {
//             name: 'LavaCar Shopping',
//             slug: 'lavacar-shopping',
//             description: 'LavaCar no shopping - praticidade para você',
//             document: '09169244163',
//             phone: '67991234567',
//             email: 'shopping@lavacar.com',
//             status: ShopStatus.ACTIVE,
//             zipCode: '79630100',
//             street: 'Avenida Brasil',
//             number: '1000',
//             neighborhood: 'Jardim América',
//             city: 'Três Lagoas',
//             state: 'MS',
//             slotInterval: 30,
//             bufferBetweenSlots: 15,
//             maxAdvanceDays: 15,
//             minAdvanceMinutes: 120,
//             organizationId: organization.id,
//             ownerId: userOwner.id,
//         },
//     });
//     console.log('🏪 Created shop:', shop2.name);

//     // ==================== SHOP MANAGERS ====================
//     await prisma.shopManager.create({
//         data: {
//             shopId: shop1.id,
//             memberId: memberEmployee.id,
//         },
//     });
//     console.log('👔 Added manager to shop:', shop1.name);

//     // ==================== SERVICE GROUPS ====================
//     const groupLavagens = await prisma.serviceGroup.create({
//         data: {
//             name: 'Lavagens',
//             description: 'Serviços de lavagem automotiva',
//             isActive: true,
//             shopId: shop1.id,
//         },
//     });

//     const groupPolimentos = await prisma.serviceGroup.create({
//         data: {
//             name: 'Polimentos',
//             description: 'Serviços de polimento e cristalização',
//             isActive: true,
//             shopId: shop1.id,
//         },
//     });

//     const groupExtras = await prisma.serviceGroup.create({
//         data: {
//             name: 'Extras',
//             description: 'Serviços adicionais',
//             isActive: true,
//             shopId: shop1.id,
//         },
//     });
//     console.log('📦 Created service groups for shop:', shop1.name);

//     // Service groups para shop2
//     const groupLavagensShop2 = await prisma.serviceGroup.create({
//         data: {
//             name: 'Lavagens',
//             description: 'Serviços de lavagem',
//             isActive: true,
//             shopId: shop2.id,
//         },
//     });
//     console.log('📦 Created service groups for shop:', shop2.name);

//     // ==================== SERVICES ====================
//     const serviceLavagemSimples = await prisma.service.create({
//         data: {
//             name: 'Lavagem Simples',
//             description: 'Lavagem externa com água e sabão',
//             price: 50.00,
//             duration: 60,
//             isActive: true,
//             shopId: shop1.id,
//             groupId: groupLavagens.id,
//         },
//     });

//     const serviceLavagemCompleta = await prisma.service.create({
//         data: {
//             name: 'Lavagem Completa',
//             description: 'Lavagem externa e interna completa',
//             price: 100.00,
//             duration: 90,
//             isActive: true,
//             shopId: shop1.id,
//             groupId: groupLavagens.id,
//         },
//     });

//     await prisma.service.create({
//         data: {
//             name: 'Lavagem Detalhada',
//             description: 'Lavagem completa com detalhamento interno',
//             price: 150.00,
//             duration: 120,
//             isActive: true,
//             shopId: shop1.id,
//             groupId: groupLavagens.id,
//         },
//     });

//     await prisma.service.create({
//         data: {
//             name: 'Polimento Simples',
//             description: 'Polimento básico da pintura',
//             price: 200.00,
//             duration: 180,
//             isActive: true,
//             shopId: shop1.id,
//             groupId: groupPolimentos.id,
//         },
//     });

//     await prisma.service.create({
//         data: {
//             name: 'Cristalização',
//             description: 'Cristalização completa da pintura',
//             price: 350.00,
//             duration: 240,
//             isActive: true,
//             shopId: shop1.id,
//             groupId: groupPolimentos.id,
//         },
//     });

//     const serviceHigienizacao = await prisma.service.create({
//         data: {
//             name: 'Higienização de Ar',
//             description: 'Higienização do sistema de ar condicionado',
//             price: 80.00,
//             duration: 30,
//             isActive: true,
//             shopId: shop1.id,
//             groupId: groupExtras.id,
//         },
//     });
//     console.log('🔧 Created services for shop:', shop1.name);

//     // Serviços para shop2
//     await prisma.service.create({
//         data: {
//             name: 'Lavagem Express',
//             description: 'Lavagem rápida externa',
//             price: 35.00,
//             duration: 30,
//             isActive: true,
//             shopId: shop2.id,
//             groupId: groupLavagensShop2.id,
//         },
//     });
//     console.log('🔧 Created services for shop:', shop2.name);

//     // ==================== SCHEDULES ====================
//     const weekdays = [
//         Weekday.MONDAY,
//         Weekday.TUESDAY,
//         Weekday.WEDNESDAY,
//         Weekday.THURSDAY,
//         Weekday.FRIDAY,
//     ];

//     for (const weekday of weekdays) {
//         await prisma.schedule.create({
//             data: {
//                 weekday,
//                 isOpen: ShopStatus.ACTIVE,
//                 startTime: '08:00',
//                 endTime: '18:00',
//                 breakStartTime: '12:00',
//                 breakEndTime: '13:00',
//                 shopId: shop1.id,
//             },
//         });
//     }

//     // Sábado com horário reduzido
//     await prisma.schedule.create({
//         data: {
//             weekday: Weekday.SATURDAY,
//             isOpen: ShopStatus.ACTIVE,
//             startTime: '08:00',
//             endTime: '12:00',
//             shopId: shop1.id,
//         },
//     });
//     console.log('📅 Created schedules for shop:', shop1.name);

//     // Schedules para shop2 (seg-sab sem intervalo)
//     for (const weekday of [...weekdays, Weekday.SATURDAY]) {
//         await prisma.schedule.create({
//             data: {
//                 weekday,
//                 isOpen: ShopStatus.ACTIVE,
//                 startTime: '10:00',
//                 endTime: '22:00',
//                 shopId: shop2.id,
//             },
//         });
//     }
//     console.log('📅 Created schedules for shop:', shop2.name);

//     // ==================== VEHICLES ====================
//     const vehicle1 = await prisma.vehicle.create({
//         data: {
//             plate: 'NSD6647',
//             brand: 'Renault',
//             model: 'Stepway',
//             year: 2014,
//             color: 'Preto',
//             type: VehicleType.CAR,
//             isActive: true,
//             userId: userCustomer.id,
//         },
//     });

//     const vehicle2 = await prisma.vehicle.create({
//         data: {
//             plate: 'ABC1234',
//             brand: 'Toyota',
//             model: 'Corolla',
//             year: 2022,
//             color: 'Prata',
//             type: VehicleType.CAR,
//             isActive: true,
//             userId: userCustomer.id,
//         },
//     });

//     await prisma.vehicle.create({
//         data: {
//             plate: 'XYZ9876',
//             brand: 'Honda',
//             model: 'CG 160',
//             year: 2023,
//             color: 'Vermelho',
//             type: VehicleType.MOTORCYCLE,
//             isActive: true,
//             userId: userCustomer2.id,
//         },
//     });
//     console.log('🚗 Created vehicles');

//     // ==================== BLOCKED TIMES ====================
//     // Feriado de Ano Novo
//     await prisma.blockedTime.create({
//         data: {
//             type: 'FULL_DAY',
//             date: new Date('2026-01-01'),
//             reason: 'Feriado - Ano Novo',
//             shopId: shop1.id,
//         },
//     });

//     // Bloqueio parcial para manutenção
//     await prisma.blockedTime.create({
//         data: {
//             type: 'PARTIAL',
//             date: new Date('2025-12-30'),
//             reason: 'Manutenção de equipamentos',
//             startTime: '14:00',
//             endTime: '18:00',
//             shopId: shop1.id,
//         },
//     });
//     console.log('🚫 Created blocked times');

//     // ==================== APPOINTMENTS ====================
//     // Agendamento para amanhã às 10h
//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     tomorrow.setHours(10, 0, 0, 0);

//     // Ajustar para um dia útil (seg-sex)
//     while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
//         tomorrow.setDate(tomorrow.getDate() + 1);
//     }

//     const endTime1 = new Date(tomorrow);
//     endTime1.setMinutes(endTime1.getMinutes() + serviceLavagemSimples.duration);

//     const appointment1 = await prisma.appointment.create({
//         data: {
//             scheduledAt: tomorrow,
//             endTime: endTime1,
//             status: 'PENDING',
//             totalPrice: serviceLavagemSimples.price,
//             totalDuration: serviceLavagemSimples.duration,
//             notes: 'Primeira lavagem do cliente',
//             userId: userCustomer.id,
//             shopId: shop1.id,
//             vehicleId: vehicle1.id,
//             services: {
//                 create: {
//                     serviceId: serviceLavagemSimples.id,
//                     serviceName: serviceLavagemSimples.name,
//                     servicePrice: serviceLavagemSimples.price,
//                     duration: serviceLavagemSimples.duration,
//                 },
//             },
//         },
//     });
//     console.log('📋 Created appointment:', appointment1.id);

//     // Segundo agendamento (múltiplos serviços)
//     const dayAfterTomorrow = new Date(tomorrow);
//     dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
//     dayAfterTomorrow.setHours(14, 0, 0, 0);

//     while (dayAfterTomorrow.getDay() === 0 || dayAfterTomorrow.getDay() === 6) {
//         dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
//     }

//     const totalDuration2 = serviceLavagemCompleta.duration + serviceHigienizacao.duration;
//     const totalPrice2 = Number(serviceLavagemCompleta.price) + Number(serviceHigienizacao.price);

//     const endTime2 = new Date(dayAfterTomorrow);
//     endTime2.setMinutes(endTime2.getMinutes() + totalDuration2);

//     const appointment2 = await prisma.appointment.create({
//         data: {
//             scheduledAt: dayAfterTomorrow,
//             endTime: endTime2,
//             status: 'CONFIRMED',
//             totalPrice: totalPrice2,
//             totalDuration: totalDuration2,
//             notes: 'Lavagem completa + higienização',
//             userId: userCustomer.id,
//             shopId: shop1.id,
//             vehicleId: vehicle2.id,
//             services: {
//                 create: [
//                     {
//                         serviceId: serviceLavagemCompleta.id,
//                         serviceName: serviceLavagemCompleta.name,
//                         servicePrice: serviceLavagemCompleta.price,
//                         duration: serviceLavagemCompleta.duration,
//                     },
//                     {
//                         serviceId: serviceHigienizacao.id,
//                         serviceName: serviceHigienizacao.name,
//                         servicePrice: serviceHigienizacao.price,
//                         duration: serviceHigienizacao.duration,
//                     },
//                 ],
//             },
//         },
//     });
//     console.log('📋 Created appointment:', appointment2.id);

//     // ==================== EVALUATIONS ====================
//     // Criar um agendamento concluído para avaliação
//     const pastDate = new Date();
//     pastDate.setDate(pastDate.getDate() - 7);
//     pastDate.setHours(10, 0, 0, 0);

//     const pastEndTime = new Date(pastDate);
//     pastEndTime.setMinutes(pastEndTime.getMinutes() + serviceLavagemSimples.duration);

//     const completedAppointment = await prisma.appointment.create({
//         data: {
//             scheduledAt: pastDate,
//             endTime: pastEndTime,
//             status: 'COMPLETED',
//             totalPrice: serviceLavagemSimples.price,
//             totalDuration: serviceLavagemSimples.duration,
//             notes: 'Serviço concluído',
//             userId: userCustomer.id,
//             shopId: shop1.id,
//             vehicleId: vehicle1.id,
//             services: {
//                 create: {
//                     serviceId: serviceLavagemSimples.id,
//                     serviceName: serviceLavagemSimples.name,
//                     servicePrice: serviceLavagemSimples.price,
//                     duration: serviceLavagemSimples.duration,
//                 },
//             },
//         },
//     });

//     await prisma.evaluation.create({
//         data: {
//             rating: 5,
//             comment: 'Excelente atendimento! Carro ficou impecável.',
//             appointmentId: completedAppointment.id,
//             userId: userCustomer.id,
//         },
//     });
//     console.log('⭐ Created evaluation');

//     console.log('');
//     console.log('✅ Seed completed successfully!');
//     console.log('');
//     console.log('📊 Summary:');
//     console.log(`   - Users: 5`);
//     console.log(`   - Organizations: 1`);
//     console.log(`   - Organization Members: 2`);
//     console.log(`   - Shops: 2`);
//     console.log(`   - Shop Managers: 1`);
//     console.log(`   - Service Groups: 4`);
//     console.log(`   - Services: 7`);
//     console.log(`   - Schedules: 12`);
//     console.log(`   - Vehicles: 3`);
//     console.log(`   - Blocked Times: 2`);
//     console.log(`   - Appointments: 3`);
//     console.log(`   - Evaluations: 1`);
//     console.log('');
//     console.log('🔐 Test credentials:');
//     console.log('   - Admin: admin@lavacar.com / 123456');
//     console.log('   - Owner: joao@lavacar.com / 123456');
//     console.log('   - Employee: maria@lavacar.com / 123456');
//     console.log('   - Customer: lucas@cliente.com / 123456');
//     console.log('   - Customer: pedro@cliente.com / 123456');
// }

// main()
//     .catch((e) => {
//         console.error('❌ Seed failed:', e);
//         process.exit(1);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });
