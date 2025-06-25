import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  HttpStatus,
  Body,
  HttpCode,
  Req
} from '@nestjs/common';
import { Request } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get('/*')
  @HttpCode(HttpStatus.OK)
  routeGet(@Req() request: Request) {
    return this.appService.route(request);
  }

  @Post('/*')
  @HttpCode(HttpStatus.CREATED)
  routePost(@Req() request: Request, @Body() body: any) {
    return this.appService.routeWithBody(request, body);
  }

  @Put('/*')
  @HttpCode(HttpStatus.OK)
  routePut(@Req() request: Request, @Body() body: any) {
    return this.appService.routeWithBody(request, body);
  }

  @Delete('/*')
  @HttpCode(HttpStatus.OK)
  routeDelete(@Req() request: Request) {
    return this.appService.route(request);
  }
}
