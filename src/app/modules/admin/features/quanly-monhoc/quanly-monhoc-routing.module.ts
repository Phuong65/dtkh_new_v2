import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '@core/guards/admin.guard';

const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('@modules/admin/features/quanly-monhoc/quanly-monhoc-router-outlet/quanly-monhoc-router-outlet.component').then(c => c.QuanlyMonhocRouterOutletComponent),
        canActivateChild: [AdminGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('@modules/admin/features/quanly-monhoc/danhsach-monhoc/danhsach-monhoc.component').then(c => c.DanhsachMonhocComponent),
            },
            {
                path: 'monhoc-thongtin',
                loadComponent: () => import('@modules/admin/features/quanly-monhoc/monhoc-thongtin/monhoc-thongtin.component').then(c => c.MonhocThongtinComponent),
            },
            {
                path: 'monhoc-muctieu',
                loadComponent: () => import('@modules/admin/features/quanly-monhoc/monhoc-muctieu-cdr/monhoc-muctieu-cdr.component').then(c => c.MonhocMuctieuCdrComponent),
            },
            {
                path: 'monhoc-noidung',
                loadComponent: () => import('@modules/admin/features/quanly-monhoc/monhoc-noidung/monhoc-noidung.component').then(c => c.MonhocNoidungComponent),
            },
            {
                path: 'monhoc-question-cdr',
                loadComponent: () => import('@modules/admin/features/quanly-monhoc/monhoc-question-cdr/monhoc-question-cdr.component').then(c => c.MonhocQuestionCdrComponent),
            },
            {
                path: 'monhoc-question-cd',
                loadComponent: () => import('@modules/admin/features/quanly-monhoc/monhoc-question-cdr/monhoc-question-cdr.component').then(c => c.MonhocQuestionCdrComponent),
            },
            {
                path: 'monhoc-kiemtra-danhgia',
                loadComponent: () => import('@modules/admin/features/quanly-monhoc/monhoc-kiemtra-danhgia/monhoc-kiemtra-danhgia.component').then(c => c.MonhocKiemtraDanhgiaComponent),
            },
            {
                path: 'monhoc-formde',
                loadComponent: () => import('@modules/admin/features/quanly-monhoc/monhoc-formde/monhoc-formde.component').then(c => c.MonhocFormdeComponent),
            },
            {
                path: 'monhoc-cauhinh',
                loadComponent: () => import('@modules/admin/features/quanly-monhoc/monhoc-cauhinh/monhoc-cauhinh.component').then(c => c.MonhocCauhinhComponent),
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class QuanlyMonhocRoutingModule { }
