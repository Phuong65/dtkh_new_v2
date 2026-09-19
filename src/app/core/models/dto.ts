export interface Dto {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: any;
    Content?: any;
}

export interface OvicPaginator {
    totalRecords: number;
    rows: number; //Data count to display per page.
    data: any;
}

export enum OvicQueryCondition {
    like = 'LIKE', // https://www.w3schools.com/sql/sql_like.asp
    equal = '=',
    greaterThan = '>',
    greaterThanToEqualsTo = '>=',
    lessThan = '<',
    lessThanOrEqualsTo = '<=',
    notEqual = '<>',
    notEqualTo = '!=',
    notLike = 'NOT LIKE',
}

export enum OrWhereCondition {
    like = 'like',
    andlike = 'andlike',
    orlike = 'orlike',
    in = 'in',
    orin = 'orin',
    notin = 'notin',
    ornotin = 'ornotin',
    and = 'and',
    or = 'or',
}

export interface OvicConditionParam {
    conditionName: string;
    condition: OvicQueryCondition;
    value: string;
    orWhere?: OrWhereCondition | 'and' | 'or' | string;
}

export type IctuOrWhereCondition = 'like' | 'andlike' | 'orlike' | 'in' | 'orin' | 'notin' | 'ornotin' | 'and' | 'or';

export type IctuQueryParamName = 'include' | 'include_by' | 'exclude' | 'exclude_by' | 'condition' | 'max' | 'min' | 'sum' | 'avg' | 'limit' | 'offset' | 'paged' | 'orderby' | 'order' | 'groupby' | 'pluck' | 'select' | 'first' | 'with';

export type IctuQueryParams = { [T in IctuQueryParamName]? : string | number }

export const dtoToIctuPaginator : <T>( res : Dto , rows? : number ) => IctuPaginator<T> = <T>( res : Dto , rows : number = 0 ) : IctuPaginator<T> => ( { totalRecords : res.recordsFiltered , rows , data : res.data as Array<T> } );

export interface IctuPaginator<T> {
	totalRecords : number;
	rows : number; //Data count to display per page.
	data : Array<T>;
}
