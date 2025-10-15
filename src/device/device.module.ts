import { Module } from '@nestjs/common';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { ClerkHttpModule } from 'src/shared/clerk-http.module';

@Module({
  imports: [ClerkHttpModule],
  controllers: [DeviceController],
  providers: [DeviceService],
})
export class DeviceModule {}
