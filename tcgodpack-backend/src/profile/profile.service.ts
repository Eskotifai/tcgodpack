import { ConflictException, Injectable, OnModuleInit } from '@nestjs/common';
import { Profile, UserRole } from './profile.model';
import { JsonHandlerService } from '../shared/json-handler/json-handler.service';

@Injectable()
export class ProfileService implements OnModuleInit {
  // Inyectamos el servicio centralizado que maneja la persistencia de datos de forma atómica
  constructor(private readonly jsonHandler: JsonHandlerService) {}

  // Se ejecuta automáticamente al arrancar el backend de NestJS
  async onModuleInit() {
    await this.inicializarAdminUnico();
  }

  // Comprueba e inicializa el administrador único del sistema usando el JsonHandler
  private async inicializarAdminUnico(): Promise<void> {
    const usuarios = await this.obtenerTodosUsuarios();
    const existeAdmin = usuarios.some((u) => u.role === UserRole.ADMIN);

    if (!existeAdmin) {
      console.log('⚙️ Inicializando el administrador único de tcgodpack...');
      const adminMaestro = new Profile(
        'admin@tcgodpack.com',
        '1234', // Contraseña maestra por defecto
        'TCG God Pack Admin',
        'Admin',
        UserRole.ADMIN,
        [],
      );
      usuarios.push(adminMaestro);
      // Guardamos usando la abstracción reutilizable
      await this.jsonHandler.writeData('profile', usuarios);
    }
  }

  // Obtiene la lista completa de perfiles desde el archivo json
  async obtenerTodosUsuarios(): Promise<Profile[]> {
    return this.jsonHandler.readData<Profile>('profile');
  }

  // Busca un usuario específico mediante su propiedad email
  async obtenerPorCorreo(correo: string): Promise<Profile | undefined> {
    const usuarios = await this.obtenerTodosUsuarios();
    return usuarios.find((usuario) => usuario.email === correo);
  }

  // Registra un nuevo cliente validando atómicamente duplicados
  async crearUsuario(profileData: Profile): Promise<Profile> {
    const email = String(profileData.email ?? '').trim().toLowerCase();
    const password = String(profileData.password ?? '').trim(); 
    const name = String(profileData.name ?? '').trim();
    const lastName = String(profileData.lastName ?? '').trim();
    const role = profileData.role ?? UserRole.CUSTOMER;
    const purchasedProducts = profileData.purchasedProducts ?? [];

    if (!email) throw new ConflictException('El correo es requerido');
    if (!password) throw new ConflictException('La contraseña es requerida');
    if (!name) throw new ConflictException('El nombre es requerido');
    if (!Object.values(UserRole).includes(role)) {
      throw new ConflictException('El rol debe ser admin o customer');
    }

    const usuarios = await this.obtenerTodosUsuarios();
    if (usuarios.some((usuario) => usuario.email === email)) {
      throw new ConflictException('Ya existe un usuario registrado con ese correo');
    }

    // Creamos la instancia formal del Perfil
    const nuevoUsuario = new Profile(
      email,
      password, 
      name,
      lastName,
      role,
      purchasedProducts,
    );

    usuarios.push(nuevoUsuario);    
    await this.jsonHandler.writeData('profile', usuarios);
    
    return nuevoUsuario;
  }
}
