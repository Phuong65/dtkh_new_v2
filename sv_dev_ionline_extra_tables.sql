CREATE TABLE `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `send_name` varchar(255) DEFAULT NULL,
  `send_id` int(11) DEFAULT NULL,
  `files` text DEFAULT NULL,
  `state` int(11) DEFAULT 1,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `announcement_users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL,
  `seen` tinyint(1) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `baiviet` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` int(11) NOT NULL,
  `content` int(11) NOT NULL,
  `slug` int(11) NOT NULL,
  `chuyenmuc_id` int(11) NOT NULL,
  `tags` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `is_deleted` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `chuyenmuc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `desc` text DEFAULT NULL,
  `slug` varchar(255) NOT NULL,
  `parent_id` int(11) DEFAULT 0,
  `thumbnail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `class_group_member` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) DEFAULT 0,
  `class_group_id` int(11) DEFAULT 0,
  `student_id` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_by` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `class_group_plan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) DEFAULT 0,
  `class_group_id` int(11) DEFAULT 0,
  `week` int(11) DEFAULT 0,
  `teaching_day` timestamp NULL DEFAULT NULL,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `class_plan_activity_thaoluan_post` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `title` text DEFAULT NULL,
  `class_plan_activity_id` int(11) DEFAULT 0,
  `student_id` int(11) DEFAULT 0,
  `files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`files`)),
  `noidung` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `class_plan_activity_thaoluan_post_reply` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `noidung` text DEFAULT NULL,
  `post_id` int(11) DEFAULT 0,
  `class_plan_activity_id` int(11) DEFAULT 0,
  `files` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int(11) DEFAULT 0,
  `class_id` int(11) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `class_plan_activity_tuluan_plan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `title` text DEFAULT NULL,
  `desc` longtext DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `submit_file` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `class_plan_activity_tuluan_plan_post` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `class_id` bigint(20) DEFAULT 0,
  `class_plan_activity_tuluan_plan_id` bigint(20) DEFAULT 0,
  `class_plan_activity_tuluan_group_id` bigint(20) DEFAULT 0,
  `files` longtext DEFAULT NULL,
  `comment` longtext DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `is_deleted` bigint(20) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `ngaynop` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `course_clo_contribute` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) DEFAULT 0,
  `course_clo_id` int(11) DEFAULT 0,
  `ctdt_id` int(11) DEFAULT 0,
  `ctdt_cdr_parent_id` int(11) DEFAULT 0,
  `ctdt_cdr_id` int(11) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `course_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) DEFAULT 0,
  `group` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ordering` int(11) DEFAULT 100,
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `noidung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `value` int(11) DEFAULT 0,
  `params` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `course_form_comment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) DEFAULT 0,
  `form_type` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `parent_id` int(11) DEFAULT 0,
  `user_id` int(11) DEFAULT 0,
  `status` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `course_form_duyet` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) DEFAULT 0,
  `form_type` varchar(255) DEFAULT NULL,
  `status` int(11) DEFAULT 0,
  `old_status` int(11) DEFAULT 0,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` int(11) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `course_form_th_kthp` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) DEFAULT 0,
  `cdr` int(11) DEFAULT 0,
  `course_clo_id` int(11) DEFAULT 0,
  `ordering` int(11) DEFAULT 0,
  `question_take` int(11) DEFAULT 0,
  `total_question` int(11) DEFAULT 0,
  `point` double DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `extracurriculars` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `description_image` text DEFAULT NULL,
  `point` int(11) DEFAULT 0,
  `total_students` int(11) DEFAULT 0,
  `location` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `radius_meter` double DEFAULT 0,
  `time_start` timestamp NOT NULL,
  `time_end` timestamp NULL DEFAULT NULL,
  `check_in` int(11) DEFAULT 0,
  `check_out` int(11) DEFAULT 0,
  `status` int(1) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `extracurricular_students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `extracurricular_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `check_in_at` datetime DEFAULT NULL,
  `check_out_at` datetime DEFAULT NULL,
  `check_in_attachment` longtext DEFAULT NULL,
  `check_out_attachment` longtext DEFAULT NULL,
  `location_checkin` longtext DEFAULT NULL,
  `location_checkout` longtext DEFAULT NULL,
  `network_info_checkin` longtext NOT NULL,
  `network_info_checkout` longtext DEFAULT NULL,
  `is_deleted` tinyint(4) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `update_at` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_by` bigint(20) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `hoidong_thamdinh` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) DEFAULT NULL,
  `status` int(11) DEFAULT 0,
  `date_start` datetime DEFAULT NULL,
  `date_end` datetime DEFAULT NULL,
  `category_id` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `title` text DEFAULT NULL,
  `desc` text DEFAULT NULL,
  `files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`files`)),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `hoidong_thamdinh_monhoc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hoidong_thamdinh_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `hoidong_thamdinh_monhoc_thanhvien` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) DEFAULT 0,
  `hoidong_thamdinh_id` int(11) DEFAULT 0,
  `hoidong_thamdinh_monhoc_id` int(11) DEFAULT 0,
  `user_id` int(11) DEFAULT 0,
  `chutich` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `hoidong_thamdinh_thanhvien` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT 0,
  `hoidong_thamdinh_id` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `partner_students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doitac_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `student_code` varchar(50) NOT NULL,
  `khoadaotao` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `rpt_class_student_test_daugio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `class_id` int(11) NOT NULL DEFAULT 0,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `week` int(11) NOT NULL DEFAULT 0,
  `passing_point` int(11) DEFAULT 0,
  `maxpoint_3t` int(11) DEFAULT 0,
  `maxpoint_at` decimal(10,2) DEFAULT 0.00,
  `num_of_test` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `thi_question_bank_th` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) DEFAULT 0,
  `shift_id` int(11) DEFAULT 0,
  `questions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`questions`)),
  `total` int(11) DEFAULT 0,
  `av` int(11) DEFAULT 0,
  `missing` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`missing`)),
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `thi_shift_duan_group` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `shift_id` bigint(20) DEFAULT 0,
  `course_plan_activity_tuluan_id` bigint(20) DEFAULT 0,
  `student_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`student_ids`)),
  `leader_id` bigint(20) DEFAULT 0,
  `params` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`params`)),
  `room` varchar(255) DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
