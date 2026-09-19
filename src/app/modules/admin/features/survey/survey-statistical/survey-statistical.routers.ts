import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '@core/guards/admin.guard';
import { NgModule } from '@angular/core';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('@modules/admin/features/survey/survey/survey-detail/survey-detail/survey-detail.component').then(c => c.SurveyDetailComponent),
        canActivateChild: [AdminGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('@modules/admin/features/survey/survey-statistical/survey-statistical/survey-statistical.component').then(c => c.SurveyStatisticalComponent),
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class SurveyStatisticalRoutes { }