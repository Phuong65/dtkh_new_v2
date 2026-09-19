import { Component, OnInit, ViewChild, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { AbstractControl } from '@angular/forms';
@Component( {
    selector: 'ovic-date-picker',
    templateUrl: './ovic-date-picker.component.html',
    styleUrls: [ './ovic-date-picker.component.css' ]
} )
export class OvicDatePickerComponent implements OnInit, OnChanges {

    constructor () {
    }

    @Input()
    dateFormat: string;

    @Input()
    inputName: string;

    @Input()
    label: string;

    @Input()
    showTime: boolean;

    @Input()
    hourFormat: string;

    @Input()
    locale: any;

    @Input()
    placeholder: string;

    @Input()
    monthNavigator: boolean;

    @Input()
    yearNavigator: boolean;

    @Output()
    onChange = new EventEmitter<any>();

    @Input()
    defaultValue: Date;
    
    @Input() disabled: boolean = false;

    @Input() formField: AbstractControl;

    value: Date;

    yearRange: string;

    ngOnInit (): void {

        const today = new Date;
        const currentYear = today.getFullYear() + 1;
        this.yearRange = '2000:'.concat( currentYear.toString() );
        if ( !this.dateFormat ) {
            this.dateFormat = 'dd/mm/yy';
        }
        if ( !this.hourFormat ) {
            this.hourFormat = '12';
        }
        if ( !this.locale ) {
            this.locale = {
                firstDayOfWeek: 1,
                dayNames: [ 'Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy' ],
                dayNamesShort: [ 'cn', '2', '3', '4', '5', '6', '7' ],
                dayNamesMin: [ 'cn', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7' ],
                monthNames: [ 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7',
                    'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12' ],
                monthNamesShort: [ '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12' ],
                today: 'Hôm nay',
                clear: 'Xóa',
                dateFormat: this.dateFormat,
                weekHeader: 'Wk'
            };
        }

        if ( this.defaultValue ) {
            this.value = new Date( this.defaultValue );
            setTimeout( () => {
                this.formatDate( this.defaultValue );
            }, 500 )

        }
    }
    ngOnChanges ( changes: SimpleChanges ) {
        if ( changes[ 'defaultValue' ] ) {
            if ( this.defaultValue ) {
                this.value = new Date( this.defaultValue );
                setTimeout( () => {
                    this.formatDate( this.defaultValue );
                }, 500 )
            } 
            
        }
    }
    input ( event ) {
        if ( this.value && Date.parse( this.value.toString() ) ) {
            this.formatDate( this.value );
        } else {
            this.onChange.emit( '' );
        }
    }

    change ( event ) {
        this.formatDate( event );
    }

    formatDate ( strDate ) {
        if ( !this.showTime ) {
            const dateSelected = new Date( strDate );
            const dd = dateSelected.getDate();
            const mm = dateSelected.getMonth() + 1;
            const yyyy = dateSelected.getFullYear();
            let formated = '';
            if ( dd < 10 ) {
                formated = '0' + dd.toString();
            } else {
                formated = dd.toString();
            }
            if ( mm < 10 ) {
                formated += '/0' + mm.toString();
            } else {
                formated += '/' + mm.toString();
            }
            formated += '/' + yyyy.toString();
            if ( this.formField )
                this.formField.setValue( formated );
            this.onChange.emit( formated );
        } else {
            const d = new Date( strDate );
            const dd = d.getDate();
            const mm = d.getMonth() + 1;
            const yyyy = d.getFullYear();
            const h = d.getHours();
            const min = d.getMinutes();
            let formated = yyyy.toString();
            if ( mm < 10 ) {
                formated += '-0' + mm.toString();
            } else {
                formated += '-' + mm.toString();
            }
            if ( dd < 10 ) {
                formated += '-0' + dd.toString();
            } else {
                formated += '-' + dd.toString();
            }
            if ( h < 10 ) {
                formated += ' 0' + h.toString();
            } else {
                formated += ' ' + h.toString();
            }
            if ( min < 10 ) {
                formated += ':0' + min.toString();
            } else {
                formated += ':' + min.toString();
            }
            formated += ':00';
            if ( this.formField )
                this.formField.setValue( formated );
            this.onChange.emit( formated );

        }
    }

}
