import { Injectable } from '@angular/core';
import { getRoute } from '@env';
import { HttpClient , HttpParams } from '@angular/common/http';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { HelperService } from '@core/services/helper.service';
import { ThemeSettingsService } from '@core/services/theme-settings.service';
import { forkJoin , Observable , of } from 'rxjs';
import { QuyetDinhHocVien } from '@shared/models/quyet-dinh';
import { Dto , OvicConditionParam , OvicQueryCondition } from '@core/models/dto';
import { map } from 'rxjs/operators';

interface DataCheck {
	mahocvien : string;
	sohieu_vbcc : string;
	donvi_id : number;
}

interface StudentDecisionDto extends Dto {
	data : QuyetDinhHocVien[];
}

export type SearchQuyetDinhHocVienOptions = { paged : number, field : 'sohieu_vbcc' | 'cccd' | 'mahocvien', search : string, limit : number, ngaysinh : string }

export type QueryQuyetDinhHocVien = {
	paged : number,
	field : 'sohieu_vbcc' | 'cccd' | 'mahocvien',
	search : string,
	limit : number,
	ngaysinh : string,
	donvi_id : number,
	pluck? : string
}

@Injectable( {
	providedIn : 'root'
} )
export class QuyetDinhHocVienService {

	private readonly api = getRoute( 'quyetdinh-hocvien/' );

	constructor(
		private http : HttpClient ,
		private httpParamsHelper : HttpParamsHeplerService ,
		private helperService : HelperService ,
		private themeSettingsService : ThemeSettingsService
	) { }

	listAll( quyetdinh_id : number , pluck = '' ) : Observable<QuyetDinhHocVien[]> {
		const fromObject = { paged : 1 , limit : -1 , orderby : 'ten' , order : 'ASC' };

		if ( pluck ) {
			fromObject[ 'pluck' ] = pluck;
		}
		const conditions : OvicConditionParam[] = [ {
			conditionName : 'quyetdinh_id' ,
			condition     : OvicQueryCondition.equal ,
			value         : quyetdinh_id.toString()
		} ];
		const params                            = this.httpParamsHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( res => res.data ) );
	}

	list( paged : number , quyetdinh_id : number , search ? : string ) : Observable<{ recordsTotal : number, data : QuyetDinhHocVien[] }> {
		const fromObject                        = {
			paged   : paged ,
			limit   : this.themeSettingsService.settings.rows ,
			orderby : 'ten' ,
			order   : 'ASC'
		};
		const conditions : OvicConditionParam[] = [];

		if ( search && search.trim() ) {
			conditions.push( {
				conditionName : 'mahocvien' ,
				condition     : OvicQueryCondition.like ,
				value         : '%' + search.trim() + '%'
			} );
			conditions.push( {
				conditionName : 'hovaten' ,
				condition     : OvicQueryCondition.like ,
				value         : '%' + search.trim() + '%' ,
				orWhere       : 'or'
			} );
		}
		conditions.push( {
			conditionName : 'quyetdinh_id' ,
			condition     : OvicQueryCondition.equal ,
			value         : quyetdinh_id.toString() ,
			orWhere       : 'and'
		} );
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

	countQuyetDinhHocVien( quyetdinh_id : number ) : Observable<number> {
		const conditions : OvicConditionParam[] = [
			{
				conditionName : 'quyetdinh_id' ,
				condition     : OvicQueryCondition.equal ,
				value         : quyetdinh_id.toString( 10 )
			}
		];
		const fromObject                        = { limit : -1 , pluck : 'id' };
		const params                            = this.httpParamsHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( res => res.recordsFiltered ) );
	}

	/**
	 * Kiểm tra tính hợp lệ của dữ liệu trước khi import vào csdl
	 * Chỉ kiểm tra xem có trùng msv hay không
	 * nếu trùng thì trả về id của bản ghi đã tồn tại để cập nhật
	 * */
	checkValidData2( { mahocvien , sohieu_vbcc , donvi_id } : DataCheck ) : Observable<[ boolean , 'empty_mahocvien' | 'empty_sohieu_vbcc' | 'mahocvien' | null , number ]> {
		if ( !mahocvien || !sohieu_vbcc ) {
			return of( [ false , !mahocvien ? 'empty_mahocvien' : 'empty_sohieu_vbcc' , 0 ] );
		} else {
			const fromObject                        = { paged : 1 , limit : 1 , pluck : 'id' };
			const conditions : OvicConditionParam[] = [
				{
					conditionName : 'mahocvien' ,
					condition     : OvicQueryCondition.equal ,
					value         : mahocvien ,
					orWhere       : 'or'
				} ,
				{
					conditionName : 'donvi_id' ,
					condition     : OvicQueryCondition.equal ,
					value         : donvi_id.toString() ,
					orWhere       : 'and'
				}
			];
			const params                            = this.httpParamsHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) );
			return this.http.get<Dto>( this.api , { params } ).pipe( map( ( { data } ) => {
				const valid = !( data.length > 0 );
				// const error = valid ? null : ( data[ 0 ].mahocvien === mahocvien ) ? 'mahocvien' : 'sohieu_vbcc';
				const error = valid ? null : 'mahocvien';
				const id    = data[ 0 ] ? data[ 0 ].id : 0;
				return [ valid , error , id ];
			} ) );
		}
	}

	/**
	 * Kiểm tra tính hợp lệ của dữ liệu trước khi import vào csdl
	 * */
	checkValidData( { mahocvien , sohieu_vbcc , donvi_id } : DataCheck ) : Observable<[ boolean , 'empty_mahocvien' | 'empty_sohieu_vbcc' | 'mahocvien' | 'sohieu_vbcc' | null ]> {
		if ( !mahocvien || !sohieu_vbcc ) {
			return of( [ false , !mahocvien ? 'empty_mahocvien' : 'empty_sohieu_vbcc' ] );
		} else {
			const fromObject                        = { paged : 1 , limit : 1 , pluck : 'mahocvien,sohieu_vbcc' };
			const conditions : OvicConditionParam[] = [
				{
					conditionName : 'mahocvien' ,
					condition     : OvicQueryCondition.equal ,
					value         : mahocvien ,
					orWhere       : 'or'
				} ,
				{
					conditionName : 'donvi_id' ,
					condition     : OvicQueryCondition.equal ,
					value         : donvi_id.toString() ,
					orWhere       : 'and'
				} ,
				{
					conditionName : 'sohieu_vbcc' ,
					condition     : OvicQueryCondition.equal ,
					value         : sohieu_vbcc ,
					orWhere       : 'or'
				} ,
				{
					conditionName : 'donvi_id' ,
					condition     : OvicQueryCondition.equal ,
					value         : donvi_id.toString() ,
					orWhere       : 'and'
				}
			];
			const params                            = this.httpParamsHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) );
			return this.http.get<Dto>( this.api , { params } ).pipe( map( ( { data } ) => {
				const valid = !( data.length > 0 );
				const error = valid ? null : ( data[ 0 ].mahocvien === mahocvien ) ? 'mahocvien' : 'sohieu_vbcc';
				return [ valid , error ];
			} ) );
		}
	}

	reportData2( donvi_id : number = null , loai_vbcc : string = '' , pluck = 'nganhhoc,namtn,xeploai,khoa_lop,graduation_on_time' , school_sign : string = null ) : Observable<[ number , QuyetDinhHocVien[] ]> {
		const conditions : OvicConditionParam[] = donvi_id ? [
			{
				conditionName : 'donvi_id' ,
				condition     : OvicQueryCondition.equal ,
				value         : donvi_id.toString()
			}
		] : [];

		if ( loai_vbcc ) {
			conditions.push( {
				conditionName : 'loai_vbcc' ,
				condition     : OvicQueryCondition.equal ,
				value         : loai_vbcc ,
				orWhere       : 'and'
			} );
		}

		if ( school_sign ) {
			conditions.push( {
				conditionName : 'school_sign' ,
				condition     : OvicQueryCondition.equal ,
				value         : school_sign ,
				orWhere       : 'or'
			} );
		}

		const fromObject = { limit : -1 , pluck };
		const params     = this.httpParamsHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) );
		return this.http.get<StudentDecisionDto>( this.api , { params } ).pipe( map( ( { recordsFiltered , data } ) => ( [ recordsFiltered , data ] ) ) );
	}

	reportData( donvi_id : number = null , loai_vbcc : string = '' , pluck = 'nganhhoc,namtn,xeploai' ) : Observable<[ number , QuyetDinhHocVien[] ]> {
		const conditions : OvicConditionParam[] = donvi_id ? [
			{
				conditionName : 'donvi_id' ,
				condition     : OvicQueryCondition.equal ,
				value         : donvi_id.toString()
			}
		] : [];

		if ( loai_vbcc ) {
			conditions.push( {
				conditionName : 'loai_vbcc' ,
				condition     : OvicQueryCondition.equal ,
				value         : loai_vbcc ,
				orWhere       : 'and'
			} );
		}
		const fromObject = { limit : -1 , pluck };
		const params     = this.httpParamsHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) );
		return this.http.get<StudentDecisionDto>( this.api , { params } ).pipe( map( ( { recordsFiltered , data } ) => ( [ recordsFiltered , data ] ) ) );
	}

	query( { paged , field , search , limit , ngaysinh , pluck , donvi_id } : QueryQuyetDinhHocVien ) : Observable<{ recordsTotal : number, data : QuyetDinhHocVien[] }> {
		const fromObject = {
			paged   : paged ,
			limit   : limit ,
			orderby : 'ten' ,
			order   : 'ASC'
		};
		if ( pluck ) {
			fromObject[ 'pluck' ] = pluck;
		}
		const conditions : OvicConditionParam[] = [
			{
				conditionName : 'donvi_id' ,
				condition     : OvicQueryCondition.equal ,
				value         : donvi_id.toString()
			} ,
			{
				conditionName : field ,
				condition     : OvicQueryCondition.equal ,
				value         : search ,
				orWhere       : 'and'
			} ,
			{
				conditionName : 'ngaysinh' ,
				condition     : OvicQueryCondition.equal ,
				value         : ngaysinh ,
				orWhere       : 'and'
			}
		];
		const params                            = this.httpParamsHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( res => ( { recordsTotal : res.recordsFiltered , data : res.data } ) ) );
	}

	search( donvi_id : number , { paged , field , search , limit , ngaysinh } : SearchQuyetDinhHocVienOptions , pluck : string = null ) : Observable<{ recordsTotal : number, data : QuyetDinhHocVien[] }> {
		const fromObject = {
			paged   : paged ,
			limit   : limit ,
			orderby : 'ten' ,
			order   : 'ASC'
		};
		if ( pluck ) {
			fromObject[ 'pluck' ] = pluck;
		}
		const conditions : OvicConditionParam[] = [
			{
				conditionName : 'donvi_id' ,
				condition     : OvicQueryCondition.equal ,
				value         : donvi_id.toString()
			} ,
			{
				conditionName : field ,
				condition     : OvicQueryCondition.like ,
				value         : '%' + search + '%' ,
				orWhere       : 'and'
			} ,
			{
				conditionName : 'ngaysinh' ,
				condition     : OvicQueryCondition.equal ,
				value         : ngaysinh ,
				orWhere       : 'and'
			}
		];
		const params                            = this.httpParamsHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject } ) );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( res => ( { recordsTotal : res.recordsFiltered , data : res.data } ) ) );
	}
}
