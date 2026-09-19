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
                loadComponent: () => import('@modules/admin/features/survey/survey/danh-muc-survey/danh-muc-survey.component').then(c => c.DanhMucSurveyComponent),
            },
            {
                path: 'survey-info',
                loadComponent: () => import('@modules/admin/features/survey/survey/survey-detail/survey-detail-info/survey-detail-info.component').then(c => c.SurveyDetailInfoComponent),
            },
            {
                path: 'survey-question',
                loadComponent: () => import('@modules/admin/features/survey/survey/survey-detail/survey-detail-question/survey-detail-question.component').then(c => c.SurveyDetailQuestionComponent),
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class SurveyRoutingRoutes { }