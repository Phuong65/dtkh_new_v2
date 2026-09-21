import { Component , OnInit , TemplateRef , ViewChild } from '@angular/core';
import { DanhMucService } from '@shared/services/danh-muc.service';
import { QuyetDinhHocVienService , SearchQuyetDinhHocVienOptions } from '@shared/services/quyet-dinh-hoc-vien.service';
import { QuyetDinhService } from '@shared/services/quyet-dinh.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { CHUC_VU , QuyetDinh , QuyetDinhHocVien } from '@shared/models/quyet-dinh';
import { UnsubscribeAndCompleteObserversOnDestroy } from '@core/utils/decorator';
import { debounceTime , Observable , of , Subject , Subscription , switchMap } from 'rxjs';
import { filter , map } from 'rxjs/operators';
import { AGENCIES , ENABLE_SELECT_AGENCY } from '@env';
import { DropdownFilterOptions } from 'primeng/dropdown';
import { NgPaginateEvent } from '@shared/models/ovic-models';
import { Paginator } from 'primeng/paginator';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

interface AgencyOption {
	id : number,
	name : string
	logo : string
}

@UnsubscribeAndCompleteObserversOnDestroy()
@Component( {standalone: false, 
	selector    : 'app-tra-cuu' ,
	templateUrl : './tra-cuu.component.html' ,
	styleUrls   : [ './tra-cuu.component.css' ]
} )
export class TraCuuComponent implements OnInit {

	studentActive : QuyetDinhHocVien;

	decision : QuyetDinh;

	dsHocVien : QuyetDinhHocVien[];

	dmNganhMap : Map<string , string>;

	isLoading = false;

	queryObject : { data : SearchQuyetDinhHocVienOptions, dirty : boolean } = {
		dirty : true ,
		data  : { field : 'sohieu_vbcc' , search : '' , paged : 1 , limit : 5 , ngaysinh : '' }
	};

	subscription = new Subscription();

	private OBSERVE_SEARCH_DATA = new Subject<{ data : SearchQuyetDinhHocVienOptions, dirty : boolean }>();

	enableSelectAgency = ENABLE_SELECT_AGENCY;

	activeAgency : AgencyOption = AGENCIES[ 0 ];

	agencies : AgencyOption[] = AGENCIES;

	filterValue : '';

	tableIndex = 0;

	recordsTotal = 0;

	@ViewChild( Paginator ) paginator : Paginator;

	@ViewChild( 'showFormData' ) showFormData : TemplateRef<any>;

	listChuVuMap : Map<string , string>;

	pluck = 'id,donvi_id,quyetdinh_id,mahocvien,hovaten,ngaysinh,gioitinh,noisinh,dantoc,quoctich,nganhhoc,chuyenganh,namtn,nienkhoa,hinhthuc_daotao,loai_vbcc,xeploai,sohieu_vbcc,sovaoso,khoa_lop,quyetdinh_hodong,ngay_baove';

	constructor(
		private helperService : HelperService ,
		private notificationService : NotificationService ,
		private danhMucService : DanhMucService ,
		private quyetDinhHocVienService : QuyetDinhHocVienService ,
		private quyetDinhService : QuyetDinhService ,
		private modalService : NgbModal
	) {
		const observeSearchData = this.OBSERVE_SEARCH_DATA.asObservable().pipe( filter( query => query.dirty && !!query.data.search ) , debounceTime( 100 ) ).subscribe( ( { data } ) => this.__search( data ) );
		this.subscription.add( observeSearchData );
		this.listChuVuMap = CHUC_VU.reduce( ( collector , { value , label } ) => collector.set( value , label ) , new Map<string , string> );
	}

	ngOnInit() {
	}

	setFilterBy( field : 'cccd' | 'sohieu_vbcc' | 'mahocvien' ) {
		if ( this.queryObject.data.field !== field ) {
			this.queryObject.data.field = field;
			this.triggerDataDirty();
			// this.searchData();
		}
	}

	triggerDataDirty() {
		this.queryObject.dirty = true;
	}

	searchData() {
		this.OBSERVE_SEARCH_DATA.next( this.queryObject );
	}

	private __search( info : SearchQuyetDinhHocVienOptions ) {
		if ( this.paginator ) {
			this.paginator.changePage( 0 );
			this.queryObject.data.paged = 1;
		}
		this.__queryData( this.activeAgency.id , info );
	}

	private __queryData( donvi_id : number , info : SearchQuyetDinhHocVienOptions ) {
		this.isLoading                           = true;
		const preLoadCategory$ : Observable<any> = this.dmNganhMap ? of( '' ) : this.danhMucService.get( 1 , 'nganh' , { donvi_id , limit : -1 , orderby : 'ordering' , order : 'ASC' , pluck : 'name,code' } ).pipe( map( ( { data } ) => {
			this.dmNganhMap = data ? data.reduce( ( collector , { name , code } ) => {
				collector.set( code , name );
				return collector;
			} , new Map<string , string>() ) : new Map<string , string>();
		} ) );
		preLoadCategory$.pipe( switchMap( () => this.quyetDinhHocVienService.search( donvi_id , info , this.pluck ) ) ).subscribe( {
			next  : ( { data , recordsTotal } ) => {
				this.tableIndex        = ( this.queryObject.data.paged * Math.max( this.queryObject.data.limit , 1 ) ) - Math.max( this.queryObject.data.limit , 1 ) + 1;
				this.recordsTotal      = recordsTotal;
				this.dsHocVien         = data.map( u => {
					const _u           = u.ngaysinh ? u.ngaysinh.split( '/' ) : [];
					u[ 'namsinh' ]     = _u && _u[ 2 ] ? _u[ 2 ] : '';
					u[ '__loai_vbcc' ] = u.loai_vbcc ? this.helperService.slugVietnamese( u.loai_vbcc ) : '';
					return u;
				} );
				this.queryObject.dirty = false;
				this.isLoading         = false;
			} ,
			error : () => {
				this.isLoading = false;
				this.notificationService.toastError( 'Mất kết nối với máy chủ' );
			}
		} );
	}

	showDetailInfo( student : QuyetDinhHocVien ) {
		this.studentActive                                  = student;
		this.studentActive[ '__tenNganhHocVien' ]           = student.nganhhoc && this.dmNganhMap && this.dmNganhMap.has( student.nganhhoc ) ? this.dmNganhMap.get( student.nganhhoc ) : '';
		this.studentActive[ '__ngayky_quyet_dinh' ]         = '';
		this.studentActive[ '__nguoiky_quyet_dinh' ]        = '';
		this.studentActive[ '__chucvu_nguoiky_quyet_dinh' ] = '';
		if ( student.quyetdinh_id ) {
			this.isLoading = true;
			this.quyetDinhService.getDecisionById( student.quyetdinh_id , 'nguoiky,chucvu_nguoiky,ngayky,file' ).pipe( map( ( { ngayky , nguoiky , chucvu_nguoiky , file } ) => {
				const nk = ngayky ? this.helperService.dateFormatWithTimeZone( ngayky ) : null;
				return {
					file ,
					__ngayky_quyet_dinh         : nk ? [ nk.getDate().toString( 10 ).padStart( 2 , '0' ) , ( nk.getMonth() + 1 ).toString( 10 ).padStart( 2 , '0' ) , nk.getFullYear() ].join( '/' ) : '' ,
					__nguoiky_quyet_dinh        : nguoiky ,
					__chucvu_nguoiky_quyet_dinh : chucvu_nguoiky && this.listChuVuMap.has( chucvu_nguoiky ) ? this.listChuVuMap.get( chucvu_nguoiky ) : ''
				};
			} ) ).subscribe( {
				next  : ( { __ngayky_quyet_dinh , __nguoiky_quyet_dinh , __chucvu_nguoiky_quyet_dinh , file } ) => {
					this.studentActive[ 'file' ]                        = file;
					this.studentActive[ '__ngayky_quyet_dinh' ]         = __ngayky_quyet_dinh;
					this.studentActive[ '__nguoiky_quyet_dinh' ]        = __nguoiky_quyet_dinh;
					this.studentActive[ '__chucvu_nguoiky_quyet_dinh' ] = __chucvu_nguoiky_quyet_dinh;
					this.isLoading                                      = false;
				} ,
				error : () => this.isLoading = false
			} );
		}

		const options : NgbModalOptions = {
			scrollable  : true ,
			size        : 'xl' ,
			windowClass : 'modal-xxl ovic-modal-class ovic-custom-large-popup' ,
			centered    : true
		};
		this.modalService.open( this.showFormData , options );
	}

	closePanel() {
		this.modalService.dismissAll( '' );
	}

	myResetFunction( options : DropdownFilterOptions ) {
		options.reset();
		this.filterValue = '';
	}

	paginate( { page } : NgPaginateEvent ) {
		this.queryObject.data.paged = page + 1;
		this.__queryData( this.activeAgency.id , this.queryObject.data );
	}
}
