import { Module, Global } from '@nestjs/common';
import { ClerkHttpService } from './clerk-http.service';

@Global()
@Module({
  providers: [ClerkHttpService],
  exports: [ClerkHttpService],
})
export class ClerkHttpModule {}
