import { Controller, Get, Post, Body, Query, Param, ValidationPipe } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { SearchRecipeDto, RecipeAnalysisDto } from './dto/recipe.dto';

@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Get('recipes/search')
  async searchRecipes(@Query(ValidationPipe) searchDto: SearchRecipeDto) {
    return this.recipeService.searchRecipes(searchDto);
  }

  @Get('recipes/:id')
  async getRecipeById(@Param('id') id: number) {
    return this.recipeService.getRecipeById(id);
  }

  @Post('analyze')
  async analyzeRecipe(@Body(ValidationPipe) analysisDto: RecipeAnalysisDto) {
    return this.recipeService.analyzeRecipe(analysisDto);
  }
/**
 * This endpoint is not implemented yet -> bt3mel ,ashakel 3la el data eli hatet3mlha return
 */
  //@Get('recipes/random')
  //async getRandomRecipes(@Query('tags') tags?: string[]) {
  //  return this.recipeService.getRandomRecipes(tags);
  //}

  @Get('recipes/:id/similar')
  async getSimilarRecipes(@Param('id') id: number) {
    return this.recipeService.getSimilarRecipes(id);
  }
}