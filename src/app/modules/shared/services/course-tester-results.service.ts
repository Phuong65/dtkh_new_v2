import { Injectable } from '@angular/core';
import { HttpClient , HttpParams } from '@angular/common/http';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { Observable } from 'rxjs';
import { Dto , IctuQueryParams , OvicConditionParam } from '@core/models/dto';
import { map } from 'rxjs/operators';
import { getRoute } from '@env';
import { CourseTesterResults } from '@shared/models/course-tester-results';
import { OBJECT_WITHOUT_PROPERTIES } from '@modules/kiem-thu-ngan-hang-cau-hoi/models/commons';
import {ConditionOption} from "@shared/models/condition-option";
import {ArticlePosts} from "@shared/services/article-posts.service";


@Injectable( {
	providedIn : 'root'
} )
export class CourseTesterResultsService {

	private readonly api : string = getRoute( 'course-tester-results/' );

	constructor(
		private http : HttpClient ,
		private httpHelper : HttpParamsHeplerService
	) {
	}

	get( id : number ) : Observable<CourseTesterResults> {
		return this.http.get<Dto>( ''.concat( this.api , id.toString( 10 ) ) ).pipe( map( ( res : Dto ) => res.data ) );
	}

	update( id : number , info : Partial<CourseTesterResults> ) : Observable<number> {
		return this.http.put<Dto>( ''.concat( this.api , id.toString( 10 ) ) , OBJECT_WITHOUT_PROPERTIES( info , [ 'id' ] ) ).pipe( map( ( res : Dto ) => res.data ) );
	}

	create( info : Partial<CourseTesterResults> ) : Observable<number> {
		return this.http.post<Dto>( this.api , info ).pipe( map( ( res : Dto ) => res.data ) );
	}

	query<T>( conditions : OvicConditionParam[] , queryParams? : IctuQueryParams ) : Observable<T[]> {
		const params : HttpParams = this.httpHelper.paramsConditionBuilder( conditions , new HttpParams( { fromObject : queryParams } ) );
		return this.http.get<Dto>( this.api , { params } ).pipe( map( ( res : Dto ) => res.data ) );
	}

    getDataByPageNew(option: ConditionOption): Observable<{ data: CourseTesterResults[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }
}
