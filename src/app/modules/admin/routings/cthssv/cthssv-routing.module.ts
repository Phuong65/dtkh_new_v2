import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path:  'dashboard',
        loadComponent: () => import('@modules/admin/features/home/home.component').then(c => c.HomeComponent),
    },
    {
        path: 'khoa-lop',
        // loadComponent: () => import('@modules/admin/features/content-none/content-none.component').then(c => c.ContentNoneComponent),
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
    {
        path: 'danhsach-gvcn',
        // loadComponent: () => import('@modules/admin/features/locked-content/locked-content.component').then(c => c.LockedContentComponent),
        loadComponent: () => import('@modules/admin/features/cthssv/danhsach-gvcn/danhsach-gvcn.component').then(c => c.DanhsachGvcnComponent),
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
export class CthssvRoutingModule { }
