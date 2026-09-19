ALTER TABLE `classes`
  ADD COLUMN `sync_class_id` text DEFAULT '0',
  ADD COLUMN `link_zoom` varchar(255) DEFAULT NULL;

ALTER TABLE `class_group`
  ADD COLUMN `name` text DEFAULT NULL,
  ADD COLUMN `slug` text DEFAULT NULL;

ALTER TABLE `class_plan_activities`
  ADD COLUMN `desc_cpi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`desc_cpi`));

ALTER TABLE `course_plan_activities`
  ADD COLUMN `course_clo_id` int(11) DEFAULT 0;

ALTER TABLE `course_plan_activity_tuluan`
  ADD COLUMN `course_clo_id` int(11) DEFAULT 0,
  ADD COLUMN `form_th_kthp_id` int(11) DEFAULT 0;

ALTER TABLE `course_question_forms`
  ADD COLUMN `part` varchar(255) DEFAULT NULL;

ALTER TABLE `ctdt`
  ADD COLUMN `madt` varchar(255) DEFAULT NULL;

ALTER TABLE `media`
  ADD COLUMN `parent_id` bigint(20) DEFAULT 0,
  ADD COLUMN `share` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`share`));

ALTER TABLE `media_aws`
  ADD COLUMN `parent_id` bigint(20) DEFAULT 0,
  ADD COLUMN `share` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`share`));

ALTER TABLE `rpt_class_student_points`
  ADD COLUMN `so_tietnghi` int(11) DEFAULT 0;

ALTER TABLE `students`
  ADD COLUMN `ctdt_id` int(11) DEFAULT 0;

ALTER TABLE `surveys`
  ADD COLUMN `parent_id` int(11) NOT NULL DEFAULT 0;

ALTER TABLE `video_marker`
  ADD COLUMN `lesson_id` int(11) DEFAULT 0;
