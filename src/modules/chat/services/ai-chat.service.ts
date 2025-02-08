import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatConversation } from '../entities/chat-conversation.entity';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import { User } from '../../users/entities/user.entity';
import { FORBIDDEN_TOPICS } from '../constants/chat.constants';
import { ChatContextService } from './chat-context.service';
import { createBaseInstructions } from '../constants/chat-instructions.constant';

@Injectable()
export class AiChatService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly chatContextService: ChatContextService,
    @InjectRepository(ChatConversation)
    private readonly conversationRepository: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
  ) {
    this.genAI = new GoogleGenerativeAI(
      this.configService.get('GEMINI_API_KEY'),
    );
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });
  }

  private async createSystemContext(user: User): Promise<string> {
    const userContext = this.chatContextService.createUserContext(user);
    return (
      createBaseInstructions() +
      this.chatContextService.formatUserProfileSection(userContext)
    );
  }

  private shouldBlockResponse(text: string): boolean {
    return FORBIDDEN_TOPICS.some((topic) =>
      text.toLowerCase().includes(topic.toLowerCase()),
    );
  }

  private cleanFormatting(text: string): string {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  async startNewConversation(user: User): Promise<ChatConversation> {
    const conversation = this.conversationRepository.create({
      user: { id: user.id },
      title: 'New Conversation',
    });

    return await this.conversationRepository.save(conversation);
  }

  async sendMessage(
    user: User,
    conversationId: string,
    content: string,
  ): Promise<ChatMessage> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, user: { id: user.id } },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
      select: ['id', 'title', 'isActive'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Save user message
    const userMessage = await this.messageRepository.save({
      content,
      role: MessageRole.USER,
      conversation: { id: conversation.id },
      user: { id: user.id },
    });

    // Block responses for forbidden topics
    if (this.shouldBlockResponse(content)) {
      const aiResponse =
        "I'm focused on being helpful with fitness, health, and general conversation. I can't provide advice about that topic. Is there something else I can help you with?";
      return await this.messageRepository.save({
        content: aiResponse,
        role: MessageRole.AI,
        conversation: { id: conversation.id },
        user: { id: user.id },
      });
    }

    // Get full user data for context
    const userWithHealth = await this.conversationRepository.manager.findOne(
      User,
      {
        where: { id: user.id },
        relations: ['health'],
      },
    );

    // Prepare conversation context
    const systemContext = await this.createSystemContext(userWithHealth);
    const history = conversation.messages.map((msg) => ({
      role: msg.role === MessageRole.USER ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Get AI response
    const chat = this.model.startChat({
      history: [{ role: 'user', parts: [{ text: systemContext }] }, ...history],
    });

    const result = await chat.sendMessage([{ text: content }]);
    const aiResponseText = this.cleanFormatting(result.response.text());

    // Save and return AI response
    return await this.messageRepository.save({
      content: aiResponseText,
      role: MessageRole.AI,
      conversation: { id: conversation.id },
      user: { id: user.id },
    });
  }

  async getConversations(user: User): Promise<ChatConversation[]> {
    return await this.conversationRepository.find({
      where: { user: { id: user.id }, isActive: true },
      order: { updatedAt: 'DESC' },
      select: ['id', 'title', 'createdAt', 'updatedAt'],
    });
  }

  async getConversation(
    user: User,
    conversationId: string,
  ): Promise<ChatConversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, user: { id: user.id } },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async deleteConversation(user: User, conversationId: string): Promise<void> {
    await this.conversationRepository.update(
      { id: conversationId, user: { id: user.id } },
      { isActive: false },
    );
  }
}
