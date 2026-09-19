import { Injectable } from '@angular/core';
import { OvicConditionParam } from '@core/models/dto';
import { HttpParams } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class HttpParamsHeplerService {

    constructor() { }

    paramsConditionBuilder(conditions: OvicConditionParam[], params: HttpParams = null): HttpParams {
        const initHttpParams = params || new HttpParams();
        return conditions.reduce((httpParams, condition, i) => {
            const key = 'condition[' + i + '][key]';
            const value = 'condition[' + i + '][value]';
            const compare = 'condition[' + i + '][compare]';
            httpParams = httpParams.append(key, condition.conditionName || '');
            httpParams = httpParams.append(value, condition.value || '');
            httpParams = httpParams.append(compare, condition.condition || '');
            if (condition['orWhere']) {
                const type = 'condition[' + i + '][type]';
                httpParams = httpParams.append(type, condition['orWhere']);
            }
            return httpParams;
        }, initHttpParams);
    }

    paramsBuilder(params: { [T: string]: string | number | boolean }): HttpParams {
        let httpParams = new HttpParams();
        const prmNames = params ? Object.keys(params) : [];
        if (prmNames.length) {
            prmNames.forEach(k => httpParams = httpParams.set(k, params[k]));
        }
        return httpParams;
    }

    ketparamsBuilder(params): HttpParams {
        let _params = new HttpParams();
        if (params) {
            const _paramsKey = Object.keys(params);
            if (_paramsKey.length) {
                _paramsKey.forEach(k => {
                    _params = _params.set(k, params[k]);
                });
            }
        }
        return _params;
    }

    ketparamsConditionBuilder(condition: OvicConditionParam[], params: HttpParams = null): HttpParams {
        const newHttpParams = params || new HttpParams();
        return condition.reduce((prm, condtn) => prm.append('condition', this._addNewParam(condtn)), newHttpParams);
    }

    _addNewParam(condition: OvicConditionParam): string {
        let result = ''.concat(condition.conditionName, ',', condition.condition, ',', condition.value);
        if (condition.hasOwnProperty('orWhere') && ['and', 'or'].includes(condition.orWhere)) {
            result = ''.concat(result, ',', condition.orWhere);
        }
        return result;
    }

}
