import { Injectable } from '@angular/core';
import { getRoute } from '@env';
import { HttpClient , HttpParams } from '@angular/common/http';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { HelperService } from '@core/services/helper.service';
import { ThemeSettingsService } from '@core/services/theme-settings.service';
import { Observable } from 'rxjs';
import { Dto , OvicQueryCondition } from '@core/models/dto';
import { map } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { DonVi } from '@shared/models/don-vi';
import { ConditionOption } from '../models/condition-option';

@Injectable( {
	providedIn : 'root'
} )
export class DonViService {
	
	private readonly api = getRoute( 'donvi/' );

	constructor(
		private http : HttpClient ,
		private httpParamsHelper : HttpParamsHeplerService ,
		private helperService : HelperService ,
		private themeSettingsService : ThemeSettingsService
	) { }

	create( data : any ) : Observable<number> {
		return this.http.post<Dto>( this.api , data ).pipe( map( res => res.data ) );
	}

	update( id : number , data : any ) : Observable<any> {
		return this.http.put<Dto>( ''.concat( this.api , id.toString( 10 ) ) , data );
	}

	delete( id : number ) : Observable<any> {
		const route = ''.concat( this.api , id.toString( 10 ) );
		return this.http.delete<Dto>( route );
	}

	getParentList() : Observable<{ id : number, title : string, status : number }[]> {
		const fromObject = {
			orderby : 'title' ,
			order   : 'ASC' ,
			pluck   : 'id,title,status' ,
			limit   : '-1'
		};
		const params     = new HttpParams( { fromObject } );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( res => res.data ) );
	}

	getDanhSachDonVi( paged : number , limit : number = null , hierarchy = 1 , onlyParent = false , orderby = 'title' ) : Observable<{ recordsTotal : number, data : DonVi[] }> {
		const fromObject = {
			hierarchy : hierarchy ,
			paged     : paged ,
			limit     : limit || this.themeSettingsService.settings.rows ,
			orderby   : orderby || 'title' ,
			order     : 'ASC'
		};
		const params     = onlyParent ? this.httpParamsHelper.paramsConditionBuilder( [ { conditionName : 'parent_id' , condition : OvicQueryCondition.equal , value : '0' } ] , new HttpParams( { fromObject } ) ) : new HttpParams( { fromObject } );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( res => ( { recordsTotal : res.recordsFiltered , data : res.data } ) ) );
	}

	private _preSetData( data : DonVi[] ) : DonVi[] {
		return data && data.length ? data.map( d => {
			d[ '__status' ] = d.status === 0 ? '<span class="badge badge--size-normal badge-danger w-100">Inactive</span>' : '<span class="badge badge--size-normal badge-success w-100">Active</span>';
			return d;
		} ) : [];
	}

	getDonViByIds( ids : string , pluck : string = null ) : Observable<DonVi[]> {
		const fromObject = { orderby : 'title' , order : 'ASC' };
		if ( pluck ) {
			fromObject[ 'pluck' ] = pluck;
		}
		const params = new HttpParams( { fromObject } );
		return this.http.get<Dto>( ''.concat( this.api , ids ) , { params } ).pipe( map( res => res.data ) );
	}

	getDsDonViOptions( onlyParent = false ) : Observable<DonVi[]> {
		const fromObject = {
			hierarchy : 1 ,
			limit     : -1 ,
			orderby   : 'id' ,
			order     : 'ASC'
		};
		const params     = onlyParent ? this.httpParamsHelper.paramsConditionBuilder( [ { conditionName : 'parent_id' , condition : OvicQueryCondition.equal , value : '0' } ] , new HttpParams( { fromObject } ) ) : new HttpParams( { fromObject } );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( res => res.data ) );
	}

	getDonViById( id : number ) : Observable<DonVi> {
		return this.http.get<Dto>( ''.concat( this.api , id.toString( 10 ) ) ).pipe( map( res => res.data ) );
    }
    
    getDonViByCols(condition: HttpParams): Observable<DonVi[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }
    
    getDonviByPageNew(option: ConditionOption): Observable<{ data: DonVi[], recordsFiltered: number }> {
        let filter = option.page ? this.httpParamsHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpParamsHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }
}
