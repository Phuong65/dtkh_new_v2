
import { url_servers } from './api-servers/lcms-ictu-2-1';
const key = url_servers;
export const environment = {
    production: true,

    ketServer: {
        api: key.ketServer_api,
    },

    thikhacServer: {
        api: key.thikhacServer_api,
    },

    driveFolders: {
        appData: {
            id: key.driveFolders_id,
            children: {
                lectureData: { id: key.lectureData_id },
                studentData: { id: key.studentData_id },
                driveImage: { id: key.driveImage_id },
                driveVideo: { id: key.driveVideo_id }
            }
        }
    },
};

const realm = key.realm;
// const host = ['h', 't', 't', 'p', 's', ':', '/', '/', 'a', 'p', 'i', '-', 'd', 'e', 'v', '.', 'i', 'c', 't', 'u', '.', 'v', 'n'];
// const port = '10091';
// const port_socket = '10092';
// const ws_url = ['w', 's', 's', ':', '/', '/', 'a', 'p', 'i', '-', 'd', 'e', 'v', '.', 'i', 'c', 't', 'u', '.', 'v', 'n'];


// const port = '9081';
// const port_socket = '9082';
// const host = ['h', 't', 't', 'p', 's', ':', '/', '/', 'd', 't', 't', 'x', '.', 'i', 'c', 't', 'u', '.', 'e', 'd', 'u', '.', 'v', 'n'];
// const ws_url = ['w', 's', 's', ':', '/', '/', 'd', 't', 't', 'x', '.', 'i', 'c', 't', 'u', '.', 'e', 'd', 'u', '.', 'v', 'n'];

// const port = '10091';
// const port_socket = '10092';
// const host = ['https://giangvien.tueba.edu.vn'];
// const ws_url = ['wss://', 'giangvien.tueba.edu.vn'];

/** Đại học CNTT */
const port = key.port;
const port_socket = key.port_socket;
const host = key.host;
const ws_url = key.ws_url;

export const key_server = key.key_server;
export const getHost = (): string => host.join('');
export const getRoute = (route: string): string => [].concat(host, [':', port, '/', realm, '/api/', route]).join('');
export const getLinkDrive = (id: string = null): string => [].concat(host, [':', port, '/', realm, '/api/driver/', id]).join('');
export const getLinkMedia = (name_or_id: string): string => [].concat(host, [':', port, '/', realm, '/api/uploads/', name_or_id || '']).join('');
export const getFileDir = (): string => [].concat(host, [':', port, '/', realm, '/api/uploads/folder/']).join('');
export const getLinkDownload = (name_or_id: string): string => [].concat(host, [':', port, '/', realm, '/api/uploads/file/', name_or_id || '']).join('');
export const getWsUrl = (): string => ws_url.join('') + ':' + port_socket;
export const wsPath = '/sso/socket';
export const getLinkMedia_aws = (name_or_id: string): string => [].concat(host, [':', port, '/', realm, '/api/aws/', name_or_id || '']).join('');
export const getLinkDownload_aws = (name_or_id: string): string => [].concat(host, [':', port, '/', realm, '/api/aws/file/', name_or_id || '']).join('');

export const getRoute_tuyensinh = (route: string): string => [].concat(host, [':', port, '/dttx/api/', route]).join('');
export const getLinkMedia_tuyensinh = (name_or_id: string): string => [].concat(host, [':', port, '/', realm, '/api/dttx-uploads/', name_or_id || '']).join('');
export const getLinkDownload_tuyensinh = (name_or_id: string): string => [].concat(host, [':', port, '/', realm, '/api/dttx-uploads/file/', name_or_id || '']).join('');
export const getRoute_city = (route: string): string => [].concat(host, [':', port, '/sso/api/', route]).join('');
export const getDateTime = (route: string): string => [].concat(host, [':', port, '/', route]).join('');

const acceptFileType = [
    'application/doc',
    'application/ms-doc',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/excel',
    'application/vnd.ms-excel',
    'application/x-excel',
    'application/x-msexcel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/mspowerpoint',
    'application/powerpoint',
    'application/vnd.ms-powerpoint',
    'application/x-mspowerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/pdf',
    'application/zip',
    'application/x-rar-compressed',
    'application/octet-stream',
    'application/x-zip-compressed',
    'multipart/x-zip',
    'audio/mpeg',
    'image/jpeg',
    'image/png',
    'video/mp4',
    'text/plain',
    'video/quicktime',
    'video/x-quicktime',
    'image/mov',
    'audio/aiff',
    'audio/x-midi',
    'audio/x-wav',
    'video/avi'
];

const appLanguages = [
    { name: 'vn', label: 'Tiếng việt' },
    { name: 'en', label: 'English' }
];

const appDefaultLanguage = { name: 'vn', label: 'Tiếng việt' };

const appVersion = key.appVersion;

export const APP_CONFIGS = {
    defaultRedirect: '/admin/giang-vien/dashboard',
    pageTitle: key.pageTitle,
    //pageTitle: '[LCMS] - Hệ thống quản lý học tập trực tuyến, Trường Đại học Kinh tế và Quản trị kinh doanh',
    multiLanguage: true,
    defaultLanguage: appDefaultLanguage, // không được bỏ trống trường này ngay cả khi multiLanguage = false
    languages: appLanguages,
    realm: 'lcms', // app realm
    dateStart: '09/2020', // 06/2020
    maxUploadSize: 3221225472, // (1024 * 1024 * 200) = 800mb
    maxFileUploading: 10, // The maximum number of files allowed to upload per time
    donvi_id: 1, // default donvi id
    coreVersion: '2.0.0',
    appVersion: appVersion,
    pingTime: 30, // unit seconds
    storeLabels: ['Server File', 'ICTU Drive'],
    metaKeyStore: '__store_dir',
    metaKeyLanguage: '__language',
    showHttpInterceptorError: false,
    limitFileType: false,
    info_console: true,
    project_name: `LCMS V${appVersion}`,
    author: 'OvicSoft',
    bg_color_01: '#008060',
    bg_color_02: '#4959bd',
    acceptList: acceptFileType,
    cloudStorage: '1mkWmS69qTh_7uoS_wpKDju7OdHLSkA1y', //driveFolder id
    lectureCloudStorage: '1Gwx6F72HUgM6ZDxonsvj8zLySGB6AYLJ',
    teacherCloudStorage: '1YZwbEC_OBOTg6OyzvWXMWqxJI63dehH6',
    soundAlert: true,
    video_marker: key.video_marker,
    donviquanly: key.donviquanly,
    donvitructhuoc: key.donvitructhuoc,
    class_main: key.class_main,
    file_server: key.file_server,
    title: key.title,
    domain: key.domain,
    codeByLvl: key.codeByLvl,
    unlimitLesson: key.unlimitLesson,
    newTestThuchanh: key.newTestThuchanh,
    dragDropLesson: key.dragDropLesson,
    isDttx: key.isDttx,
    loadNewCom: key.loadNewCom,
    no_test_question: key.no_test_question
};

/* define menu filter */
export const HIDDEN_MENUS = new Set(['message/notification-details']); // id của menu không muốn hiển thị
export const USER_KEY = 'D&GruMeY';
export const EXPIRED_KEY = 'gnDkfwIh';
export const UCASE_KEY = 'zUfnyEzV';
export const ROLES_KEY = 'MzgdGEAR';
export const META_KEY = 'c*G9*7FV';
export const ACCESS_TOKEN = 'kx5T83$)';
export const REFRESH_TOKEN = 'pbT+7@^6';
export const ENCRYPT_KEY = 'L4Jg$^9M';
export const APP_STORES = 'DC(4F@EP'; // no clear after logout
export const SWITCH_DONVI_ID = '+F4dwv)%'; // no clear after logout
export const PASS_ROOMS = '0YxMOl1Y';
// export const X_APP_ID        = '770c9094-b556-4713-83be-ad5b600fb1cb'; // domain : vbcc.ictu.vn
export const X_APP_ID = key.X_APP_ID;
//'4447F86F-65B6-48A0-96A1-EB843806D49A';
//'8CBFCBAC-E0FD-4315-AB5A-AB6B8E588EAB';lcms.ictu.edu.vn
//'7AA76A7E-5BDE-40AE-A0FE-F85CFA0C2BE2'//
//'7AA76A7E-5BDE-40AE-A0FE-F85CFA0C2BE2 // lcms.tueba.edu.vn
//'848DCEC2-9A2B-4B8D-A9D4-26A799DAB6FF'// giangvien.tueba.edu.vn
//'D5006F80-F239-4FBD-9D48-91EE3B1ECFD0'// dttx.ictu.vn;
//'6BA4CC42-6C77-4A5D-A025-5655299C6475'//betalcms.ictu.vn;
//; ////;//'A64262D9-37CB-4926-8B78-5315B46B1750'; // domain : vbcc.tnu.edu.vn
// export const X_APP_ID = 'FA3D8DB6-8B75-43BA-A73C-3540EE55F55B'; // for desktop
export const META_KEY_DRIVE = '__store_dir';
export const CLOUD_STORAGE_KEY = '__QmuEG_9UQ5674';
export const MENU_ACTIVITY = '_menu_activity';
interface AgencyOption {
    id: number,
    name: string,
    logo: string,
    sign: string, // ký hiệu
}

export const AGENCIES: AgencyOption[] = [
    { id: 1, name: 'Trường Đại học Công nghệ thông tin và Truyền thông', logo: 'logo1.png', sign: 'ictu' },
    { id: 60, name: 'Trường Đại học Sư phạm Thái Nguyên', logo: 'logo60.png', sign: 'tnue' },
    { id: 61, name: 'Trường Đại học Y dược', logo: 'logo61.png', sign: 'tump' },
    { id: 62, name: 'Trường Đại học Nông Lâm', logo: 'logo62.png', sign: 'tuaf' },
    { id: 63, name: 'Trường Đại học Khoa hoc', logo: 'logo63.png', sign: 'tnus' },
    { id: 64, name: 'Trường Đại học Kinh tế và QTKD', logo: 'logo64.png', sign: 'tueba' },
    { id: 66, name: 'Trường Đại học Kỹ thuật Công nghiệp', logo: 'logo66.png', sign: 'tnut' },
    { id: 70, name: 'Trường Cao đẳng Kinh tế Kỹ thuật', logo: 'logo70.png', sign: 'tec' },
    { id: 67, name: 'Trường Ngoại ngữ', logo: 'logo67.png', sign: 'sfl' },
    { id: 65, name: 'Khoa Quốc tế', logo: 'logo65.png', sign: 'iss' },
    { id: 68, name: 'Phân hiệu ĐHTN tại Lào Cai', logo: 'logo68.png', sign: 'tnul' },
    { id: 69, name: 'Phân hiệu ĐHTN tại Hà Giang', logo: 'logo69.png', sign: 'tnuh' },
    { id: 71, name: 'Trung tâm Giáo dục Quốc phòng và An ninh', logo: 'logo71.png', sign: 'gdqp' },
    { id: 72, name: 'Trung tâm Khảo thí và Quản lý chất lượng Giáo dục', logo: 'logo72.png', sign: 'tceq' },
    { id: 73, name: 'Trung tâm Đào tạo từ xa', logo: 'logo73.png', sign: 'dttx' },
    { id: 74, name: 'Trung tâm Số', logo: 'logo74.png', sign: 'tts' }
];

export const ACCEPT_ROUTER = [
    'ctdt-chitiet',
    'ctdt-noidung',
    'ctdt-thongtin',
    'ctdt-muctieu',
    'ctdt-doingu',
    'ctdt-cauhinh',
    'ctdt-cdr',
    'monhoc-thongtin',
    'monhoc-muctieu',
    'monhoc-noidung',
    'monhoc-question-cdr',
    'monhoc-question-cd',
    'monhoc-kiemtra-danhgia',
    'monhoc-formde',
    'monhoc-cauhinh',
    'hoidong-thanhvien',
    'hoidong-monhoc',
    'hoidong-info',
    'baigiang',
    'celo',
    'cauhoi',
    'danhsach-cauhoi',
    'de-thuchanh',
    'form-th-kthp',
    'class-details',
    'chitiet-kehoach',
    'chuandaura',
    'chitiet',
    'phongthi',
    'phongthi-duan',
    'clo',
    'class-details/room-test',
    'phanbo-cdr-cauhoi',
    'form-de',
    'class-details/kt-daugio',
    'class-details/chambai-15p',
    'class-details/kt-tuluan-15p',
    'cauhoi-tracnghiem-chitiet',
    'duyetnoidung/duyet-cauhoi-tn-detail',
    'survey-info',
    'survey-question',
    'survey-plan-info',
    'survey-plan-question',
    'survey-plan-setting',
];

export const ENABLE_SELECT_AGENCY = true; // hiển thị thanh chọn đơn vị ở trang tra cứu
export const google_client_id = key.google_client_id//'973389896263-11sa03rtspsn2fap5uo160l3opa7n62t.apps.googleusercontent.com';///'370352596447-qoehacvhc49lpf6hp2nsllqqkbd078ri.apps.googleusercontent.com''370352596447-qoehacvhc49lpf6hp2nsllqqkbd078ri.apps.googleusercontent.com';//'973389896263-11sa03rtspsn2fap5uo160l3opa7n62t.apps.googleusercontent.com';///'370352596447-qoehacvhc49lpf6hp2nsllqqkbd078ri.apps.googleusercontent.com';
