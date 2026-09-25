import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';

import { MenuModule } from 'primeng/menu';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MessageModule } from 'primeng/message';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { InputTextModule } from 'primeng/inputtext';
// import { SidenavComponent } from '@modules/admin/features/sidenav/sidenav.component';
import { NgApexchartsModule } from 'ng-apexcharts';

import { SharedModule } from '@shared/shared.module';
import { DashboardComponent } from '@modules/admin/dashboard/dashboard.component';
import { UserInfoComponent } from '@modules/admin/dashboard/user-info/user-info.component';
import { PopoverModule } from 'primeng/popover';
import { MenuLanguageComponent } from '@modules/admin/dashboard/menu-language/menu-language.component';
import { TranslateModule } from '@ngx-translate/core';
// import { OvicMessageModule } from '@modules/admin/features/ovic-message/ovic-message.module';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
// import { HomeComponent } from './features/home/home.component';
// import { HomeAgencyComponent } from './features/home/home-agency/home-agency.component';
// import { HomeAdminComponent } from './features/home/home-admin/home-admin.component';
// import { HomeGdqpAnComponent } from './features/home/home-gdqp-an/home-gdqp-an.component';
// import { HomeLcmsComponent } from './features/home/home-lcms/home-lcms.component';
import { ChartModule } from 'primeng/chart';
// import { GoogleChartsModule } from 'angular-google-charts';
// import AdminDashboardComponent from './features/home/admin-dashboard-225/admin-dashboard/admin-dashboard.component';
import { MenuV2Component } from './dashboard/menu-v2/menu-v2.component';
import { ContentNoneComponent } from './features/content-none/content-none.component';

@NgModule({
    declarations: [
        DashboardComponent,
        // SidenavComponent,
        UserInfoComponent,
        MenuLanguageComponent,
        // HomeComponent,
        // HomeAgencyComponent,
        // HomeAdminComponent,
        // HomeGdqpAnComponent,
        // HomeLcmsComponent,
        MenuV2Component,

    ],
    imports: [
        ContentNoneComponent,
        // AdminDashboardComponent,
        CommonModule,
        AdminRoutingModule,
        MenuModule,
        PanelMenuModule,
        MessageModule,
        ScrollPanelModule,
        ButtonModule,
        RippleModule,
        InputTextModule,
        NgApexchartsModule,
        // SharedModule,
        PopoverModule,
        TranslateModule,
        // OvicMessageModule,
        SelectModule,
        FormsModule,
        ChartModule,
        // GoogleChartsModule,
        // AdminDashboardComponent
    ],
})
export class AdminModule { }
