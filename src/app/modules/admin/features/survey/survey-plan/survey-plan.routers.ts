import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '@core/guards/admin.guard';
import { NgModule } from '@angular/core';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('@modules/admin/features/survey/survey-plan/survey-plan-detail/survey-plan-detail.component').then(c => c.SurveyPlanDetailComponent),
        canActivateChild: [AdminGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('@modules/admin/features/survey/survey-plan/survey-plan/survey-plan.component').then(c => c.SurveyPlanComponent),
            },
            {
                path: 'survey-plan-info',
                loadComponent: () => import('@modules/admin/features/survey/survey-plan/survey-plan-detail/children/survey-plan-info/survey-plan-info.component').then(c => c.SurveyPlanInfoComponent),
            },
            {
                path: 'survey-plan-question',
                loadComponent: () => import('@modules/admin/features/survey/survey-plan/survey-plan-detail/children/survey-plan-preview-quetsion/survey-plan-preview-quetsion.component').then(c => c.SurveyPlanPreviewQuetsionComponent),
            },
            {
                path: 'survey-plan-setting',
                loadComponent: () => import('@modules/admin/features/survey/survey-plan/survey-plan-detail/children/survey-plan-setting/survey-plan-setting.component').then(c => c.SurveyPlanSettingComponent),
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class SurveyPlanRoutingModule { }