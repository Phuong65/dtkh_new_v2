import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ModuleGuard } from '@core/guards/module.guard';

const routes: Routes = [
    {
        path: 'admin',
        canActivate: [ModuleGuard],
        loadChildren: () =>
            import('@modules/admin/admin.module').then((m) => m.AdminModule),
    },
    {
        path: 'kiem-thu-ngan-hang-cau-hoi/:id',
        canActivate: [ModuleGuard],
        loadComponent: () =>
            import(
                '@modules/kiem-thu-ngan-hang-cau-hoi/kiem-thu-ngan-hang-cau-hoi.component'
            ).then((m) => m.default),
    },
    {
        path: '',
        loadChildren: () =>
            import('@modules/public/public.module').then((m) => m.PublicModule),
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule { }
