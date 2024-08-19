export class YouTubeEditor {

    constructor(model, view) {
        this.model = model;
        this.view = view;

        this.playerAPI = null;
        this.fields = {
            video_start: this.model.get('fields.video_start') || 0,
            video_end: this.model.get('fields.video_end') || null
        };
        this.sliderUpdateFrequency = 500;
        this.duration = null;
        this.progress = this.fields.video_start;

        this.playButton = null;
        this.timestampElement = null;
        this.progressElement = null;
        this.startMarker = null;
        this.endMarker = null;
        this.croppedVideoLabel = null;

        this.updater = null;

        this.isActive = false;
        this.isPlaying = false;
    }

    run(markup) {
        this.isActive = true;

        const videoId = this.model.get('fields.vid');
        if (!videoId) return false;

        if (typeof YT !== 'undefined') {
            this.playerAPI = this.createPlayer(videoId, markup);
        } else {
            window.onYouTubeIframeAPIReady = () => {
                this.playerAPI = this.createPlayer(videoId, markup);
            };
        }

        return true;
    }

    createPlayer(id, markup) {
        return new YT.Player('YouTubeEditorContainer', {
            videoId: id,
            playerVars: {
                controls: 0,
                disablekb: 1
            },
            events: {
                onReady: this.onPlayerReady.bind(this, markup),
                onStateChange: this.onStateChange.bind(this)
            }
        });
    }

    onPlayerReady(markup) {
        this.duration = this.playerAPI.getDuration();
        this.createControls(markup);
        this.setTimestamp(this.fields.video_start);
    }

    onStateChange(state) {
        this.setIsPlaying(state.data == 1);
        if (state.data === 0) {
            this.progressElement.value = this.duration;
        }
    }

    setTimestamp(seconds) {
        this.playerAPI.seekTo(seconds);
        this.progress = this.playerAPI.getCurrentTime();
    }

    setIsPlaying(isPlaying) {
        this.isPlaying = isPlaying;
        if (isPlaying) {
            this.startUpdater();
            this.playButton.classList.add('labicon-pause');
            this.playButton.classList.remove('labicon-play');
        } else {
            this.update();
            this.stopUpdater();
            this.playButton.classList.add('labicon-play');
            this.playButton.classList.remove('labicon-pause');
        }
    }

    createControls(markup) {
        this.progressElement =  markup.querySelector('#progressYouTube');
        this.progressElement.max = this.duration;
        this.progressElement.addEventListener('change', () => {
            this.stopUpdater();
            this.setTimestamp(this.progressElement.value);
        });

        this.startMarker = markup.querySelector('#startMarkerYouTube');
        this.endMarker = markup.querySelector('#endMarkerYouTube');
        this.styleMarker(this.startMarker);
        this.styleMarker(this.endMarker);

        this.playButton = markup.querySelector('#playYouTube');
        this.playButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.isPlaying) {
                this.playerAPI.pauseVideo();
            } else {
                this.playerAPI.playVideo();
            }
        });
        // Skip buttons.
        const forwardButton = markup.querySelector('#forwardYouTube');
        forwardButton.addEventListener('click', (e) => {
            e.preventDefault();
            const seconds = 5;
            const timestamp = this.playerAPI.getCurrentTime() + seconds;
            this.setTimestamp(timestamp);
        });
        const backwardButton = markup.querySelector('#backwardYouTube');
        backwardButton.addEventListener('click', (e) => {
            e.preventDefault();
            const seconds = -5;
            const timestamp = this.playerAPI.getCurrentTime() + seconds;
            this.setTimestamp(timestamp);
        });

        const startPointElement = markup.querySelector('#setStartYouTube');
        startPointElement.addEventListener('click', (e) => {
            e.preventDefault();
            const currentTime = this.playerAPI.getCurrentTime();
            if (this.fields.video_end && currentTime > this.fields.video_end) {
                return;
            }

            this.fields.video_start = currentTime;
            this.updateCrop();
            this.save();
        });

        const endPointElement = markup.querySelector('#setEndYouTube');
        endPointElement.addEventListener('click', (e) => {
            e.preventDefault();
            const currentTime = this.playerAPI.getCurrentTime();
            if (this.fields.video_start > currentTime) {
                return;
            }
            this.fields.video_end = currentTime;
            this.updateCrop();
            this.save();
        });

        const resetElement = markup.querySelector('#resetYouTube');
        resetElement.addEventListener('click', (e) => {
            e.preventDefault();
            this.fields.video_start = 0;
            this.fields.video_end = this.duration;
            this.updateCrop();
            this.save();
        });

        this.croppedVideoLabel = markup.querySelector('#cropLabelYouTube');
        this.timestampElement = markup.querySelector('#timestampYouTube');

        this.update();
        this.updateCrop();
    }

    styleMarker(marker) {
        marker.style.pointerEvents = 'none';
        marker.style.top = '50%';
        marker.style.transform = 'translate(-50%, -50%)';
        marker.style.fontSize = '2rem';
    }

    getPrettyTimestamp(time) {
        const seconds = (`0${  Math.floor(time % 60) }`).slice(-2);
        const minutes = (`0${  Math.floor((time / 60) % 60) }`).slice(-2);

        let timestamp = `${ minutes }:${ seconds }`;

        if (this.duration / (60 * 60) > 1) {
            const hours = (`0${  Math.floor((time / (60 * 60)) % 60) }`).slice(-2);
            timestamp = `${ hours }:${ timestamp }`;
        }

        return timestamp;
    }

    stopUpdater() {
        clearInterval(this.updater);
    }

    startUpdater() {
        this.updater = setInterval(this.update.bind(this), this.sliderUpdateFrequency);
    }

    update() {
        this.progress = this.playerAPI.getCurrentTime();
        this.progressElement.value = Math.ceil(this.progress);

        const current = this.getPrettyTimestamp(this.progress);
        const max = this.getPrettyTimestamp(this.duration);

        this.timestampElement.innerText = `${ current } / ${ max }`;
    }

    updateCrop() {
        const startValue = this.fields.video_start;
        const endValue = this.fields.video_end || this.duration;

        const start = this.getPrettyTimestamp(startValue);
        const end = this.getPrettyTimestamp(endValue);

        this.croppedVideoLabel.innerText = `${ start } - ${ end }`;

        this.startMarker.style.left = `${ startValue / this.duration * 100  }%`;
        this.endMarker.style.left = `${ endValue / this.duration * 100  }%`;
    }

    save() {
        this.model.set('fields.video_start', this.fields.video_start);
        this.model.set('fields.video_end', this.fields.video_end);
    }

}
