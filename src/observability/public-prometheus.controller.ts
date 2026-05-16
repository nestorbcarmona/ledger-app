import { Controller } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Public } from '../common/public.decorator';

@SkipThrottle()
@Public()
@Controller()
export class PublicPrometheusController extends PrometheusController {}
