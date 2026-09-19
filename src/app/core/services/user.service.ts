import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { User, UserMeta } from '@core/models/user';
import { map } from 'rxjs/operators';
import { getRoute } from '@env';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '@modules/shared/models/condition-option';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private readonly profileApi = getRoute('profile');

    private readonly avatar = getRoute('avatar');

    private readonly api = getRoute('users');

    private readonly userMetaApi = getRoute('user-meta');

    private readonly api_roles = getRoute('users/roles');


    constructor(
        private http: HttpClient,
        private appHttpParamsService: HttpParamsHeplerService) {
    }

    getUser(userId: number, pluck: string = null): Observable<User> {
        // const _pluck  = pluck ? pluck : 'id,username,display_name,phone,email,avatar,donvi_id,created_at,created_by,is_admin,is_deleted,realms,role_ids,status,updated_at,updated_by';
        const params = pluck ? new HttpParams().set('select', pluck) : new HttpParams();
        const url = ''.concat(this.api, '/', userId.toString());
        return this.http.get<Dto>(url, { params }).pipe(map(res => res.data ? res.data : null));
    }

    getUserByEmail(email: string, pluck: string = null): Observable<User> {
        const _pluck = pluck ? pluck : 'id,username,display_name,phone,email,password,avatar,donvi_id,role_ids,donvi_ids,status,created_at,updated_at';
        const params = this.appHttpParamsService.paramsConditionBuilder([{
            conditionName: 'email',
            condition: OvicQueryCondition.equal,
            value: email
        }]).set('select', _pluck);
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res[0] || null));
    }

    validateUserPhone(phone: string, currentPhone: string): Observable<boolean> {
        const params = this.appHttpParamsService.paramsConditionBuilder([{
            conditionName: 'phone',
            condition: OvicQueryCondition.equal,
            value: phone
        }]).set('select', 'phone');
        return this.http.get<Dto>(this.api, { params }).pipe(
            map(res => {
                if (res.data.length === 0) {
                    return true;
                } else if (res.data.length === 1) {
                    return currentPhone === res.data[0]['phone'];
                } else {
                    return false;
                }
            })
        );
    }

    validateUserEmail(email: string, currentEmail: string): Observable<boolean> {
        const params = this.appHttpParamsService.paramsConditionBuilder([{
            conditionName: 'email',
            condition: OvicQueryCondition.equal,
            value: email
        }]).set('select', 'email');
        return this.http.get<Dto>(this.api, { params }).pipe(
            map(res => {
                if (res.data.length === 0) {
                    return true;
                } else if (res.data.length === 1) {
                    return currentEmail === res.data[0]['email'];
                } else {
                    return false;
                }
            })
        );
    }

    validateUsername(userName: string, currentUserName: string): Observable<boolean> {
        const params = this.appHttpParamsService.paramsConditionBuilder([{
            conditionName: 'username',
            condition: OvicQueryCondition.equal,
            value: userName
        }]).set('select', 'username');
        return this.http.get<Dto>(this.api, { params }).pipe(
            map(res => {
                if (res.data.length === 0) {
                    return true;
                } else if (res.data.length === 1) {
                    return currentUserName === res.data[0]['username'];
                } else {
                    return false;
                }
            })
        );
    }

    getExistenceUser(email: string, phone: string, pluck: string = null): Observable<User> {
        const _pluck = pluck ? pluck : 'id,username,display_name,phone,email,password,avatar,donvi_id,role_ids,donvi_ids,status,created_at,updated_at';
        const conditions = [];
        if (email && phone) {
            conditions.push({
                conditionName: 'email',
                condition: OvicQueryCondition.equal,
                value: email
            });
            conditions.push({
                conditionName: 'phone',
                condition: OvicQueryCondition.equal,
                value: phone,
                orWhere: 'or'
            });
        } else {
            if (email) {
                conditions.push({
                    conditionName: 'email',
                    condition: OvicQueryCondition.equal,
                    value: email
                });
            }
            if (phone) {
                conditions.push({
                    conditionName: 'phone',
                    condition: OvicQueryCondition.equal,
                    value: phone
                });
            }
        }
        if (!conditions.length) {
            return of(null);
        }
        const params = this.appHttpParamsService.paramsConditionBuilder(conditions).set('select', _pluck);
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res[0] || null));
    }

    listUsers(donvi_id: number): Observable<User[]> {
        const search = new HttpParams().set('donvi_id', donvi_id.toString());
        return this.http.get<Dto>(this.api, { params: search }).pipe(map(res => res.data));
    }

    queryUsers(donvi_id: number): Observable<Dto> {
        const search = new HttpParams().set('limit', '100').set('paged', '1');
        return this.http.get<Dto>(this.api, { params: search });
    }

    search(info: string, donvi_id: number): Observable<User[]> {
        if (!donvi_id || !info) {
            return of([]);
        } else {
            const condition = [
                { conditionName: 'username', condition: OvicQueryCondition.like, value: `%${info}%` },
                { conditionName: 'email', condition: OvicQueryCondition.like, value: `%${info}%`, orWhere: 'or' },
                { conditionName: 'display_name', condition: OvicQueryCondition.like, value: `%${info}%`, orWhere: 'or' },
                { conditionName: 'phone', condition: OvicQueryCondition.like, value: `%${info}%`, orWhere: 'or' },
                { conditionName: 'donvi_id', condition: OvicQueryCondition.equal, value: donvi_id.toString(), orWhere: 'and' }
            ];
            const options = { params: this.appHttpParamsService.paramsConditionBuilder(condition) };
            return this.http.get<Dto>(this.api, options).pipe(map(res => res.data));
        }
    }

    creatUser(user): Observable<number> {
        return this.http.post<Dto>(this.api, user).pipe(map(res => res.data));
    }

    updateUserS(id, data): Observable<number> {
        return this.http.put<any>(this.api.concat('/', id.toString()), data);
    }

    updateUserInfo(data): Observable<number> {
        return this.http.put<any>(this.profileApi, data);
    }

    deleteUser(id: any): Observable<number> {
        return this.http.delete<any>(''.concat(this.api, '/', id.toString()));
    }

    validateEqualInfo(info: any): Observable<boolean> {
        const cons = [];
        Object.keys(info).forEach(_key => cons.push({ conditionName: _key, condition: OvicQueryCondition.equal, value: info[_key] }));
        const condition = this.appHttpParamsService.paramsConditionBuilder(cons);
        return this.http.get<Dto>(this.api, { params: condition }).pipe(map(res => res.data.length === 0));
    }

    /*************************************************
     * mặc đinh filter theo user hiện tại rồi
     * *********************************************/
    getUserMeta(meta_key: string = null): Observable<UserMeta[]> {
        let request$: Observable<Dto> = this.http.get<Dto>(this.userMetaApi);
        if (meta_key) {
            const conditions: OvicConditionParam[] = [];
            conditions.push({
                conditionName: 'meta_key',
                condition: OvicQueryCondition.equal,
                value: meta_key
            });
            const params = this.appHttpParamsService.paramsConditionBuilder(conditions);
            request$ = this.http.get<Dto>(this.userMetaApi, { params });
        }
        return request$.pipe(map(res => res.data));
    }

    /*************************************************
     * mặc đinh tạo meta theo user hiện tại rồi
     * *********************************************/
    updateMeta(info: UserMeta): Observable<number> {
        return this.http.post<Dto>(this.userMetaApi, info).pipe(map(res => res.data));
    }

    getUserByItem(item: string, col: string): Observable<User[]> {
        const by = new HttpParams().set('include', item).set("include_by", col).set("limit", "-1");
        return this.http.get<Dto>(this.api, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getUserPageByCol(start: number, limit: number, col: string, item: any,): Observable<User[]> {
        const filter = new HttpParams().set('condition', 'status,<>,-1,and').set(col, item).set('orderby', 'id').set('order', 'DESC').set('limit', limit.toString()).set("offset", start.toString());
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }


    getUserByCol(col: string, value: string, donvi_ids?: string): Observable<User[]> {

        let search = donvi_ids ? new HttpParams().set('condition', col.concat(',=,', value)).set("donvi_ids", donvi_ids) : new HttpParams().set('condition', col.concat(',=,', value)).set("limit", -1);
        if (col === "role_ids") {
            search = donvi_ids ? new HttpParams().set(col, value).set("donvi_ids", donvi_ids) : new HttpParams().set(col, value).set("limit", -1);
        }
        return this.http.get<Dto>(this.api, { params: search }).pipe(
            map(res => res.data)
        );
    }

    getUserByCols(condition: HttpParams): Observable<User[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    getTotalUserByCols(condition: HttpParams): Observable<any> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res)
        );
    }

    getUserByPageNew(option: ConditionOption): Observable<{ data: User[], recordsFiltered: number }> {
        let filter = option.page ? this.appHttpParamsService.paramsConditionBuilder(option.condition).set("paged", option.page) : this.appHttpParamsService.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    addRoles(user_id: number, role_ids: string[]): Observable<{ data: string[], message: string }> {
        const url = ''.concat(this.api, '/roles/', user_id.toString(10));
        return this.http.post<{ data: string[], message: string }>(url, { role_ids })
    }

    deleteRoles(user_id: number, role_ids: string[]): Observable<any> {
        const url = ''.concat(this.api, '/roles/', user_id.toString(10));
        return this.http.delete<any>(url, { body: { role_ids: role_ids } });
    }


    profileAvatar(file, id: string): Observable<number> {
        return this.http.post<any>(this.avatar.concat('?user_id=', id), file);
    }

}
