import { APP_CONFIGS } from '@env';
import { ChamDiemKiemtraDaugioGuard } from '@modules/admin/features/lop-hoc-phan/class-details/cham-diem-kiemtra-daugio/cham-diem-kiemtra-daugio.guard';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const loadNewCom = APP_CONFIGS.loadNewCom;

const routes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () => import('@modules/admin/features/home/home.component').then(c => c.HomeComponent),
        // loadComponent: () => import('@modules/admin/features/dashboard-dao-tao/dashboard-dao-tao.component').then(c => c.DashboardDaoTaoComponent),
    },
    // {
    //     path: 'chuongtrinh-daotao',
    //     // loadComponent: () => import('@modules/admin/features/quanly-kehoach-hoctap/quanly-kehoach-hoctap/quanly-kehoach-hoctap.component').then(c => c.QuanlyKehoachHoctapComponent),
    //     loadComponent: () => import('@modules/admin/features/chuongtrinh-daotao/chuongtrinh-daotao-manager/chuongtrinh-daotao-manager.component').then(c => c.ChuongtrinhDaotaoManagerComponent),
    // },
    {
        path: 'chuongtrinh-daotao',
        loadChildren: () => import('@modules/admin/features/chuongtrinh-daotao/ctdt.module').then(m => m.CtdtModule)
    },
    {
        path: 'quanly-monhoc',
        loadChildren: () => import('@modules/admin/features/quanly-monhoc/quanly-monhoc.module').then(m => m.QuanlyMonhocModule)
    },
    {
        path: 'kehoach-hoctap',
        // loadComponent: () => import('@modules/admin/features/quanly-kehoach-hoctap/quanly-kehoach-hoctap/quanly-kehoach-hoctap.component').then(c => c.QuanlyKehoachHoctapComponent),
        loadComponent: () => import('@modules/admin/features/quanly-kehoach-hoctap/noidung-hoctap/noidung-hoctap.component').then(c => c.NoidungHoctapComponent),
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
        // loadComponent: () => import('@modules/admin/features/quanly-kehoach-hoctap/formde-tracnghiem/formde-tracnghiem.component').then(c => c.FormdeTracnghiemComponent),
        loadComponent: () => import('@modules/admin/features/quanly-kehoach-hoctap/formde-tracnghiem-v2/formde-tracnghiem-v2.component').then(c => c.FormdeTracnghiemV2Component),
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
        path: 'cauhoi-thuchanh-kthp',
        loadChildren: () => import('@modules/admin/features/cauhoi-thuchanh-kthp/cauhoi-thuchanh-kthp.module').then(m => m.CauhoiThuchanhKTHPModule)
    },
    {
        path: 'cauhoi-thuchanh',
        loadComponent: () => import('@modules/admin/features/cauhoi-thuchanh/cauhoi-ketthuc-hocphan/cauhoi-ketthuc-hocphan.component').then(c => c.CauhoiKetthucHocphanComponent),
    },
    {
        path: 'quanly-noidung-decuong',
        loadComponent: () => import('@modules/admin/features/thongke-solieu-tonghop/quanly-noidung-decuong/quanly-noidung-decuong.component').then(c => c.QuanlyNoidungDecuongComponent),
    },
    {
        path: 'tai-lieu',
        loadComponent: () => import('@modules/admin/features/tailieu/quanly-tailieu/quanly-tailieu.component').then(c => c.QuanlyTailieuComponent),
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
        path: 'dongbo-dulieu',
        loadComponent: () => import('@modules/admin/features/dongbo-dulieu/dongbo-dulieu-main/dongbo-dulieu-main.component').then(c => c.DongboDulieuMainComponent),
        // loadComponent: () => import('@modules/admin/features/dongbo-dulieu/import-hvu/import-hvu-main/import-hvu-main.component').then(c => c.ImportHvuMainComponent),
    },
    {
        path: 'thongbao-giangvien',
        loadComponent: () => import('@modules/admin/features/locked-content/locked-content.component').then(c => c.LockedContentComponent),
        // loadComponent: () => import('@modules/admin/features/thong-bao/thongbao-giangvien/thongbao-giangvien.component').then(c => c.ThongbaoGiangvienComponent),
    },
    {
        path: 'thongbao-sinhvien',
        loadComponent: () => import('@modules/admin/features/locked-content/locked-content.component').then(c => c.LockedContentComponent),
    },
    {
        path: 'khoa',
        loadComponent: () => import('@modules/admin/features/danh-muc/donvi/donvi.component').then(c => c.DonviComponent),
    },
    {
        path: 'nganh',
        loadComponent: () => import('@modules/admin/features/danh-muc/nganh/nganh-bomon.component').then(c => c.NganhBomonComponent),
    },
    {
        path: 'bomon',
        loadComponent: () => import('@modules/admin/features/danh-muc/bomon/nganh-bomon.component').then(c => c.NganhBomonComponent),
    },

    {
        path: 'khoa-lop',
        loadComponent: () => import('@modules/admin/features/cthssv/khoa-lop/khoa-lop.component').then(c => c.KhoaLopComponent),
    },
    {
        path: 'quanly-hocvien',
        loadComponent: () => import('@modules/admin/features/danh-muc-hoc-vien/hoc-vien/hoc-vien.component').then(c => c.HocVienComponent),
    },
    {
        path: 'dongbo-dulieu-sinhvien',
        loadComponent: () => import('@modules/admin/features/dongbo-dulieu/import-sinhvien-main/import-sinhvien-main.component').then(c => c.ImportSinhvienMainComponent),
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DaoTaoRoutingModule { }
