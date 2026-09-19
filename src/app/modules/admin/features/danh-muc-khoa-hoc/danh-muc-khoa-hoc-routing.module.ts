import { NgModule } from '@angular/core';
import { Routes , RouterModule } from '@angular/router';
import { KhoaHocComponent } from './khoa-hoc/khoa-hoc.component';
const routes : Routes = [
	{
		path        : '' ,
		component   : KhoaHocComponent ,
		data        : {
			featureName : 'Học phần'
		}
	} ,
];

@NgModule( {
	imports : [ RouterModule.forChild( routes ) ] ,
	exports : [ RouterModule ]
} )
export class DanhMucKhoaHocRoutingModule {
}
