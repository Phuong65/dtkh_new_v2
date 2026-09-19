import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

import { PublicRoutingModule } from './public-routing.module';
import { LoginComponent } from './features/login/login.component';
import { ResetPasswordComponent } from './features/reset-password/reset-password.component';
import { ContentNoneComponent } from './features/content-none/content-none.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginV2Component } from './features/login-v2/login-v2.component';
import { UnauthorizedComponent } from './features/unauthorized/unauthorized.component';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ClearComponent } from './features/clear/clear.component';
import { InputMaskModule } from 'primeng/inputmask';
import { TraCuuComponent } from './features/tra-cuu/tra-cuu.component';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { LoginTemplateV3Component } from './features/login-template-v3/login-template-v3.component';
import { LoginTemplateV4Component } from './features/login-template-v4/login-template-v4.component';
import { IndexComponent } from './features/index/index.component';
import { LoginTemplateIctuComponent } from './features/login-template-ictu/login-template-ictu.component';
import { LoginMainTemplateComponent } from './features/login-main-template/login-main-template.component';
import { LoginTemplateNvhcmComponent } from './features/login-template-nvhcm/login-template-nvhcm.component';
import { FlickityModule } from './features/ngx-flickity/flickity.module';
import { LoginTemplateVhhcmComponent } from './features/login-template-vhhcm/login-template-vhhcm.component';
import { LoginTemplateHvuComponent } from './features/login-template-hvu/login-template-hvu.component';
import { LoginTemplateIctuDttxComponent } from './features/login-template-ictu-dttx/login-template-ictu-dttx.component';
@NgModule({
    declarations: [
        LoginComponent,
        ResetPasswordComponent,
        ContentNoneComponent,
        LoginV2Component,
        UnauthorizedComponent,
        ClearComponent,
        TraCuuComponent,
        LoginTemplateV3Component,
        LoginTemplateV4Component,
        IndexComponent,
        LoginTemplateIctuComponent,
        LoginMainTemplateComponent,
        LoginTemplateNvhcmComponent,
        LoginTemplateVhhcmComponent,
        LoginTemplateHvuComponent,
        LoginTemplateIctuDttxComponent
    ],
    imports: [
        FlickityModule,
        CommonModule,
        PublicRoutingModule,
        ReactiveFormsModule,
        ButtonModule,
        RippleModule,
        InputMaskModule,
        FormsModule,
        TableModule,
        DropdownModule,
        InputTextModule,
        PaginatorModule,
        NgOptimizedImage
    ]
})
export class PublicModule { }
