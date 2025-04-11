import { Controller, Get, Query, Param, ValidationPipe, Post, Body, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes} from '@nestjs/swagger';
import { RecipeService } from './recipe.service';
import { SearchRecipeDto, RecipeDto, IngredientSearchDto, ImageAnalysisByUrlDto, FoodAnalysisResponseDto } from './dto/recipe.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Recipes')
@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search recipes with filters' })
  @ApiResponse({ status: 200, description: 'Returns categorized recipes', type: RecipeDto, isArray: true })
  async searchRecipes(@Query(ValidationPipe) searchDto: SearchRecipeDto) {
    return this.recipeService.searchRecipes(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recipe by ID' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiResponse({ status: 200, description: 'Returns recipe details', type: RecipeDto })
  async getRecipeById(@Param('id') id: number) {
    return this.recipeService.getRecipeById(id);
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar recipes' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiResponse({ status: 200, description: 'Returns similar recipes', type: RecipeDto, isArray: true })
  async getSimilarRecipes(@Param('id') id: number) {
    return this.recipeService.getSimilarRecipes(id);
  }

  @Get('ingredients/search')
  @ApiOperation({ summary: 'Search ingredients' })
  @ApiResponse({ status: 200, description: 'Returns matching ingredients' })
  async searchIngredients(@Query(ValidationPipe) searchDto: IngredientSearchDto) {
    return this.recipeService.searchIngredients(searchDto);
  }


  @Get(':id/nutrition')
  @ApiOperation({ summary: 'Get recipe nutrition information' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiResponse({ status: 200, description: 'Returns recipe nutrition details' })
  async getRecipeNutrition(@Param('id') id: number) {
    return this.recipeService.getRecipeNutrition(id);
  }

  @Get(':id/analyzedInstructions')
  @ApiOperation({ summary: 'Get analyzed recipe instructions' })
  @ApiParam({ name: 'id', description: 'Recipe ID' })
  @ApiQuery({ name: 'stepBreakdown', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Returns analyzed recipe instructions' })
  async getAnalyzedInstructions(
    @Param('id') id: number,
    @Query('stepBreakdown') stepBreakdown?: boolean,
  ) {
    return this.recipeService.getAnalyzedInstructions(id, stepBreakdown);
}


@Post('analyze/url')
@ApiOperation({ summary: 'Analyze food image by URL' })
@ApiResponse({ status: 200, description: 'Returns analysis of food image', type: FoodAnalysisResponseDto })
async analyzeImageByUrl(@Body() imageDto: ImageAnalysisByUrlDto) {
  return this.recipeService.analyzeImageByUrl(imageDto.imageUrl);
}


@Post('analyze/file')
@ApiOperation({ summary: 'Analyze food image by file upload' })
@ApiConsumes('multipart/form-data')
@ApiResponse({ status: 200, description: 'Returns analysis of food image', type: FoodAnalysisResponseDto })
@UseInterceptors(FileInterceptor('file'))  
async analyzeImageByFile(@UploadedFile() file) {
  if (!file) {
    throw new BadRequestException('File is required');
  }
  return this.recipeService.analyzeImageByFile(file.buffer);
}
}

