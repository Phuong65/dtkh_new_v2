import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '@core/guards/admin.guard';

const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('@modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-manager/cauhoi-tracnghiem-manager.component').then(c => c.CauhoiTracnghiemManagerComponent),
        canActivateChild: [AdminGuard],
    },
    {
        path: 'cauhoi-tracnghiem-chitiet',
        loadComponent: () => import('@modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-chitiet/cauhoi-tracnghiem-chitiet.component').then(c => c.CauhoiTracnghiemChitietComponent),
        canActivateChild: [AdminGuard],
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class CauhoiTracnghiemRoutingModule { }
