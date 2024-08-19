import properties from './properties.js';

export default {
    name: 'YouTube',
    description: 'Set start- & endpoint on a YouTube video.',
    version: '1.0.0',
    entry: class {

        onReady() {
            const script = document.createElement('script');
            script.setAttribute('src', 'https://www.youtube.com/iframe_api');
            document.head.appendChild(script);
        }

    },
    elements: {
        youtube: {
            properties
        }
    }
};
