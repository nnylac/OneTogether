import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type {
  DirectionsRequest,
  DirectionsResponse,
} from './directions.service';
import { DirectionsService } from './directions.service';

@ApiTags('maps')
@Controller('directions')
export class DirectionsController {
  constructor(private readonly directionsService: DirectionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get driving directions between two points',
    description:
      'Returns route path, distance, and duration using Google Maps Directions API with fallback to mock routing.',
  })
  @ApiQuery({ name: 'originLat', required: true, type: Number })
  @ApiQuery({ name: 'originLng', required: true, type: Number })
  @ApiQuery({ name: 'destLat', required: true, type: Number })
  @ApiQuery({ name: 'destLng', required: true, type: Number })
  async getDirections(
    @Query('originLat') originLat: string,
    @Query('originLng') originLng: string,
    @Query('destLat') destLat: string,
    @Query('destLng') destLng: string,
  ): Promise<DirectionsResponse> {
    const request: DirectionsRequest = {
      origin: { lat: parseFloat(originLat), lng: parseFloat(originLng) },
      destination: { lat: parseFloat(destLat), lng: parseFloat(destLng) },
    };
    return this.directionsService.getDirections(request);
  }
}
