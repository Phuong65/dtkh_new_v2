import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '@core/guards/admin.guard';
import { NgModule } from '@angular/core';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('@modules/admin/features/chuongtrinh-daotao/chitiet-ctdt/chitiet-ctdt.component').then(c => c.ChitietCtdtComponent),
        canActivateChild: [AdminGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('@modules/admin/features/chuongtrinh-daotao/chuongtrinh-daotao-manager/chuongtrinh-daotao-manager.component').then(c => c.ChuongtrinhDaotaoManagerComponent),
            },
            {
                path: 'ctdt-thongtin',
                loadComponent: () => import('@modules/admin/features/chuongtrinh-daotao/ctdt-thongtin/ctdt-thongtin.component').then(c => c.CtdtThongtinComponent),
            },
            {
                path: 'ctdt-muctieu',
                loadComponent: () => import('@modules/admin/features/chuongtrinh-daotao/ctdt-muctieu-cdr/ctdt-muctieu-cdr.component').then(c => c.CtdtMuctieuCdrComponent),
            },
            {
                path: 'ctdt-doingu',
                loadComponent: () => import('@modules/admin/features/chuongtrinh-daotao/ctdt-doingu/ctdt-doingu.component').then(c => c.CtdtDoinguComponent),
            },
            {
                path: 'ctdt-cauhinh',
                loadComponent: () => import('@modules/admin/features/chuongtrinh-daotao/ctdt-cauhinh/ctdt-cauhinh.component').then(c => c.CtdtCauhinhComponent),
            },
            {
                path: 'ctdt-noidung',
                loadComponent: () => import('@modules/admin/features/chuongtrinh-daotao/ctdt-noidung/ctdt-noidung.component').then(m => m.CtdtNoidungComponent),
            },
            {
                path: 'ctdt-cdr',
                loadComponent: () => import('@modules/admin/features/chuongtrinh-daotao/ctdt-cdr/ctdt-cdr.component').then(m => m.CtdtCdrComponent),
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class CtdtRoutersModule { }