import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () => import('@modules/admin/features/home/home.component').then(c => c.HomeComponent),
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
export class BghRoutingModule { }
