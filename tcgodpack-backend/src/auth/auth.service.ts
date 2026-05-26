import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class AuthService {
  constructor(private readonly profileService: ProfileService) {}

  async login(email: string, password: string): Promise<{ token: string }> {
    const usuario = await this.profileService.obtenerPorCorreo(email);

    if (!usuario || usuario.password !== password) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const token = Buffer.from(`${usuario.email}:${usuario.role}`).toString('base64');
    return { token };
  }
}
