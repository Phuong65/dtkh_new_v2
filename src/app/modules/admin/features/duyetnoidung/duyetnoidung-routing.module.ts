import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '@core/guards/admin.guard';

const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('@modules/admin/features/duyetnoidung/duyetnoidung-router-outlet/duyetnoidung-router-outlet.component').then(c => c.DuyetnoidungRouterOutletComponent),
        canActivateChild: [AdminGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('@modules/admin/features/duyetnoidung/duyetnoidung-manager/duyetnoidung-manager.component').then(c => c.DuyetnoidungManagerComponent),
            },
            {
                path: 'celo',
                loadComponent: () => import('@modules/admin/features/duyetnoidung/duyet-celo/duyet-celo.component').then(c => c.DuyetCeloComponent),
            },
            {
                path: 'baigiang',
                loadComponent: () => import('@modules/admin/features/duyetnoidung/duyet-baigiang/duyet-baigiang.component').then(c => c.DuyetBaigiangComponent),
            },
            {
                path: 'cauhoi',
                loadComponent: () => import('@modules/admin/features/duyetnoidung/duyet-cauhoi/duyet-cauhoi.component').then(c => c.DuyetCauhoiComponent),
            },
            {
                path: 'duyet-cauhoi-tn-detail/:questionId',
                loadComponent: () => import('@modules/admin/features/duyetnoidung/duyet-cauhoi-tn-detail/duyet-cauhoi-tn-detail.component').then(c => c.DuyetCauhoiTnDetailComponent),
            },
            {
                path: 'duyet-thuongxuyen-duan-detail/:tuluanId',
                loadComponent: () => import('@modules/admin/features/duyetnoidung/duyet-thuongxuyen-duan-detail/duyet-thuongxuyen-duan-detail.component').then(c => c.DuyetThuongxuyenDuanDetailComponent),
            },
            {
                path: 'duyet-thuongxuyen-tuluan-detail/:tuluanId',
                loadComponent: () => import('@modules/admin/features/duyetnoidung/duyet-thuongxuyen-tuluan-detail/duyet-thuongxuyen-tuluan-detail.component').then(c => c.DuyetThuongxuyenTuluanDetailComponent),
            },
            {
                path: 'duyet-cauhoi-thuchanh-kthp-detail/:tuluanId',
                loadComponent: () => import('@modules/admin/features/duyetnoidung/duyet-cauhoi-thuchanh-kthp-detail/duyet-cauhoi-thuchanh-kthp-detail.component').then(c => c.DuyetCauhoiThuchanhKthpDetailComponent),
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DuyetnoidungRoutingModule { }
