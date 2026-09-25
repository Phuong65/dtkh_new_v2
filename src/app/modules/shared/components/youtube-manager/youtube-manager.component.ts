import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { HelperService } from '@core/services/helper.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MAXIMIZE_MODAL_OPTIONS } from '../../../shared/utils/syscat';
import { PlyrComponent } from 'ngx-plyr';
import { PlaylistYoutubeService } from '../../../shared/services/playlist-youtube.service';
import { OvicFileStore } from '../../models/file-store';
import { AbstractControl } from '@angular/forms';
import { NotificationService } from '@core/services/notification.service';

@Component({standalone: true, 
    selector: 'youtube-manager',
    templateUrl: './youtube-manager.component.html',
    styleUrls: ['./youtube-manager.component.css']
})
export class YoutubeManagerComponent implements OnInit, AfterViewInit, OnChanges {

    @Input() filesDefault: any[] = [];

    @Input() playlist_id: string;

    @Input() playlist_option: any; //{title: ,description:}

    @Input() create_Label = "Khởi tạo bộ nhớ";

    @Input() formField: AbstractControl;

    @Input() isMultipleMode = true;

    @Output() onGetIdPlaylist = new EventEmitter<any>();
    @ViewChild('templateMananger') templateMananger: ElementRef;
    @ViewChild(PlyrComponent) plyr: PlyrComponent;

    player: Plyr;

    searchVideo: string;

    fileChooser: any[];

    videoSources: any[];

    id_playlist: string;
    option_playlist: any;

    startProgress = false;
    progressValue = 0;

    selectedVideo: Plyr.Source[] = [];
    constructor(
        private helperService: HelperService,
        private modalService: NgbModal,
        private playlistYoutubeService: PlaylistYoutubeService,
        private noitifi:NotificationService
    ) {

    }

    ngOnChanges(changes: SimpleChanges): void {

        if (changes['playlist_id']) {
            this.id_playlist = this.playlist_id;
        }

        if (changes['playlist_option']) {
            this.option_playlist = this.playlist_option;
        }

        if (changes['filesDefault']) {
            this.fileChooser = this.filesDefault;
            if (this.formField) {
                this.formField.setValue(this.fileChooser);
            }
        }
    }

    ngAfterViewInit(): void {

    }

    ngOnInit(): void {
        this.id_playlist = this.playlist_id;
        this.option_playlist = this.playlist_option;
        if (this.filesDefault && this.filesDefault.length) {
            this.fileChooser = this.filesDefault;
            if (this.formField) {
                this.formField.setValue(this.fileChooser);
            }
        }
    }

    openYoutubeManager() {
        this.modalService.open(this.templateMananger, MAXIMIZE_MODAL_OPTIONS);
        this.getPlaylist();
    }

    openYoutubeManager_secondary() {
        if (!this.isMultipleMode) {
            this.modalService.open(this.templateMananger, MAXIMIZE_MODAL_OPTIONS);
            this.getPlaylist();
        }
    }

    played(event: Plyr.PlyrEvent) {

    }

    play(): void {
        this.player.play(); // or this.plyr.player.play()
    }

    plyrInit(event) {
        this.player = event;
        this.player.play();
    }


    onFileInput(event, fileChooser) {


        if (event && event.length) {
            let flag = false;
            for (let i = 0; i < event.length; i++) {
                if (event[i].size > 2147483648) {
                    flag = true;
                }
            }
            if (!flag) {
                let k = 0;
                this.progressValue = 0;
                this.startProgress = true;
                let j = 0;
                const settimeout = setInterval(() => {
                    if (j < 96) {
                        j = j + this.getRandomInt(3);
                        this.progressValue = j / 100 * 100;
                    } else {
                        clearInterval(settimeout);
                    }
                }, 100)
                for (let i = 0; i < event.length; i++) {
                    setTimeout(() => {
                        if (event[i].size <= 2147483648) {
                            this.playlistYoutubeService.addVideo(event[i], this.id_playlist, event[i].name).subscribe(_res => {
                                k = k + 1;
                                if (j === event.length) {
                                    this.progressValue = 0;
                                    this.startProgress = false;
                                    clearInterval(settimeout);
                                    fileChooser.value = '';
                                    this.videoSources.unshift({
                                        id: _res.id,
                                        type: "video/mp4",
                                        title: _res.snippet.title,
                                        path: _res.id,
                                        source: "encrypted",
                                        url: _res.id,
                                        check: false,
                                        location: "youtube",
                                        public: _res.snippet.resourceId.videoId,
                                        // thumbnails: f.snippet.thumbnails.standard
                                    })
                                }
                            })
                        } else {
                            this.noitifi.toastWarning("Vui lòng kiểm tra lại dung lượng file, dung lượng file không được lớn hơn 2GB");
                        }
                    }, 50 * i);
                }
            } else {
                this.noitifi.confirmRounded("Vui lòng kiểm tra lại dung lượng file, dung lượng file không được lớn hơn 2GB", "Thông báo").then(() => null, () => null)
            }
        }

    }

    createPlaylist() {
        this.progressValue = 0;
        this.startProgress = true;
        let j = 0;
        const settimeout = setInterval(() => {
            if (j < 96) {
                j = j + this.getRandomInt(3);
                this.progressValue = j / 100 * 100;
            } else {
                clearInterval(settimeout);
            }
        }, 100)
        this.playlistYoutubeService.addPlaylistYoutube(this.option_playlist).subscribe(_res => {
            clearInterval(settimeout);
            this.progressValue = 100;
            this.startProgress = false;
            this.id_playlist = _res.id;
            this.noitifi.toastSuccess("Khởi tạo thành công")
            this.onGetIdPlaylist.emit(_res.id);
        }, () => this.noitifi.toastWarning("Khởi tạo thất bại"))
    }

    getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    getPlaylist() {
        if (this.id_playlist) {
            this.progressValue = 0;
            this.startProgress = true;
            let j = 0;
            const settimeout = setInterval(() => {
                if (j < 96) {
                    j = j + this.getRandomInt(3);
                    this.progressValue = j / 100 * 100;
                } else {
                    clearInterval(settimeout);
                }
            }, 100)
            this.playlistYoutubeService.getPlaylistYoutubeByPlaylistId(this.id_playlist, 40).subscribe(_res => {
                clearInterval(settimeout);
                this.progressValue = 100;
                this.startProgress = false;
                const tmp = [];
                _res.forEach(f => {
                    tmp.push({
                        id: f.id,
                        type: "video/mp4",
                        title: f.snippet.title,
                        path: f.id,
                        source: "encrypted",
                        url: f.id,
                        check: this.filesDefault && this.filesDefault.length && this.filesDefault.findIndex(m => m.id === f.id) !== -1 ? true : false,
                        location: "youtube",
                        public: f.snippet.resourceId.videoId,
                        // thumbnails: f.snippet.thumbnails.standard
                    })
                })
                this.videoSources = tmp;
            })
        }
    }

    deleteFileChoosed(i: number) {
        if (this.fileChooser && this.fileChooser.length) {
            this.fileChooser.splice(i, 1);
            if (this.formField) {
                this.formField.setValue(this.fileChooser);
            }
        }
    }

    chooseVideo(video) {
        this.playlistYoutubeService.getVideoId(video.id).subscribe(_res => {
            if (_res) {
                const index = _res.findIndex(m => m['qualityLabel'] === "720p" && m['mimeType'].indexOf("video/mp4") !== -1);
                if (index !== -1) {
                    this.selectedVideo = [{ src: _res[index]['url'], provider: "html5" }]
                }
            }
        })
    }

    saveChooseVideos(d) {
        const fileChooser = this.videoSources.filter(m => m['check']);
        this.fileChooser = fileChooser;
        const newfileChooser = fileChooser.map(m => { delete m['check']; return m });
        if (!this.isMultipleMode) {
            this.formField.setValue(newfileChooser);
            this.playlistYoutubeService.getVideoId(fileChooser[0].id).subscribe(_res => {
                if (_res) {
                    const index = _res.findIndex(m => m['qualityLabel'] === "720p" && m['mimeType'].indexOf("video/mp4") !== -1);
                    if (index !== -1) {
                        const phut = Math.floor(Number(_res[index]['approxDurationMs']) / 60000);
                        const s = Math.floor((Number(_res[index]['approxDurationMs']) % 60000) / 1000);
                        const h = Math.floor(phut / 60);
                        const p = phut % 60;
                        let duration = '';
                        if (h < 10) {
                            duration = duration.concat("0", h.toString())
                        } else {
                            duration = duration.concat(h.toString())
                        }

                        if (p < 10) {
                            duration = duration.concat(":0", p.toString())
                        } else {
                            duration = duration.concat(":", p.toString())
                        }

                        if (s < 10) {
                            duration = duration.concat(":0", s.toString())
                        } else {
                            duration = duration.concat(":", s.toString())
                        }
                        fileChooser[0]['duration'] = duration;
                        this.formField.setValue(newfileChooser);
                    }
                }
            });


        } else {
            this.formField.setValue(newfileChooser);
        }
        d(true)

    }

    checkBoxVideo(index) {
        if (!this.isMultipleMode) {
            if (this.videoSources[index]['check']) {
                this.videoSources.forEach((f, key) => {
                    if (key !== index) {
                        f['check'] = false;
                    }
                })
            }
        }
    }

    onDeleteVideo(video) {
        this.playlistYoutubeService.deleteVideoId(video.id).subscribe(_res => {
            this.getPlaylist();
            this.noitifi.toastSuccess("Xóa thành công");
        }, () => this.noitifi.toastError("Xóa thất bại"))
    }
}
