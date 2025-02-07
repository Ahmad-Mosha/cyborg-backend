import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatConversation } from '../entities/chat-conversation.entity';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AiChatService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;

  private readonly ALLOWED_TOPICS = [
    'fitness',
    'health',
    'nutrition',
    'exercise',
    'workout',
    'diet',
    'wellness',
    'strength',
    'cardio',
    'muscle',
    'weight',
    'food',
    'meal',
    'training',
    'gym',
    'sleep',
    'recovery',
    'fat',
    'body',
    'skinny',
    'mass',
    'bulk',
    'cut',
    'lean',
    'plan',
    'program',
    'routine',
    'schedule',
    'workout',
  ];

  private readonly TOPIC_ALIASES = {
    'wieght': 'weight',
    'excersize': 'exercise',
    'nutrician': 'nutrition',
    'deit': 'diet',
    'bodyfat': 'fat',
    'muscels': 'muscle',
    'mucle': 'muscle',
    'cardyo': 'cardio',
    'strenght': 'strength',
    'sleap': 'sleep',
  };

  private readonly CONTEXT_WORDS = [
    'this',
    'that',
    'the',
    'my',
    'your',
    'our',
    'their',
    'it',
    'these',
    'those',
  ];

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ChatConversation)
    private readonly conversationRepository: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
  ) {
    this.genAI = new GoogleGenerativeAI(this.configService.get('GEMINI_API_KEY'));
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  private createUserProfileSection(userContext: any): string {
    if (!userContext.health) {
      return `\n\nNO HEALTH DATA: ${userContext.name} hasn't provided their health information.
      First priority: Collect essential metrics (age, gender, weight, height, body composition, goals, activity level).`;
    }

    const bmiCalculated = userContext.health.weight && userContext.health.height 
      ? (userContext.health.weight / Math.pow(userContext.health.height / 100, 2)).toFixed(1)
      : null;

    return `\n\nUSER PROFILE - ${userContext.name}:
    - Age: ${userContext.health.age || 'Not provided'} years
    - Gender: ${userContext.health.gender || 'Not provided'}
    - Current weight: ${userContext.health.weight ? `${userContext.health.weight}kg` : 'Not provided'}
    - Height: ${userContext.health.height ? `${userContext.health.height}cm` : 'Not provided'}
    - BMI: ${bmiCalculated || userContext.health.bmi || 'Not calculated'}
    - Body composition:
      * Body fat: ${userContext.health.bodyFat ? `${userContext.health.bodyFat}%` : 'Not provided'}
      * Muscle mass: ${userContext.health.muscleMass ? `${userContext.health.muscleMass}kg` : 'Not provided'}
      * Water: ${userContext.health.waterPercentage ? `${userContext.health.waterPercentage}%` : 'Not provided'}
    - Goals: ${userContext.health.fitnessGoals || 'Not specified'}
    - Activity level: ${userContext.health.activityLevel || 'Not specified'}

    IMPORTANT: Base all advice on these metrics. Consider body composition when giving recommendations.
    If the user mentions being "skinny fat", focus on body recomposition strategies combining resistance training and proper nutrition.`;
  }

  private createBaseInstructions(): string {
    return `IMPORTANT INSTRUCTIONS:
    1. You are strictly a fitness and health AI assistant. Always give personalized advice based on the user's metrics and goals.
    2. When asked about plans or advice:
       - ALWAYS check if you have the user's data first
       - If you have their data, tailor the response specifically to their metrics and goals
       - If asked whether advice is personalized, explain how it relates to their specific metrics
       - Never give generic plans without relating them to the user's data
    3. When giving advice:
       - Start by acknowledging their specific situation
       - Reference their actual metrics in your explanation
       - Explain why your advice is appropriate for their body composition
       - Be specific about how recommendations match their goals
    4. Format rules:
       - Use plain text only
       - Use simple dashes (-) for lists
       - Keep paragraphs concise
       - Use single newlines between sections`;
  }

  private createReminders(): string {
    return `\n\nREMEMBER:
    - Always relate advice to the user's specific metrics and goals
    - If the user asks if advice is personalized, explain how it relates to their data
    - Every plan should consider their current fitness level and body composition
    - Mention specific numbers from their profile when explaining recommendations
    - If asked about previous advice, explain how it was tailored for them`;
  }

  private async createSystemContext(user: User): Promise<string> {
    const userContext = {
      name: `${user.firstName} ${user.lastName}`,
      health: user.health ? {
        age: user.health.age,
        weight: user.health.weight,
        height: user.health.height,
        gender: user.health.gender,
        fitnessGoals: user.health.fitnessGoals,
        activityLevel: user.health.activityLevel,
        bmi: user.health.bmi,
        bodyFat: user.health.fatPercentage,
        muscleMass: user.health.muscleMass,
        waterPercentage: user.health.waterPercentage,
      } : null,
    };

    return this.createBaseInstructions() +
           this.createUserProfileSection(userContext) +
           this.createReminders();
  }

  private isTopicAllowed(text: string, conversation?: ChatConversation): boolean {
    // Normalize text by correcting common misspellings
    let normalizedText = text.toLowerCase();
    
    // Replace common misspellings
    Object.entries(this.TOPIC_ALIASES).forEach(([misspelled, correct]) => {
      normalizedText = normalizedText.replace(new RegExp(misspelled, 'gi'), correct);
    });

    // Check for context words that might refer to previous fitness discussion
    const hasContextReference = this.CONTEXT_WORDS.some(word => 
      normalizedText.includes(word)
    );

    // Check if any allowed topic is present in the normalized text
    const hasAllowedTopic = this.ALLOWED_TOPICS.some(topic => 
      normalizedText.includes(topic)
    );

    // Check for fitness-related question patterns
    const fitnessQuestionPatterns = [
      /how (to|do|can|should)/i,
      /what (is|are|should)/i,
      /best way/i,
      /(lose|gain|build|increase|decrease|improve|reduce)/i,
      /(recommend|suggest|advice)/i,
      /plan|program|routine|schedule/i,
      /for me|my|general/i,
    ];

    const isQuestionAboutFitness = fitnessQuestionPatterns.some(pattern => 
      pattern.test(normalizedText)
    );

    // If there's context reference and we have a conversation, check the previous message
    if (hasContextReference && conversation?.messages?.length > 0) {
      const previousMessage = [...conversation.messages]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      
      if (previousMessage.role === MessageRole.AI) {
        // If the previous message was from AI, it was already validated as fitness-related
        return true;
      }
    }

    return hasAllowedTopic || isQuestionAboutFitness || hasContextReference;
  }

  private cleanMarkdownFormatting(text: string): string {
    // First normalize newlines and spaces
    let cleaned = text
      .replace(/\\n/g, '\n') // Handle escaped newlines
      .replace(/\\r/g, '') // Remove carriage returns
      .replace(/\\t/g, '  ') // Convert tabs to spaces
      .replace(/\s*\n\s*/g, '\n') // Clean up spaces around newlines
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
      .replace(/\s+/g, ' '); // Normalize multiple spaces
    
    // Then remove markdown and special formatting
    cleaned = cleaned
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^\s*[-*•]\s*/gm, '- ') // Convert all list markers to simple dashes
      .replace(/(\d+\.)\s*/g, '$1 '); // Clean up numbered lists
    
    // Improve sentence and list formatting
    cleaned = cleaned
      .split('\n')
      .map(line => {
        line = line.trim();
        // Ensure proper spacing after punctuation
        line = line.replace(/([.!?])\s*([A-Z])/g, '$1 $2');
        // Capitalize first letter of each sentence
        line = line.replace(/^[a-z]/g, c => c.toUpperCase());
        return line;
      })
      .filter(line => line) // Remove empty lines
      .join('\n');
    
    // Final cleanup to ensure consistent spacing
    cleaned = cleaned
      .replace(/([.!?])\s*\n/g, '$1\n') // Clean up end of sentences
      .replace(/\n{3,}/g, '\n\n') // Final cleanup of multiple newlines
      .trim();
    
    return cleaned;
  }

  private getMessageContext(messages: ChatMessage[], currentMessage: string): string {
    if (!messages || messages.length === 0) {
      return '';
    }

    // Sort messages by creation time
    const sortedMessages = [...messages].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    // Get the last 2 exchanges (up to 4 messages) for immediate context
    const recentMessages = sortedMessages.slice(-4);
    
    if (recentMessages.length === 0) {
      return '';
    }

    // Create a context string explaining the conversation flow
    let contextHint = '\nCONVERSATION CONTEXT:\n';
    recentMessages.forEach(msg => {
      if (msg.role === MessageRole.USER) {
        contextHint += `User asked: "${msg.content}"\n`;
      } else {
        contextHint += `You provided advice about: ${msg.content.split('.')[0]}\n`;
      }
    });

    // Add specific hint if current message seems to reference previous content
    const referenceWords = ['this', 'that', 'it', 'the plan', 'the advice'];
    if (referenceWords.some(word => currentMessage.toLowerCase().includes(word))) {
      contextHint += '\nThe user is asking about the previous advice. Make sure to explain how your previous recommendations were personalized for their specific metrics and goals.';
    }

    return contextHint;
  }

  private async loadUserWithFullContext(userId: string): Promise<User> {
    const user = await this.conversationRepository.manager.findOne(User, {
      where: { id: userId },
      relations: [
        'health',
        'chatConversations',
        'chatConversations.messages',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async startNewConversation(user: User): Promise<ChatConversation> {
    const userWithContext = await this.loadUserWithFullContext(user.id);
    
    const conversation = this.conversationRepository.create({
      user: userWithContext,
      title: 'New Fitness Conversation',
    });
    return await this.conversationRepository.save(conversation);
  }

  async sendMessage(
    user: User,
    conversationId: string,
    content: string,
  ): Promise<ChatMessage> {
    // Load fresh user data with full context
    const userWithContext = await this.loadUserWithFullContext(user.id);
    
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, user: { id: user.id } },
      relations: ['messages'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Save user message
    await this.messageRepository.save({
      content,
      role: MessageRole.USER,
      conversation,
      user: userWithContext,
    });

    // Prepare conversation history and context
    const systemContext = await this.createSystemContext(userWithContext);
    const messageContext = this.getMessageContext(conversation.messages, content);
    const sortedMessages = [...conversation.messages].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
    
    const history = sortedMessages.map(msg => ({
      role: msg.role === MessageRole.USER ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Get AI response with enhanced context
    const chat = this.model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemContext + messageContext }] },
        ...history,
      ],
    });
    
    const result = await chat.sendMessage([{ text: content }]);
    const response = result.response;
    let aiResponseText = response.text();

    // Only override if it's clearly not fitness-related
    if (!this.isTopicAllowed(content, conversation)) {
      aiResponseText = "I can only help with fitness, health, nutrition, exercise, and wellness related topics. How can I assist you with your fitness goals?";
    } else {
      aiResponseText = this.cleanMarkdownFormatting(aiResponseText);
    }

    // Save AI response with updated user context
    const aiMessage = await this.messageRepository.save({
      content: aiResponseText,
      role: MessageRole.AI,
      conversation,
      user: userWithContext,
    });

    return aiMessage;
  }

  async getConversations(user: User): Promise<ChatConversation[]> {
    const userWithContext = await this.loadUserWithFullContext(user.id);
    return await this.conversationRepository.find({
      where: { user: { id: userWithContext.id }, isActive: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async getConversation(user: User, conversationId: string): Promise<ChatConversation> {
    const userWithContext = await this.loadUserWithFullContext(user.id);
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, user: { id: userWithContext.id } },
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