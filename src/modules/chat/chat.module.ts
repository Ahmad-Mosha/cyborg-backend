import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './services/ai-chat.service';
import { ChatConversation } from './entities/chat-conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatConversation, ChatMessage])],
  controllers: [AiChatController],
  providers: [AiChatService],
  exports: [AiChatService],
})
export class ChatModule {}