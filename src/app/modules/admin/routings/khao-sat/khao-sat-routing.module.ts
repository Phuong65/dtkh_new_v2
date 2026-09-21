import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () => import('@modules/admin/features/home/home.component').then(c => c.HomeComponent),
    },
    {
        path: 'khaosat-phieu',
        loadChildren: () => import('@modules/admin/features/survey/survey/survey.module').then(c => c.SurveyModule),
    },
    {
        path: 'khaosat-dot',
        loadChildren: () => import('@modules/admin/features/survey/survey-plan/survey-plan.module').then(c => c.SurveyPlanModule),
    },
    {
        path: 'khaosat-thongke',
        loadChildren: () => import('@modules/admin/features/survey/survey-statistical/survey-statistical.module').then(c => c.SurveyStatisticalModule),
    },
]; 

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class KhaoSatRoutingModule { }
