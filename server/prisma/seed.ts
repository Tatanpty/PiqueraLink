import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear usuario administrador por defecto
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@piqueralink.com' },
    update: {},
    create: {
      name: 'Administrador PiqueraLink',
      email: 'admin@piqueralink.com',
      passwordHash: adminPassword,
      role: Role.admin,
    },
  });
  console.log(`  ✅ Admin creado: ${admin.email}`);

  // Crear conductor de prueba
  const driverPassword = await bcrypt.hash('driver123', 10);
  const driver = await prisma.user.upsert({
    where: { email: 'conductor@piqueralink.com' },
    update: {},
    create: {
      name: 'Carlos Pérez',
      email: 'conductor@piqueralink.com',
      passwordHash: driverPassword,
      role: Role.driver,
    },
  });
  console.log(`  ✅ Conductor creado: ${driver.email}`);

  // Crear vehículo para el conductor
  await prisma.vehicle.upsert({
    where: { driverId: driver.id },
    update: {},
    create: {
      driverId: driver.id,
      plate: 'ABC-1234',
      model: 'Toyota Corolla 2020',
      color: 'Blanco',
      photoUrl: '/placeholder-car.png',
    },
  });
  console.log('  ✅ Vehículo registrado: ABC-1234');

  // Crear pasajero de prueba
  const passengerPassword = await bcrypt.hash('pasajero123', 10);
  const passenger = await prisma.user.upsert({
    where: { email: 'pasajero@piqueralink.com' },
    update: {},
    create: {
      name: 'María García',
      email: 'pasajero@piqueralink.com',
      passwordHash: passengerPassword,
      role: Role.passenger,
    },
  });
  console.log(`  ✅ Pasajero creado: ${passenger.email}`);

  // Crear piquera de ejemplo
  const piquera = await prisma.piquera.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Piquera Central',
      address: 'Calle Principal #100, Centro',
      latitude: 19.4326,
      longitude: -99.1332,
      maxCapacity: 15,
      isActive: true,
    },
  });
  console.log(`  ✅ Piquera creada: ${piquera.name}`);

  console.log('\n🎉 Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
