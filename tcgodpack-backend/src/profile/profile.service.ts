// import { Injectable } from '@nestjs/common';
// import * as fs from 'fs/promises';
// import * as path from 'path';
// import { Profile, UserRole } from './profile.model';

// @Injectable()
// export class ProfileService {
//   private readonly dataDir = path.join(process.cwd(), 'data');
//   private readonly filePath = path.join(this.dataDir, 'profile.json');
//   private writeQueue: Promise<void> = Promise.resolve();

//   private async obtenerTodos(): Promise<Profile[]> {
//     try {
//       const data = await fs.readFile(this.filePath, 'utf-8');
//       return JSON.parse(data) as Profile[];
//     } catch {
//       return [];
//     }
//   }

//   private async doAtomicWrite(usuarios: Profile[]): Promise<void> {
//     await fs.mkdir(this.dataDir, { recursive: true });
//     const tmp = this.filePath + '.tmp';
//     await fs.writeFile(tmp, JSON.stringify(usuarios, null, 2), 'utf-8');
//     await fs.rename(tmp, this.filePath);
//   }

//   private enqueueWrite(usuarios: Profile[]): Promise<void> {
//     this.writeQueue = this.writeQueue.then(
//       () => this.doAtomicWrite(usuarios),
//       () => this.doAtomicWrite(usuarios),
//     );
//     return this.writeQueue;
//   }

//   async obtenerTodosUsuarios(): Promise<Profile[]> {
//     return this.obtenerTodos();
//   }

//   async obtenerPorUsuario(username: string): Promise<Profile | undefined> {
//     const usuarios = await this.obtenerTodos();
//     return usuarios.find((usuario) => usuario.username === username);
//   }

//   async crearUsuario(profile: Profile): Promise<Profile> {
//     const username = String(profile.username ?? '').trim().toLowerCase();
//     const password = String(profile.password ?? '').trim();
//     const name = String(profile.name ?? '').trim();
//     const role = profile.role ?? UserRole.CUSTOMER;
//     const purchasedProducts = profile.purchasedProducts ?? [];

//     if (!username) throw new Error('username is required');
//     if (!password) throw new Error('password is required');
//     if (!name) throw new Error('name is required');
//     if (!Object.values(UserRole).includes(role))
//       throw new Error('role must be admin or customer');

//     const usuarios = await this.obtenerTodos();
//     if (usuarios.some((usuario) => usuario.username === username)) {
//       throw new Error('A user with that username already exists');
//     }

//     const nuevoUsuario = new Profile(
//       username,
//       password,
//       name,
//       role,
//       purchasedProducts,
//     );

//     usuarios.push(nuevoUsuario);
//     await this.enqueueWrite(usuarios);
//     return nuevoUsuario;
//   }
// }


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
      role,
      purchasedProducts,
    );

    usuarios.push(nuevoUsuario);
    // Persistimos los datos de forma segura
    await this.jsonHandler.writeData('profile', usuarios);
    
    return nuevoUsuario;
  }
}
