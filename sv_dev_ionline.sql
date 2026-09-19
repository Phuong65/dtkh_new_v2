-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jul 20, 2026 at 09:33 PM
-- Server version: 10.11.10-MariaDB-log
-- PHP Version: 8.3.32

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sv_dev_ionline`
--

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `send_name` varchar(255) DEFAULT NULL,
  `send_id` int(11) DEFAULT NULL COMMENT 'id người gửi',
  `files` text DEFAULT NULL,
  `state` int(11) DEFAULT 1,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcement_users`
--

CREATE TABLE `announcement_users` (
  `id` bigint(20) DEFAULT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `seen` tinyint(1) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `article_categories`
--

CREATE TABLE `article_categories` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `desc` text DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` int(11) NOT NULL DEFAULT 0,
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `article_posts`
--

CREATE TABLE `article_posts` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `short_desc` text DEFAULT NULL,
  `content` text DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `tags` text DEFAULT NULL,
  `cate_ids` text DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `type` int(11) NOT NULL DEFAULT 0 COMMENT '0: bài viet,1 thongbao',
  `ghim` int(11) DEFAULT 0 COMMENT 'đánh dấu nổi bật',
  `files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`files`)),
  `is_deleted` int(11) NOT NULL DEFAULT 0,
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `article_post_cate`
--

CREATE TABLE `article_post_cate` (
  `id` int(11) NOT NULL,
  `cate_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `baiviet`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `chuyenmuc`
--

CREATE TABLE `chuyenmuc` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `desc` text DEFAULT NULL,
  `slug` varchar(255) NOT NULL,
  `parent_id` int(11) DEFAULT 0,
  `thumbnail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL COMMENT 'Lớp thuộc khoa nào',
  `nganh_bomon_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT NULL,
  `sync_class_id` text DEFAULT '0',
  `name` varchar(100) DEFAULT NULL,
  `kyhieu` varchar(255) DEFAULT NULL,
  `sotinchi` int(11) DEFAULT NULL,
  `locked_score` int(11) DEFAULT 0,
  `slug` varchar(255) DEFAULT NULL,
  `course_info` text DEFAULT NULL,
  `manager_ids` text DEFAULT NULL COMMENT 'can bo giao vien quan ly, sắp xếp theo thứ tự người đứng đầu là giảng viên chính, đứng sau là trợ giảng',
  `manager_info` text DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL COMMENT '0: chưa kích hoạt\n1: Đã kích hoạt\n-1: Lưu trữ (không xuất hiện ở khu vực làm việc) ==> sẽ có chức năng hiển thị các lớp đã lưu trữ và cho phép xoá hẳn từ đây\n',
  `trongso` text DEFAULT NULL,
  `params` text DEFAULT NULL,
  `image` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL COMMENT 'nguoi tao',
  `time_start` timestamp NULL DEFAULT NULL,
  `time_end` timestamp NULL DEFAULT NULL,
  `hocky` double DEFAULT NULL,
  `khoa` varchar(50) DEFAULT NULL COMMENT 'khóa mở',
  `dothoc` int(11) DEFAULT NULL,
  `sosv_dangky` int(11) DEFAULT NULL COMMENT 'số sinh viên đăng ký',
  `namhoc` varchar(255) DEFAULT NULL,
  `price` varchar(255) DEFAULT NULL COMMENT 'để sau',
  `approve_status` int(11) DEFAULT 0,
  `approve_info` longtext DEFAULT NULL,
  `link_googlemeet` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'nhập link google meet' CHECK (json_valid(`link_googlemeet`)),
  `link_zoom` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `classes_root`
--

CREATE TABLE `classes_root` (
  `id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL COMMENT 'Lớp thuộc ngành nào',
  `nganh_bomon_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT NULL,
  `donvi_chuyenmon_id` int(11) DEFAULT 0,
  `name` varchar(100) DEFAULT NULL,
  `kyhieu` varchar(255) DEFAULT NULL,
  `sotinchi` int(11) DEFAULT NULL,
  `slug` varchar(100) DEFAULT NULL,
  `course_info` text DEFAULT NULL,
  `manager_ids` text DEFAULT NULL COMMENT 'can bo giao vien quan ly, sắp xếp theo thứ tự người đứng đầu là giảng viên chính, đứng sau là trợ giảng',
  `manager_info` text DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL COMMENT '0: chưa kích hoạt1: Đã kích hoạt-1: Lưu trữ (không xuất hiện ở khu vực làm việc) ==> sẽ có chức năng hiển thị các lớp đã lưu trữ và cho phép xoá hẳn từ đây',
  `trongso` text DEFAULT NULL,
  `params` text DEFAULT NULL,
  `image` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL COMMENT 'nguoi tao',
  `time_start` timestamp NULL DEFAULT NULL,
  `time_end` timestamp NULL DEFAULT NULL,
  `hocky` varchar(255) DEFAULT NULL,
  `khoa` varchar(50) DEFAULT NULL COMMENT 'khóa mở',
  `dothoc` int(11) DEFAULT NULL,
  `sosv_dangky` int(11) DEFAULT NULL COMMENT 'số sinh viên đăng ký',
  `namhoc` varchar(255) DEFAULT NULL,
  `price` varchar(255) DEFAULT NULL COMMENT 'để sau',
  `link_googlemeet` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'nhập link google meet' CHECK (json_valid(`link_googlemeet`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_calendar`
--

CREATE TABLE `class_calendar` (
  `id` bigint(20) NOT NULL,
  `class_id` bigint(20) NOT NULL DEFAULT 0,
  `class_name` text DEFAULT NULL,
  `teacher_ids` text DEFAULT NULL,
  `tuan` int(11) NOT NULL DEFAULT 0,
  `ngay` date DEFAULT NULL,
  `thu` varchar(20) DEFAULT NULL,
  `tiet` varchar(20) DEFAULT NULL,
  `sotc` int(11) DEFAULT 0,
  `thuchanh` int(11) DEFAULT 0,
  `diadiem` text DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL COMMENT 'Null: lịch thường | \r\nUPDATE_CA: lịch sửa | \r\nOTHER_CA: lịch khác',
  `content` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_documents`
--

CREATE TABLE `class_documents` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `title` varchar(250) DEFAULT NULL,
  `file_info` text DEFAULT NULL COMMENT 'Thông tin của File, như id, đường dẫn, loại file,.... đọc từ bảng media',
  `student_ids` text DEFAULT NULL COMMENT 'null (null chứ không phải [] nhé): share tất cả\r\n[1,3,4,5,6]: ID các học viên được share tài liệu, ',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='Lưu tài liệu mà giáo viên chia sẻ cho học viên';

-- --------------------------------------------------------

--
-- Table structure for table `class_emails`
--

CREATE TABLE `class_emails` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `student_ids` text DEFAULT NULL,
  `title` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_group`
--

CREATE TABLE `class_group` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `name` text DEFAULT NULL,
  `slug` text DEFAULT NULL,
  `ordering` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_group_member`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `class_group_plan`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `class_homeworks`
--

CREATE TABLE `class_homeworks` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `title` varchar(250) DEFAULT NULL COMMENT 'Tiêu đề bài tập hay bài thảo luận',
  `type` varchar(45) DEFAULT NULL COMMENT 'Loại bài tập:\nBAITAP\nTHAOLUAN',
  `online` int(11) NOT NULL DEFAULT 1,
  `desc` longtext DEFAULT NULL COMMENT 'Mô tả nội dung bài tập hay bài thảo luận',
  `files` text DEFAULT NULL COMMENT 'ID file đính kèm (nếu có)',
  `time_start` date DEFAULT NULL,
  `deadlines` timestamp NULL DEFAULT NULL COMMENT 'Hạn cuối nộp bài',
  `user_id` int(11) DEFAULT NULL COMMENT 'Người tạo',
  `student_ids` text DEFAULT NULL COMMENT 'null: Tất cả học viên\r\n[id1, id2]: Id của học viên được giao bài tập thêm',
  `groups` text DEFAULT NULL,
  `topic_type` varchar(20) DEFAULT '''SINGLE''' COMMENT 'SINGLE | GROUP',
  `topics` text DEFAULT NULL,
  `type_of_return` text DEFAULT 'student',
  `points` text DEFAULT NULL,
  `room_id` varchar(255) DEFAULT NULL,
  `shift_id` int(11) NOT NULL DEFAULT 0 COMMENT 'id trong bảng shift_test trong KETDB',
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0: không lấy điểm; 1: lấy điểm',
  `created_at` timestamp NULL DEFAULT NULL COMMENT 'Ngày tạo',
  `updated_at` timestamp NULL DEFAULT NULL COMMENT 'Ngày update lần cuối',
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='Lưu thông tin bài tập mà giao viên giao';

-- --------------------------------------------------------

--
-- Table structure for table `class_homework_comments`
--

CREATE TABLE `class_homework_comments` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `class_homework_id` int(11) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL COMMENT 'lấy trong bảng user;\r\n',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='Lưu thông tin thảo luận của học viên cho các bài chủ đề THAOLUAN';

-- --------------------------------------------------------

--
-- Table structure for table `class_homework_points`
--

CREATE TABLE `class_homework_points` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `class_homework_id` int(11) DEFAULT NULL,
  `class_student_id` int(11) DEFAULT NULL,
  `point_name` varchar(250) DEFAULT NULL COMMENT 'C.CAN; BAI1; BAI2; BAI3....',
  `student_id` int(11) NOT NULL COMMENT 'profile_id',
  `point` double NOT NULL DEFAULT -1,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `deleted` int(11) DEFAULT 0 COMMENT '1: đã xoá; 0: chưa xoá',
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_homework_posts`
--

CREATE TABLE `class_homework_posts` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `class_homework_id` int(11) DEFAULT NULL,
  `class_student_id` int(11) DEFAULT NULL,
  `student_id` int(11) NOT NULL DEFAULT 0 COMMENT 'id trong profile',
  `co_owner` varchar(255) DEFAULT NULL COMMENT 'Đồng sở hữu ( Trường hợp là bài theo nhóm thì bài làm sẽ được nhóm trưởng post lên và các thành viên khác sẽ tham chiếu được bài post đó từ nhóm trưởng)',
  `files` longtext DEFAULT NULL,
  `note` longtext DEFAULT NULL COMMENT 'Bài làm của học viên',
  `point` double(10,2) DEFAULT -1.00 COMMENT 'cho điểm nếu có (-1) là không cho điểm',
  `ngaynop` datetime DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL COMMENT '0: Chờ duyệt\n1: Chấp nhận\n-1: Yêu cầu nộp lại',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='sinh viên nộp bài tập về nhà đã làm cho giáo viên';

-- --------------------------------------------------------

--
-- Table structure for table `class_management`
--

CREATE TABLE `class_management` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `kyhieu` varchar(50) DEFAULT NULL,
  `khoa` int(11) NOT NULL COMMENT 'khóa',
  `nganh_id` int(11) NOT NULL,
  `donvi_id` int(11) NOT NULL COMMENT 'khoa id',
  `pm_qldt_id` int(11) DEFAULT 0,
  `desc` varchar(255) DEFAULT NULL COMMENT 'mo tả',
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_management_gvcn`
--

CREATE TABLE `class_management_gvcn` (
  `id` int(11) NOT NULL,
  `gvcn_id` int(11) NOT NULL DEFAULT 0 COMMENT 'user_id(giáo viên chủ nghiệm sẽ có role riêng)',
  `class_management_id` int(11) NOT NULL DEFAULT 0,
  `date_start` date NOT NULL,
  `quyetdinh_so` varchar(50) DEFAULT NULL,
  `date_end` date DEFAULT NULL,
  `status` int(11) DEFAULT 0 COMMENT '1:đang chủ nghiệm,0:đã kết thúc',
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_meeting`
--

CREATE TABLE `class_meeting` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `meeting_number` text DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `time` int(11) DEFAULT NULL,
  `student_number` int(11) DEFAULT 0,
  `creator_id` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_plans`
--

CREATE TABLE `class_plans` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL DEFAULT 0,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `course_plan_activity_id` int(11) DEFAULT 0,
  `week` int(11) NOT NULL DEFAULT 0 COMMENT 'Tuần thứ (1-14)',
  `title` text DEFAULT NULL,
  `date_start_of_week` date DEFAULT NULL COMMENT 'ngày bắt đầu của tuần (luôn là thứ 2)',
  `date_end_of_week` date DEFAULT NULL COMMENT 'ngày cuối của tuần',
  `teaching_day` timestamp NULL DEFAULT NULL COMMENT 'Ngày giảng dạy',
  `desc` text DEFAULT NULL COMMENT 'nội dung ghi chú lưu ý cho sinh viên cần thực hiện trong tuần (nếu có)',
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_by` bigint(20) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_plan_activities`
--

CREATE TABLE `class_plan_activities` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `plan_id` int(11) NOT NULL DEFAULT 0,
  `course_plan_activity_id` int(11) DEFAULT 0,
  `type` varchar(50) DEFAULT NULL COMMENT 'LESSON; LESSON_TEST (bài tập bổ trợ); TESTING_TRACNGHIEM; TESTING_TULUAN; MEET ;ACTIVITY; ACTIVITY_CDR ; MUCTIEU',
  `nhapdiem_tructiep` int(11) DEFAULT 0,
  `reference_id` int(11) NOT NULL DEFAULT 0 COMMENT 'ID bài học; \r\nID bài kiểm tra trắc nghiệm; \r\nID bài kiểm tra tự luận',
  `ordering` int(11) NOT NULL DEFAULT 1000,
  `title` text DEFAULT NULL,
  `desc_title` text DEFAULT NULL,
  `desc_cpi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`desc_cpi`)),
  `kyhieu` varchar(255) DEFAULT NULL,
  `obligatory` int(11) DEFAULT 1,
  `status` int(11) DEFAULT 1,
  `desc` text DEFAULT NULL,
  `files` longtext DEFAULT NULL,
  `slides` text DEFAULT NULL,
  `video` longtext DEFAULT NULL,
  `zoom_meet` varchar(255) DEFAULT NULL,
  `params` longtext DEFAULT NULL,
  `exprided_date` datetime DEFAULT NULL COMMENT 'thời gian cần hoàn thành (mặc định lấy ngày cuối cùng của tuần), trường hợp là zoom hoặc meet thì đây là thời gian bắt đầu',
  `start_date` datetime DEFAULT NULL,
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_plan_activities_tests`
--

CREATE TABLE `class_plan_activities_tests` (
  `id` int(11) NOT NULL,
  `class_plan_activities_id` bigint(20) DEFAULT 0,
  `ordering` int(11) DEFAULT 0,
  `student_id` int(11) DEFAULT 0,
  `class_id` int(11) DEFAULT 0,
  `old_class_id` int(11) DEFAULT 0,
  `old_class_plan_activities_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `teacher_id` int(11) DEFAULT 0,
  `av` tinyint(2) DEFAULT 0,
  `status` tinyint(2) NOT NULL DEFAULT 0 COMMENT '0 : chưa làm | 1 : đang làm | 2 : đã nộp bài',
  `reason_stop` longtext DEFAULT NULL,
  `time` int(11) DEFAULT 0 COMMENT 'Thời gian làm bài của thí sinh( đơn vị giây)',
  `tracking` longtext DEFAULT NULL COMMENT '{ start : ''DD/MM/YYYY hh:mm:ss''}',
  `total_questions` int(3) DEFAULT 0,
  `progress` int(2) DEFAULT 0 COMMENT 'Tỉ lệ % hoàn thành của sinh viên 0 -> 100',
  `lock` tinyint(2) DEFAULT 0 COMMENT 'Trạng thái khóa của bài thi',
  `point` float DEFAULT 0,
  `trudiem` int(11) DEFAULT 0,
  `params` longtext DEFAULT NULL,
  `pass_code` varchar(255) DEFAULT NULL,
  `warning` text DEFAULT NULL,
  `questions` longtext DEFAULT NULL,
  `violation_of_exam` text DEFAULT NULL,
  `time_remaining` int(11) DEFAULT 0,
  `submited_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `is_deleted` tinyint(2) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `tong_diem` decimal(10,2) GENERATED ALWAYS AS (`point` - `point` * `trudiem` / 100) VIRTUAL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_plan_activities_tests_answer`
--

CREATE TABLE `class_plan_activities_tests_answer` (
  `id` int(11) NOT NULL,
  `class_plan_activities_tests_id` int(11) NOT NULL DEFAULT 0,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `course_question_id` int(11) NOT NULL DEFAULT 0,
  `student_answer` varchar(255) DEFAULT NULL,
  `temporary` varchar(500) DEFAULT NULL,
  `result` tinyint(2) DEFAULT 0 COMMENT 'kết quả chấm : 1 => đúng | 0 => sai',
  `status` tinyint(2) DEFAULT 0 COMMENT 'Trạng thái chấm của câu hỏi: 0 => chưa chấm | 1 => đã chấm',
  `is_deleted` tinyint(2) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_plan_activities_tests_control`
--

CREATE TABLE `class_plan_activities_tests_control` (
  `id` int(11) NOT NULL,
  `class_plan_activities_tests_id` int(11) DEFAULT 0,
  `type` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `value` int(11) DEFAULT 0,
  `sender` varchar(255) DEFAULT NULL,
  `sender_by` int(11) DEFAULT 0,
  `received_by` int(11) DEFAULT 0,
  `status` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_plan_activity_students`
--

CREATE TABLE `class_plan_activity_students` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL DEFAULT 0,
  `class_plan_id` int(11) NOT NULL DEFAULT 0,
  `class_plan_activity_id` int(11) NOT NULL DEFAULT 0,
  `week` int(11) NOT NULL DEFAULT -1,
  `tracking` text DEFAULT NULL COMMENT 'lưu tiến độ hoàn thành task của sinh viên{		duration : number // video duration	played : number // time played video	last_point : number // last stoped	max_point : number // max time played	test_results : [		{			"date":"dd/mm/yyyyy hh:mm:ss",			"time": number // test duration			"answer": string // correct / answer			"point": number		}	]}',
  `student_id` int(11) NOT NULL DEFAULT 0,
  `status` int(11) NOT NULL DEFAULT -1 COMMENT '-1; 0: doing; 1: done',
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_plan_activity_student_answers`
--

CREATE TABLE `class_plan_activity_student_answers` (
  `id` int(11) NOT NULL,
  `class_plan_activity_student_test_id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `class_plan_activity_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `course_question_id` int(11) DEFAULT 0,
  `student_answer` text DEFAULT NULL COMMENT 'string',
  `temporary` varchar(500) DEFAULT NULL COMMENT 'lưu kết quả tạm cho question-type-reorder-words',
  `result` int(11) DEFAULT 0 COMMENT '1: đúng; 0: sai tương đương 1: một điểm; 0: không điểm',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_plan_activity_student_tests`
--

CREATE TABLE `class_plan_activity_student_tests` (
  `id` int(11) NOT NULL,
  `class_plan_activity_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `av` int(11) DEFAULT 0,
  `class_id` int(11) DEFAULT 0,
  `old_class_id` int(11) DEFAULT 0,
  `move_data_by` int(11) DEFAULT 0,
  `week` int(11) DEFAULT 0,
  `student_id` int(11) DEFAULT NULL,
  `point` int(11) DEFAULT 0,
  `trudiem` int(11) DEFAULT 0,
  `time` int(11) DEFAULT 0 COMMENT 'Thời gian làm bài của thí sinh(đơn vị giây)',
  `with_correct_answers` tinyint(2) NOT NULL DEFAULT 0,
  `note` varchar(50) DEFAULT NULL COMMENT 'Ghi chú',
  `vipham` int(1) DEFAULT 0,
  `note_vipham` text DEFAULT NULL,
  `tracking` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tracking`)),
  `env` varchar(25) DEFAULT NULL COMMENT 'environment: web | mobile',
  `passing_point` int(11) DEFAULT 0,
  `passed` tinyint(2) DEFAULT 0,
  `questions` longtext DEFAULT NULL COMMENT 'Danh sách câu hỏi của bài thi',
  `params` longtext DEFAULT NULL,
  `locked` int(11) DEFAULT 0,
  `closed` int(11) DEFAULT 0,
  `type` varchar(100) DEFAULT 'KT_TUAN' COMMENT 'KT_TUAN: Kiểm tra theo tuần | KT_DAUGIO: Kiểm tra đầu giờ',
  `violation_of_exam` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`violation_of_exam`)),
  `submit_by` bigint(20) DEFAULT 0,
  `submit_at` timestamp NULL DEFAULT NULL,
  `status` tinyint(2) DEFAULT 0 COMMENT '-1 : Chưa thi | 0 : Đang thi | 1 : Đã thi xong ',
  `is_deleted` tinyint(2) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `scan` int(11) DEFAULT 0,
  `point_type` varchar(3) DEFAULT 'CC' COMMENT 'CC: Chuyên cần (hàng tuần); TX: Thường xuyên (1 tính chỉ 1 bài)',
  `hocky` varchar(15) DEFAULT NULL,
  `tong_diem` decimal(10,2) GENERATED ALWAYS AS (`point` - `point` * `trudiem` / 100) VIRTUAL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_plan_activity_thaoluan_post`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `class_plan_activity_thaoluan_post_reply`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `class_plan_activity_tickets`
--

CREATE TABLE `class_plan_activity_tickets` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL DEFAULT 0,
  `course_id` int(11) DEFAULT NULL,
  `class_plan_id` int(11) NOT NULL DEFAULT 0,
  `class_plan_activity_id` int(11) NOT NULL DEFAULT 0,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `teacher_id` varchar(255) DEFAULT NULL,
  `is_student` int(11) NOT NULL COMMENT '0:GV,1:SV',
  `parent_id` int(11) NOT NULL DEFAULT 0,
  `files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`files`)),
  `content` text DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0: open 1: active 2: closed ',
  `rate` int(11) NOT NULL DEFAULT 0 COMMENT '1 sao - 5 sao (chỉ rate khi đóng tick)',
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_by` bigint(20) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_plan_activity_tuluan`
--

CREATE TABLE `class_plan_activity_tuluan` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT 0,
  `old_class_id` int(11) DEFAULT 0,
  `old_class_plan_activities_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `class_plan_activity_id` int(11) DEFAULT 0,
  `course_plan_activity_tuluan_id` int(11) DEFAULT 0,
  `student_id` int(11) DEFAULT 0,
  `status` int(11) DEFAULT 0 COMMENT '0: Sinh viên chưa nhận đề, 1 là sinh viên đã nhận đề',
  `lock` int(11) DEFAULT 0,
  `stopped` int(11) DEFAULT 0,
  `point` double DEFAULT -1,
  `params` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`params`)),
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_plan_activity_tuluan_group`
--

CREATE TABLE `class_plan_activity_tuluan_group` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `course_plan_activity_tuluan_id` int(11) DEFAULT 0,
  `student_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Danh sách sinh viên trong nhóm',
  `leader_id` int(11) DEFAULT 0 COMMENT 'student_id của trưởng nhóm',
  `point` float DEFAULT -1,
  `params` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`params`)),
  `ordering` int(11) DEFAULT 100,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_plan_activity_tuluan_plan`
--

CREATE TABLE `class_plan_activity_tuluan_plan` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `title` text DEFAULT NULL,
  `desc` longtext DEFAULT NULL,
  `date` datetime DEFAULT NULL COMMENT 'Thời hạn làm',
  `submit_file` int(11) DEFAULT 0 COMMENT '0: Báo cáo trực tiếp, 1: Nộp file',
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_plan_activity_tuluan_plan_post`
--

CREATE TABLE `class_plan_activity_tuluan_plan_post` (
  `id` bigint(20) NOT NULL,
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
  `ngaynop` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_students`
--

CREATE TABLE `class_students` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL COMMENT 'Lấy trong bảng user_id có role là học viên',
  `student_id` int(11) NOT NULL COMMENT 'chính là id trong bảng user_profile',
  `user_info` text DEFAULT NULL,
  `namhoc` varchar(255) DEFAULT NULL,
  `hocky` double DEFAULT NULL,
  `ordering` int(11) DEFAULT 0,
  `status` tinyint(4) DEFAULT 1 COMMENT '0: đang chờ duyệt | 1: đang học | 2: đã hoàn thành | -1: bỏ học',
  `params` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `scan` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='Lưu thông tin học viên join khoá học';

-- --------------------------------------------------------

--
-- Table structure for table `class_student_diemdanh`
--

CREATE TABLE `class_student_diemdanh` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `old_class_id` int(11) DEFAULT 0,
  `student_id` int(11) DEFAULT NULL,
  `calendar_id` int(11) DEFAULT NULL,
  `mocdiemdanh_id` int(11) DEFAULT NULL,
  `loaiphep` varchar(2) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL COMMENT 'P: có phép; K: Không phép; M muộn ',
  `tiet` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ngay` datetime DEFAULT NULL,
  `lydo` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `status` int(255) NOT NULL DEFAULT 0,
  `duyetphep` int(11) NOT NULL DEFAULT 0 COMMENT '1 là duyệt phép; 0 là chờ duyệt; -1 là không duyệt',
  `lydo_giangvien` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ngayduyet` date DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_student_mocdiemdanh`
--

CREATE TABLE `class_student_mocdiemdanh` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `ngay` datetime DEFAULT NULL,
  `mota` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `created_by` int(11) NOT NULL DEFAULT 0,
  `update_by` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_student_points`
--

CREATE TABLE `class_student_points` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL DEFAULT 0,
  `type` varchar(50) DEFAULT NULL,
  `location` varchar(50) DEFAULT NULL,
  `location_id` int(11) NOT NULL DEFAULT 0,
  `point` double DEFAULT -1,
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `class_student_id` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_student_tests`
--

CREATE TABLE `class_student_tests` (
  `id` int(11) NOT NULL,
  `class_test_id` int(11) DEFAULT NULL,
  `class_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `point` decimal(10,2) DEFAULT -1.00 COMMENT 'điểm quy về thang 10 (1 số thập phân); -1 là không thi',
  `time` int(11) NOT NULL COMMENT 'Thời gian làm bài của thí sinh(đơn vị giây)',
  `status` int(11) DEFAULT 0 COMMENT '0 : Chưa thi | \r\n1 : Đang thi | \r\n2 : Đã thi xong (Chờ giáo viên chấm điểm) | \r\n3 : Đã chấm xong\r\n',
  `with_correct_answers` tinyint(2) NOT NULL DEFAULT 0,
  `note` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT 'Ghi chú',
  `map` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT 'Lưu kết quả trộn của đề. Chỉ cần tạo lần đầu\r\n',
  `result` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT '{\r\ntime : 10/10/2023,\r\npoint : 8.7,\r\ncreator : ''mobile'' | ''web''\r\n}',
  `questions` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT 'Danh sách câu hỏi của bài thi',
  `params` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT '{\r\n	reviews : number[] , //danh sách câu hỏi mà thí sinh đánh dấu là cần xem lại\r\n	starts : {\r\n		_created_at : ''DD/MM/YYYY hh:mm:ss'', // Avoid using duplicate key pls\r\n		time_left : number,\r\n		device : ''mobile'' | ''web''\r\n	}[], // Số lần thí sinh ấn vào nút bắt đầu làm bài\r\n	distractions : {\r\n		type : ''IN'' | ''OUT'',\r\n		_created_at : ''DD/MM/YYYY hh:mm:ss'', // Avoid using duplicate key pls\r\n		time_left : number\r\n	}[] // Số lần thí sinh thoát ra và quay lại tab bài thi trong quá trình làm bài\r\n}',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Lưu kết quả bài test (tổng điểm được quy về điểm chuẩn)';

-- --------------------------------------------------------

--
-- Table structure for table `class_student_test_answers`
--

CREATE TABLE `class_student_test_answers` (
  `id` int(11) NOT NULL,
  `class_student_test_id` int(11) NOT NULL,
  `class_test_id` int(11) DEFAULT NULL,
  `class_test_question_id` int(11) DEFAULT NULL,
  `class_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `student_answer` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT 'string',
  `temporary` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `result` int(11) DEFAULT 0 COMMENT '1: đúng; 0: sai tương đương 1: một điểm; 0: không điểm',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Lưu kết quả trả lời của student tại mỗi câu hỏi';

-- --------------------------------------------------------

--
-- Table structure for table `class_student_test_deadline`
--

CREATE TABLE `class_student_test_deadline` (
  `id` int(11) NOT NULL,
  `class_plan_activity_id` int(11) DEFAULT 0,
  `week` int(11) DEFAULT 0,
  `student_id` int(11) DEFAULT 0,
  `class_id` int(11) DEFAULT 0,
  `deadline` date DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_student_test_logs`
--

CREATE TABLE `class_student_test_logs` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `class_student_test_id` int(11) DEFAULT NULL,
  `content` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT 'Bắt dầu thi; Nộp bài; Thoát khỏi chế độ full màn hình; Chuyển Ứng dụng khác',
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Lưu vết thông tin của thí sinh trong quá trình làm bài thi; lưu thời gian vào làm bài; thời gian nộp bài; thời gian có hành vi vi phạm, gian lận';

-- --------------------------------------------------------

--
-- Table structure for table `class_student_tracking`
--

CREATE TABLE `class_student_tracking` (
  `id` int(11) NOT NULL,
  `class_student_id` int(11) DEFAULT NULL,
  `class_id` int(11) DEFAULT NULL,
  `lesson_id` int(11) DEFAULT NULL,
  `lesson_name` varchar(255) DEFAULT NULL,
  `time_play_video` int(11) DEFAULT 0 COMMENT 'Thời gian thực tế xem video',
  `video_duration` int(11) DEFAULT 0 COMMENT 'Thời lượng của video',
  `max_stopped_time` int(11) NOT NULL DEFAULT 0 COMMENT 'Điểm stop video lớn nhất',
  `last_stopped` int(11) DEFAULT 0 COMMENT 'Điểm dừng video lần gần nhất',
  `completed` tinyint(4) DEFAULT 0 COMMENT 'Học viên cần xem đủ 90% tổng thời lượng của video thì được tính là hoàn thành. 1 : Hoàn thành | 0 : chưa hoàn thành',
  `test_results` text DEFAULT NULL,
  `params` text DEFAULT NULL,
  `created_at` varchar(255) DEFAULT NULL COMMENT 'tổng thời gian online được tính là khoảng thời gian từ lúc bắt đầu đến lúc kết thúc\r\n',
  `updated_at` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='Lưu dữ liệu tương tác của sinh viên với bài học';

-- --------------------------------------------------------

--
-- Table structure for table `class_tests`
--

CREATE TABLE `class_tests` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `purpose` varchar(11) DEFAULT 'SCHEDULED' COMMENT 'SCHEDULED | ADDITIONAL \r\nSCHEDULED => Bài kiểm tra theo kế hoạch\r\nADDITIONAL => Bài kiểm tra bổ xung',
  `course_question_form_id` int(11) DEFAULT 0,
  `course_plan_activity_id` int(11) DEFAULT 0,
  `content` text DEFAULT NULL,
  `media` text DEFAULT NULL COMMENT 'json audio => local |video=> youtobe, vimeo, local',
  `status` int(11) DEFAULT 1 COMMENT '0: In active; 1: active; 2 : done ; -1 delete',
  `time_start` timestamp NULL DEFAULT NULL COMMENT 'Thời gian bắt đầu làm bài kiểm tra (khung 24h)',
  `total_time` int(11) DEFAULT NULL COMMENT 'Tổng thời gian làm bài (phút)',
  `type_test` varchar(255) DEFAULT NULL,
  `structure` text DEFAULT NULL,
  `point` int(11) DEFAULT 10 COMMENT 'điểm quy đổi về: thang điểm 10',
  `lesson_ids` text DEFAULT NULL,
  `source` text DEFAULT NULL,
  `get_point` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_test_questions`
--

CREATE TABLE `class_test_questions` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `class_test_id` int(11) DEFAULT NULL,
  `question_number` int(11) DEFAULT NULL,
  `question_direction` text DEFAULT NULL COMMENT 'question',
  `question_type` varchar(45) DEFAULT NULL COMMENT '{ key: ''inputbox'', label: ''Nhập vào đáp án đúng'' },\r\n{ key: ''drag_drop'', label: ''Drag-drop'' },\r\n{ key: ''reorder_words'', label: ''Sắp xếp lại câu'' },\r\n{ key: ''radio'', label: ''Chọn 1 đáp án đúng'' },\r\n{ key: ''grouping'', label: ''Câu hỏi kéo thả đáp án vào cột tương ứng'' },\r\n{ key: ''checkbox'', label: ''Chọn nhiều đáp án đúng'' },\r\n{ key: ''group-radio'', label: ''Nhóm câu hỏi chọn đáp án radio'' },\r\n{ key: ''group-input'', label: ''Nhóm câu hỏi nhập đáp án'' },',
  `answer_option` text DEFAULT NULL COMMENT 'radio[{id:1,"value":"Phương án trả lời 1"},{"id":2, "value":"Phương án trả lời 2"}...]\\nselect[{id:1,"value":"Phương án trả lời 1"},{"id":2, "value":"Phương án trả lời 2"}...]\\ncheck[{id:1,"value":"Phương án trả lời 1"},{"id":2, "value":"Phương án trả lời 2"}...]\\ninput###nội dung nằm ngoài (nếu là tiếng anh ... [nội dung phương án trả lời | nếu có nhiều phương án cách nhau dấu gạch đứng]###',
  `answer_correct` text DEFAULT NULL COMMENT 'Lưu id của các phương án đúng\\nĐối với input thì lưu cụm từ điền vào chỗ trống dưới dạng | ... |, |...|, ...',
  `status` int(11) DEFAULT 1 COMMENT '1: active; 0 inactive; -1: delete',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `part` int(11) DEFAULT 0,
  `shuff` varchar(255) DEFAULT NULL,
  `creater_id` int(11) DEFAULT 0,
  `group_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `course_questions_id` int(11) DEFAULT 0,
  `media` text DEFAULT NULL,
  `code` text DEFAULT NULL,
  `config` longtext DEFAULT NULL,
  `ordering` int(11) DEFAULT 0,
  `skill` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `raw_answer` text DEFAULT NULL,
  `cdr` int(11) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci COMMENT='câu hỏi test kèm theo bài học';

-- --------------------------------------------------------

--
-- Table structure for table `configs`
--

CREATE TABLE `configs` (
  `id` int(11) NOT NULL,
  `config_key` varchar(100) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `value` int(11) DEFAULT 0,
  `params` longtext DEFAULT '',
  `description` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `category_ids` int(11) DEFAULT 0 COMMENT 'id khoa trong bảng đơn vị',
  `nganh_bomon_id` int(11) DEFAULT 0 COMMENT 'id bộ môn rong bảng nganh_bomon',
  `title` varchar(255) DEFAULT NULL,
  `copy_course_id` int(11) DEFAULT 0,
  `subtitle` text DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `maso` varchar(255) DEFAULT NULL COMMENT 'mã học phần dùng để map với lớp học phần',
  `desc` text DEFAULT NULL,
  `muctieu` text DEFAULT NULL,
  `img_url` text DEFAULT NULL COMMENT 'ảnh đại diện',
  `keyword` text DEFAULT NULL COMMENT 'nhieu keywork, cach nhau dau phay (,)',
  `decuong` text DEFAULT NULL COMMENT 'đề cương môn học',
  `sobaigiang` int(11) DEFAULT NULL COMMENT 'số bài giảng mà giáo viên đăng ký xây dựng cho môn học',
  `files` text DEFAULT NULL COMMENT 'cac file tai lieu dinh kem dang json',
  `tailieu_chinh` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tailieu_chinh`)),
  `yeucau_sinhvien` text DEFAULT NULL,
  `tailieu_thamkhao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tailieu_thamkhao`)),
  `video_introduce` text DEFAULT NULL COMMENT 'json {type: vimeo, source: url}',
  `playlist_id` varchar(100) DEFAULT NULL COMMENT 'ID của playlist trên youtube',
  `playlist_source` text DEFAULT NULL,
  `seo` text DEFAULT NULL COMMENT 'title, subtitle, keyword,...',
  `price` double DEFAULT NULL,
  `discount` double DEFAULT 0,
  `num_of_like` int(11) DEFAULT 0,
  `num_of_view` int(11) DEFAULT 0,
  `feature` tinyint(4) DEFAULT 0 COMMENT 'Đánh dấu là khóa học tiêu biểu',
  `av` tinyint(4) DEFAULT 0,
  `status` tinyint(4) DEFAULT 0 COMMENT '-1: delete, 0: inactive; 1: active',
  `activated` int(11) DEFAULT 0 COMMENT 'Số học viên đã kích hoạt khóa học',
  `teacher_ids` text DEFAULT NULL,
  `creator_plan_id` int(11) DEFAULT 0 COMMENT 'id của giảng viên được phép tạo kế hoạch',
  `type_test` varchar(255) DEFAULT NULL COMMENT 'tienganh|monkhac',
  `creator_id` int(11) DEFAULT NULL COMMENT 'nguoi tao ra bai giang',
  `creator_name` varchar(255) DEFAULT NULL,
  `params` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`params`)),
  `num_of_question_test` longtext DEFAULT NULL COMMENT 'phân bổ số lượng câu hỏi private',
  `dot_capnhat` varchar(20) DEFAULT NULL COMMENT 'đợt cập nhật phục vụ lọc kết quả thống kê nghiệm thu',
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) DEFAULT NULL COMMENT 'id của giáo viên được quyền sửa',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `scan` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_bank`
--

CREATE TABLE `course_bank` (
  `id` int(11) NOT NULL,
  `title` text DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL COMMENT 'CHUYENDE | THUONGXUYEN',
  `cdr` int(11) DEFAULT 1 COMMENT '1: nhớ/ biết\r\n2: hiểu\r\n3: vận dụng\r\n4: phân tích\r\n5: Đánh giá\r\n6: sáng tạo',
  `course_id` int(11) DEFAULT NULL,
  `desc` text DEFAULT NULL,
  `slug` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_clo`
--

CREATE TABLE `course_clo` (
  `id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT 0,
  `course_muctieu_chitiet_id` int(11) DEFAULT 0,
  `kyhieu` varchar(255) DEFAULT NULL,
  `ordering` int(11) DEFAULT 1000,
  `noidung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `updated_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_clo_contribute`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `course_config`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `course_form_cc`
--

CREATE TABLE `course_form_cc` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `part` varchar(10) DEFAULT '' COMMENT 'Nếu là môn tiếng anh: Part-1,Part-2,...',
  `course_plan_activity_id` int(11) NOT NULL DEFAULT 0,
  `week` int(11) NOT NULL DEFAULT 0 COMMENT 'tuần số (bài số)',
  `cdr` int(11) DEFAULT 0 COMMENT 'Mức 1,2,3,4,5,6 tương ứng với Biết, Hiểu, Vận dụng, Phân tích, ...',
  `question_take` int(11) DEFAULT 0,
  `child_question_take` int(11) DEFAULT 0,
  `av` int(11) DEFAULT 0,
  `point` int(11) DEFAULT 0 COMMENT 'Tổng điểm nếu làm đúng',
  `private` int(11) DEFAULT 0,
  `scan` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_form_comment`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `course_form_dg`
--

CREATE TABLE `course_form_dg` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `part` varchar(10) DEFAULT '' COMMENT 'Nếu là môn tiếng anh: Part-1,Part-2,...',
  `course_plan_activity_id` int(11) NOT NULL DEFAULT 0,
  `week` int(11) NOT NULL DEFAULT 0 COMMENT 'tuần số (bài số)',
  `cdr` int(11) DEFAULT 0 COMMENT 'Mức 1,2,3,4,5,6 tương ứng với Biết, Hiểu, Vận dụng, Phân tích, ...',
  `question_take` int(11) DEFAULT 0,
  `child_question_take` int(11) DEFAULT 0,
  `av` int(11) DEFAULT 0,
  `point` int(11) DEFAULT 0 COMMENT 'Tổng điểm nếu làm đúng',
  `private` int(11) DEFAULT 0,
  `scan` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_form_duyet`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `course_form_kthp`
--

CREATE TABLE `course_form_kthp` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `part` varchar(255) DEFAULT NULL,
  `course_plan_activity_id` int(11) DEFAULT 0,
  `week` int(11) DEFAULT 0,
  `cdr` int(11) DEFAULT 0,
  `total_question_take` int(11) DEFAULT 0,
  `private` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_form_th_kthp`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `course_form_tx`
--

CREATE TABLE `course_form_tx` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `part` varchar(10) DEFAULT '' COMMENT 'Nếu là môn tiếng anh: Part-1,Part-2,...',
  `course_plan_activity_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `ordering` int(11) DEFAULT 1 COMMENT '1: BTX 1; 2 BTX2; 3....',
  `week` int(11) NOT NULL DEFAULT 0 COMMENT 'tuần số (bài số)',
  `cdr` int(11) DEFAULT 0 COMMENT 'Mức 1,2,3,4,5,6 tương ứng với Biết, Hiểu, Vận dụng, Phân tích, ...',
  `question_take` int(11) NOT NULL DEFAULT 0,
  `child_question_take` int(11) DEFAULT 0,
  `av` int(11) DEFAULT 0,
  `point` int(11) DEFAULT 0 COMMENT 'Tổng điểm nếu làm đúng',
  `private` int(11) DEFAULT 0,
  `scan` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_lessons`
--

CREATE TABLE `course_lessons` (
  `id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL COMMENT 'duoc phep trung',
  `type` varchar(15) DEFAULT 'LESSON' COMMENT 'LESSON | TEST',
  `params` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `desc` text DEFAULT NULL,
  `video` text DEFAULT NULL COMMENT 'json: {"source":"youtube|vimeo|local|other", "url":"https://..."}',
  `audio` text DEFAULT NULL,
  `slide` text DEFAULT NULL,
  `trailer` tinyint(4) DEFAULT NULL COMMENT '1: cho phep hoc thu (ko can mua, ko can login); 0: phai mua moi hoc dc',
  `documents` text DEFAULT NULL COMMENT 'json: link file tai lieu, bai tap',
  `ordering` int(11) DEFAULT 1000,
  `teacher` text DEFAULT NULL COMMENT 'json: id=>name\r\n\r\nBao gồm cả trợ giảng luôn',
  `status` tinyint(4) DEFAULT 0 COMMENT '-1: delete; 0: inactive; 1: active',
  `status_check` int(11) NOT NULL DEFAULT 0,
  `fast_forward` tinyint(4) DEFAULT NULL,
  `other_video` text DEFAULT NULL,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci COMMENT='bai hoc';

-- --------------------------------------------------------

--
-- Table structure for table `course_lesson_comments`
--

CREATE TABLE `course_lesson_comments` (
  `id` int(11) NOT NULL,
  `question_type` varchar(20) DEFAULT '''RATE''' COMMENT 'RATE | OTHER',
  `question_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `class_id` int(11) DEFAULT 0,
  `lesson_id` int(11) DEFAULT 0,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `namhoc` varchar(20) DEFAULT NULL,
  `hocky` int(11) DEFAULT 0,
  `rate` int(11) NOT NULL DEFAULT 0 COMMENT 'Rate thang điểm từ 1 - 10',
  `comments` text DEFAULT NULL,
  `answers` varchar(255) DEFAULT NULL,
  `unique_code` varchar(255) DEFAULT NULL COMMENT 'chuỗi có định dạng [question_id]_[course_id]_[class_id]_[lesson_id]_[question_id]_[student_id] dùng để group_by chống dumplicate dữ liệu',
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` bigint(22) DEFAULT 0,
  `created_by` bigint(22) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_lesson_tests`
--

CREATE TABLE `course_lesson_tests` (
  `id` int(11) NOT NULL,
  `lesson_id` int(11) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `type` varchar(45) DEFAULT NULL,
  `media` text DEFAULT NULL COMMENT 'json audio => local |video=> youtobe, vimeo, local',
  `config` text DEFAULT NULL COMMENT 'inverted question, inverted answer, show hint, show explain, show answer, percent complete',
  `time_start` timestamp NULL DEFAULT NULL,
  `total_time` int(11) DEFAULT NULL,
  `point` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_lesson_test_questions`
--

CREATE TABLE `course_lesson_test_questions` (
  `id` int(11) NOT NULL,
  `lesson_id` int(11) DEFAULT NULL,
  `test_id` int(11) DEFAULT NULL,
  `question` text DEFAULT NULL COMMENT 'question',
  `answer_correct` text DEFAULT NULL COMMENT 'Lưu id của các phương án đúng\\nĐối với input thì lưu cụm từ điền vào chỗ trống dưới dạng | ... |, |...|, ...',
  `hint` text DEFAULT NULL,
  `explain` text DEFAULT NULL,
  `question_number` int(11) DEFAULT NULL,
  `question_direction` text DEFAULT NULL,
  `question_type` text DEFAULT NULL,
  `answer_option` text DEFAULT NULL,
  `config` longtext DEFAULT NULL,
  `group_id` int(11) DEFAULT NULL,
  `part` int(11) DEFAULT NULL,
  `media` text DEFAULT NULL,
  `code` text DEFAULT NULL,
  `creater_id` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci COMMENT='câu hỏi test kèm theo bài học';

-- --------------------------------------------------------

--
-- Table structure for table `course_metas`
--

CREATE TABLE `course_metas` (
  `id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `key` varchar(100) DEFAULT NULL COMMENT 'tu khoa chu in hoa khong dau, vi du: PRICE; NUMBER_OF_STUDENT_JOINED,... ',
  `title` varchar(255) DEFAULT NULL,
  `value` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_muctieu_chitiet`
--

CREATE TABLE `course_muctieu_chitiet` (
  `id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT 0,
  `ordering` int(11) DEFAULT NULL,
  `kyhieu` varchar(255) DEFAULT NULL,
  `noidung` text DEFAULT NULL,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_plan_activities`
--

CREATE TABLE `course_plan_activities` (
  `id` int(11) NOT NULL,
  `week` int(11) DEFAULT 0,
  `parent_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `course_clo_id` int(11) DEFAULT 0,
  `course_plan_activity_id` int(11) DEFAULT 0 COMMENT 'Lưu id của bản gốc',
  `title` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `kyhieu` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `ma_cdr` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `type` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT 'LESSON | LESSON_TEST (lấy ở bảng course_lesson) | ACTIVITY | PLAN | ACTIVITY_TEST | MUCTIEU ',
  `exam_type` varchar(10) DEFAULT NULL COMMENT 'Dạng bài kiểm tra',
  `desc_title` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `desc_cpi` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`desc_cpi`)),
  `desc` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `kienthuc` text DEFAULT NULL,
  `kynang` text DEFAULT NULL,
  `video` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `videos` longtext DEFAULT NULL COMMENT 'video khác',
  `files` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `slides` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `params` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `cdr_cauhoi` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `ordering` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT 0 COMMENT '-1: ko đạt, yêu cầu sửa lại; 0: Đang cập nhật; 1 đã duyệt (ko cho sửa); -2: Đã sửa đề nghị duyệt lại; -3: Bản gốc',
  `approved_by` int(11) DEFAULT 0,
  `approved_at` datetime DEFAULT NULL,
  `status_captruong` int(11) DEFAULT 0,
  `approved_captruong_by` int(11) DEFAULT 0,
  `approved_captruong_at` datetime DEFAULT NULL,
  `old_status` int(11) DEFAULT 0,
  `accept_edit_id` int(11) DEFAULT 0,
  `accept_edit_at` datetime DEFAULT NULL,
  `edit` int(11) NOT NULL DEFAULT 1 COMMENT '1 : được phép sửa | 0 : là không dược phép sửa (mục lục)',
  `course_lesson_id` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `scan` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_plan_activity_tuluan`
--

CREATE TABLE `course_plan_activity_tuluan` (
  `id` int(11) NOT NULL,
  `course_plan_activity_id` int(11) DEFAULT 0,
  `course_clo_id` int(11) DEFAULT 0,
  `form_th_kthp_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `title` text DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL COMMENT 'QUESTION | GROUP_QUESTION',
  `cdr` int(11) DEFAULT NULL,
  `private` int(11) DEFAULT 0,
  `point` double DEFAULT 0,
  `time_duration` int(11) DEFAULT 50,
  `ordering` int(11) DEFAULT NULL,
  `desc` longtext DEFAULT NULL,
  `note` longtext DEFAULT NULL,
  `tuluan_id` text DEFAULT '0',
  `files` longtext DEFAULT NULL,
  `activity_cdr_ids` text DEFAULT NULL COMMENT 'id của course_plan_actitity liên quan',
  `status` int(11) DEFAULT 0,
  `tuluan_root_ids` varchar(255) DEFAULT NULL COMMENT 'id của các câu hỏi tự luận tạo nên đề	',
  `approved_at` datetime DEFAULT NULL,
  `approved_by` int(11) NOT NULL DEFAULT 0,
  `status_captruong` int(11) DEFAULT 0,
  `approved_captruong_by` int(11) DEFAULT 0,
  `approved_captruong_at` datetime DEFAULT NULL,
  `old_status` int(11) DEFAULT 0 COMMENT 'status trước khi được mở khóa cho phép sửa',
  `accept_edit_id` int(11) DEFAULT 0 COMMENT 'id của người đã mở khóa',
  `accept_edit_at` datetime DEFAULT NULL COMMENT 'thời gian mở khóa',
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_plan_activity_tuluan_tieuchicham`
--

CREATE TABLE `course_plan_activity_tuluan_tieuchicham` (
  `id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT 0,
  `course_plan_activity_tuluan_id` int(11) DEFAULT 0,
  `course_plan_activity_id` int(11) DEFAULT 0,
  `title` text DEFAULT NULL,
  `cdr` int(11) DEFAULT 0,
  `ordering` int(11) DEFAULT 0,
  `point` float DEFAULT 0,
  `desc` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_plan_bank`
--

CREATE TABLE `course_plan_bank` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `week` int(11) NOT NULL,
  `questions` longtext NOT NULL,
  `total` int(11) DEFAULT 0,
  `av` int(11) DEFAULT 0,
  `bank_type` varchar(2) NOT NULL DEFAULT 'CC',
  `ordering` int(11) DEFAULT 0,
  `missing` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`missing`)),
  `created_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_plan_comment`
--

CREATE TABLE `course_plan_comment` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT 0,
  `parent_id` int(11) DEFAULT 0,
  `comment` text DEFAULT NULL,
  `course_id` int(11) DEFAULT 0,
  `course_plan_activity_id` int(11) DEFAULT 0,
  `status` int(11) DEFAULT NULL,
  `cap_hoidong` varchar(255) DEFAULT 'cap_khoa',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` bigint(20) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_plan_tuluan_comment`
--

CREATE TABLE `course_plan_tuluan_comment` (
  `id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT 0,
  `comment` longtext DEFAULT NULL,
  `course_plan_activity_id` int(11) DEFAULT 0,
  `parent_id` int(11) DEFAULT 0,
  `user_id` int(11) DEFAULT 0,
  `course_plan_activity_tuluan_id` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `status` int(11) NOT NULL,
  `cap_hoidong` varchar(255) DEFAULT 'cap_khoa',
  `updated_by` bigint(20) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_questions`
--

CREATE TABLE `course_questions` (
  `id` int(11) NOT NULL,
  `question_root_id` int(11) NOT NULL DEFAULT 0,
  `week` int(11) NOT NULL DEFAULT 0,
  `reference` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `reference_id` int(11) DEFAULT 0,
  `cdr_id` int(11) DEFAULT NULL COMMENT 'id của activity_cdr trong course_plan_activity',
  `course_id` int(11) DEFAULT 0,
  `answer_correct` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `raw_answer` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `question_number` int(11) DEFAULT 0,
  `question_direction` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `question_type` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `cdr` int(11) DEFAULT 1,
  `answer_option` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `group_id` int(11) DEFAULT 0,
  `part` int(11) DEFAULT 0,
  `skill` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `media` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `code` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `config` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `status` int(11) DEFAULT 0 COMMENT '-1 chưa đạt, 0 chưa duyệt, 1 đã duyệt',
  `approved_by` int(11) DEFAULT 0,
  `approved_at` datetime DEFAULT NULL,
  `status_captruong` int(11) DEFAULT 0,
  `approved_captruong_by` int(11) DEFAULT 0,
  `approved_captruong_at` datetime DEFAULT NULL,
  `old_status` int(11) DEFAULT 0,
  `accept_edit_id` int(11) DEFAULT 0,
  `accept_edit_at` datetime DEFAULT NULL,
  `shuff` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `private` int(11) DEFAULT 0,
  `note` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT '',
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_question_comment`
--

CREATE TABLE `course_question_comment` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT 0,
  `parent_id` int(11) DEFAULT 0,
  `comment` text DEFAULT NULL,
  `course_id` int(11) DEFAULT 0,
  `course_plan_activity_id` int(11) DEFAULT 0,
  `course_question_id` int(11) DEFAULT 0,
  `status` int(11) DEFAULT 0,
  `cap_hoidong` varchar(255) DEFAULT 'cap_khoa',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_question_forms`
--

CREATE TABLE `course_question_forms` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `course_plan_activity_id` int(11) DEFAULT 0 COMMENT '>0 khi form type = CC; = 0 khi form type = TX',
  `part` varchar(255) DEFAULT NULL COMMENT 'chỉ dùng cho câu hỏi dạng KTHP( kết thúc học phần)',
  `week` int(11) DEFAULT 0,
  `cdr` int(11) DEFAULT 0,
  `total_question_take` int(11) DEFAULT 0 COMMENT 'tổng câu hỏi sẽ lấy',
  `form_type` varchar(3) DEFAULT '0' COMMENT 'cc | tx (bài test tuần hay test kỹ năng thường xuyên) | KTHP (thi kết thúc học phần)',
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `ordering` int(11) DEFAULT 0 COMMENT '1: Bai TX 1; 2 BTX2; 3....',
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_question_logs`
--

CREATE TABLE `course_question_logs` (
  `log_id` int(11) NOT NULL,
  `id` int(11) NOT NULL DEFAULT 0,
  `reference` varchar(255) DEFAULT NULL,
  `reference_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `answer_correct` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `raw_answer` varchar(255) DEFAULT NULL,
  `question_number` int(11) DEFAULT 0,
  `question_direction` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `question_type` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `cdr` int(11) DEFAULT 1,
  `answer_option` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `group_id` int(11) DEFAULT 0,
  `part` int(11) DEFAULT 0,
  `skill` varchar(255) DEFAULT NULL,
  `media` text DEFAULT NULL,
  `code` text DEFAULT NULL,
  `config` longtext DEFAULT NULL,
  `status` int(11) DEFAULT 0 COMMENT '-1 chưa đạt, 0 chưa duyệt, 1 đã duyệt',
  `approved_by` int(11) DEFAULT 0,
  `approved_at` datetime DEFAULT NULL,
  `shuff` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_question_report`
--

CREATE TABLE `course_question_report` (
  `id` int(11) NOT NULL,
  `question_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`content`)),
  `course_tester_session_id` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_rate`
--

CREATE TABLE `course_rate` (
  `id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `user_info` text DEFAULT NULL COMMENT 'id, username, avanta',
  `type` varchar(45) DEFAULT NULL COMMENT 'rate, comment',
  `valute` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_testers`
--

CREATE TABLE `course_testers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_plan_activity_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `week` int(11) NOT NULL DEFAULT 0,
  `solan` int(11) NOT NULL DEFAULT 5,
  `solan_datest` int(11) NOT NULL DEFAULT 0,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_tester_results`
--

CREATE TABLE `course_tester_results` (
  `id` int(11) NOT NULL,
  `course_tester_id` int(11) NOT NULL DEFAULT 0,
  `course_tester_session_id` int(11) DEFAULT 0,
  `round` int(5) NOT NULL COMMENT 'Lần test thứ bao nhiêu',
  `question_id` int(11) NOT NULL DEFAULT 0,
  `answer` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `temporary` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `result` tinyint(1) DEFAULT 0,
  `time_to_answer` int(9) NOT NULL,
  `created_by` int(11) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_tester_session`
--

CREATE TABLE `course_tester_session` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL DEFAULT 0,
  `course_tester_id` int(11) DEFAULT 0,
  `course_plan_activity_id` int(11) NOT NULL,
  `course_id` int(10) NOT NULL,
  `round` int(5) DEFAULT 0 COMMENT 'Lần test thứ mấy',
  `week` int(11) NOT NULL,
  `av` tinyint(2) DEFAULT 0 COMMENT 'Test môn tiếng anh\r\n',
  `structure` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `total_questions` int(11) DEFAULT 0,
  `passing_score` int(11) DEFAULT 0,
  `score` int(11) DEFAULT 0,
  `passed` tinyint(2) DEFAULT 0,
  `status` tinyint(2) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_thanhvien`
--

CREATE TABLE `course_thanhvien` (
  `id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `vaitro` varchar(255) DEFAULT NULL,
  `cap_hoidong` varchar(255) DEFAULT 'cap_khoa',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ctdt`
--

CREATE TABLE `ctdt` (
  `id` int(11) NOT NULL,
  `ten` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `mota` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `nganh_id` int(11) DEFAULT 0,
  `he_dt` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT '0',
  `madt` varchar(255) DEFAULT NULL,
  `danhhieu_totnghiep` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `thoigian_daotao` int(11) DEFAULT NULL,
  `vitri_lamviec_sautotnghiep` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `cohoihoctap_sautotnghiep` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `muctieu` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL COMMENT 'id đơn vị đào tạo',
  `category_title` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL COMMENT 'hiện tại sẽ không dùng cái này',
  `khoa_apdung` int(11) DEFAULT NULL COMMENT 'Khoá áp dụng',
  `nam` int(11) DEFAULT NULL,
  `files` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL COMMENT 'Lưu quyết định ban hành chương trình đào tạo',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `status` tinyint(4) DEFAULT 1,
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `is_deleted` int(11) NOT NULL DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci COMMENT='Lưu thông tin về chương trình đào tạo các ngành, khoá';

-- --------------------------------------------------------

--
-- Table structure for table `ctdt_cdr`
--

CREATE TABLE `ctdt_cdr` (
  `id` int(11) NOT NULL,
  `ctdt_id` int(11) DEFAULT 0,
  `kyhieu` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ordering` int(11) DEFAULT 0,
  `noidung` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `parent_id` int(11) DEFAULT 0,
  `percent_pi` int(11) DEFAULT 0,
  `tuongthich_peos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tuongthich_peos`)),
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ctdt_config`
--

CREATE TABLE `ctdt_config` (
  `id` int(11) NOT NULL,
  `ctdt_id` int(11) DEFAULT 0,
  `group` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ordering` int(11) DEFAULT NULL,
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `noidung` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `value` int(11) DEFAULT 0,
  `params` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ctdt_hocphan`
--

CREATE TABLE `ctdt_hocphan` (
  `id` int(11) NOT NULL,
  `ctdt_id` int(11) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `course_name` varchar(255) DEFAULT NULL,
  `khoikienthuc` varchar(100) DEFAULT NULL COMMENT 'GIAODUC_DAICUONG\r\nCOSO_NHOMNGANH\r\nCHUYENNGANH\r\nTUCHON\r\nTHUCTAP_TOTNGHIEP',
  `sotinchi` int(11) DEFAULT NULL,
  `sotinchi_thuchanh` int(11) DEFAULT NULL,
  `hocky` int(11) DEFAULT NULL COMMENT 'học kỳ dự kiến tổ chức đào tạo',
  `status` tinyint(4) DEFAULT 1,
  `ordering` int(11) DEFAULT 100,
  `category_id` int(11) DEFAULT NULL,
  `category_title` varchar(245) DEFAULT NULL COMMENT 'Khoa quản lý',
  `hp_hoctruoc` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `hp_tienquyet` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `hp_songhanh` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`hp_songhanh`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci COMMENT='Lưu danh sách các học phần được xây dựng cho chương trình đào tạo';

-- --------------------------------------------------------

--
-- Table structure for table `ctdt_muctieu_cuthe`
--

CREATE TABLE `ctdt_muctieu_cuthe` (
  `id` int(11) NOT NULL,
  `ctdt_id` int(11) DEFAULT 0,
  `kyhieu` varchar(255) DEFAULT NULL,
  `ordering` int(11) DEFAULT 0,
  `noidung` text DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL COMMENT 'KIENTHUC | KYNANG | MDTC_TN(Mức độ tự chủ và trách nhiệm) | KYSU',
  `tuongthich` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Tương thích giữa sứ mạng, tầm nhìn, triết lý giáo dục với mục tiêu của chương trình đào tạo',
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ctdt_tuongthich`
--

CREATE TABLE `ctdt_tuongthich` (
  `id` int(11) NOT NULL,
  `title` text DEFAULT NULL,
  `noidung` text DEFAULT NULL,
  `edit` int(11) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_donvi`
--

CREATE TABLE `dm_donvi` (
  `id` int(11) NOT NULL,
  `ten` varchar(100) DEFAULT NULL,
  `mota` text DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci COMMENT='câp 1 là trường, cấp 2 là đơn vị phòng ban khoa, cấp 3 là bộ môn';

-- --------------------------------------------------------

--
-- Table structure for table `extensions`
--

CREATE TABLE `extensions` (
  `id` int(11) NOT NULL,
  `title` varchar(250) DEFAULT NULL,
  `key` varchar(255) NOT NULL,
  `grid` tinyint(1) DEFAULT 0,
  `grid_number` int(11) DEFAULT 0,
  `enable` tinyint(1) DEFAULT 0,
  `data` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `extracurriculars`
--

CREATE TABLE `extracurriculars` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `description_image` text DEFAULT NULL,
  `point` int(11) DEFAULT 0,
  `total_students` int(11) DEFAULT 0,
  `location` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '{name: Tên địa điểm, latitude: Vĩ độ, longitude: Kinh độ}',
  `radius_meter` double DEFAULT 0 COMMENT 'Phạm vị cho phép điểm danh của hoạt động tính bằng m',
  `time_start` timestamp NOT NULL COMMENT 'Thời gian bắt đầu ngoại khóa',
  `time_end` timestamp NULL DEFAULT NULL COMMENT 'Thời gian kết thúc ngoại khóa',
  `check_in` int(11) DEFAULT 0 COMMENT 'Thời gian được check in tính bằng phút tính từ time_start',
  `check_out` int(11) DEFAULT 0 COMMENT 'Thời gian được check out tính bằng phút tính sau time_end',
  `status` int(1) NOT NULL DEFAULT 0 COMMENT '-1: Chưa mở | 0: Đang diễn ra | 1: Đã kết thúc ',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `extracurricular_students`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `he_dt`
--

CREATE TABLE `he_dt` (
  `id` int(11) NOT NULL,
  `title` text DEFAULT NULL,
  `bac` varchar(255) DEFAULT NULL,
  `kyhieu` varchar(255) DEFAULT NULL,
  `updated_by` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hoidong_thamdinh`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `hoidong_thamdinh_monhoc`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `hoidong_thamdinh_monhoc_thanhvien`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `hoidong_thamdinh_thanhvien`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `log_student`
--

CREATE TABLE `log_student` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL DEFAULT 0,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `action` varchar(200) NOT NULL,
  `content` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `log_teacher`
--

CREATE TABLE `log_teacher` (
  `id` int(11) NOT NULL,
  `action_key` varchar(255) NOT NULL,
  `action_type` varchar(255) NOT NULL COMMENT 'Loại hành động: upload, get, listPlaylit, getvideoinfo,...',
  `object_id` int(11) NOT NULL DEFAULT 0 COMMENT 'id của đối tượng mà người dùng thao tác',
  `title` varchar(255) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `user_id` int(11) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mail_track`
--

CREATE TABLE `mail_track` (
  `id` int(10) UNSIGNED NOT NULL,
  `realm` varchar(100) NOT NULL,
  `to` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `sender` bigint(20) NOT NULL DEFAULT 0,
  `seen` int(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `media`
--

CREATE TABLE `media` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `title` text NOT NULL,
  `tag` varchar(255) DEFAULT NULL,
  `url` text NOT NULL,
  `ext` varchar(5) NOT NULL,
  `type` varchar(100) DEFAULT NULL,
  `size` bigint(20) NOT NULL,
  `share` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`share`)),
  `duration` double DEFAULT 0,
  `parent_id` bigint(20) DEFAULT 0,
  `user_id` bigint(20) DEFAULT 0,
  `public` tinyint(1) DEFAULT 0,
  `status` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `media_aws`
--

CREATE TABLE `media_aws` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `title` text NOT NULL,
  `tag` varchar(255) DEFAULT NULL,
  `url` text NOT NULL,
  `ext` varchar(5) NOT NULL,
  `type` varchar(100) DEFAULT NULL,
  `size` bigint(20) NOT NULL,
  `share` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`share`)),
  `duration` double DEFAULT 0,
  `parent_id` bigint(20) DEFAULT 0,
  `user_id` bigint(20) DEFAULT 0,
  `public` tinyint(1) DEFAULT 0,
  `status` tinyint(1) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `media_folder`
--

CREATE TABLE `media_folder` (
  `id` int(11) NOT NULL,
  `name` text DEFAULT NULL,
  `slug` text DEFAULT NULL,
  `parent_id` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `media_ftp`
--

CREATE TABLE `media_ftp` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `title` text NOT NULL,
  `tag` varchar(255) DEFAULT NULL,
  `url` text NOT NULL,
  `ext` varchar(5) NOT NULL,
  `type` varchar(100) DEFAULT NULL,
  `size` bigint(20) NOT NULL,
  `duration` bigint(20) DEFAULT 0,
  `user_id` bigint(20) DEFAULT 0,
  `public` tinyint(1) DEFAULT 0,
  `status` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `media_lcms`
--

CREATE TABLE `media_lcms` (
  `id` int(11) NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `server` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `table` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `table_id` int(11) DEFAULT 0,
  `table_col` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ext` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `title` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `type` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `size` bigint(20) DEFAULT NULL,
  `tag` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `url` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `user_id` int(11) DEFAULT 0,
  `public` int(11) DEFAULT 0,
  `status` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nganh_bomon`
--

CREATE TABLE `nganh_bomon` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `code` varchar(255) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `donvi_chuyenmon_id` int(11) DEFAULT 0,
  `donvi_id` int(11) DEFAULT 0,
  `slug` varchar(255) NOT NULL,
  `desc` text DEFAULT NULL,
  `parent_id` int(11) DEFAULT 0,
  `ordering` int(11) NOT NULL DEFAULT 1000,
  `status` tinyint(4) DEFAULT 1 COMMENT '-1. Delete; 0: inactive; 1. active',
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci COMMENT='danh muc khoa hoc';

-- --------------------------------------------------------

--
-- Table structure for table `options`
--

CREATE TABLE `options` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `value` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT 0,
  `customer_info` text DEFAULT NULL,
  `total` double DEFAULT 0 COMMENT 'tổng tiền các khoá học đã đăng ký mua',
  `code` varchar(255) DEFAULT NULL,
  `active_code` varchar(255) DEFAULT NULL,
  `tax` double DEFAULT 0,
  `items` text DEFAULT NULL COMMENT 'json thong tin cac khoa hoc + price',
  `payment_method` varchar(100) NOT NULL COMMENT 'banktranfer, cash, cod',
  `status` tinyint(4) DEFAULT 0 COMMENT '-2:refund;\r\n -1: Cancel; 0: Pending\r\n; 2: Paid',
  `checker_id` int(11) DEFAULT 0 COMMENT 'quản lý người chốt đơn',
  `note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `partner_students`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `playlists`
--

CREATE TABLE `playlists` (
  `id` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `video_id` varchar(100) NOT NULL,
  `playlist_id` varchar(100) NOT NULL,
  `playlist_title` varchar(255) NOT NULL,
  `channel_id` varchar(100) NOT NULL,
  `channel_title` varchar(255) NOT NULL,
  `status` int(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `playlists_aws`
--

CREATE TABLE `playlists_aws` (
  `id` varchar(255) NOT NULL,
  `aws` varchar(255) NOT NULL,
  `video_id` varchar(255) NOT NULL,
  `playlist` varchar(255) NOT NULL,
  `status` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `report_student_activity`
--

CREATE TABLE `report_student_activity` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL DEFAULT 0,
  `lesson_id` int(11) NOT NULL DEFAULT 0,
  `lesson_type` char(50) NOT NULL COMMENT 'TEST hoặc LESSON',
  `action_type` varchar(100) NOT NULL COMMENT 'open, like, dislike, play,...',
  `number` int(11) NOT NULL DEFAULT 0 COMMENT 'tổng số action',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `room`
--

CREATE TABLE `room` (
  `id` int(10) UNSIGNED NOT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `owned` int(11) NOT NULL COMMENT 'id của user tạo ra zoom',
  `joiners` longtext DEFAULT NULL COMMENT 'danh sách user joined in, eg:|15|65|39|',
  `banned` longtext DEFAULT NULL COMMENT 'Danh sách user bị banned, eg:|15|65|39|',
  `app_name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `room_messages`
--

CREATE TABLE `room_messages` (
  `id` int(10) UNSIGNED NOT NULL,
  `room_id` int(11) NOT NULL,
  `owned` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rpt_class_student_points`
--

CREATE TABLE `rpt_class_student_points` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `class_id` int(11) NOT NULL DEFAULT 0,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `hodem` varchar(100) DEFAULT NULL,
  `ten` varchar(50) DEFAULT NULL,
  `student_code` varchar(50) NOT NULL,
  `cc` float NOT NULL DEFAULT -1,
  `bttn` float NOT NULL DEFAULT -1 COMMENT 'tổng trung bình trung điểm lớn nhất 3 lần test của các bài tập trắc nghiệm',
  `bttn_tp` varchar(200) DEFAULT NULL COMMENT 'điểm 15phuts đầu giờ tính từ học kỳ 3 - 2024-2025\r\n{"Bài 1":9,"Bài 2":7}, từ tuần 1 =>8',
  `bttn_max_tp` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'điểm cao nhất trong các lần luyện ở nhà',
  `check_ban` varchar(10) DEFAULT NULL COMMENT 'đánh dấu đã qua bài điều kiện tuần ',
  `nghi_20_pecent` varchar(255) DEFAULT NULL,
  `chitiet_tx` varchar(255) DEFAULT NULL,
  `tx1` float NOT NULL DEFAULT -1,
  `tx2` float NOT NULL DEFAULT -1,
  `tx3` float NOT NULL DEFAULT -1,
  `tx4` float NOT NULL DEFAULT -1,
  `thi` float NOT NULL DEFAULT -1,
  `tyle` varchar(50) DEFAULT '{"cc":5,"bttn":15,"tx":30,"thi":50}' COMMENT 'tỷ lệ giữa các thành phần điểm',
  `key` text DEFAULT NULL COMMENT 'mã xác thực kết quả',
  `ordering` int(11) DEFAULT 0,
  `so_buoinghi` int(11) DEFAULT 0 COMMENT 'Số buổi nghỉ',
  `so_tietnghi` int(11) DEFAULT 0,
  `accept_duthi` int(11) NOT NULL DEFAULT 0 COMMENT 'giảng viên cho phép dự thi đối với trường hợp bị cấp thi do điểm danh mọi trường hợp khác không thay đổi (0 mặc định , 1 : cho phép)',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `giangvien_id` int(11) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rpt_class_student_test_cc`
--

CREATE TABLE `rpt_class_student_test_cc` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `class_id` int(11) NOT NULL DEFAULT 0,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `week` int(11) NOT NULL DEFAULT 0,
  `type` varchar(100) DEFAULT NULL,
  `num_of_test` int(11) DEFAULT 0,
  `passing_point` int(11) DEFAULT 0,
  `maxpoint_3t` decimal(10,2) DEFAULT 0.00,
  `maxpoint_at` decimal(10,2) DEFAULT 0.00,
  `point_15` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rpt_class_student_test_daugio`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `rpt_class_student_test_tx`
--

CREATE TABLE `rpt_class_student_test_tx` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `class_id` int(11) NOT NULL DEFAULT 0,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `tx1` int(11) DEFAULT -1,
  `tx2` int(11) DEFAULT -1,
  `tx3` int(11) DEFAULT -1,
  `tx4` int(11) DEFAULT -1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `user_id` bigint(11) DEFAULT NULL,
  `student_code` varchar(45) DEFAULT NULL COMMENT 'neu la sinh vien ==> luu ma sinh vien',
  `full_name` varchar(100) DEFAULT NULL COMMENT 'Họ và tên sinh viên',
  `name` varchar(45) DEFAULT NULL COMMENT 'ten nay dung de sap xep theo A-Z',
  `birthday` varchar(20) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `full_name_slug` varchar(100) DEFAULT NULL,
  `category_id` int(11) DEFAULT 0 COMMENT 'mã ngành',
  `category_name` varchar(255) DEFAULT NULL COMMENT 'tên ngành',
  `makhoa` int(11) NOT NULL DEFAULT 0 COMMENT 'mã khoa',
  `tenkhoa` varchar(250) DEFAULT NULL COMMENT 'tên khoa chuyên môn',
  `tenlop_quanly` varchar(255) DEFAULT NULL COMMENT 'tên lớp quản lý',
  `class_management_id` int(11) DEFAULT 0,
  `khoadaotao` varchar(11) DEFAULT NULL COMMENT 'Khoá đào tạo',
  `teacher` int(11) DEFAULT 0,
  `new_personal_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_personal_info`)),
  `donvi_chuyenmon_id` int(11) DEFAULT 0,
  `bomon_id` int(11) DEFAULT NULL,
  `ctdt_id` int(11) DEFAULT 0,
  `google_meet` varchar(255) DEFAULT NULL,
  `social_link` text DEFAULT NULL COMMENT 'json{"facebook":"", "twitter":"", "instagram":""}',
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `deleted` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students_cabiet`
--

CREATE TABLE `students_cabiet` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL DEFAULT 0 COMMENT 'id trong bảng students',
  `student_info` text DEFAULT NULL COMMENT 'thông tin sinh viên',
  `class_management_id` int(11) NOT NULL DEFAULT 0 COMMENT 'lớp quản ',
  `status` int(11) DEFAULT 0,
  `user_id` int(11) NOT NULL DEFAULT 0 COMMENT 'id của user',
  `is_deleted` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students_cabiet_activities`
--

CREATE TABLE `students_cabiet_activities` (
  `id` int(11) NOT NULL,
  `students_cabiet_id` int(11) NOT NULL DEFAULT 0,
  `class_management_id` int(11) NOT NULL DEFAULT 0,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `title` varchar(255) DEFAULT NULL COMMENT 'Noidung',
  `type` varchar(100) DEFAULT NULL COMMENT 'start/end',
  `noidung_tuvan` varchar(255) DEFAULT NULL,
  `ketqua_tuvan` varchar(255) DEFAULT NULL,
  `loi_vipham` longtext DEFAULT NULL,
  `hinhthuc_tuvan` int(11) DEFAULT NULL,
  `date_tuvan` varchar(100) DEFAULT NULL,
  `updated_by` bigint(20) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_activity`
--

CREATE TABLE `student_activity` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT 0,
  `class_id` int(11) NOT NULL DEFAULT 0,
  `lesson_id` int(11) NOT NULL DEFAULT 0,
  `namhoc` varchar(50) DEFAULT NULL,
  `hocky` int(11) DEFAULT 0,
  `action` varchar(255) NOT NULL,
  `content` varchar(255) DEFAULT NULL,
  `ip` varchar(50) DEFAULT NULL,
  `browser` varchar(255) DEFAULT NULL,
  `realm` varchar(22) DEFAULT NULL,
  `created_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `surveys`
--

CREATE TABLE `surveys` (
  `id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL DEFAULT 0,
  `title` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL COMMENT 'Mô tả ngắn ngọn về cuộc khảo sát',
  `total_questions` int(11) DEFAULT 0,
  `participant_roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Mô tả nhóm người dùng tham gia khảo sát\r\nSTUDENT : Sinh viên,\r\nFORMER_STUDENTS : Cựu sinh viên,\r\nLECTURER : Giảng viên,\r\nHEAD_OF_DEPARTMENT : Trưởng Bộ môn, \r\nDEAN : Trưởng khoa,\r\nALL_USERS : Tất cả người dùng,',
  `assigned_count` int(5) DEFAULT 0 COMMENT 'Lượt sử dụng phiếu',
  `status` enum('DRAFT','PUBLISHED','CLOSED') NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT : Đan soạn thảo | PUBLISHED : Đã xuất bản | CLOSED : đã đóng',
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) NOT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_by` bigint(20) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_participants`
--

CREATE TABLE `survey_participants` (
  `id` int(11) NOT NULL,
  `survey_plan_id` int(11) DEFAULT 0,
  `full_name` varchar(255) DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `gender` enum('NAM','NU','KHAC') DEFAULT 'NAM',
  `session_id` varchar(255) NOT NULL COMMENT 'uuid của người dùng trong trường hợp khảo sát mà không cần đăng nhập	',
  `age` int(11) DEFAULT 0,
  `address` varchar(500) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `organization_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_plans`
--

CREATE TABLE `survey_plans` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `required` tinyint(1) NOT NULL DEFAULT 1,
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `survey_id` int(11) NOT NULL DEFAULT 0,
  `school_year` varchar(100) DEFAULT NULL,
  `participant_roles` varchar(255) DEFAULT NULL COMMENT 'forward từ survey sang',
  `semester` tinyint(1) DEFAULT 0,
  `type` enum('COURSE','OUTSIDE') NOT NULL DEFAULT 'COURSE' COMMENT 'Định nghĩa đợt khảo sát của môm học hay ngoài môn học',
  `course_ids` text DEFAULT NULL,
  `class_ids` text DEFAULT NULL,
  `khoa` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Khóa học' CHECK (json_valid(`khoa`)),
  `questions` text DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `status` enum('DRAFT','PUBLISHED','CLOSED') DEFAULT 'DRAFT' COMMENT 'DRAFT : Chưa mở | PUBLISHED : Đang diễn ra | CLOSED : Đã đóng',
  `random_question` int(11) DEFAULT 0,
  `auth_method` enum('LMS','GOOGLE','NONE') DEFAULT 'LMS',
  `access_link` text DEFAULT NULL COMMENT 'link của cuộc khảo sát',
  `created_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) NOT NULL DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_by` bigint(20) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_questions`
--

CREATE TABLE `survey_questions` (
  `id` int(11) NOT NULL,
  `survey_id` int(11) NOT NULL DEFAULT 0,
  `title` text DEFAULT NULL,
  `ordering` tinyint(3) DEFAULT 0 COMMENT 'Thứ tự hiển thị của câu hỏi trong phiếu khảo sát',
  `answer_options` text DEFAULT NULL COMMENT 'Danh sách phương án trả lời',
  `allow_other_answer` tinyint(1) DEFAULT 0 COMMENT '0: không ý kiên khác | 1: ý kiên khác',
  `required` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Bắt buộc trả lời hay không',
  `question_type` enum('RADIO','CHECKBOX','INPUT','DATE','SELECT','MULTI_SELECT','YES_NO','TEXTAREA','TIME','RATE') DEFAULT 'INPUT' COMMENT 'Loại câu hỏi',
  `frequency` int(11) DEFAULT 0,
  `frequency_unit` enum('DAY','WEEK','MONTH','ONE') NOT NULL DEFAULT 'ONE',
  `media` text DEFAULT NULL,
  `params` text DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_question_answers`
--

CREATE TABLE `survey_question_answers` (
  `id` int(11) NOT NULL,
  `survey_id` int(11) NOT NULL DEFAULT 0,
  `code` varchar(50) DEFAULT NULL,
  `survey_plan_id` int(11) NOT NULL DEFAULT 0,
  `survey_question_id` int(11) DEFAULT 0,
  `student_id` int(11) DEFAULT 0,
  `answer_id` varchar(50) DEFAULT NULL,
  `answer_text` varchar(2000) DEFAULT NULL COMMENT 'Dành cho các câu hỏi dạng input và textarea và các nội dung của các phương án bổ xung',
  `has_other_answer` tinyint(1) DEFAULT 0 COMMENT '0: không ý kiên khác | 1: ý kiên khác',
  `temporary` varchar(255) DEFAULT NULL,
  `section_id` varchar(200) NOT NULL COMMENT 'uuid của người dùng trong trường hợp khảo sát mà không cần đăng nhập',
  `class_id` int(11) DEFAULT 0,
  `teacher_id` int(11) DEFAULT 0,
  `course_id` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(4) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sys_version`
--

CREATE TABLE `sys_version` (
  `id` int(11) NOT NULL,
  `app_name` varchar(255) NOT NULL COMMENT ' tên app ( fe_elearning / be_elearning )',
  `version` varchar(255) NOT NULL,
  `change_log` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thibackup_shift_controls`
--

CREATE TABLE `thibackup_shift_controls` (
  `id` int(11) NOT NULL DEFAULT 0,
  `shift_student_id` int(11) DEFAULT 0,
  `type` varchar(100) NOT NULL COMMENT 'loại tín hiệu',
  `message` varchar(255) NOT NULL COMMENT 'thông báo tín hiệu',
  `value` int(11) DEFAULT 0 COMMENT 'Giá trị tín hiệu',
  `sender` varchar(10) DEFAULT NULL COMMENT 'GIANGVIEN; SINHVIEN',
  `sender_by` int(11) NOT NULL COMMENT 'ID người gửi tín hiệu',
  `received_by` int(11) NOT NULL COMMENT 'Người thực hiện tín hiệu (status=1)',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `status` int(11) DEFAULT 0 COMMENT '0: chưa nhận; 1 đã nhận',
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='Bảng lưu thông tin điều khiển của cán bộ coi thi vơi SV và gửi thông tin hành vi sinh viên đến cán bộ coi thi';

-- --------------------------------------------------------

--
-- Table structure for table `thibackup_shift_rooms`
--

CREATE TABLE `thibackup_shift_rooms` (
  `id` int(11) NOT NULL DEFAULT 0,
  `shift_id` int(11) DEFAULT 0,
  `room` varchar(200) NOT NULL,
  `desc` varchar(500) DEFAULT NULL,
  `canbo_coithi_ids` varchar(200) DEFAULT NULL COMMENT '[id1,id2,...]',
  `pass_of_room` varchar(255) DEFAULT NULL,
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `is_deleted` int(11) NOT NULL DEFAULT 0 COMMENT '1: Đã xoá; 0: chưa xoá',
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '1: Đã hoàn thành coi thi; 0: Chưa hoàn thành coi thi'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thibackup_shift_students`
--

CREATE TABLE `thibackup_shift_students` (
  `id` int(11) NOT NULL DEFAULT 0,
  `shift_id` int(11) NOT NULL DEFAULT 0,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `student_user_id` int(11) DEFAULT 0,
  `sbd` int(11) NOT NULL DEFAULT 0 COMMENT 'Số báo danh',
  `ordering` int(11) NOT NULL DEFAULT 0 COMMENT 'Thứ tự theo danh sách thí sinh',
  `room` varchar(255) DEFAULT NULL,
  `thi_question_bank_tn_id` int(11) DEFAULT 0,
  `questions` text DEFAULT NULL,
  `total` int(10) DEFAULT 0 COMMENT 'Tổng số câu hỏi',
  `av` int(10) DEFAULT 0 COMMENT '0: mon khac; 1: Ngoai ngu; 2:toan',
  `status` tinyint(2) DEFAULT 0 COMMENT '	0: Chưa làm; 1: Đã nhận đề, đang làm; -1:hủy; -2:tạm dừng thi',
  `completed` tinyint(2) DEFAULT 0 COMMENT '0: chua hoan thanh; 1: da hoan thanh',
  `submited_by` int(2) DEFAULT 0 COMMENT '0 là hệ thống tự nộp, khác 0 thì là id của người nộp[sinhvien | giảng viên]	',
  `pass_code` varchar(255) DEFAULT NULL COMMENT 'Ma khau bai test cua sv',
  `locked` tinyint(2) NOT NULL DEFAULT 0 COMMENT '1: khóa bài test',
  `point` float NOT NULL DEFAULT -1 COMMENT 'thang 100',
  `tracking` text DEFAULT NULL COMMENT 'tracking quá trình làm bài của thí sinh',
  `violation_of_exam` text DEFAULT NULL,
  `progress` int(3) DEFAULT 0 COMMENT 'Tiến độ hoàn thành của bài thi(đơn vị %)',
  `markers` varchar(500) DEFAULT NULL,
  `time_total` text DEFAULT '0' COMMENT 'Tổng thời gian làm bài (s)',
  `time_remaining` int(11) DEFAULT 0 COMMENT 'Tổng thời gian còn lại (s)',
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(2) DEFAULT 0,
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thibackup_shift_student_answers`
--

CREATE TABLE `thibackup_shift_student_answers` (
  `id` int(11) NOT NULL DEFAULT 0,
  `shift_student_id` int(11) NOT NULL DEFAULT 0,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `course_question_id` int(11) NOT NULL DEFAULT 0,
  `student_answer` varchar(255) DEFAULT NULL,
  `temporary` varchar(500) DEFAULT NULL,
  `result` tinyint(2) NOT NULL DEFAULT 0,
  `status` tinyint(2) NOT NULL DEFAULT 0 COMMENT '0:chưa chấm; 1: Đã chấm',
  `is_deleted` tinyint(2) NOT NULL DEFAULT 0,
  `deleted_by` tinyint(2) NOT NULL DEFAULT 0,
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='Luu ket qua tra loi cua sinh vien';

-- --------------------------------------------------------

--
-- Table structure for table `thibackup_shift_violation`
--

CREATE TABLE `thibackup_shift_violation` (
  `id` int(11) NOT NULL DEFAULT 0,
  `shift_student_id` int(11) NOT NULL DEFAULT 0,
  `violation_key` varchar(255) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `student_id` int(11) DEFAULT 0,
  `shift_id` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thi_form`
--

CREATE TABLE `thi_form` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `desc` tinytext DEFAULT NULL,
  `num_of_test` int(11) DEFAULT 0,
  `time_of_test` int(11) DEFAULT 0 COMMENT 'tổng thời gian làm bài thi',
  `av` int(11) DEFAULT 0,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0: chưa kích hoạt; 1: đã kích hoạt',
  `scan` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` int(11) NOT NULL DEFAULT 0,
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thi_form_details`
--

CREATE TABLE `thi_form_details` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `form_id` int(11) NOT NULL DEFAULT 0,
  `part` varchar(10) DEFAULT '' COMMENT 'Part-1,Part-2,...',
  `course_plan_activity_id` int(11) NOT NULL DEFAULT 0 COMMENT '0: Các môn bình thường hoặc tiếng anh; >0 là môn toán có thiết lập đặc biệt đến tận từng CDR',
  `week` int(11) NOT NULL DEFAULT 0 COMMENT 'số tín chỉ x3 và 100',
  `cdr` int(11) NOT NULL DEFAULT 0 COMMENT 'Mức 1,2,3,4,5,6 tương ứng với Biết, Hiểu, Vận dụng, Phân tích, ...',
  `total_question_take` int(11) NOT NULL DEFAULT 0,
  `point` int(11) NOT NULL DEFAULT 0 COMMENT 'Tổng điểm nếu làm đúng',
  `private` int(11) DEFAULT 0,
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` int(11) NOT NULL DEFAULT 0,
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thi_logs`
--

CREATE TABLE `thi_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL DEFAULT 0,
  `type` varchar(100) DEFAULT NULL COMMENT 'Loại log: (định nghĩa rõ từng loại log)',
  `object` varchar(100) DEFAULT NULL COMMENT 'Đối tượng table bị tác động',
  `object_id` int(11) NOT NULL DEFAULT 0 COMMENT 'id của row trong table bị tác động',
  `value` text DEFAULT NULL COMMENT 'giá trị (nế có)',
  `created_at` timestamp NULL DEFAULT NULL,
  `thi_shift_id` int(11) DEFAULT 0,
  `note` text DEFAULT NULL,
  `deleted_by` int(11) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='Lưu toàn bộ activity của cán bộ khi thực hiện thao tác thêm, sửa, xoá trên phần mềm';

-- --------------------------------------------------------

--
-- Table structure for table `thi_question_bank_th`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `thi_question_bank_tn`
--

CREATE TABLE `thi_question_bank_tn` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `form_id` int(11) DEFAULT 0,
  `questions` text DEFAULT NULL COMMENT 'ds id câu hỏi',
  `total` int(11) NOT NULL DEFAULT 0 COMMENT 'Tổng số câu hỏi',
  `av` int(11) NOT NULL DEFAULT 0 COMMENT '0: mon khac; 1: Ngoai ngu; 2:toan',
  `missing` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`missing`)),
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='Bảng đề thi sinh trước ngân hàng đề thi trắc nghiệm';

-- --------------------------------------------------------

--
-- Table structure for table `thi_shifts`
--

CREATE TABLE `thi_shifts` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type_of_test` varchar(20) NOT NULL DEFAULT 'TRACNGHIEM' COMMENT 'TRACNGHIEP; TULUAN',
  `desc` text DEFAULT NULL,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `form_id` int(11) NOT NULL DEFAULT 0,
  `sync_cathi_id` varchar(255) DEFAULT '0',
  `time_start` datetime DEFAULT NULL COMMENT 'thời gian bắt đầu ca thi (ngày, giờ)',
  `time_of_test` int(11) NOT NULL DEFAULT 0 COMMENT 'thời gian làm bài thi (phút)',
  `num_of_student` int(11) NOT NULL DEFAULT 0 COMMENT 'Tổng số sinh viên',
  `num_of_test` int(11) DEFAULT NULL COMMENT 'Tổng số đề sẽ sinh',
  `pass_of_test` varchar(255) DEFAULT NULL COMMENT 'Mật khẩu truy cập bài test',
  `namhoc` varchar(15) DEFAULT NULL,
  `hocky` int(11) NOT NULL DEFAULT 0,
  `dotthi` int(11) DEFAULT NULL,
  `tuluan_ids` longtext DEFAULT NULL COMMENT 'Đề tự luận của ca thi tự luận',
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0: Chưa kích hoat; 1: Đã kích hoạt; 2: Đã hoàn thành',
  `open` int(11) NOT NULL DEFAULT 0 COMMENT 'status=1; open=1 ==> show phía sinh viên',
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `is_deleted` int(11) NOT NULL DEFAULT 0,
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thi_shift_controls`
--

CREATE TABLE `thi_shift_controls` (
  `id` int(11) NOT NULL,
  `shift_student_id` int(11) DEFAULT 0,
  `type` varchar(100) NOT NULL COMMENT 'loại tín hiệu',
  `message` varchar(255) NOT NULL COMMENT 'thông báo tín hiệu',
  `value` int(11) DEFAULT 0 COMMENT 'Giá trị tín hiệu',
  `sender` varchar(10) DEFAULT NULL COMMENT 'GIANGVIEN; SINHVIEN',
  `sender_by` int(11) NOT NULL COMMENT 'ID người gửi tín hiệu',
  `received_by` int(11) NOT NULL COMMENT 'Người thực hiện tín hiệu (status=1)',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `status` int(11) DEFAULT 0 COMMENT '0: chưa nhận; 1 đã nhận',
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='Bảng lưu thông tin điều khiển của cán bộ coi thi vơi SV và gửi thông tin hành vi sinh viên đến cán bộ coi thi';

-- --------------------------------------------------------

--
-- Table structure for table `thi_shift_duan_group`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `thi_shift_rooms`
--

CREATE TABLE `thi_shift_rooms` (
  `id` int(11) NOT NULL,
  `shift_id` int(11) DEFAULT 0,
  `room` varchar(200) NOT NULL,
  `desc` varchar(500) DEFAULT NULL,
  `canbo_coithi_ids` varchar(200) DEFAULT NULL COMMENT '[id1,id2,...]',
  `pass_of_room` varchar(255) DEFAULT NULL,
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `is_deleted` int(11) NOT NULL DEFAULT 0 COMMENT '1: Đã xoá; 0: chưa xoá',
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '1: Đã hoàn thành coi thi; 0: Chưa hoàn thành coi thi',
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thi_shift_students`
--

CREATE TABLE `thi_shift_students` (
  `id` int(11) NOT NULL,
  `shift_id` int(11) NOT NULL DEFAULT 0,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `student_user_id` int(11) DEFAULT 0,
  `sbd` int(11) NOT NULL DEFAULT 0 COMMENT 'Số báo danh',
  `ordering` int(11) NOT NULL DEFAULT 0 COMMENT 'Thứ tự theo danh sách thí sinh',
  `room` varchar(255) DEFAULT NULL,
  `thi_question_bank_tn_id` int(11) DEFAULT 0,
  `questions` text DEFAULT NULL,
  `total` int(10) DEFAULT 0 COMMENT 'Tổng số câu hỏi',
  `av` int(10) DEFAULT 0 COMMENT '0: mon khac; 1: Ngoai ngu; 2:toan',
  `status` tinyint(2) DEFAULT 0 COMMENT '	0: Chưa làm; 1: Đã nhận đề, đang làm; -1:hủy; -2:tạm dừng thi',
  `completed` tinyint(2) DEFAULT 0 COMMENT '0: chua hoan thanh; 1: da hoan thanh',
  `submited_by` int(2) DEFAULT 0 COMMENT '0 là hệ thống tự nộp, khác 0 thì là id của người nộp[sinhvien | giảng viên]	',
  `pass_code` varchar(255) DEFAULT NULL COMMENT 'Ma khau bai test cua sv',
  `locked` tinyint(2) NOT NULL DEFAULT 0 COMMENT 'khác 0: khóa bài test;\r\n1: vắng 0 phép;\r\n2: vắng có phép;\r\n\r\n',
  `point` float NOT NULL DEFAULT -1 COMMENT 'thang 100',
  `trudiem` int(11) DEFAULT 0,
  `tracking` text DEFAULT NULL COMMENT 'tracking quá trình làm bài của thí sinh',
  `warning` text DEFAULT NULL COMMENT 'Lưu dấu cảnh báo trên bài thi của thí sinh, các lần phân cách nhau bởi dấu | . Vd : 2024-11-05T17:12:15|2024-11-05T17:18:10|2024-11-05T17:22:06',
  `violation_of_exam` text DEFAULT NULL,
  `progress` int(3) DEFAULT 0 COMMENT 'Số câu hỏi đã trả lời',
  `markers` varchar(500) DEFAULT NULL,
  `time_total` text DEFAULT '0' COMMENT 'Tổng thời gian làm bài (s)',
  `time_remaining` int(11) DEFAULT 0 COMMENT 'Tổng thời gian còn lại (s)',
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(2) DEFAULT 0,
  `deleted_by` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  `tong_diem` decimal(10,2) GENERATED ALWAYS AS (`point` - `point` * `trudiem` / 100) VIRTUAL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thi_shift_students_duan`
--

CREATE TABLE `thi_shift_students_duan` (
  `id` int(11) NOT NULL,
  `shift_id` int(11) DEFAULT 0,
  `student_id` int(11) DEFAULT 0,
  `student_user_id` int(11) DEFAULT 0,
  `course_plan_activity_tuluan_id` int(11) DEFAULT 0,
  `sbd` varchar(255) DEFAULT NULL,
  `locked` int(11) DEFAULT 0,
  `ordering` int(11) DEFAULT 1000,
  `room` varchar(255) DEFAULT NULL,
  `params` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`params`)),
  `point` double DEFAULT -1,
  `note` text DEFAULT NULL,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thi_shift_student_answers`
--

CREATE TABLE `thi_shift_student_answers` (
  `id` int(11) NOT NULL,
  `shift_student_id` int(11) NOT NULL DEFAULT 0,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `course_id` int(11) NOT NULL DEFAULT 0,
  `course_question_id` int(11) NOT NULL DEFAULT 0,
  `student_answer` varchar(255) DEFAULT NULL,
  `temporary` varchar(500) DEFAULT NULL,
  `result` tinyint(2) NOT NULL DEFAULT 0,
  `status` tinyint(2) NOT NULL DEFAULT 0 COMMENT '0:chưa chấm; 1: Đã chấm',
  `is_deleted` tinyint(2) NOT NULL DEFAULT 0,
  `deleted_by` tinyint(2) NOT NULL DEFAULT 0,
  `created_by` int(11) NOT NULL DEFAULT 0,
  `updated_by` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='Luu ket qua tra loi cua sinh vien';

-- --------------------------------------------------------

--
-- Table structure for table `thi_shift_violation`
--

CREATE TABLE `thi_shift_violation` (
  `id` int(11) NOT NULL,
  `shift_student_id` int(11) NOT NULL DEFAULT 0,
  `violation_key` varchar(255) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `student_id` int(11) DEFAULT 0,
  `shift_id` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `created_by` bigint(20) DEFAULT 0,
  `updated_by` bigint(20) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `video_marker`
--

CREATE TABLE `video_marker` (
  `id` int(11) NOT NULL,
  `lesson_id` int(11) DEFAULT 0,
  `time` double DEFAULT NULL,
  `collection_id` int(11) DEFAULT 0,
  `collection_type` varchar(255) DEFAULT 'LESSON' COMMENT 'LESSON | COURSE_PLAN_ACTIVITY | CLASS_PLAN_ACTIVITY',
  `config` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int(11) DEFAULT 0,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `video_marker_question`
--

CREATE TABLE `video_marker_question` (
  `id` int(11) NOT NULL,
  `video_marker_id` int(11) DEFAULT 0,
  `collection_id` int(11) DEFAULT 0,
  `collection_type` varchar(255) DEFAULT 'LESSON',
  `question_direction` text DEFAULT NULL,
  `answer_correct` varchar(255) DEFAULT NULL,
  `answer_option` text DEFAULT NULL,
  `config` text DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_by` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT 0,
  `updated_by` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `send_id` (`send_id`),
  ADD KEY `announcements_is_deleted_index` (`is_deleted`),
  ADD KEY `announcements_deleted_by_index` (`deleted_by`),
  ADD KEY `announcements_created_by_index` (`created_by`),
  ADD KEY `announcements_updated_by_index` (`updated_by`);

--
-- Indexes for table `announcement_users`
--
ALTER TABLE `announcement_users`
  ADD UNIQUE KEY `USER_UNIQUE` (`user_id`,`id`),
  ADD KEY `announcement_users_id_index` (`id`),
  ADD KEY `announcement_users_user_id_index` (`user_id`),
  ADD KEY `announcement_users_seen_index` (`seen`);

--
-- Indexes for table `article_categories`
--
ALTER TABLE `article_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `article_posts`
--
ALTER TABLE `article_posts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `article_post_cate`
--
ALTER TABLE `article_post_cate`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `baiviet`
--
ALTER TABLE `baiviet`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `chuyenmuc`
--
ALTER TABLE `chuyenmuc`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `classes_root`
--
ALTER TABLE `classes_root`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_calendar`
--
ALTER TABLE `class_calendar`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_documents`
--
ALTER TABLE `class_documents`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_emails`
--
ALTER TABLE `class_emails`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_group`
--
ALTER TABLE `class_group`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_group_member`
--
ALTER TABLE `class_group_member`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_group_plan`
--
ALTER TABLE `class_group_plan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_homeworks`
--
ALTER TABLE `class_homeworks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`);

--
-- Indexes for table `class_homework_comments`
--
ALTER TABLE `class_homework_comments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_homework_points`
--
ALTER TABLE `class_homework_points`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_homework_posts`
--
ALTER TABLE `class_homework_posts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_management`
--
ALTER TABLE `class_management`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_management_gvcn`
--
ALTER TABLE `class_management_gvcn`
  ADD PRIMARY KEY (`id`),
  ADD KEY `class_management_gvcn_deleted_by_index` (`deleted_by`);

--
-- Indexes for table `class_meeting`
--
ALTER TABLE `class_meeting`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_plans`
--
ALTER TABLE `class_plans`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_plan_activities`
--
ALTER TABLE `class_plan_activities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_plan_activities_tests`
--
ALTER TABLE `class_plan_activities_tests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_plan_activities_tests_answer`
--
ALTER TABLE `class_plan_activities_tests_answer`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_plan_activities_tests_control`
--
ALTER TABLE `class_plan_activities_tests_control`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_plan_activity_students`
--
ALTER TABLE `class_plan_activity_students`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_plan_activity_student_answers`
--
ALTER TABLE `class_plan_activity_student_answers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_plan_activity_student_tests`
--
ALTER TABLE `class_plan_activity_student_tests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_query` (`class_id`,`class_plan_activity_id`,`course_id`,`student_id`,`created_by`,`week`,`type`,`status`,`locked`,`closed`,`is_deleted`) USING BTREE;

--
-- Indexes for table `class_plan_activity_thaoluan_post`
--
ALTER TABLE `class_plan_activity_thaoluan_post`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_plan_activity_thaoluan_post_reply`
--
ALTER TABLE `class_plan_activity_thaoluan_post_reply`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_plan_activity_tickets`
--
ALTER TABLE `class_plan_activity_tickets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_plan_activity_tuluan`
--
ALTER TABLE `class_plan_activity_tuluan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_plan_activity_tuluan_group`
--
ALTER TABLE `class_plan_activity_tuluan_group`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_plan_activity_tuluan_plan`
--
ALTER TABLE `class_plan_activity_tuluan_plan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_plan_activity_tuluan_plan_post`
--
ALTER TABLE `class_plan_activity_tuluan_plan_post`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_students`
--
ALTER TABLE `class_students`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_student_diemdanh`
--
ALTER TABLE `class_student_diemdanh`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQUE_SAVE` (`class_id`,`calendar_id`,`student_id`) USING BTREE;

--
-- Indexes for table `class_student_mocdiemdanh`
--
ALTER TABLE `class_student_mocdiemdanh`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_student_points`
--
ALTER TABLE `class_student_points`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_student_tests`
--
ALTER TABLE `class_student_tests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_student_test_answers`
--
ALTER TABLE `class_student_test_answers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`);

--
-- Indexes for table `class_student_test_deadline`
--
ALTER TABLE `class_student_test_deadline`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_student_test_logs`
--
ALTER TABLE `class_student_test_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`);

--
-- Indexes for table `class_student_tracking`
--
ALTER TABLE `class_student_tracking`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_tests`
--
ALTER TABLE `class_tests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_test_questions`
--
ALTER TABLE `class_test_questions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `configs`
--
ALTER TABLE `configs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_bank`
--
ALTER TABLE `course_bank`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_clo`
--
ALTER TABLE `course_clo`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_clo_contribute`
--
ALTER TABLE `course_clo_contribute`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_clo_contribute_created_by_index` (`created_by`),
  ADD KEY `course_clo_contribute_updated_by_index` (`updated_by`);

--
-- Indexes for table `course_config`
--
ALTER TABLE `course_config`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_form_cc`
--
ALTER TABLE `course_form_cc`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_form_comment`
--
ALTER TABLE `course_form_comment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_form_dg`
--
ALTER TABLE `course_form_dg`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_form_duyet`
--
ALTER TABLE `course_form_duyet`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_form_kthp`
--
ALTER TABLE `course_form_kthp`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_form_th_kthp`
--
ALTER TABLE `course_form_th_kthp`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_form_tx`
--
ALTER TABLE `course_form_tx`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_lessons`
--
ALTER TABLE `course_lessons`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_lesson_comments`
--
ALTER TABLE `course_lesson_comments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_lesson_tests`
--
ALTER TABLE `course_lesson_tests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_lesson_test_questions`
--
ALTER TABLE `course_lesson_test_questions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_metas`
--
ALTER TABLE `course_metas`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_muctieu_chitiet`
--
ALTER TABLE `course_muctieu_chitiet`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_plan_activities`
--
ALTER TABLE `course_plan_activities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_plan_activity_tuluan`
--
ALTER TABLE `course_plan_activity_tuluan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_plan_activity_tuluan_tieuchicham`
--
ALTER TABLE `course_plan_activity_tuluan_tieuchicham`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_plan_bank`
--
ALTER TABLE `course_plan_bank`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_plan_comment`
--
ALTER TABLE `course_plan_comment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_plan_tuluan_comment`
--
ALTER TABLE `course_plan_tuluan_comment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_questions`
--
ALTER TABLE `course_questions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_question_comment`
--
ALTER TABLE `course_question_comment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_question_forms`
--
ALTER TABLE `course_question_forms`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_question_logs`
--
ALTER TABLE `course_question_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `course_question_log_id` (`log_id`);

--
-- Indexes for table `course_question_report`
--
ALTER TABLE `course_question_report`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQUE_QUESTION_USER` (`question_id`,`user_id`);

--
-- Indexes for table `course_rate`
--
ALTER TABLE `course_rate`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_testers`
--
ALTER TABLE `course_testers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_tester_results`
--
ALTER TABLE `course_tester_results`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_tester_session`
--
ALTER TABLE `course_tester_session`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_thanhvien`
--
ALTER TABLE `course_thanhvien`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ctdt`
--
ALTER TABLE `ctdt`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ctdt_cdr`
--
ALTER TABLE `ctdt_cdr`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ctdt_config`
--
ALTER TABLE `ctdt_config`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ctdt_hocphan`
--
ALTER TABLE `ctdt_hocphan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ctdt_hocphan_is_deleted_index` (`is_deleted`),
  ADD KEY `ctdt_hocphan_deleted_by_index` (`deleted_by`),
  ADD KEY `ctdt_hocphan_updated_by_index` (`updated_by`);

--
-- Indexes for table `ctdt_muctieu_cuthe`
--
ALTER TABLE `ctdt_muctieu_cuthe`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ctdt_tuongthich`
--
ALTER TABLE `ctdt_tuongthich`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_donvi`
--
ALTER TABLE `dm_donvi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`);

--
-- Indexes for table `extensions`
--
ALTER TABLE `extensions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `extracurriculars`
--
ALTER TABLE `extracurriculars`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `extracurricular_students`
--
ALTER TABLE `extracurricular_students`
  ADD PRIMARY KEY (`id`),
  ADD KEY `extracurricular_students_updated_by_index` (`updated_by`);

--
-- Indexes for table `he_dt`
--
ALTER TABLE `he_dt`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kyhieu` (`kyhieu`);

--
-- Indexes for table `hoidong_thamdinh`
--
ALTER TABLE `hoidong_thamdinh`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hoidong_thamdinh_monhoc`
--
ALTER TABLE `hoidong_thamdinh_monhoc`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hoidong_thamdinh_monhoc_thanhvien`
--
ALTER TABLE `hoidong_thamdinh_monhoc_thanhvien`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hoidong_thamdinh_thanhvien`
--
ALTER TABLE `hoidong_thamdinh_thanhvien`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `log_student`
--
ALTER TABLE `log_student`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `log_teacher`
--
ALTER TABLE `log_teacher`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `mail_track`
--
ALTER TABLE `mail_track`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `TRACK_UNIQUE` (`to`,`subject`);

--
-- Indexes for table `media`
--
ALTER TABLE `media`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `media_name_unique` (`name`);

--
-- Indexes for table `media_aws`
--
ALTER TABLE `media_aws`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `media_aws_name_unique` (`name`);

--
-- Indexes for table `media_folder`
--
ALTER TABLE `media_folder`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `media_ftp`
--
ALTER TABLE `media_ftp`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `media_ftp_name_unique` (`name`);

--
-- Indexes for table `media_lcms`
--
ALTER TABLE `media_lcms`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `nganh_bomon`
--
ALTER TABLE `nganh_bomon`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug_UNIQUE` (`slug`);

--
-- Indexes for table `options`
--
ALTER TABLE `options`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `options_name_unique` (`name`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `partner_students`
--
ALTER TABLE `partner_students`
  ADD PRIMARY KEY (`id`),
  ADD KEY `partner_students_deleted_by_index` (`deleted_by`);

--
-- Indexes for table `playlists`
--
ALTER TABLE `playlists`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `playlists_aws`
--
ALTER TABLE `playlists_aws`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `report_student_activity`
--
ALTER TABLE `report_student_activity`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `room`
--
ALTER TABLE `room`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `room_messages`
--
ALTER TABLE `room_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rpt_class_student_points`
--
ALTER TABLE `rpt_class_student_points`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQUE_STUDENT` (`class_id`,`student_id`);

--
-- Indexes for table `rpt_class_student_test_cc`
--
ALTER TABLE `rpt_class_student_test_cc`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rpt_class_student_test_daugio`
--
ALTER TABLE `rpt_class_student_test_daugio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`),
  ADD KEY `class_id` (`class_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `rpt_class_student_test_tx`
--
ALTER TABLE `rpt_class_student_test_tx`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_code_UNIQUE` (`student_code`);

--
-- Indexes for table `students_cabiet`
--
ALTER TABLE `students_cabiet`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQUE_POST` (`student_id`,`class_management_id`),
  ADD KEY `students_cabiet_deleted_by_index` (`deleted_by`);

--
-- Indexes for table `students_cabiet_activities`
--
ALTER TABLE `students_cabiet_activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `students_cabiet_activities_updated_by_index` (`updated_by`),
  ADD KEY `students_cabiet_activities_is_deleted_index` (`is_deleted`),
  ADD KEY `students_cabiet_activities_deleted_by_index` (`deleted_by`),
  ADD KEY `students_cabiet_activities_created_by_index` (`created_by`);

--
-- Indexes for table `student_activity`
--
ALTER TABLE `student_activity`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `surveys`
--
ALTER TABLE `surveys`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `survey_participants`
--
ALTER TABLE `survey_participants`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `survey_plans`
--
ALTER TABLE `survey_plans`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `survey_questions`
--
ALTER TABLE `survey_questions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `survey_question_answers`
--
ALTER TABLE `survey_question_answers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sys_version`
--
ALTER TABLE `sys_version`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thibackup_shift_controls`
--
ALTER TABLE `thibackup_shift_controls`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thibackup_shift_rooms`
--
ALTER TABLE `thibackup_shift_rooms`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thibackup_shift_students`
--
ALTER TABLE `thibackup_shift_students`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thibackup_shift_student_answers`
--
ALTER TABLE `thibackup_shift_student_answers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ANSWER_UNIQUE` (`shift_student_id`,`course_question_id`);

--
-- Indexes for table `thibackup_shift_violation`
--
ALTER TABLE `thibackup_shift_violation`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thi_form`
--
ALTER TABLE `thi_form`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thi_form_details`
--
ALTER TABLE `thi_form_details`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thi_logs`
--
ALTER TABLE `thi_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thi_question_bank_th`
--
ALTER TABLE `thi_question_bank_th`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thi_question_bank_tn`
--
ALTER TABLE `thi_question_bank_tn`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thi_shifts`
--
ALTER TABLE `thi_shifts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `thi_shift_controls`
--
ALTER TABLE `thi_shift_controls`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thi_shift_duan_group`
--
ALTER TABLE `thi_shift_duan_group`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thi_shift_rooms`
--
ALTER TABLE `thi_shift_rooms`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thi_shift_students`
--
ALTER TABLE `thi_shift_students`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thi_shift_students_duan`
--
ALTER TABLE `thi_shift_students_duan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thi_shift_student_answers`
--
ALTER TABLE `thi_shift_student_answers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ANSWER_UNIQUE` (`shift_student_id`,`course_question_id`);

--
-- Indexes for table `thi_shift_violation`
--
ALTER TABLE `thi_shift_violation`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `video_marker`
--
ALTER TABLE `video_marker`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `video_marker_question`
--
ALTER TABLE `video_marker_question`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `article_categories`
--
ALTER TABLE `article_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `article_posts`
--
ALTER TABLE `article_posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `article_post_cate`
--
ALTER TABLE `article_post_cate`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `baiviet`
--
ALTER TABLE `baiviet`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chuyenmuc`
--
ALTER TABLE `chuyenmuc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `classes_root`
--
ALTER TABLE `classes_root`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_calendar`
--
ALTER TABLE `class_calendar`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_documents`
--
ALTER TABLE `class_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_emails`
--
ALTER TABLE `class_emails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_group`
--
ALTER TABLE `class_group`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_group_member`
--
ALTER TABLE `class_group_member`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_group_plan`
--
ALTER TABLE `class_group_plan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_homeworks`
--
ALTER TABLE `class_homeworks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_homework_comments`
--
ALTER TABLE `class_homework_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_homework_points`
--
ALTER TABLE `class_homework_points`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_homework_posts`
--
ALTER TABLE `class_homework_posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_management`
--
ALTER TABLE `class_management`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_management_gvcn`
--
ALTER TABLE `class_management_gvcn`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_meeting`
--
ALTER TABLE `class_meeting`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plans`
--
ALTER TABLE `class_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plan_activities`
--
ALTER TABLE `class_plan_activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plan_activities_tests`
--
ALTER TABLE `class_plan_activities_tests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plan_activities_tests_answer`
--
ALTER TABLE `class_plan_activities_tests_answer`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plan_activities_tests_control`
--
ALTER TABLE `class_plan_activities_tests_control`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plan_activity_students`
--
ALTER TABLE `class_plan_activity_students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plan_activity_student_answers`
--
ALTER TABLE `class_plan_activity_student_answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plan_activity_student_tests`
--
ALTER TABLE `class_plan_activity_student_tests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plan_activity_thaoluan_post`
--
ALTER TABLE `class_plan_activity_thaoluan_post`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plan_activity_thaoluan_post_reply`
--
ALTER TABLE `class_plan_activity_thaoluan_post_reply`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plan_activity_tickets`
--
ALTER TABLE `class_plan_activity_tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plan_activity_tuluan`
--
ALTER TABLE `class_plan_activity_tuluan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plan_activity_tuluan_group`
--
ALTER TABLE `class_plan_activity_tuluan_group`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plan_activity_tuluan_plan`
--
ALTER TABLE `class_plan_activity_tuluan_plan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_plan_activity_tuluan_plan_post`
--
ALTER TABLE `class_plan_activity_tuluan_plan_post`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_students`
--
ALTER TABLE `class_students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_student_diemdanh`
--
ALTER TABLE `class_student_diemdanh`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_student_mocdiemdanh`
--
ALTER TABLE `class_student_mocdiemdanh`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_student_points`
--
ALTER TABLE `class_student_points`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_student_tests`
--
ALTER TABLE `class_student_tests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_student_test_answers`
--
ALTER TABLE `class_student_test_answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_student_test_deadline`
--
ALTER TABLE `class_student_test_deadline`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_student_test_logs`
--
ALTER TABLE `class_student_test_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_student_tracking`
--
ALTER TABLE `class_student_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_tests`
--
ALTER TABLE `class_tests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_test_questions`
--
ALTER TABLE `class_test_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `configs`
--
ALTER TABLE `configs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_bank`
--
ALTER TABLE `course_bank`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_clo`
--
ALTER TABLE `course_clo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_clo_contribute`
--
ALTER TABLE `course_clo_contribute`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_config`
--
ALTER TABLE `course_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_form_cc`
--
ALTER TABLE `course_form_cc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_form_comment`
--
ALTER TABLE `course_form_comment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_form_dg`
--
ALTER TABLE `course_form_dg`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_form_duyet`
--
ALTER TABLE `course_form_duyet`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_form_kthp`
--
ALTER TABLE `course_form_kthp`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_form_th_kthp`
--
ALTER TABLE `course_form_th_kthp`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_form_tx`
--
ALTER TABLE `course_form_tx`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_lessons`
--
ALTER TABLE `course_lessons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_lesson_comments`
--
ALTER TABLE `course_lesson_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_lesson_tests`
--
ALTER TABLE `course_lesson_tests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_lesson_test_questions`
--
ALTER TABLE `course_lesson_test_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_metas`
--
ALTER TABLE `course_metas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_muctieu_chitiet`
--
ALTER TABLE `course_muctieu_chitiet`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_plan_activities`
--
ALTER TABLE `course_plan_activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_plan_activity_tuluan`
--
ALTER TABLE `course_plan_activity_tuluan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_plan_activity_tuluan_tieuchicham`
--
ALTER TABLE `course_plan_activity_tuluan_tieuchicham`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_plan_bank`
--
ALTER TABLE `course_plan_bank`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_plan_comment`
--
ALTER TABLE `course_plan_comment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_plan_tuluan_comment`
--
ALTER TABLE `course_plan_tuluan_comment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_questions`
--
ALTER TABLE `course_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_question_comment`
--
ALTER TABLE `course_question_comment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_question_forms`
--
ALTER TABLE `course_question_forms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_question_logs`
--
ALTER TABLE `course_question_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_question_report`
--
ALTER TABLE `course_question_report`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_rate`
--
ALTER TABLE `course_rate`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_testers`
--
ALTER TABLE `course_testers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_tester_results`
--
ALTER TABLE `course_tester_results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_tester_session`
--
ALTER TABLE `course_tester_session`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_thanhvien`
--
ALTER TABLE `course_thanhvien`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ctdt`
--
ALTER TABLE `ctdt`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ctdt_cdr`
--
ALTER TABLE `ctdt_cdr`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ctdt_config`
--
ALTER TABLE `ctdt_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ctdt_hocphan`
--
ALTER TABLE `ctdt_hocphan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ctdt_muctieu_cuthe`
--
ALTER TABLE `ctdt_muctieu_cuthe`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ctdt_tuongthich`
--
ALTER TABLE `ctdt_tuongthich`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_donvi`
--
ALTER TABLE `dm_donvi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `extensions`
--
ALTER TABLE `extensions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `extracurriculars`
--
ALTER TABLE `extracurriculars`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `extracurricular_students`
--
ALTER TABLE `extracurricular_students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `he_dt`
--
ALTER TABLE `he_dt`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hoidong_thamdinh`
--
ALTER TABLE `hoidong_thamdinh`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hoidong_thamdinh_monhoc`
--
ALTER TABLE `hoidong_thamdinh_monhoc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hoidong_thamdinh_monhoc_thanhvien`
--
ALTER TABLE `hoidong_thamdinh_monhoc_thanhvien`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hoidong_thamdinh_thanhvien`
--
ALTER TABLE `hoidong_thamdinh_thanhvien`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `log_student`
--
ALTER TABLE `log_student`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `log_teacher`
--
ALTER TABLE `log_teacher`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mail_track`
--
ALTER TABLE `mail_track`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `media`
--
ALTER TABLE `media`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `media_aws`
--
ALTER TABLE `media_aws`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `media_folder`
--
ALTER TABLE `media_folder`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `media_ftp`
--
ALTER TABLE `media_ftp`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `media_lcms`
--
ALTER TABLE `media_lcms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `nganh_bomon`
--
ALTER TABLE `nganh_bomon`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `options`
--
ALTER TABLE `options`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `partner_students`
--
ALTER TABLE `partner_students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `report_student_activity`
--
ALTER TABLE `report_student_activity`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `room`
--
ALTER TABLE `room`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `room_messages`
--
ALTER TABLE `room_messages`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rpt_class_student_points`
--
ALTER TABLE `rpt_class_student_points`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rpt_class_student_test_cc`
--
ALTER TABLE `rpt_class_student_test_cc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rpt_class_student_test_daugio`
--
ALTER TABLE `rpt_class_student_test_daugio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rpt_class_student_test_tx`
--
ALTER TABLE `rpt_class_student_test_tx`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students_cabiet`
--
ALTER TABLE `students_cabiet`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students_cabiet_activities`
--
ALTER TABLE `students_cabiet_activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_activity`
--
ALTER TABLE `student_activity`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `surveys`
--
ALTER TABLE `surveys`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `survey_participants`
--
ALTER TABLE `survey_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `survey_plans`
--
ALTER TABLE `survey_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `survey_questions`
--
ALTER TABLE `survey_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `survey_question_answers`
--
ALTER TABLE `survey_question_answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sys_version`
--
ALTER TABLE `sys_version`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thi_form`
--
ALTER TABLE `thi_form`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thi_form_details`
--
ALTER TABLE `thi_form_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thi_logs`
--
ALTER TABLE `thi_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thi_question_bank_th`
--
ALTER TABLE `thi_question_bank_th`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thi_question_bank_tn`
--
ALTER TABLE `thi_question_bank_tn`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thi_shifts`
--
ALTER TABLE `thi_shifts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thi_shift_controls`
--
ALTER TABLE `thi_shift_controls`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thi_shift_duan_group`
--
ALTER TABLE `thi_shift_duan_group`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thi_shift_rooms`
--
ALTER TABLE `thi_shift_rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thi_shift_students`
--
ALTER TABLE `thi_shift_students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thi_shift_students_duan`
--
ALTER TABLE `thi_shift_students_duan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thi_shift_student_answers`
--
ALTER TABLE `thi_shift_student_answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `thi_shift_violation`
--
ALTER TABLE `thi_shift_violation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `video_marker`
--
ALTER TABLE `video_marker`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `video_marker_question`
--
ALTER TABLE `video_marker_question`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
