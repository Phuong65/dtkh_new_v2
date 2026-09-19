import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'quan-ly-tai-khoan',
        loadComponent: () => import('@modules/admin/features/he-thong/quan-ly-tai-khoan/quan-ly-tai-khoan.component').then(c => c.QuanLyTaiKhoanComponent),
    },
    {
        path: 'quanly-hocvien',
        loadComponent: () => import('@modules/admin/features/danh-muc-hoc-vien/hoc-vien/hoc-vien.component').then(c => c.HocVienComponent),
    },
    {
        path: 'cai-dat',
        loadComponent: () => import('@modules/admin/features/setting/setting/setting.component').then(c => c.SettingComponent),
    },
    {
        path: 'thong-tin-tai-khoan',
        loadComponent: () => import('@modules/admin/features/he-thong/thong-tin-tai-khoan/thong-tin-tai-khoan.component').then(c => c.ThongTinTaiKhoanComponent),
    },
    {
        path: 'trogiup-kythuat',
        loadComponent: () => import('@modules/admin/features/huongdan/huongdan/huongdan.component').then(c => c.HuongdanComponent),
    },{
        path: 'extensions',
        loadComponent: () => import('@modules/admin/features/he-thong/extensions/extensions.component').then(c => c.ExtensionsComponent),
    },
    {
        path: 'quanly-chuyenmuc',
        loadComponent: () => import('@modules/admin/features/he-thong/quan-ly-chuyen-muc/quan-ly-chuyen-muc.component').then(c => c.QuanLyChuyenMucComponent),
    },{
        path: 'quanly-baiviet',
        loadComponent: () => import('@modules/admin/features/he-thong/quan-ly-bai-viet/quan-ly-bai-viet.component').then(c => c.QuanLyBaiVietComponent),
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class HeThongRoutingModule { }
