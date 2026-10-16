import * as migration_20261016_090115_init from './20261016_090115_init';
import * as migration_20261016_092103_staff_auth from './20261016_092103_staff_auth';
import * as migration_20261016_102520_jobs_queue from './20261016_102520_jobs_queue';

export const migrations = [
  {
    up: migration_20261016_090115_init.up,
    down: migration_20261016_090115_init.down,
    name: '20261016_090115_init',
  },
  {
    up: migration_20261016_092103_staff_auth.up,
    down: migration_20261016_092103_staff_auth.down,
    name: '20261016_092103_staff_auth',
  },
  {
    up: migration_20261016_102520_jobs_queue.up,
    down: migration_20261016_102520_jobs_queue.down,
    name: '20261016_102520_jobs_queue'
  },
];
