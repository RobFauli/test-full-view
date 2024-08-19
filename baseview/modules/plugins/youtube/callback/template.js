export default `
<div class="iframe-container" style="padding-top: 56.25%; width: 100%; position: relative; overflow: hidden;">
    <div id="YouTubeEditorContainer" class="youtube-preview container" style="display: block; position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%;"></div>
</div>

<div class="youtube-controls">
    <div class="lab-grid lab-relative lab-margin-top-1">
        <div id="startMarkerYouTube" class="lab-absolute labicon-start_point"></div>
        <input id="progressYouTube" type="range" value="0" min="0">
        <div id="endMarkerYouTube" class="lab-absolute labicon-end_point"></div>
    </div>
    <div class="lab-grid">
        <div class="lab-padding-top-1 lab-grid lab-grid-large-5">
            <div class="lab-btn-group lab-grid-large-12">
                <button title="Skip backward 5 seconds" id="backwardYouTube" class="lab-btn lab-grid-gap labicon-backward"></button>
                <button title="Play/Pause video" id="playYouTube" class="lab-btn lab-grid-gap labicon-play"></button>
                <button title="Skip forward 5 seconds" id="forwardYouTube" class="lab-btn lab-grid-gap labicon-forward"></button>
            </div>
            <div class="lab-grid lab-grid-large-12">
                <span class="lab-padding-right-1">Timestamp:</span>
                <span id="timestampYouTube">00:00 / 10:00</span>
            </div>
        </div>
        <div class="lab-padding-top-1 lab-grid lab-grid-large-7">
            <div class="lab-btn-group lab-grid lab-grid-large-12 lab-align-right">
                <button title="Set the start of the video" id="setStartYouTube" class="lab-btn labicon-start_point"></button>
                <button title="Reset the crop" id="resetYouTube" class="lab-btn labicon-refresh"></button>
                <button title="Set the end of the video" id="setEndYouTube" class="lab-btn labicon-end_point"></button>
            </div>
            <div class="lab-grid lab-grid-large-12 lab-align-right">
                <span class="lab-padding-right-1">Cropped:</span>
                <span id="cropLabelYouTube">00:00 - 00:00</span>
            </div>
        </div>
    </div>
</div>
`;
