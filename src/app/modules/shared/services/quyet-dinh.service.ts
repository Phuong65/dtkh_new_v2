import { Injectable } from '@angular/core';
import { getRoute } from '@env';
import { HttpClient , HttpParams } from '@angular/common/http';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { HelperService } from '@core/services/helper.service';
import { ThemeSettingsService } from '@core/services/theme-settings.service';
import { Dto , OrWhereCondition , OvicConditionParam , OvicQueryCondition } from '@core/models/dto';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { QuyetDinh } from '@shared/models/quyet-dinh';

type LoaiVbType = 'TRUNGCAP' | 'DAIHOC' | 'CAODANG' | 'CHUNGCHI' | 'TIENSI' | 'THACSI';

@Injectable( {
	providedIn : 'root'
} )
export class QuyetDinhService {

	private readonly api = getRoute( 'quyetdinh/' );

	constructor(
		private http : HttpClient ,
		private httpParamsHelper : HttpParamsHeplerService ,
		private helperService : HelperService ,
		private themeSettingsService : ThemeSettingsService
	) { }

	getDecisionById( quyetdinh_id : number , pluck = '' ) : Observable<QuyetDinh> {
		const params = pluck ? new HttpParams().set( 'pluck' , pluck ) : new HttpParams();
		return this.http.get<Dto>( ''.concat( this.api , quyetdinh_id.toString( 10 ) ) , { params } ).pipe( map( res => res.data ) );
	}

	countData( donvi_id : number , loaivb_type : LoaiVbType ) : Observable<number> {
		const fromObject                        = { paged : 1 , limit : -1 , pluck : 'id' };
		const conditions : OvicConditionParam[] = [
			{
				conditionName : 'donvi_id' ,
				condition     : OvicQueryCondition.equal ,
				value         : donvi_id.toString()
			} ,
			{
				conditionName : 'loaivb_type' ,
				condition     : OvicQueryCondition.like ,
				value         : '%' + loaivb_type + '%' ,
				orWhere       : 'and'
			}
		];
		const params                            = this.httpParamsHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( res => res.recordsFiltered ) );
	}

	list( paged : number , filter : { donvi_id : number, search? : string, loaivb_type? : string } ) : Observable<{ recordsTotal : number, data : QuyetDinh[] }> {
		const fromObject                      = {
			paged   : paged ,
			limit   : this.themeSettingsService.settings.rows ,
			orderby : 'ngayky' ,
			order   : 'DESC'
		};
		let conditions : OvicConditionParam[] = [];
		if ( filter.loaivb_type ) {
			if ( filter.search ) {
				conditions = [
					{
						conditionName : 'so_quyetdinh' ,
						condition     : OvicQueryCondition.like ,
						value         : '%' + filter.search + '%'
					} ,
					{
						conditionName : 'loaivb_type' ,
						condition     : OvicQueryCondition.equal ,
						value         : filter.loaivb_type ,
						orWhere       : 'and'
					} ,
					{
						conditionName : 'donvi_id' ,
						condition     : OvicQueryCondition.equal ,
						value         : filter.donvi_id.toString() ,
						orWhere       : 'and'
					}
				];
			} else {
				conditions = [
					{
						conditionName : 'loaivb_type' ,
						condition     : OvicQueryCondition.equal ,
						value         : filter.loaivb_type
					} ,
					{
						conditionName : 'donvi_id' ,
						condition     : OvicQueryCondition.equal ,
						value         : filter.donvi_id.toString() ,
						orWhere       : 'and'
					}
				];
			}
		}

		const params = conditions.length ? this.httpParamsHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) ) : new HttpParams( { fromObject } );
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

	reportAllAgencyDecisions( donvi_id : number = null ) : Observable<QuyetDinh[]> {
		const fromObject                        = { limit : -1 , pluck : 'loaivb_type' };
		const conditions : OvicConditionParam[] = donvi_id ? [
			{
				conditionName : 'donvi_id' ,
				condition     : OvicQueryCondition.equal ,
				value         : donvi_id.toString()
			}
		] : null;
		const params                            = conditions ? this.httpParamsHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) ) : new HttpParams( { fromObject } );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( res => res.data ) );
	}
}
