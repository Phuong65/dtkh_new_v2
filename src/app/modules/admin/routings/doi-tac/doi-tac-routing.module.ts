import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [

    {
        path: 'dashboard',
        loadComponent: () => import('@modules/admin/features/home/home-doi-tac/home-doi-tac.component').then(c => c.HomeDoiTacComponent),
    },
    {
        path: 'taikhoan',
        loadComponent: () => import('@modules/admin/features/doi-tac/taikhoan-doitac/taikhoan-doitac.component').then(c => c.TaikhoanDoitacComponent),
    },
    {
        path: 'phan-sinhvien',
        loadComponent: () => import('@modules/admin/features/doi-tac/phan-sinhvien/phan-sinhvien.component').then(c => c.PhanSinhvienComponent),
    },
    {
        path: 'danhsach-sinhvien',
        loadComponent: () => import('@modules/admin/features/doi-tac/danhsach-sinhvien/danhsach-sinhvien.component').then(c => c.DanhsachSinhvienComponent),
    },
    {
        path: 'sinhvien-nophocphi',
        loadComponent: () => import('@modules/admin/features/locked-content/locked-content.component').then(c => c.LockedContentComponent),
    },
    {
        path: 'thong-bao',
        loadComponent: () => import('@modules/admin/features/doi-tac/thong-bao/thong-bao.component').then(c => c.ThongBaoComponent),
    },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DoiTacRoutingModule { }
