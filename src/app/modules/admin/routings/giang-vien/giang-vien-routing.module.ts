import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { APP_CONFIGS } from '@env';
import { ChamDiemKiemtraDaugioGuard } from '@modules/admin/features/lop-hoc-phan/class-details/cham-diem-kiemtra-daugio/cham-diem-kiemtra-daugio.guard';

const loadNewCom = APP_CONFIGS.loadNewCom;

const routes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () => import('@modules/admin/features/home/home-giangvien/home-giangvien.component').then(c => c.HomeGiangvienComponent),
        // loadComponent: () => import('@modules/admin/features/home/home-chunhiem/home-chunhiem.component').then(c => c.HomeChunhiemComponent),
    },
    {
        path: 'lich-giang-day',
        loadComponent: () => import('@modules/admin/features/lich-giang-day/lich-giang-day/lich-giang-day.component').then(c => c.LichGiangDayComponent),
    },
    {
        path: 'lop-hoc-phan',
        // loadComponent: () => import('@modules/admin/features/lop-hoc-phan/quanly-lophocphan/quanly-lophocphan.component').then(c => c.QuanlyLophocphanComponent),
        loadComponent: () => import('@modules/admin/features/lop-hoc-phan/quanly-lophocphan-v2/quanly-lophocphan-v2.component').then(c => c.QuanlyLophocphanV2Component),
    },
    {
        path: 'lop-hoc-phan/class-details',
        loadComponent: () => import('@modules/admin/features/lop-hoc-phan/class-details/manage-class-details/manage-class-details.component').then(c => c.ManageClassDetailsComponent),
    },
    {
        path: 'lop-hoc-phan/class-details/room-test',
        loadComponent: () => import('@modules/admin/features/lop-hoc-phan/class-details/thuongxuyen-tracnghiem/thuongxuyen-tracnghiem.component').then(c => c.ThuongxuyenTracnghiemComponent),
    },
    {
        path: 'lop-hoc-phan/class-details/kt-daugio',
        loadComponent: () => import('@modules/admin/features/lop-hoc-phan/class-details/theodoi-kiemtra-daugio/theodoi-kiemtra-daugio.component').then(c => c.TheodoiKiemtraDaugioComponent),
    },
    {
        path: 'lop-hoc-phan/class-details/chambai-15p',
        loadComponent: () => import('@modules/admin/features/lop-hoc-phan/class-details/cham-diem-kiemtra-daugio/cham-diem-kiemtra-daugio.component').then(c => c.ChamDiemKiemtraDaugioComponent),
        canDeactivate: [ChamDiemKiemtraDaugioGuard]
    },
    {
        path: 'lop-hoc-phan/class-details/kt-tuluan-15p',
        loadComponent: () => import('@modules/admin/features/lop-hoc-phan/class-details/theodoi-kiemtra-tuluan15p/theodoi-kiemtra-tuluan15p.component').then(c => c.TheodoiKiemtraTuluan15pComponent),
    },
    {
        path: 'tai-lieu',
        loadComponent: () => import('@modules/admin/features/tailieu/quanly-tailieu/quanly-tailieu.component').then(c => c.QuanlyTailieuComponent),
    },
    {
        path: 'kehoach-hoctap',
        // loadComponent: () => import('@modules/admin/features/quanly-kehoach-hoctap/quanly-kehoach-hoctap/quanly-kehoach-hoctap.component').then(c => c.QuanlyKehoachHoctapComponent),
        loadComponent: () => import('@modules/admin/features/quanly-kehoach-hoctap/noidung-hoctap/noidung-hoctap.component').then(c => c.NoidungHoctapComponent),
    },
    {
        path: 'quanly-monhoc',
        loadChildren: () => import('@modules/admin/features/quanly-monhoc/quanly-monhoc.module').then(m => m.QuanlyMonhocModule)
    },
    {
        path: 'kehoach-hoctap/chitiet-kehoach',
        loadComponent: () => import('@modules/admin/features/quanly-kehoach-hoctap/kehoach/kehoach.component').then(c => c.KehoachComponent),
    },
    {
        path: 'kehoach-hoctap/phanbo-cdr-cauhoi',
        loadComponent: () => import('@modules/admin/features/quanly-kehoach-hoctap/phanbo-cdr-cauhoi/phanbo-cdr-cauhoi.component').then(c => c.PhanboCdrCauhoiComponent),
    },
    {
        path: 'kehoach-hoctap/form-de',
        loadComponent: () => import('@modules/admin/features/quanly-kehoach-hoctap/formde-tracnghiem-v2/formde-tracnghiem-v2.component').then(c => c.FormdeTracnghiemV2Component),
        // loadComponent: () => import('@modules/admin/features/quanly-kehoach-hoctap/formde-tracnghiem/formde-tracnghiem.component').then(c => c.FormdeTracnghiemComponent),
    },
    {
        path: 'cauhoi-tracnghiem',
        // loadComponent: () => import('@modules/admin/features/cauhoi-tracnghiem/topical-question-bank/topical-question-bank.component').then(c => c.TopicalQuestionBankComponent),
        ...(loadNewCom
            ? { loadChildren: () => import('@modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem.module').then(m => m.CauhoiTracnghiemModule) }
            : { loadComponent: () => import('@modules/admin/features/cauhoi-tracnghiem/topical-question-bank-v2/topical-question-bank-v2.component').then(c => c.TopicalQuestionBankV2Component) }
        )
    },
    {
        path: 'import-cauhoi-tracnghiem',
        loadComponent: () => import('@modules/admin/features/Import-cauhoi-tracnghiem/import-cauhoi-tn-main/import-cauhoi-tn-main.component').then(c => c.ImportCauhoiTnMainComponent),
    },
    {
        path: 'cauhoi-thuchanh',
        loadComponent: () => import('@modules/admin/features/cauhoi-thuchanh/cauhoi-ketthuc-hocphan/cauhoi-ketthuc-hocphan.component').then(c => c.CauhoiKetthucHocphanComponent),
    },
    {
        path: 'cauhoi-thuchanh-kthp',
        loadChildren: () => import('@modules/admin/features/cauhoi-thuchanh-kthp/cauhoi-thuchanh-kthp.module').then(m => m.CauhoiThuchanhKTHPModule)
    },
    {
        path: 'giang-vien-test',
        loadComponent: () => import('@modules/admin/features/cauhoi-tracnghiem/giang-vien-test/giang-vien-test.component').then(c => c.GiangVienTestComponent),
    },
    {
        path: 'traloi-sinhvien',
        loadComponent: () => import('@modules/admin/features/locked-content/locked-content.component').then(c => c.LockedContentComponent),
    },
    {
        path: 'thongbao-sinhvien',
        loadComponent: () => import('@modules/admin/features/locked-content/locked-content.component').then(c => c.LockedContentComponent),
    },
    {
        path: 'thong-tin-tai-khoan',
        loadComponent: () => import('@modules/admin/features/he-thong/thong-tin-tai-khoan/thong-tin-tai-khoan.component').then(c => c.ThongTinTaiKhoanComponent),
    },
    {
        path: 'trogiup-kythuat',
        loadComponent: () => import('@modules/admin/features/locked-content/locked-content.component').then(c => c.LockedContentComponent),
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class GiangVienRoutingModule { }
