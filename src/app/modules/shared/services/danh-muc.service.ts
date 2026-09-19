import { Injectable } from '@angular/core';
import { getRoute } from '@env';
import { HttpClient , HttpParams } from '@angular/common/http';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { HelperService } from '@core/services/helper.service';
import { ThemeSettingsService } from '@core/services/theme-settings.service';
import { DanhMuc , LoaiDanhMuc } from '@shared/models/danh-muc';
import { Observable } from 'rxjs';
import { Dto , OvicConditionParam , OvicQueryCondition } from '@core/models/dto';
import { map } from 'rxjs/operators';

@Injectable( {
	providedIn : 'root'
} )
export class DanhMucService {

	private readonly api = getRoute( 'danhmuc/' );

	constructor(
		private http : HttpClient ,
		private httpParamsHelper : HttpParamsHeplerService ,
		private helperService : HelperService ,
		private themeSettingsService : ThemeSettingsService
	) { }

	get( paged : number , type : LoaiDanhMuc , options? : { donvi_id? : number; limit? : number, orderby? : string, order? : 'ASC' | 'DESC', pluck? : string } ) : Observable<{ data : DanhMuc[], recordsTotal : number }> {
		const fromObject = {
			paged   : paged ,
			limit   : options && options.limit ? options.limit : this.themeSettingsService.settings.rows ,
			orderby : options && options.orderby ? options.orderby : 'created_at' ,
			order   : options && options.order ? options.order : 'ASC'
		};

		if ( options && options.pluck ) {
			fromObject[ 'pluck' ] = options.pluck;
		}
		const conditions : OvicConditionParam[] = [ {
			conditionName : 'type' ,
			condition     : OvicQueryCondition.equal ,
			value         : type
		} ];

		if ( options && options.donvi_id ) {
			conditions.push( {
				conditionName : 'donvi_id' ,
				condition     : OvicQueryCondition.equal ,
				value         : options.donvi_id.toString( 10 ) ,
				orWhere       : 'and'
			} );
		}
		const params = this.httpParamsHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( res => ( { recordsTotal : res.recordsFiltered , data : res.data } ) ) );
	}

	update( id : number , data : any ) : Observable<number> {
		return this.http.put<Dto>( ''.concat( this.api , id.toString( 10 ) ) , data ).pipe( map( res => res.data ) );
	}

	create( data : any ) : Observable<number> {
		return this.http.post<Dto>( this.api , data ).pipe( map( res => res.data ) );
	}

	delete( id : number ) : Observable<any> {
		return this.http.delete<Dto>( ''.concat( this.api , id.toString( 10 ) ) ).pipe( map( res => res.data ) );
	}
}
