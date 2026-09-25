import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '@core/guards/admin.guard';

const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('@modules/admin/features/cauhoi-thuchanh-kthp/cauhoi-thuchanh-kthp-router-outlet/cauhoi-thuchanh-kthp-router-outlet.component').then(c => c.CauhoiThuchanhKthpRouterOutletComponent),
        canActivateChild: [AdminGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                loadComponent: () => import('@modules/admin/features/cauhoi-thuchanh/cauhoi-ketthuc-hocphan/cauhoi-ketthuc-hocphan.component').then(c => c.CauhoiKetthucHocphanComponent),
            },
            {
                path: 'form-th-kthp',
                loadComponent: () => import('@modules/admin/features/cauhoi-thuchanh-kthp/form-de-th-kthp/form-de-th-kthp.component').then(c => c.FormDeThKthpComponent),
            },
            {
                path: 'danhsach-cauhoi',
                loadComponent: () => import('@modules/admin/features/cauhoi-thuchanh-kthp/cauhoi-thuchanh/cauhoi-thuchanh.component').then(c => c.CauhoiThuchanhComponent),
            },
            {
                path: 'de-thuchanh',
                loadComponent: () => import('@modules/admin/features/cauhoi-thuchanh-kthp/de-thuchanh/de-thuchanh.component').then(c => c.DeThuchanhComponent),
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class CauhoiThuchanhKTHPRoutingModule { }
