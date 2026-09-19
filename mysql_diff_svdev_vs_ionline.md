# So sánh cấu trúc Database: `sv_dev_ionline` vs `ionline_data`

> File dump: `sv_dev_ionline.sql` (149 bảng) và `ionline_data.sql` (122 bảng)
> Ngày tạo: 2026-06-25

---

## Phần 1 — Bảng thiếu trong `ionline_data` so với `sv_dev_ionline` (29 bảng)

Các bảng này có trong `sv_dev_ionline` nhưng **không có** trong `ionline_data`:

| # | Bảng | Mô tả |
|---|------|-------|
| 1 | `announcement_users` | Người dùng nhận thông báo |
| 2 | `announcements` | Thông báo |
| 3 | `baiviet` | Bài viết CMS |
| 4 | `chuyenmuc` | Chuyên mục CMS |
| 5 | `class_group_member` | Thành viên nhóm |
| 6 | `class_group_plan` | Kế hoạch nhóm |
| 7 | `class_plan_activity_thaoluan_post` | Bài thảo luận |
| 8 | `class_plan_activity_thaoluan_post_reply` | Trả lời thảo luận |
| 9 | `class_plan_activity_tuluan_plan` | Kế hoạch tự luận |
| 10 | `class_plan_activity_tuluan_plan_post` | Bài nộp tự luận |
| 11 | `course_config` | Cấu hình khóa học |
| 12 | `course_form_comment` | Comment form |
| 13 | `course_form_duyet` | Duyệt form |
| 14 | `course_form_th_kthp` | Form thực hành KTHP |
| 15 | `extracurricular_students` | SV ngoại khóa |
| 16 | `extracurriculars` | Hoạt động ngoại khóa |
| 17 | `hoidong_thamdinh` | Hội đồng thẩm định |
| 18 | `hoidong_thamdinh_monhoc` | HĐ thẩm định môn học |
| 19 | `hoidong_thamdinh_monhoc_thanhvien` | TV HĐ thẩm định môn học |
| 20 | `hoidong_thamdinh_thanhvien` | TV HĐ thẩm định |
| 21 | `partner_students` | Sinh viên đối tác |
| 22 | `rpt_class_student_test_daugio` | Báo cáo kiểm tra đầu giờ |
| 23 | `thi_question_bank_th` | Ngân hàng câu hỏi thực hành |
| 24 | `thi_shift_duan_group` | Nhóm dự án shift thi |
| 25 | `thibackup_shift_controls` | Backup điều khiển ca thi |
| 26 | `thibackup_shift_rooms` | Backup phòng thi |
| 27 | `thibackup_shift_student_answers` | Backup câu trả lời |
| 28 | `thibackup_shift_students` | Backup SV dự thi |
| 29 | `thibackup_shift_violation` | Backup vi phạm |

---

## Phần 2 — Bảng thừa trong `ionline_data` (2 bảng)

Các bảng này có trong `ionline_data` nhưng **không có** trong `sv_dev_ionline`:

| # | Bảng |
|---|------|
| 1 | `class_student_diemdanh_back` |
| 2 | `rpt_class_student_test_cc_back` |

---

## Phần 3 — Bảng tồn tại ở cả 2 nhưng số cột khác nhau (14 bảng)

| Bảng | ionline_data | sv_dev_ionline | Cột thừa/thiếu |
|------|:-----------:|:--------------:|----------------|
| **classes** | 35 | 37 | Thiếu: `sync_class_id`, `link_zoom` |
| **class_group** | 13 | 12 | Cấu trúc khác: ionline có `class_student_id`, `student_id`, `group_number`; sv_dev có `name`, `slug` |
| **class_plan_activities** | 29 | 30 | Thiếu: `desc_cpi` |
| **class_plan_activities_tests** | 35 | 34 | Thừa: `stopped` |
| **class_student_diemdanh** | 22 | 21 | Thừa: `deleted` |
| **course_plan_activities** | 41 | 42 | Thiếu: `course_clo_id` |
| **course_plan_activity_tuluan** | 32 | 34 | Thiếu: `course_clo_id`, `form_th_kthp_id` |
| **course_question_forms** | 15 | 16 | Thiếu: `part` |
| **ctdt** | 23 | 24 | Thiếu: `madt` |
| **rpt_class_student_points** | 32 | 33 | Thiếu: `so_tietnghi` |
| **students** | 30 | 31 | Thiếu: `ctdt_id` |
| **survey_plans** | 28 | 27 | Thừa: `display_position` |
| **surveys** | 14 | 15 | Thiếu: `parent_id` |
| **video_marker** | 12 | 13 | Thiếu: `lesson_id` |

---

## Phần 4 — CREATE TABLE của 22 bảng từ `sv_dev_ionline`

### 1. `course_clo_contribute`
```sql
CREATE TABLE `course_clo_contribute` (
  `id` int(11) NOT NULL,
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
  `updated_by` bigint(20) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### 2. `announcement_users`
```sql
CREATE TABLE `announcement_users` (
  `id` bigint(20) DEFAULT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `seen` tinyint(1) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

### 3. `baiviet`
```sql
CREATE TABLE `baiviet` (
  `id` int(11) NOT NULL,
  `title` int(11) NOT NULL,
  `content` int(11) NOT NULL,
  `slug` int(11) NOT NULL,
  `chuyenmuc_id` int(11) NOT NULL,
  `tags` text NOT NULL COMMENT '[ ]',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `is_deleted` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
```

### 4. `chuyenmuc`
```sql
CREATE TABLE `chuyenmuc` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `desc` text DEFAULT NULL,
  `slug` varchar(255) NOT NULL,
  `parent_id` int(11) DEFAULT 0,
  `thumbnail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
```

### 5. `class_group_member`
```sql
CREATE TABLE `class_group_member` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT 0,
  `class_group_id` int(11) DEFAULT 0,
  `student_id` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_by` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### 6. `class_group_plan`
```sql
CREATE TABLE `class_group_plan` (
  `id` int(11) NOT NULL,
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
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
```

### 7. `class_plan_activity_thaoluan_post`
```sql
CREATE TABLE `class_plan_activity_thaoluan_post` (
  `id` int(11) NOT NULL,
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
  `updated_by` bigint(20) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### 8. `class_plan_activity_thaoluan_post_reply`
```sql
CREATE TABLE `class_plan_activity_thaoluan_post_reply` (
  `id` int(11) NOT NULL,
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
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### 9. `course_config`
```sql
CREATE TABLE `course_config` (
  `id` int(11) NOT NULL,
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
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

### 10. `course_form_comment`
```sql
CREATE TABLE `course_form_comment` (
  `id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT 0,
  `form_type` varchar(255) DEFAULT NULL COMMENT 'TN_KTHP || TH_KTHP || DG || TNTX || CC',
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
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

### 11. `course_form_duyet`
```sql
CREATE TABLE `course_form_duyet` (
  `id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT 0,
  `form_type` varchar(255) DEFAULT NULL COMMENT 'TN_KTHP || TH_KTHP || DG || TNTX || CC',
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
  `is_deleted` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

### 12. `course_form_th_kthp`
```sql
CREATE TABLE `course_form_th_kthp` (
  `id` int(11) NOT NULL,
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
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

### 13. `extracurriculars`
```sql
CREATE TABLE `extracurriculars` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `description_image` text DEFAULT NULL,
  `point` int(11) DEFAULT 0,
  `total_students` int(11) DEFAULT 0,
  `location` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '{name: Tên địa điểm, latitude: Vĩ độ, longitude: Kinh độ}',
  `radius_meter` double DEFAULT 0 COMMENT 'Phạm vi cho phép điểm danh của hoạt động tính bằng m',
  `time_start` timestamp NOT NULL COMMENT 'Thời gian bắt đầu ngoại khóa',
  `time_end` timestamp NULL DEFAULT NULL COMMENT 'Thời gian kết thúc ngoại khóa',
  `check_in` int(11) DEFAULT 0 COMMENT 'Thời gian được check in tính bằng phút tính từ time_start',
  `check_out` int(11) DEFAULT 0 COMMENT 'Thời gian được check out tính bằng phút tính sau time_end',
  `status` int(1) NOT NULL DEFAULT 0 COMMENT '-1: Chưa mở | 0: Đang diễn ra | 1: Đã kết thúc',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

### 14. `extracurricular_students`
```sql
CREATE TABLE `extracurricular_students` (
  `id` int(11) NOT NULL,
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
  `updated_by` bigint(20) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

### 15. `hoidong_thamdinh`
```sql
CREATE TABLE `hoidong_thamdinh` (
  `id` int(11) NOT NULL,
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
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

### 16. `hoidong_thamdinh_monhoc`
```sql
CREATE TABLE `hoidong_thamdinh_monhoc` (
  `id` int(11) NOT NULL,
  `hoidong_thamdinh_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

### 17. `hoidong_thamdinh_monhoc_thanhvien`
```sql
CREATE TABLE `hoidong_thamdinh_monhoc_thanhvien` (
  `id` int(11) NOT NULL,
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
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

### 18. `hoidong_thamdinh_thanhvien`
```sql
CREATE TABLE `hoidong_thamdinh_thanhvien` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT 0,
  `hoidong_thamdinh_id` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

### 19. `partner_students`
```sql
CREATE TABLE `partner_students` (
  `id` int(11) NOT NULL,
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
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### 20. `rpt_class_student_test_daugio`
```sql
CREATE TABLE `rpt_class_student_test_daugio` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `class_id` int(11) NOT NULL DEFAULT 0,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `week` int(11) NOT NULL DEFAULT 0,
  `passing_point` int(11) DEFAULT 0,
  `maxpoint_3t` int(11) DEFAULT 0,
  `maxpoint_at` decimal(10,2) DEFAULT 0.00,
  `num_of_test` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### 21. `thi_question_bank_th`
```sql
CREATE TABLE `thi_question_bank_th` (
  `id` int(11) NOT NULL,
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
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

### 22. `thi_shift_duan_group`
```sql
CREATE TABLE `thi_shift_duan_group` (
  `id` bigint(20) NOT NULL,
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
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
```

'sso-users-new': {
    'table': 'sso_users_new'
},
'class-group-plan': {
    'table': 'class_group_plan'
},
'class-plan-activity-tuluan-plan': {
    'table': 'class_plan_activity_tuluan_plan',
    'cache': true,
},
'class-plan-activity-tuluan-plan-post': {
    'table': 'class_plan_activity_tuluan_plan_post'
},
'thi-shift-duan-group': {
    'table': 'thi_shift_duan_group'
},
'registrations': {
    'table': 'dttx_registrations',
    'resource': ['manager', 'create', 'update']
},
'registration-status': {
    'table': 'dttx_registration_status',
    'resource': ['manager', 'create', 'update']
},
'dotxettuyen': {
    'table': 'dttx_dotxettuyen',
    'resource': ['manager', 'create', 'update']
},
'nganh': {
    'table': 'dttx_nganh',
    'public': ['manager'],
    'resource': ['manager', 'create', 'update']
},
'dttx-uploads': {
    'table': 'dttx_uploads',
    'resource': ['manager', 'create']
},
'check-users': {
    'table': 'check_users',
},
'announcements': {
    'table': 'announcements',
    'cache': true,
},
'announcement-users': {
    'table': 'announcement_users',
    'permission': false,
},
'hoidong-thamdinh': {
    'table': 'hoidong_thamdinh'
},
'hoidong-thamdinh-monhoc': {
    'table': 'hoidong_thamdinh_monhoc'
},
'hoidong-thamdinh-thanhvien': {
    'table': 'hoidong_thamdinh_thanhvien'
},
'hoidong-thamdinh-monhoc-thanhvien': {
    'table': 'hoidong_thamdinh_monhoc_thanhvien'
},
'course-form-th-kthp': {
    'table': 'course_form_th_kthp'
},
'thi-question-bank-th': {
    'table': 'thi_question_bank_th'
},
'extracurriculars': {
    'table': 'extracurriculars'
},
'extracurricular-students': {
    'table': 'extracurricular_students'
},
'course-form-comment': {
    'table': 'course_form_comment'
},
'course-form-duyet': {
    'table': 'course_form_duyet'
},
'course-config': {
    'table': 'course_config'
},
'course-clo-contribute': {
    'table': 'course_clo_contribute'
},
'class-group-member': {
    'table': 'class_group_member'
},
'dhhv': {
    'table': 'dhhv_api'
},
'partner-students': {
    'table': 'partner_students'
},
'class-plan-activity-thaoluan-post': {
    'table': 'class_plan_activity_thaoluan_post'
},
'class-plan-activity-thaoluan-post-reply': {
    'table': 'class_plan_activity_thaoluan_post_reply'
},
'cources2': {
    'table': 'cources2'
},
'cource2-lessons': {
    'table': 'cource2_lessons'
},
