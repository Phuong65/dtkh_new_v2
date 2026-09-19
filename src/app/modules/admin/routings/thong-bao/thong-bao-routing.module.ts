import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'inbox',
        loadComponent: () => import('@modules/admin/features/thong-bao/thu-den/thu-den.component').then(c => c.ThuDenComponent),
    },
    {
        path: 'send',
        loadComponent: () => import('@modules/admin/features/thong-bao/thu-da-gui/thu-da-gui.component').then(c => c.ThuDaGuiComponent),
    },

    // {
    //     path: 'draft',
    //     loadComponent: () => import('@modules/admin/features/thong-bao/thu-nhap/thu-nhap.component').then(c =>c.ThuNhapComponent),
    // },

    {
        path: 'trash',
        loadComponent: () => import('@modules/admin/features/thong-bao/thu-xoa/thu-xoa.component').then(c => c.ThuXoaComponent),
    },


];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ThongBaoRoutingModule { }
