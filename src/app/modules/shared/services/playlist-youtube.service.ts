import { Injectable } from '@angular/core';
import {  environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpEvent, HttpEventType, HttpParams, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
// import { PlaylistYoutube } from '../../shared/models/Elng';
import { distinctUntilChanged, map, mergeMap, scan, tap } from 'rxjs/operators';
import { Upload } from 'src/app/core/models/file';


@Injectable({
    providedIn: 'root'
})

export class PlaylistYoutubeService {

    api =  getRoute( 'playlists/');
    api_video =  getRoute( 'youtube/');

    constructor(
        private http: HttpClient
    ) {
    }

    private static packetFiles(files, details: { [t: string]: string } = null): FormData {
        const formData = new FormData();
        if (files && files.length) {
            for (const file of files) {
                formData.append('upload', file);
            }
        }
        if (details) {
            Object.keys(details).forEach(key => formData.append(key, details[key]));
        }
        return formData;
    }

    addPlaylistYoutube(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res)
        );
    }

    isHttpProgressEvent(event: HttpEvent<unknown>): event is HttpProgressEvent {
        return (event.type === HttpEventType.DownloadProgress || event.type === HttpEventType.UploadProgress);
    }

    isHttpResponse<T>(event: HttpEvent<T>): event is HttpResponse<T> {
        return event.type === HttpEventType.Response;
    }



    addVideo(file, playlist_id: string, title: string, description = ''): Observable<any> {
        const params = new HttpParams().set('playlist_id', playlist_id).set('title', title).set("description", description);
        const initialState: Upload = { state: 'PENDING', progress: 0 };
        const calculateState = (upload: Upload, event: HttpEvent<unknown>): Upload => {
            if (this.isHttpProgressEvent(event)) {
                return { progress: event.total ? Math.round((100 * event.loaded) / event.total) : upload.progress, state: 'IN_PROGRESS' };
            }
            if (this.isHttpResponse(event)) {
                return { progress: 100, state: 'DONE' };
            }
            return upload;
        };
        //return this.http.post(this.api_video, PlaylistYoutubeService.packetFiles([file]), { reportProgress: true }).pipe(scan(calculateState, initialState));
        return this.http.post(this.api_video, PlaylistYoutubeService.packetFiles([file], { playlist_id: playlist_id, title: title, description: description }), { reportProgress: true });
    }

    updatePlaylistYoutube(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }


    getAllPlaylistYoutube(): Observable<any[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deletePlaylistYoutube(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    getPlaylistYoutubeByCol(col: string, item: string): Observable<any[]> {
        const filter = new HttpParams().set(col, item);
        return this.http.get<Dto>(this.api_video, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getPlaylistYoutubeByCols(condition: HttpParams): Observable<any[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    getPlaylistYoutubeByPlaylistId(id: string, limit: number): Observable<any[]> {
        const filter = new HttpParams().set("limit", limit.toString());
        return this.http.get<Dto>(this.api.concat(id), { params: filter }).pipe(
            map(res => res['items'])
        );
    }

    getPlaylistYoutubeByNextPage(idPlaylist: string, col: string, idPage: string, limit: number): Observable<any[]> {
        const filter = new HttpParams().set(col, idPage).set("limit", limit.toString());
        return this.http.get<Dto>(this.api.concat(idPlaylist), { params: filter }).pipe(
            map(res => res['items'])
        );
    }

    getVideoId(id: string): Observable<any[]> {
        return this.http.get<Dto>(this.api_video.concat(id)).pipe(
            map(res => res['formats'])
        );
    }
    
    getVideoIdDetail(id: string): Observable<any[]> {
        return this.http.get<Dto>(this.api_video.concat(id)).pipe(
            map(res => res['videoDetails'])
        );
    }

    deleteVideoId(id: string): Observable<any[]> {

        return this.http.delete<Dto>(this.api_video.concat(id)).pipe(
            map(res => res['formats'])
        );
    }
}
