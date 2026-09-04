-- =======================================================
-- VEHICLEHUB - Complete Production Database Schema
-- =======================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `phone` VARCHAR(20) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `district` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `mandal` VARCHAR(100) NULL,
    `pincode` VARCHAR(10) NULL,
    `profile_photo` VARCHAR(255) DEFAULT 'default-avatar.png',
    `role` ENUM('USER', 'ADMIN', 'MODERATOR') DEFAULT 'USER',
    `is_suspended` TINYINT(1) DEFAULT 0,
    `suspended_reason` TEXT NULL,
    `reset_token` VARCHAR(255) NULL,
    `reset_token_expires` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_phone` (`phone`),
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Vehicle Categories Table
CREATE TABLE IF NOT EXISTS `vehicle_categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `icon` VARCHAR(50) DEFAULT 'fa-car',
    `description` TEXT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `display_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_cat_slug` (`slug`),
    INDEX `idx_cat_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Vehicles Table
CREATE TABLE IF NOT EXISTS `vehicles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `seller_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `brand` VARCHAR(100) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `variant` VARCHAR(100) NULL,
    `manufacturing_year` INT NOT NULL,
    `registration_year` INT NULL,
    `registration_number` VARCHAR(50) NULL,
    `fuel_type` VARCHAR(50) NOT NULL,
    `transmission` VARCHAR(50) NOT NULL,
    `price` DECIMAL(12,2) NOT NULL,
    `kilometers` INT NOT NULL,
    `mileage` VARCHAR(50) NULL,
    `engine_capacity` VARCHAR(50) NULL,
    `vehicle_color` VARCHAR(50) NULL,
    `ownership_type` VARCHAR(50) NOT NULL,
    `insurance_status` VARCHAR(50) DEFAULT 'None',
    `insurance_expiry` DATE NULL,
    `fitness_status` VARCHAR(50) DEFAULT 'Not Applicable',
    `registration_state` VARCHAR(100) NULL,
    `registration_district` VARCHAR(100) NULL,
    `registration_city` VARCHAR(100) NULL,
    `registration_mandal` VARCHAR(100) NULL,
    `location` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `condition_rating` VARCHAR(50) DEFAULT 'Good',
    `scratches` TEXT NULL,
    `dents` TEXT NULL,
    `repairs` TEXT NULL,
    `accident_history` TEXT NULL,
    `mechanical_issues` TEXT NULL,
    `number_of_tyres` INT NULL,
    `seats` INT NULL,
    `body_type` VARCHAR(100) NULL,
    `air_conditioning` TINYINT(1) DEFAULT 0,
    `airbags` TINYINT(1) DEFAULT 0,
    `operating_hours` INT NULL,
    `horsepower` INT NULL,
    `drive_type` VARCHAR(50) NULL,
    `payload_capacity` VARCHAR(50) NULL,
    `verification_status` ENUM('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED') DEFAULT 'UNVERIFIED',
    `status` ENUM('ACTIVE', 'SOLD', 'PENDING', 'REJECTED', 'DELETED') DEFAULT 'ACTIVE',
    `rejection_reason` TEXT NULL,
    `views_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`category_id`) REFERENCES `vehicle_categories`(`id`) ON DELETE RESTRICT,
    INDEX `idx_v_category` (`category_id`),
    INDEX `idx_v_seller` (`seller_id`),
    INDEX `idx_v_brand` (`brand`),
    INDEX `idx_v_model` (`model`),
    INDEX `idx_v_price` (`price`),
    INDEX `idx_v_status` (`status`),
    INDEX `idx_v_city` (`registration_city`),
    INDEX `idx_v_district` (`registration_district`),
    INDEX `idx_v_reg_no` (`registration_number`),
    INDEX `idx_v_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Vehicle Images Table
CREATE TABLE IF NOT EXISTS `vehicle_images` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `vehicle_id` INT NOT NULL,
    `image` VARCHAR(255) NOT NULL,
    `is_primary` TINYINT(1) DEFAULT 0,
    `display_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE,
    INDEX `idx_vi_vehicle` (`vehicle_id`),
    INDEX `idx_vi_primary` (`is_primary`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Favorites Table
CREATE TABLE IF NOT EXISTS `favorites` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `vehicle_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_user_favorite` (`user_id`, `vehicle_id`),
    INDEX `idx_fav_user` (`user_id`),
    INDEX `idx_fav_vehicle` (`vehicle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Conversations Table
CREATE TABLE IF NOT EXISTS `conversations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `vehicle_id` INT NOT NULL,
    `buyer_id` INT NOT NULL,
    `seller_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_convo_participants` (`vehicle_id`, `buyer_id`, `seller_id`),
    INDEX `idx_c_buyer` (`buyer_id`),
    INDEX `idx_c_seller` (`seller_id`),
    INDEX `idx_c_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Messages Table
CREATE TABLE IF NOT EXISTS `messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `conversation_id` INT NOT NULL,
    `sender_id` INT NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_m_convo` (`conversation_id`),
    INDEX `idx_m_sender` (`sender_id`),
    INDEX `idx_m_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Reviews Table
CREATE TABLE IF NOT EXISTS `reviews` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `seller_id` INT NOT NULL,
    `reviewer_id` INT NOT NULL,
    `vehicle_id` INT NULL,
    `rating` TINYINT NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
    `comment` TEXT NULL,
    `status` ENUM('APPROVED', 'PENDING', 'REJECTED') DEFAULT 'APPROVED',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE SET NULL,
    INDEX `idx_rev_seller` (`seller_id`),
    INDEX `idx_rev_reviewer` (`reviewer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Reports Table
CREATE TABLE IF NOT EXISTS `reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `reporter_id` INT NULL,
    `reporter_contact` VARCHAR(150) NULL,
    `vehicle_id` INT NOT NULL,
    `reason` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED') DEFAULT 'PENDING',
    `admin_notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE,
    INDEX `idx_rep_status` (`status`),
    INDEX `idx_rep_vehicle` (`vehicle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(255) NULL,
    `type` VARCHAR(50) DEFAULT 'info',
    `is_read` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_notif_user` (`user_id`),
    INDEX `idx_notif_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Vehicle Views Table
CREATE TABLE IF NOT EXISTS `vehicle_views` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `vehicle_id` INT NOT NULL,
    `user_id` INT NULL,
    `ip_hash` VARCHAR(64) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_vv_vehicle` (`vehicle_id`),
    INDEX `idx_vv_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Challans Table
CREATE TABLE IF NOT EXISTS `challans` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `registration_number` VARCHAR(50) NOT NULL,
    `challan_number` VARCHAR(100) NULL,
    `amount` DECIMAL(10,2) DEFAULT 0.00,
    `violation_date` DATETIME NULL,
    `status` VARCHAR(50) DEFAULT 'Pending',
    `location` VARCHAR(255) NULL,
    `raw_data` TEXT NULL,
    `fetched_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_ch_reg` (`registration_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `admin_id` INT NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INT NOT NULL,
    `description` TEXT NULL,
    `ip_address` VARCHAR(50) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_al_admin` (`admin_id`),
    INDEX `idx_al_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
