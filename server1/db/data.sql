
SET NAMES utf8;
SET time_zone = '+00:00';

SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;


INSERT INTO `users` (`id`, `email`, `password_hash`, `pwdLogin`, `googleOauth`, `USER_GOOGLE_EMAIL`, `first_name`, `last_name`, `account_status`, `balance_tokens`, `created_at`, `updated_at`) VALUES
(3,	'test1@test.com',	'b8ebe4dfc942112c8b7cb5366a914352:fffed62e449d7f102c3f33b8758d9cb3',	1,	1,	'test1.different@gmail.com',	'Test',	'User',	'active',	0,	'2025-11-18 11:38:13',	'2025-11-18 11:38:13');


INSERT INTO `pblcRechms` (`id`, `user_id`, `url_code`, `is_active`, `deactivate_at`, `created_at`, `updated_at`) VALUES
(3,	3,	'f6z',	1,	NULL,	'2025-11-18 11:38:13',	'2025-11-18 11:38:13');





-- 2025-11-18 12:23:15 UTC