import * as migration_20261016_090115_init from './20261016_090115_init';
import * as migration_20261016_092103_staff_auth from './20261016_092103_staff_auth';
import * as migration_20261016_102520_jobs_queue from './20261016_102520_jobs_queue';
import * as migration_20261016_104218_media_uploads from './20261016_104218_media_uploads';
import * as migration_20261016_105811_audit_logs from './20261016_105811_audit_logs';
import * as migration_20261016_160726_click_events from './20261016_160726_click_events';
import * as migration_20261017_031052_categories_developers from './20261017_031052_categories_developers';

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
    name: '20261016_102520_jobs_queue',
  },
  {
    up: migration_20261016_104218_media_uploads.up,
    down: migration_20261016_104218_media_uploads.down,
    name: '20261016_104218_media_uploads',
  },
  {
    up: migration_20261016_105811_audit_logs.up,
    down: migration_20261016_105811_audit_logs.down,
    name: '20261016_105811_audit_logs',
  },
  {
    up: migration_20261016_160726_click_events.up,
    down: migration_20261016_160726_click_events.down,
    name: '20261016_160726_click_events',
  },
  {
    up: migration_20261017_031052_categories_developers.up,
    down: migration_20261017_031052_categories_developers.down,
    name: '20261017_031052_categories_developers'
  },
];
