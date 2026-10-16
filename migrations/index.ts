import * as migration_20261016_090115_init from './20261016_090115_init';

export const migrations = [
  {
    up: migration_20261016_090115_init.up,
    down: migration_20261016_090115_init.down,
    name: '20261016_090115_init'
  },
];
