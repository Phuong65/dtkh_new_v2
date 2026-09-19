import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '@core/guards/admin.guard';

const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('@modules/admin/features/quanly-hoidong/hd-thamdinh-router-outlet/hd-thamdinh-router-outlet.component').then(c => c.HdThamdinhRouterOutletComponent),
        canActivateChild: [AdminGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('@modules/admin/features/quanly-hoidong/hd-thamdinh-manager/hd-thamdinh-manager.component').then(c => c.HdThamdinhManagerComponent),
            },
            {
                path: 'hoidong-thanhvien',
                loadComponent: () => import('@modules/admin/features/quanly-hoidong/hd-thamdinh-thanhvien/hd-thamdinh-thanhvien.component').then(c => c.HdThamdinhThanhvienComponent),
            },
            {
                path: 'hoidong-monhoc',
                loadComponent: () => import('@modules/admin/features/quanly-hoidong/hd-thamdinh-monhoc/hd-thamdinh-monhoc.component').then(c => c.HdThamdinhMonhocComponent),
            },
            {
                path: 'hoidong-info',
                loadComponent: () => import('@modules/admin/features/quanly-hoidong/hd-thamdinh-info/hd-thamdinh-info.component').then(c => c.HdThamdinhInfoComponent),
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class HoidongThamdinhRoutingModule { }
