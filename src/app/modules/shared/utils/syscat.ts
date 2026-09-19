import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { APP_CONFIGS, key_server } from '@env';

export const FULL_SIZE_MODAL_OPTIONS = {
    scrollable: true,
    size: 'xl',
    windowClass: 'modal-xxl ovic-modal-class ovic-modal-full-size',
    centered: true
};

export const MAXIMIZE_MODAL_OPTIONS: any = {
    scrollable: true,
    size: 'xl',
    windowClass: 'modal-maximize ovic-modal-class',
    centered: true
};

export const WAITING_POPUP: any = {
    scrollable: true,
    size: 'xl',
    windowClass: 'modal-xxl ovic-modal-class',
    centered: true,
    backdrop: 'static',
};

export const LARGE_MODAL_OPTIONS: any = {
    scrollable: true,
    size: 'xl',
    windowClass: 'modal-xxl ovic-modal-class',
    centered: true
};

export const DEFAULT_MODAL_OPTIONS: any = {
    size: 'lg',
    backdrop: 'static',
    centered: true,
    windowClass: 'ovic-modal-class'
};

export const NORMAL_MODAL_OPTIONS: any = {
    size: 'md',
    backdrop: 'static',
    centered: true,
    windowClass: 'ovic-modal-class'
};

export const NORMAL_MODAL_OPTIONS_ROUND: any = {
    size: 'md',
    backdrop: 'static',
    centered: true,
    windowClass: 'ovic-modal-class ovic-modal--rounded'
};

export const SM_MODAL_OPTIONS: any = {
    size: 'sm',
    backdrop: 'static',
    centered: true,
    windowClass: 'ovic-modal-class'
};

export const DEFAULT_MODAL_OPTIONS_NO_BACKDROP: any = {
    size: 'lg',
    centered: true,
    windowClass: 'ovic-modal-class'
};

export const KEY_ANSWER_new = {
    0: 'A',
    1: 'B',
    2: 'C',
    3: 'D',
    4: 'E',
    5: 'F',
    6: 'G',
    7: 'H',
    8: 'I',
    9: 'J',
    10: 'K',
    11: 'L',
    12: 'M',
    13: 'N',
    14: 'O',
    15: 'P',
    16: 'Q',
    17: 'R',
    18: 'S',
    19: 'T',
    20: 'U',
    21: 'V',
    22: 'W',
    23: 'X',
    24: 'Y',
    25: 'Z'
};

export const PointRead = {
    0: 'Không',
    1: 'Một',
    2: 'Hai',
    3: 'Ba',
    4: 'Bốn',
    5: 'Năm',
    6: 'Sáu',
    7: 'Bảy',
    8: 'Tám',
    9: 'Chín',
    10: 'Mười'
}

export const DanToc = [
    { name: 'kinh', label: 'Kinh' },
    { name: 'tay', label: 'Tày' },
    { name: 'thai', label: 'Thái' },
    { name: 'muong', label: 'Mường' },
    { name: 'nung', label: 'Nùng' },
    { name: 'dao', label: 'Dao' },
    { name: 'h-mong', label: 'H\'mông' },
    { name: 'khmer', label: 'Khmer' },
    { name: 'gia-rai', label: 'Gia Rai' },
    { name: 'ede', label: 'Ê Đê' },
    { name: 'bana', label: 'Ba Na' },
    { name: 'xo-dang', label: 'Xơ Đăng' },
    { name: 'san-chay', label: 'Sán Chay' },
    { name: 'co-ho', label: 'Cơ Ho' },
    { name: 'hoa', label: 'Hoa' },
    { name: 'cham', label: 'Chăm' },
    { name: 'san-diu', label: 'Sán Dìu' },
    { name: 'tho', label: 'Thổ' },
    { name: 'hre', label: 'Hrê' },
    { name: 'ra-gia', label: 'Ra Glai' },
    { name: 'm-nong', label: 'M\'Nông' },
    { name: 'x-tieng', label: 'X\'Tiêng' },
    { name: 'bru-van-kieu', label: 'Bru-Vân Kiều' },
    { name: 'kho-mu', label: 'Khơ Mú' },
    { name: 'co-tu', label: 'Cơ Tu' },
    { name: 'giay', label: 'Giáy' },
    { name: 'gie-trieng', label: 'Giẻ Triêng' },
    { name: 'ta-oi', label: 'Tà Ôi' },
    { name: 'ma', label: 'Mạ' },
    { name: 'co', label: 'Co' },
    { name: 'cho-ro', label: 'Chơ Ro' },
    { name: 'xinh-mun', label: 'Xinh Mun' },
    { name: 'ha-nhi', label: 'Hà Nhì' },
    { name: 'chu-ru', label: 'Chu Ru' },
    { name: 'lao', label: 'Lào' },
    { name: 'khang', label: 'Kháng' },
    { name: 'la-chi', label: 'La Chí' },
    { name: 'phu-la', label: 'Phù Lá' },
    { name: 'la-hu', label: 'La Hủ' },
    { name: 'la-ha', label: 'La Ha' },
    { name: 'pa-then', label: 'Pà Thẻn' },
    { name: 'chut', label: 'Chứt' },
    { name: 'lu', label: 'Lự' },
    { name: 'lo-lo', label: 'Lô Lô' },
    { name: 'mang', label: 'Mảng' },
    { name: 'co-lao', label: 'Cờ Lao' },
    { name: 'bo-y', label: 'Bố Y' },
    { name: 'cong', label: 'Cống' },
    { name: 'ngay', label: 'Ngái' },
    { name: 'si-la', label: 'Si La' },
    { name: 'pu-peo', label: 'Pu Péo' },
    { name: 'ro-mam', label: 'Rơ măm' },
    { name: 'brau', label: 'Brâu' },
    { name: 'o-du', label: 'Ơ Đu' }
];

export const TonGiaoVietNam = [
    { name: 'khong', label: 'Không' },
    { name: 'phat-giao', label: 'Phật giáo' },
    { name: 'hoi-giao', label: 'Hồi giáo' },
    { name: 'bahai', label: 'Bahai' },
    { name: 'cong-giao', label: 'Công giáo' },
    { name: 'tin-lanh', label: 'Tin lành' },
    { name: 'mac-mon', label: 'Mặc môn' },
    { name: 'phat-giao-hoa-hao', label: 'Phật giáo Hòa Hảo' },
    { name: 'cao-dai', label: 'Cao Đài' },
    { name: 'buu-son-ky-huong', label: 'Bửu Sơn Kỳ Hương' },
    { name: 'tinh-do-cu-si-phat-hoi', label: 'Tịnh Độ Cư Sĩ Phật Hội' },
    { name: 'tu-an-hieu-nghia', label: 'Tứ Ân Hiếu Nghĩa' },
    { name: 'phat-duong-nam-tong-minh-su-dao', label: 'Phật Đường Nam Tông Minh Sư Đạo' },
    { name: 'minh-ly-dao-tam-tong-mieu', label: 'Minh Lý Đạo Tam Tông Miếu' },
    { name: 'ba-la-mon-kho-me', label: 'Bà la môn Khơ me' },
    { name: 'phat-giao-hieu-nghia-ta-lon', label: 'Phật giáo Hiếu Nghĩa Tà Lơn' }
];

export const FileType = new Map([
    ['application/vnd.google-apps.folder', 'folder'],
    ['audio/mpeg', 'mp3'],
    ['audio/mp3', 'mp3'],
    ['audio/x-aac', 'x-aac'],
    ['application/zip', 'zip'],
    ['application/x-zip-compressed', 'zip'],
    ['application/x-rar-compressed', 'rar'],
    ['application/x-7z-compressed', 'zip'],
    ['application/msword', 'doc'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
    ['application/vnd.ms-powerpoint', 'ppt'],
    ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'pptx'],
    ['application/vnd.ms-excel', 'xls'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
    ['application/vnd.google-apps.spreadsheet', 'xlsx'],
    ['application/pdf', 'pdf'],
    ['video/x-msvideo', 'video'],
    ['video/mp4', 'mp4'],
    ['image/png', 'img'],
    ['image/jpeg', 'img'],
    ['image/jpg', 'img'],
    ['image/gif', 'img'],
    ['text/plain', 'text']
]);


export const AppValidators = {
    arrayInput: {
        needInputAtLeast: (length: number): ValidatorFn => (control: AbstractControl): ValidationErrors | null => (control.value && Array.isArray(control.value) && control.value.length >= length) ? null : { notValidLength: 'content does not meet the minimum content requirements' }
    }
};

export const GENDER = [
    { label: 'Nam', value: 'nam', key: 'Nam' },
    { label: 'Nữ', value: 'nu', key: 'Nữ' },
];

export const VIDEO_SOURCE = [
    { name: 'Youtube', key: 'youtube' },
    { name: 'Server Files', key: 'serverFile' }
];
export const MEDIA_TYPE = [
    { name: 'Audio', key: 'audio' },
    { name: 'Video', key: 'video' },
];
export const KEY_ANSWER = [
    { key: 'A' },
    { key: 'B' },
    { key: 'C' },
    { key: 'D' },
    { key: 'E' },
    { key: 'F' },
    { key: 'G' },
    { key: 'H' },
    { key: 'I' },
    { key: 'J' },
    { key: 'K' },
    { key: 'L' },
    { key: 'M' },
    { key: 'N' },
    { key: 'O' },
    { key: 'P' },
    { key: 'Q' },
    { key: 'R' },
    { key: 'S' },
    { key: 'T' },
    { key: 'U' },
    { key: 'V' },
    { key: 'W' },
    { key: 'X' },
    { key: 'Y' },
    { key: 'Z' }
];

export const TYPE_TEST = [
    { label: 'Chọn một phương án đúng dạng ABC', value: 'radio', src: 'radio-test-ex.png' },
    { label: 'Chọn một phương án đúng dạng SELECTBOX', value: 'selectbox', src: 'selectbox-test-ex.PNG' },
    { label: 'Chọn nhiều phương án đúng dạng CHECKBOX', value: 'checkbox', src: 'selectbox-test-ex.PNG' },
    { label: 'Nhập phương án đúng', value: 'inputbox', src: 'inputbox-test-ex.png' },
];
export const CONFIG_TEST = [ //ở trước còn code 0 cho đảo đáp án, và code 1 cho đảo câu hỏi trong setting config
    { label: 'Đảo câu hỏi', check: false, code: 'invertedQuestion' },
    { label: 'Đảo đáp án', check: false, code: 'invertedAnswer' },
    { label: 'Hiển thị gợi ý', check: false, code: 'showHint' },
    { label: 'Hiển thị giải thích đáp án', check: false, code: 'showExplain' },
    { label: 'Hiển thị đáp án', check: false, code: 'showAnswer' },
];
export const CONFIG_TEST_LESSON = {
    invertedQuestion: 0,
    invertedAnswer: 0,
    showHint: 0,
    showExplain: 0,
    showAnswer: 0,
    numberQuestion: 0,
    percentComplete: 80,
    maxTestTimes: null,
};

export const OvicVideoSourceObject = {
    local: 'local',
    serverFile: 'serverFile',
    vimeo: 'vimeo',
    youtube: 'youtube',
    googleDrive: 'googleDrive',
    encrypted: 'encrypted',
    serverAws: 'serverAws'
};

export function getMenuClass() {
    let menu = [
        { label: 'Thông tin lớp học', icon: 'fa fa-angle-right', id: 'thong-tin-lop-hoc', buttonAddLabel: '', buttonIcon: 'pi pi-plus-circle' },
        { label: 'Thông tin giảng viên khác', icon: 'fa fa-angle-right', id: 'tro-giang', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        { label: 'Sinh viên', icon: 'fa fa-angle-right', id: 'hoc-vien', buttonAddLabel: 'Import Sinh viên', buttonIcon: 'pi pi-upload' },
        { label: 'Danh sách nhóm', icon: 'fa fa-angle-right', id: 'class-group', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        // { label: 'Lịch học zoom', icon: 'fa fa-angle-right', id: 'lop-hoc-ao', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        // { label: 'Thảo luận', icon: 'fa fa-angle-right', id: 'thao-luan', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        // { label: 'Bài kiểm tra tự luận', icon: 'fa fa-angle-right', id: 'giao-bai-tap', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        // { label: 'Kiểm tra trắc nghiệm', icon: 'fa fa-angle-right', id: 'kiem-tra', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        { label: 'Nội dung giảng dạy', icon: 'fa fa-angle-right', id: 'kehoach-hoctap', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        { label: 'Kiểm tra 15 phút', icon: 'fa fa-angle-right', id: 'kiemtra-daugio', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        { label: 'Kiểm tra thường xuyên', icon: 'fa fa-angle-right', id: 'kiemtra-kynang', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        { label: 'Sinh viên chậm tiến độ', icon: 'fa fa-angle-right', id: 'theo-doi-tien-do', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        { label: 'Hỏi đáp', icon: 'fa fa-angle-right', id: 'hoidap', buttonAddLabel: 'Hỏi đáp', buttonIcon: 'pi pi-plus-circle' },
        { label: 'Gửi thông báo', icon: 'fa fa-angle-right', id: 'gui-email', buttonAddLabel: 'Gửi email', buttonIcon: 'pi pi-plus-circle' },
        { label: 'Bảng điểm danh', icon: 'fa fa-angle-right', id: 'diemdanh', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        // { label: 'Điểm bài tập bổ trợ', icon: 'fa fa-angle-right', id: 'baitap-botro', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        { label: 'Điểm thường xuyên', icon: 'fa fa-angle-right', id: 'diem', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        // { label: 'Tài liệu', icon: 'fa fa-angle-right', id: 'tai-lieu', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        // { label: 'Thống kê tương tác', icon: 'fa fa-angle-right', id: 'thongke-tuongtac', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
        // { label: 'Tiến trình' },
    ];

    if (APP_CONFIGS.isDttx) {
        menu = [
            { label: 'Thông tin lớp học', icon: 'fa fa-angle-right', id: 'thong-tin-lop-hoc', buttonAddLabel: '', buttonIcon: 'pi pi-plus-circle' },
            { label: 'Thông tin giảng viên khác', icon: 'fa fa-angle-right', id: 'tro-giang', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            { label: 'Sinh viên', icon: 'fa fa-angle-right', id: 'hoc-vien', buttonAddLabel: 'Import Sinh viên', buttonIcon: 'pi pi-upload' },
            { label: 'Danh sách nhóm', icon: 'fa fa-angle-right', id: 'class-group', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            // { label: 'Lịch học zoom', icon: 'fa fa-angle-right', id: 'lop-hoc-ao', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            // { label: 'Thảo luận', icon: 'fa fa-angle-right', id: 'thao-luan', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            // { label: 'Bài kiểm tra tự luận', icon: 'fa fa-angle-right', id: 'giao-bai-tap', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            // { label: 'Kiểm tra trắc nghiệm', icon: 'fa fa-angle-right', id: 'kiem-tra', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            { label: 'Nội dung giảng dạy', icon: 'fa fa-angle-right', id: 'kehoach-hoctap', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            // { label: 'Kiểm tra 15 phút', icon: 'fa fa-angle-right', id: 'kiemtra-daugio', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            { label: 'Thảo luận', icon: 'fa fa-comments-o', id: 'thaoluan', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            { label: 'Kiểm tra giữa kì', icon: 'fa fa-angle-right', id: 'kiemtra-kynang', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            { label: 'Sinh viên chậm tiến độ', icon: 'fa fa-angle-right', id: 'theo-doi-tien-do', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            { label: 'Hỏi đáp', icon: 'fa fa-angle-right', id: 'hoidap', buttonAddLabel: 'Hỏi đáp', buttonIcon: 'pi pi-plus-circle' },
            { label: 'Gửi thông báo', icon: 'fa fa-angle-right', id: 'gui-email', buttonAddLabel: 'Gửi email', buttonIcon: 'pi pi-plus-circle' },
            { label: 'Bảng điểm danh', icon: 'fa fa-angle-right', id: 'diemdanh', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            // { label: 'Điểm bài tập bổ trợ', icon: 'fa fa-angle-right', id: 'baitap-botro', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            { label: 'Bảng điểm', icon: 'fa fa-angle-right', id: 'diem', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            // { label: 'Tài liệu', icon: 'fa fa-angle-right', id: 'tai-lieu', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            // { label: 'Thống kê tương tác', icon: 'fa fa-angle-right', id: 'thongke-tuongtac', buttonAddLabel: 'Thêm mới', buttonIcon: 'pi pi-plus-circle' },
            // { label: 'Tiến trình' },
        ];
    }

    return menu;
}

export const settingOwnClass_1 = getMenuClass();



export const NORMAL_STATUS = [
    { label: 'Không kích hoạt', value: '0' },
    { label: 'Kích hoạt', value: '1' },
];
export const KHOI_KIEN_THUC = [
    { "label": "Giáo dục đại cương", "value": "GIAODUC_DAICUONG" },
    { "label": "Cơ sở - nhóm ngành", "value": "COSO_NHOMNGANH" },
    { "label": "Chuyên ngành", "value": "CHUYENNGANH" },
    { "label": "Thực tập và tốt nghiệp", "value": "THUCTAP_TOTNGHIEP" },
    { "label": "Môn tự chọn", "value": "TUCHON" },
];

export const TYPE_OF_RETURN = [
    { label: 'Theo từng sinh viên', value: 'SINGLE' },
    { label: 'Theo từng nhóm', value: 'GROUP' },
];

export const VBTN = [
    { value: 'THPT', label: 'THPT' },
    { value: 'BTVH', label: 'BTVH' },
];

export const VBCM = [
    { value: 'THCN', label: 'Trung cấp' },
    { value: 'Cao đẳng', label: 'Cao đẳng' },
    { value: 'Đại học', label: 'Đại học' },
];

export const TH_XETTUYEN = [
    { label: 'Chờ duyệt', kyhieu: 'KHOI_TAO', value: 0, status_key: 'XET_TUYEN', content: false, admin: false, show: false },
    { label: 'Hồ sơ chưa đủ, cần bổ sung', kyhieu: 'THIEU_HOSO', value: 1, status_key: 'XET_TUYEN', content: true, admin: false, show: true },
    { label: 'Đã duyệt, chờ kết quả xét tuyển', kyhieu: 'CHOKQ_XET_TUYEN', value: 2, status_key: 'XET_TUYEN', content: false, admin: false, show: true },
    { label: 'Trúng tuyển', kyhieu: 'TRUNG_TUYEN', value: 3, status_key: 'XET_TUYEN', content: false, admin: true, show: true },
    { label: 'Không trúng tuyển', kyhieu: 'KHONG_TRUNG_TUYEN', value: -1, status_key: 'XET_TUYEN', content: true, admin: true, show: true },
    { label: 'Chưa nhập học', kyhieu: 'CHUA_NHAP_HOC', value: 4, status_key: 'NHAP_HOC', content: false, admin: true, show: true },
    { label: 'Đã nhập học, chưa hoàn thành thủ tục nhập học', kyhieu: 'NHAP_HOC_THIEU', value: 5, status_key: 'NHAP_HOC', content: true, admin: true, show: true },
    { label: 'Đã hoàn thành thủ tục nhập học', kyhieu: 'NHAP_HOC_OK', value: 6, status_key: 'NHAP_HOC', content: false, admin: true, show: true },
]

export const TITLE_ANH = {
    anh_thpt: 'ảnh THPT',
    anh_the: 'ảnh thẻ',
    anh_cmnd_truoc: 'ảnh CCCD trước',
    anh_cmnd_sau: 'ảnh CCCD sau',
    anh_hoc_ba: 'ảnh học bạ',
}

export const NORMAL_MODAL_OPTIONS_FOLDER: any = {
    size: 'md folder_creater',
    backdrop: 'static',
    centered: true,
    windowClass: 'ovic-modal-class'
};

export const STATUS_IMPORT = [
    { label: 'Thành công' },
    { label: 'Thất bại' },
    { label: 'Đã có' },
    { label: 'Trùng lặp' },
    { label: 'Chưa import' }
];

export const STATUS_IMPORT_USER = [
    { label: 'Thành công' },
    { label: 'Thất bại' },
    { label: 'Đã có' },
    { label: 'Trùng lặp' },
    { label: 'Email không hợp lệ', option_label: 'false_email' },
    { label: 'Mật khẩu không hợp lệ', option_label: 'false_password' },
    { label: 'Chưa import' }
];

export const STATUS_IMPORT_STUDENT_CLASS = [
    { label: 'Không có lớp hp' },
    { label: 'Chưa có tài khoản' },
    { label: 'Lỗi đường truyền' },
    { label: 'Thành công' },
    { label: 'Thất bại' },
    { label: 'Đã có' },
    { label: 'Trùng lặp' },
    { label: 'Chưa import' }
];

export const STATUS_IMPORT_CLASS = [
    { label: 'Tổng lớp', key: 'sum_data' },
    { label: ' - Lớp TH', key: 'class_th' },
    { label: ' - Lớp LT', key: 'class_lt' },
    { label: 'Lớp đã tồn tại trên hệ thống', key: 'exist' },
    { label: 'Import thành công', key: 'done' },
    { label: 'Import thất bại', key: 'failed' },
    { label: 'Chưa import', key: 'not_import' },
    { label: 'Lớp giảng viên chưa có tài khoản', key: 'no_teacher' },
    { label: 'Lớp không xác định được khoa', key: 'no_category' },
];

export const STATUS_IMPORT_ONE_STUDENT = [
    { label: 'Tổng sinh viên', key: 'sum_data' },
    { label: 'Sinh viên đã có trong lớp', key: 'exist' },
    { label: 'Import thành công', key: 'done' },
    { label: 'Import thất bại', key: 'failed' },
    { label: 'Chưa import', key: 'not_import' },
    { label: 'Sinh viên chưa có tài khoản', key: 'no_data' },
];

export const OB_STATUS_IMPORT_ONE_STUDENT = {
    sum_data: 'Tổng sinh viên',
    exist: 'Đã có trong lớp',
    done: 'Thành công',
    failed: 'Thất bại',
    not_import: 'Chưa import',
    no_data: 'Chưa có tài khoản'
}


export const TYPE_COURSE_QUEST = [
    { label: 'Môn khác', key: 'monkhac', label_name: 'Không', label_: 'Môn khác' },
    { label: 'Tiếng anh', key: 'tienganh', label_name: 'Có', label_: 'Tiếng anh' }
]

export const SKILL_TEST_TOTAL = [
    { label: 'Nghe', value: 'listening' },
    { label: 'Đọc', value: 'reading' },
    // { label: 'Nói', value: 'speaking' },
    // { label: 'Viết', value: 'writing' },
];

export const DIEMDANH = [
    { label: 'Có phép', value: 'P' },
    { label: 'Không phép', value: 'K' },
    { label: 'Muộn ', value: 'M' },
    // { label: 'Nói', value: 'speaking' },
    // { label: 'Viết', value: 'writing' },
];
export const LOAIPHEP = {
    P: 'P',
    K: 'K',
    M: 'M',
}

export const TYPE_FILE_LIST = {
    docx: 'docx',
    pptx: 'pptx',
    ppt: 'ppt',
    pdf: 'pdf',
    xlsx: 'xlsx',
    audio: 'audio',
    video: 'video',
    image: 'image',
    text: 'text',
    zip: 'zip'
}

export const OFFICE_SUPORT_FILE = {
    ppt: 'ppt',
    pptx: 'pptx',
    doc: 'doc',
    docx: 'docx',
    xls: 'xls',
    xlsx: 'xlsx',
    video: 'video',
    audio: 'audio',
    image: 'image',
    pdf: 'pdf'
}

export const LESSON_KEY_LOG = {
    'lesson-video-end': 1,
    'lesson-video-play': 1,
    'lesson-video-pause': 1,
    'lesson-video-lost-focus': 1,
    'lesson-completed': 1.5,
    'lesson-open': 1.5,
    'lesson-test-start': 2,
    'lesson-test-lost-focus': 2,
    'lesson-test-re-focus': 2,
    'lesson-test-submit': 2,
    'lesson-download-lecture': 3,
    'lesson-open-lecture': 3,
    'lesson-open-course-attachments': 4,
    'lesson-open-course-outline': 4,



}


export const ST_LESSON_KEY = {
    1: { video: '', source: '', type: '' },
    2: { lesson: '' },
    3: { file: '', type: '', source: '' },
    4: { course: '' }
}

export const CLASS_ANWSER_COLS = {
    1: '',
    2: 'item-per-row-2',
    3: 'item-per-row-3',
    4: 'item-per-row-4'
}

export const CONTENT_LESSON_TYPE = [
    { key: 'LESSON', label: 'Bài giảng', image: '\\assets\\images\\content-type\\online-lesson.png', title: 'Tiêu đề bài giảng' },
    // { key: 'VIDEO', label: 'Video', image: '\\assets\\images\\content-type\\online-video.png', title: 'Tiêu đề bài giảng dạng video' },
    // { key: 'FILES', label: 'Tệp tin pdf', image: '\\assets\\images\\content-type\\pdf.png', title: 'Tiêu đề bài giảng dạng tệp đính kèm(pdf)' },
    { key: 'TEST', label: 'Bài kiểm tra', image: '\\assets\\images\\content-type\\online-test.png', title: 'Tiêu đề bài kiểm tra' }
]

export const TITLE_LESSOn_TYPE = {
    'LESSON': 'Tiêu đề bài giảng',
    'TEST': 'Tiêu đề bài kiểm tra'
}


export const CONTENT_ACTIVITY_TYPE = [
    { key: 'ACTIVITY', label: 'Bài giảng lý thuyết', image: '\\assets\\images\\content-type\\online-lesson.png', title: 'Tiêu đề bài giảng lý thuyết' },
    // { key: 'ACTIVITY_TEST', label: 'Kiểm tra trắc nghiệm', image: '\\assets\\images\\content-type\\online-test.png', title: 'Tiêu đề bài kiểm tra trắc nghiệm (trên máy)' },
    // { key: 'OFFLINE_TEST', label: 'Kiểm tra tự luận', image: '\\assets\\images\\content-type\\offline-test.png', title: 'Tiêu đề bài kiểm tra tự luận (offline trên lớp)' },
    { key: 'MEET', label: 'Zoom/Goole meet', image: '\\assets\\images\\content-type\\zoom.png', title: 'Tiêu đề hoạt động' },
    // { key: 'ACTIVITY_CDR', label: 'Chuẩn đầu ra', image: '\\assets\\images\\content-type\\cdr.png', title: 'Chuẩn đầu ra' },
]

export const CONTENT_ACTIVITY_TYPE_CLASS = [
    { key: 'ACTIVITY', label: 'Bài giảng lý thuyết', image: '\\assets\\images\\content-type\\online-lesson.png', title: 'Tiêu đề bài giảng lý thuyết' },
    { key: 'MEET', label: 'Zoom/Goole meet', image: '\\assets\\images\\content-type\\zoom.png', title: 'Tiêu đề hoạt động' }
]

export const TITLE_ACTIVITY_TYPE = {
    'ACTIVITY': 'Tiêu đề bài giảng lý thuyết',
    'ACTIVITY_TEST': 'Tiêu đề bài kiểm tra trắc nghiệm (trên máy)',
    'OFFLINE_TEST': 'Tiêu đề bài kiểm tra tự luận (offline trên lớp)',
    'MEET': 'Tiêu đề Zoom/ Google meet',
    'ACTIVITY_CDR': 'Tiêu đề chuẩn đầu ra',
}

export const BANK_TYPE = [
    { key: 'CHUYENDE', label: 'Chuyên đề', url: 'nganhang-cauhoi/baitap-chuyende' },
    { key: 'THUONGXUYEN', label: 'Thường xuyên', url: 'nganhang-cauhoi/kiemtra-thuongxuyen' },
    { key: 'THI', label: 'Thi', url: 'nganhang-cauhoi/thiketthuc-hocphan' }
]

export const CHUAN_DAU_RA = [
    { id: 1, label: 'Biết', disabled: false, isActive: true },
    { id: 2, label: 'Hiểu', disabled: false, isActive: false },
    { id: 3, label: 'Vận dụng', disabled: false, isActive: false },
    { id: 4, label: 'Phân tích', disabled: false, isActive: false },
    { id: 5, label: 'Đánh giá', disabled: false, isActive: false },
    { id: 6, label: 'Sáng tạo', disabled: false, isActive: false },
]


export const THUONGXUYEN_TEST_TYPE = [
    { key: 'THUONGXUYEN_TRACNGHIEM', label: 'Trắc nghiệm' },
    { key: 'THUONGXUYEN_TULUAN', label: 'Thực hành, Tự Luận, Vấn đáp, Vẽ' },
    { key: 'THUONGXUYEN_DUAN', label: 'Đồ án, Dự án, Báo cáo, Tiểu luận' },
]

export function getTestType() {
    let exam = [
        { id: 'et_1', key: 'THUONGXUYEN_TRACNGHIEM', label: 'Trắc nghiệm' },
        { id: 'et_2', key: 'THUONGXUYEN_TULUAN', label: 'Thực hành' },
        { id: 'et_3', key: 'THUONGXUYEN_TULUAN', label: 'Tự Luận' },
        { id: 'et_4', key: 'THUONGXUYEN_TULUAN', label: 'Vấn đáp' },
        { id: 'et_5', key: 'THUONGXUYEN_TULUAN', label: 'Vẽ' },
        { id: 'et_7', key: 'THUONGXUYEN_DUAN', label: 'Dự án' },
        { id: 'et_8', key: 'THUONGXUYEN_DUAN', label: 'Báo cáo' },
        { id: 'et_9', key: 'THUONGXUYEN_DUAN', label: 'Tiểu luận' },
    ];

    switch (key_server) {
        case 'hvu':
            exam = [
                { id: 'et_1', key: 'THUONGXUYEN_TRACNGHIEM', label: 'Trắc nghiệm' },
                { id: 'et_2', key: 'THUONGXUYEN_TULUAN', label: 'Thực hành' },
                { id: 'et_4', key: 'THUONGXUYEN_DUAN', label: 'Bài tập lớn' },
            ];
            break;
        default:
            break;
    }

    return exam;
}


export const TYPE_TEST_MONKHAC = [
    { id: 1, key: 'grouping', label: 'Câu hỏi kéo thả đáp án vào cột tương ứng' },
    { id: 2, key: 'drag_drop', label: 'Câu hỏi nhóm kéo thả đáp án đúng' },
    { id: 3, key: 'radio', label: 'Chọn 1 đáp án đúng' },
    { id: 4, key: 'checkbox', label: 'Chọn nhiều đáp án đúng' },
    { id: 5, key: 'group-radio', label: 'Nhóm câu hỏi chọn đáp án Đúng - Sai' },
    { id: 6, key: 'group-input', label: 'Nhóm câu hỏi nhập đáp án' },
]


export const TYPE_TEST_ANHVAN = [
    { id: 7, key: 'inputbox', label: 'Matching 2 vế' },
    { id: 8, key: 'inputbox', label: 'Nhập vào đáp án đúng' },
    { id: 9, key: 'drag_drop', label: 'Drag-drop' },
    { id: 10, key: 'reorder_words', label: 'Sắp xếp lại câu' },
    { id: 11, key: 'radio', label: 'Chọn 1 đáp án đúng' },
]


export const CONVERT_TYPE_TEST = {
    SCHEDULED: 'THUONGXUYEN',
    ADDITIONAL: 'CHUYENDE'
}

export const PHUONGPHAP_DANGDAY = [
    { key: 'lecture', label: 'Dạy lý thuyết(Lecture)' },
    { key: 'tutorial', label: 'Hướng dẫn làm bài tập(Tutorial)' },
    { key: 'project_based_learning', label: 'Hướng dẫn làm project(Project-based Learning)' },
    { key: 'lab_work', label: 'Thực hành trong phòng thí nghiệm(Lab Work)' },
    { key: 'group_discussion_seminar', label: 'Thảo luận nhóm(Group Discussion / Seminar)' },
    { key: 'research_based_learning', label: 'Học tập qua nghiên cứu(Research - based Learning)' },
    { key: 'blended_learning', label: 'Học tập kết hợp(Blended Learning)' },
    { key: 'case_study_method', label: 'Học tập theo tình huống(Case Study Method)' },
    { key: 'guest_lectures', label: 'Diễn giả khách mời(Guest Lectures)' },
    { key: 'internship_co_op_programs', label: 'Học tập thông qua công việc thực tế(Internship / Co - op Programs)' },
    { key: 'service_learning', label: 'Học tập theo mô hình thực tế(Service Learning)' },
    { key: 'peer_teaching_tutoring', label: 'Thảo luận đồng đẳng(Peer Teaching / Tutoring)' },
    { key: 'edutainment', label: 'Học tập qua giải trí(Edutainment)' },
    { key: 'feedback_based_learning', label: 'Học tập qua phản hồi(Feedback - based Learning)' },
    { key: 'field_trips', label: 'Tham quan thực tế(Field Trips)' },
    { key: 'self_directed_learning', label: 'Học tập tự định hướng(Self - directed Learning)' },
]

export const HOIDONGDUYET = {
    cap_khoa: 'Cấp khoa',
    cap_truong: 'Cấp trường'
}

export const ROLES = {
    admin: "admin",
    manager: "truong_ld",
    lanhdaokhoa: "khoa_ld",
    lanhdaobomon: "bomon_ld",
    duyetbaigiang: "duyetbaigiang",
    troly_pdt: "daotao_troly",
    giangvien: "teacher",
    trogiang: "supporter",
    chuyenvien_pdt: "daotao_ld",
    kiemduyet_hoidong: "kd_hoidong",
    kiemduyet_uyvien: "kd_uyvien",
    phanquyen_taokehoach: "lapkehoach_quyen",
    hoidongthi_lanhdao: "khaothi_ld",
    hoidongthi_chutich: "khaothi_hdthi_chutich",
    hoidongthi_thuky: "khaothi_hdthi_thuky",
    hoidongthi_qlct: "khaothi_hdthi_qlct",
    phong_hssv: "cthssv_ld",
    student: "student",
    daotao_cv_1: "daotao_cv_1",
    doitac: 'doi-tac',
}

export const ROUTERS = {
    giangvien: 'giang-vien',
    chunhiem: 'chu-nhiem',
    khaothi: 'khao-thi',
    daotao: 'dao-tao',
    cthssv: 'cthssv',
    lanhdao_khoa: 'lanhdao-khoa',
    hoidong: 'hoi-dong',
    baocao: 'bao-cao',
    bgh: 'bgh',
    admin: 'lanhdao-truong',
    lanhdao_bomon: 'lanhdao-bomon',
    doi_tac: 'doi-tac',
}

export const CHAM_DIEM_TULUAN_TX = [
    { percent: 0, label: 'F', position: 20, color: 'red' },
    { percent: 40, label: 'D', position: 47.5, color: 'orange' },
    { percent: 55, label: 'C', position: 62.5, color: 'yellow' },
    { percent: 70, label: 'B', position: 77.5, color: '#1da750' },
    { percent: 85, label: 'A', position: 92.5, color: '#3b82f6' },
]

export const DANHHIEU_TOTNGHIEP = [
    { key: 'CN', label: 'Cử nhân', disabled: false },
    { key: 'KS', label: 'Kỹ sư', disabled: false },
    { key: 'TS', label: 'Thạc sỹ', disabled: false }
]

export const HOIDONG_STATUS = [
    { key: 0, label: 'Đang thiết lập', disabled: false },
    { key: 1, label: 'Đang thực hiện', disabled: false },
    { key: 2, label: 'Đã hoàn thành', disabled: false },
]

export const DINHDANG_BAITRACNGHIEM = [
    { key: 1, label: 'Form 1 - Ngoại ngữ', disabled: false },
    { key: 2, label: 'Form 2 - Toán', disabled: false },
    { key: 0, label: 'Các môn khác', disabled: false },
]

export const TYPE_HOIDONG = [
    { value: 'celo', label: 'CPI/Bài giảng', disabled: false },
    { value: 'cauhoi', label: 'Câu hỏi/Đề', disabled: false },
]
// export const FILTER_NOIDUNGBAI = [
//     { key: 'MUCTIEU', label: 'Mục tiêu' },
//     { key: 'CDR', label: 'Nội dung' },
//     { key: 'TAILIEUTHAMKHAO', label: 'Tài liệu tham khảo' },
//     { key: 'CDR', label: 'Tài liệu tham khảo' }
// ]


// this.auth.logAction('lesson-video-end', { video: video.path, source: video.source, type: video.type });
// this.auth.logAction('lesson-completed', { lesson: lesson_id, type: lesson.type, actor: ('user' | 'system'), func: (actor === 'user' ? 'click-by-yourself' : 'process'), track: track.id });
// this.auth.logAction('lesson-download-lecture', { file: file.path, type: file.type, source: file.source });
// this.auth.logAction('lesson-open-lecture', { file: file.path, type: file.type, source: file.source });
// this.auth.logAction('lesson-open-course-attachments', { course: course.id });
// this.auth.logAction('lesson-open-course-outline', { course: course.id });
// this.auth.logAction('lesson-open', { lesson: lesson.id, type: lesson.type });


// this.reportAction('lesson-video-play', { video: video.path, source: video.source, type: video.type })
// this.reportAction('lesson-video-pause', { video: video.path, source: video.source, type: video.type })
// this.reportAction('lesson-video-lost-focus', { video: video.path, source: video.source, type: video.type });



// this.reportAction('lesson-test-start', { lesson: lesson.id, test: lessonTest.id, testType: lessonTest.type.toLowerCase() });
// this.reportAction('lesson-test-lost-focus', { lesson: lesson.id, test: lessonTest.id, testType: lessonTest.type.toLowerCase() })
// this.reportAction('lesson-test-re-focus', { lesson: lesson.id, test: lessonTest.id, testType: lessonTest.type.toLowerCase() })
// this.reportAction('lesson-test-submit', { lesson: lesson.id, test: lessonTest.id, testType: lessonTest.type.toLowerCase(), actor: ('user' | 'system'), reason: (actor === 'user' ? 'submit' : 'expired time'), func: (actor === 'user' ? 'click-by-yourself' : 'process') });
