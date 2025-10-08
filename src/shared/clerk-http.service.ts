import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

interface ClerkUser {
  id: string;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  profile_image_url?: string;
  profileImageUrl?: string;
}

@Injectable()
export class ClerkHttpService {
  private base = 'https://api.clerk.com/v1';

  async getUserProfileImage(userId: string): Promise<string | null> {
    try {
      const res = await axios.get<ClerkUser>(`${this.base}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const user = res.data;
      return (
        user.profile_image_url ?? user.image_url ?? user.profileImageUrl ?? null
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error('Erro ao chamar Clerk BAPI', err.response?.data);
      } else {
        console.error('Erro inesperado', err);
      }
      throw new InternalServerErrorException('Erro ao buscar usuário no Clerk');
    }
  }
}
