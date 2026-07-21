import { ObjectDefinitionModule } from './types';
import { tableModule } from './table';
import { chairModule } from './chair';
import { cupModule } from './cup';
import { mugModule } from './mug';

export const objectRegistry: Record<string, ObjectDefinitionModule> = {
  table: tableModule,
  chair: chairModule,
  cup: cupModule,
  mug: mugModule,
};

export const objectList: ObjectDefinitionModule[] = [
  tableModule,
  chairModule,
  cupModule,
  mugModule,
];
