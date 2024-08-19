import callback from './callback/index.js';

export default {
    contentMenus: {
        plugins: {
            position: 'right',
            snapToTop: true,
            items: {
                youtube: {
                    icon: 'labicon-video_edit',
                    title: 'YouTube Editor',
                    callback
                }
            }
        }
    }
};
