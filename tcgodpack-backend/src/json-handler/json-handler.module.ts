import { Module } from '@nestjs/common';
import { JsonHandlerService } from './json-handler.service';

@Module({
  providers: [JsonHandlerService],
  exports: [JsonHandlerService],
})
export class JsonHandlerModule {}
