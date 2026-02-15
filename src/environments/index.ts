import { environment as developmentEnvironment } from './environment';
import { environment as productionEnvironment } from './environment.production';

export const environment = import.meta.env.PROD
  ? productionEnvironment
  : developmentEnvironment;
