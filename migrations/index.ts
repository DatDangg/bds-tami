import * as migration_20261016_090115_init from './20261016_090115_init';
import * as migration_20261016_092103_staff_auth from './20261016_092103_staff_auth';
import * as migration_20261016_102520_jobs_queue from './20261016_102520_jobs_queue';
import * as migration_20261016_104218_media_uploads from './20261016_104218_media_uploads';
import * as migration_20261016_105811_audit_logs from './20261016_105811_audit_logs';
import * as migration_20261016_160726_click_events from './20261016_160726_click_events';
import * as migration_20261017_031052_categories_developers from './20261017_031052_categories_developers';
import * as migration_20261017_033508_globals_site_header_footer from './20261017_033508_globals_site_header_footer';
import * as migration_20261017_034248_globals_translation_group from './20261017_034248_globals_translation_group';
import * as migration_20261017_043315_translation_usage from './20261017_043315_translation_usage';
import * as migration_20261017_092524_services_pages from './20261017_092524_services_pages';
import * as migration_20261017_093650_news from './20261017_093650_news';
import * as migration_20261017_122831_provinces_wards from './20261017_122831_provinces_wards';
import * as migration_20261017_125429_projects from './20261017_125429_projects';
import * as migration_20261017_130625_job_postings from './20261017_130625_job_postings';
import * as migration_20261017_132020_job_applications_cv_nullable from './20261017_132020_job_applications_cv_nullable';
import * as migration_20261017_135306_redirects from './20261017_135306_redirects';
import * as migration_20261017_143212_rentals from './20261017_143212_rentals';
import * as migration_20261017_175237_close_job_postings_task from './20261017_175237_close_job_postings_task';
import * as migration_20261018_075627_property_posts from './20261018_075627_property_posts';
import * as migration_20261018_082231_rentals_search_trgm from './20261018_082231_rentals_search_trgm';
import * as migration_20261018_091949_homepage_global from './20261018_091949_homepage_global';

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
    name: '20261017_031052_categories_developers',
  },
  {
    up: migration_20261017_033508_globals_site_header_footer.up,
    down: migration_20261017_033508_globals_site_header_footer.down,
    name: '20261017_033508_globals_site_header_footer',
  },
  {
    up: migration_20261017_034248_globals_translation_group.up,
    down: migration_20261017_034248_globals_translation_group.down,
    name: '20261017_034248_globals_translation_group',
  },
  {
    up: migration_20261017_043315_translation_usage.up,
    down: migration_20261017_043315_translation_usage.down,
    name: '20261017_043315_translation_usage',
  },
  {
    up: migration_20261017_092524_services_pages.up,
    down: migration_20261017_092524_services_pages.down,
    name: '20261017_092524_services_pages',
  },
  {
    up: migration_20261017_093650_news.up,
    down: migration_20261017_093650_news.down,
    name: '20261017_093650_news',
  },
  {
    up: migration_20261017_122831_provinces_wards.up,
    down: migration_20261017_122831_provinces_wards.down,
    name: '20261017_122831_provinces_wards',
  },
  {
    up: migration_20261017_125429_projects.up,
    down: migration_20261017_125429_projects.down,
    name: '20261017_125429_projects',
  },
  {
    up: migration_20261017_130625_job_postings.up,
    down: migration_20261017_130625_job_postings.down,
    name: '20261017_130625_job_postings',
  },
  {
    up: migration_20261017_132020_job_applications_cv_nullable.up,
    down: migration_20261017_132020_job_applications_cv_nullable.down,
    name: '20261017_132020_job_applications_cv_nullable',
  },
  {
    up: migration_20261017_135306_redirects.up,
    down: migration_20261017_135306_redirects.down,
    name: '20261017_135306_redirects',
  },
  {
    up: migration_20261017_143212_rentals.up,
    down: migration_20261017_143212_rentals.down,
    name: '20261017_143212_rentals',
  },
  {
    up: migration_20261017_175237_close_job_postings_task.up,
    down: migration_20261017_175237_close_job_postings_task.down,
    name: '20261017_175237_close_job_postings_task',
  },
  {
    up: migration_20261018_075627_property_posts.up,
    down: migration_20261018_075627_property_posts.down,
    name: '20261018_075627_property_posts',
  },
  {
    up: migration_20261018_082231_rentals_search_trgm.up,
    down: migration_20261018_082231_rentals_search_trgm.down,
    name: '20261018_082231_rentals_search_trgm',
  },
  {
    up: migration_20261018_091949_homepage_global.up,
    down: migration_20261018_091949_homepage_global.down,
    name: '20261018_091949_homepage_global'
  },
];
