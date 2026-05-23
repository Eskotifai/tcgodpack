import { Module } from '@nestjs/common';
import { JsonHandlerService } from './json-handler.service';

@Module({
  providers: [JsonHandlerService]
})
export class JsonHandlerModule {}
