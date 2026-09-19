import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContentNoneComponent } from '@modules/admin/features/content-none/content-none.component';
import { DashboardComponent } from '@modules/admin/dashboard/dashboard.component';
import { AdminGuard } from '@core/guards/admin.guard';
// import { HomeComponent } from '@modules/admin/features/home/home.component';
import { HuongdanComponent } from './features/huongdan/huongdan/huongdan.component';
import { DashboardV2Component } from './dashboard/dashboard-v2/dashboard-v2.component';

const routes: Routes = [
    {
        path: '',
        component: DashboardV2Component,
        canActivateChild: [AdminGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'prefix'
            },
            // {
            //     path: 'dashboard',
            //     component: HomeComponent,
            //     data: { state: 'dashboard' }
            // },
            {
                path: 'content-none',
                component: ContentNoneComponent,
                data: { state: 'content-none' }
            },
            {
                path: 'huong-dan',
                component: HuongdanComponent,
                data: { state: 'huong-dan' }
            },
            {
                path: 'giang-vien',
                loadChildren: () => import('@modules/admin/routings/giang-vien/giang-vien.module').then(m => m.GiangVienModule),
            },
            {
                path: 'chu-nhiem',
                loadChildren: () => import('@modules/admin/routings/chu-nhiem/chu-nhiem.module').then(m => m.ChuNhiemModule),
            },
            {
                path: 'khao-thi',
                loadChildren: () => import('@modules/admin/routings/khao-thi/khao-thi.module').then(m => m.KhaoThiModule),
            },
            {
                path: 'dao-tao',
                loadChildren: () => import('@modules/admin/routings/dao-tao/dao-tao.module').then(m => m.DaoTaoModule),
            },
            {
                path: 'cthssv',
                loadChildren: () => import('@modules/admin/routings/cthssv/cthssv.module').then(m => m.CthssvModule),
            },
            {
                path: 'lanhdao-khoa',
                loadChildren: () => import('@modules/admin/routings/lanhdao-khoa/lanhdao-khoa.module').then(m => m.LanhdaoKhoaModule),
            },
            {
                path: 'lanhdao-bomon',
                loadChildren: () => import('@modules/admin/routings/lanhdao-bomon/lanhdao-bomon.module').then(m => m.LanhdaoBomonModule),
            },
            {
                path: 'hoi-dong',
                loadChildren: () => import('@modules/admin/routings/hoi-dong/hoi-dong.module').then(m => m.HoiDongModule),
            },
            {
                path: 'bao-cao',
                loadChildren: () => import('@modules/admin/routings/bao-cao/bao-cao.module').then(m => m.BaoCaoModule)
            },
            {
                path: 'bgh',
                loadChildren: () => import('@modules/admin/routings/bgh/bgh.module').then(m => m.BghModule)
            },
            {
                path: 'lanhdao-truong',
                loadChildren: () => import('@modules/admin/routings/admin/admin.module').then(m => m.AdminModule)
            },
            {
                path: 'he-thong',
                loadChildren: () => import('@modules/admin/routings/he-thong/he-thong.module').then(m => m.HeThongModule)
            },
            {
                path: 'doi-tac',
                loadChildren: () => import('@modules/admin/routings/doi-tac/doi-tac.module').then(m => m.DoiTacModule)
            },
            {
                path: 'thong-bao',
                loadChildren: () => import('@modules/admin/routings/thong-bao/thong-bao.module').then(m => m.ThongBaoModule)
            },
            {
                path: 'khao-sat',
                loadChildren: () => import('@modules/admin/routings/khao-sat/khao-sat.module').then(m => m.KhaoSatModule)
            },
            {
                path: '**',
                redirectTo: '/admin/content-none',
                pathMatch: 'prefix'
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }
