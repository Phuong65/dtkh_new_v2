import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path:  'dashboard',
        loadComponent: () => import('@modules/admin/features/home/home-chunhiem/home-chunhiem.component').then(c => c.HomeChunhiemComponent),
        // loadComponent: () => import('@modules/admin/features/home/home.component').then(c => c.HomeComponent),
    },
    {
        path: 'lop-quanly',
        // loadComponent: () => import('@modules/admin/features/home/home.component').then(c => c.HomeComponent),
        loadComponent: () => import('@modules/admin/features/chu-nhiem/lop-quanly/lop-quanly.component').then(c => c.LopQuanlyComponent),
    },
    {
        path: 'sinhvien-theodoi',
        // loadComponent: () => import('@modules/admin/features/home/home.component').then(c => c.HomeComponent),
        loadComponent: () => import('@modules/admin/features/chu-nhiem/sinhvien-theodoi/sinhvien-theodoi.component').then(c => c.SinhvienTheodoiComponent),
    },
    {
        path: 'thong-bao',
        // loadComponent: () => import('@modules/admin/features/chu-nhiem/thongbao-cho-sv/thongbao-cho-sv.component').then(c => c.ThongbaoChoSvComponent),
        loadComponent: () => import('@modules/admin/features/home/home.component').then(c => c.HomeComponent),

    },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChuNhiemRoutingModule { }
