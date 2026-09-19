import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { HelperService } from '@core/services/helper.service';
import { Dto } from '@core/models/dto';
import { ClassesService } from './classes.service';
import { NotificationService } from '@core/services/notification.service';

@Injectable({
    providedIn: 'root'
})
export class OvicCheckSlugService {

    private _api = {
        classes: this.classesService.api,
    };

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private classesService: ClassesService,
        private noitifi: NotificationService
    ) {
    }

    private _getData(api: string, slug: string): Observable<any> {
        const _params = new HttpParams().set('pluck', 'id').set('slug', slug);
        return this.http.get<Dto>(api, { params: _params }).pipe(map(res => res.data));
    }

    checkSlugIsValidForAdding(postType: string, postTitle: string, currentId: number = null): Promise<boolean> {
        if (['classes', 'username', 'email', 'phone'].includes(postType)) {
            return new Promise((resolve) => {
                this._getData(this._api[postType], this.helperService.slugVietnamese(postTitle)).subscribe(
                    data => {
                        if (currentId) {
                            if (data.length === 0) {
                                resolve(true);
                            } else if (data.length === 1 && data[0].id === currentId) {
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        } else {
                            resolve(data.length === 0);
                        }
                    },
                    () => {
                        this.noitifi.toastError('Không kiểm tra được tiêu đề đã tồn tại hay chưa');
                        resolve(false);
                    }
                );
            });
        } else {
            this.noitifi.toastError('post type chưa được hỗ trợ');
            return Promise.resolve(false);
        }
    }

    checkSlugIsValidForUpdating(postType: string, postTitle: string, currentPostId: number) {

    }



}
