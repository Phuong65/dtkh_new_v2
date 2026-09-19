import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'dashboard',
        // loadComponent: () => import('@modules/admin/features/home/home.component').then(c => c.HomeComponent),
        loadComponent: () => import('@modules/admin/features/thongke-hoidong-nghiemthu/thongke-hoidong-nghiemthu.component').then(c => c.ThongkeHoidongNghiemthuComponent),
    },
    {
        path: 'duyetnoidung-hoctap',
        loadComponent: () => import('@modules/admin/features/quanly-duyetnoidung-hoctap/quanly-duyetnoidung-hoctap-v2/quanly-duyetnoidung-hoctap-v2.component').then(c => c.QuanlyDuyetnoidungHoctapV2Component),
    },
    {
        path: 'duyetnoidung-hoctap-captruong',
        loadComponent: () => import('@modules/admin/features/quanly-duyetnoidung-captruong/quanly-duyetnoidung-hoctap-v2/quanly-duyetnoidung-hoctap-v2.component').then(c => c.QuanlyDuyetnoidungHoctapV2Component),
    },
    {
        path: 'thong-tin-tai-khoan',
        loadComponent: () => import('@modules/admin/features/he-thong/thong-tin-tai-khoan/thong-tin-tai-khoan.component').then(c => c.ThongTinTaiKhoanComponent),
    },
    {
        path: 'trogiup-kythuat',
        loadComponent: () => import('@modules/admin/features/locked-content/locked-content.component').then(c => c.LockedContentComponent),
    },
    {
        path: 'thamdinh-celo',
        loadChildren: () => import('@modules/admin/features/quanly-hoidong/hoidong-thamdinh.module').then(m => m.HoidongThamdinhModule)
    },
    {
        path: 'thamdinh-noidung',
        loadChildren: () => import('@modules/admin/features/quanly-hoidong/hoidong-thamdinh.module').then(m => m.HoidongThamdinhModule)
    },
    {
        path: 'thamdinh-cauhoi',
        loadChildren: () => import('@modules/admin/features/quanly-hoidong/hoidong-thamdinh.module').then(m => m.HoidongThamdinhModule)
    },
    {
        path: 'duyetnoidung',
        loadChildren: () => import('@modules/admin/features/duyetnoidung/duyetnoidung.module').then(m => m.DuyetnoidungModule)
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class HoiDongRoutingModule { }
