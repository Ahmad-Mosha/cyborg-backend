import { Controller, Get, Query, Param, ValidationPipe } from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery} from '@nestjs/swagger';
import { RecipeService } from './recipe.service';
import { SearchRecipeDto, RecipeDto, IngredientSearchDto } from './dto/recipe.dto';

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
}

